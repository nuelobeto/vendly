import { NextResponse, type NextRequest } from "next/server"
import type { AuthError, EmailOtpType } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import type { TConfirmStatus } from "@/features/auth/types"

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return !!value && EMAIL_OTP_TYPES.includes(value as EmailOtpType)
}

function statusForError(error: AuthError): TConfirmStatus {
  // The PKCE verifier lives in a cookie set during signUp, so it is absent when
  // the email link is opened on another browser or device.
  if (error.code === "pkce_code_verifier_not_found") {
    return "wrong_device"
  }

  // Supabase uses 401/403 for a consumed or timed-out one-time credential.
  const expired =
    error.status === 401 ||
    error.status === 403 ||
    error.code === "otp_expired" ||
    error.code === "flow_state_expired" ||
    error.code === "flow_state_not_found"

  return expired ? "expired" : "error"
}

/**
 * Email confirmation callback.
 *
 * Two link shapes are accepted:
 *
 *   token_hash  ?token_hash=<hash>&type=<type>   ← what we send
 *         → verifyOtp. Needs no browser state, so the link works from ANY
 *           device. Produced by the custom email template in
 *           supabase/templates/confirmation.html.
 *
 *   PKCE        ?code=<uuid>
 *         → exchangeCodeForSession, which requires the code-verifier cookie
 *           written during signUp and therefore only works in the originating
 *           browser. Retained for links already sitting in inboxes from before
 *           the template change, and for OAuth later, which is PKCE by nature.
 *
 * token_hash is checked first: it is the expected shape and the one that works
 * everywhere.
 *
 * The credential is consumed here rather than on the page, so it never reaches
 * the client and is not left in history against a rendered URL.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = searchParams.get("next")

  // Supabase appends these when it rejects the link before we ever see it.
  const providerError =
    searchParams.get("error_code") ?? searchParams.get("error")

  // Only relative paths — an absolute `next` would be an open redirect.
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : undefined

  const outcome = (status: TConfirmStatus) => {
    /*
     * Password recovery goes straight to the form. An interstitial reading
     * "Email confirmed — continue setup" is simply the wrong screen for
     * someone who clicked "reset my password".
     */
    if (status === "success" && type === "recovery") {
      return NextResponse.redirect(
        new URL(safeNext ?? "/auth/reset-password", origin)
      )
    }

    const url = new URL("/auth/confirm", origin)
    url.searchParams.set("status", status)
    if (status === "success" && safeNext) {
      url.searchParams.set("next", safeNext)
    }
    return NextResponse.redirect(url)
  }

  if (providerError) {
    return outcome(providerError.includes("expired") ? "expired" : "invalid")
  }

  const supabase = await createClient()

  if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })
    return outcome(error ? statusForError(error) : "success")
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    return outcome(error ? statusForError(error) : "success")
  }

  return outcome("invalid")
}

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
 * Supabase sends one of two link shapes depending on the client's flow type,
 * and we accept both:
 *
 *   PKCE  (the @supabase/ssr default)  ?code=<uuid>
 *         → exchangeCodeForSession, which needs the code-verifier cookie set
 *           during signUp, so the link must be opened in the same browser.
 *
 *   OTP   (implicit / custom templates) ?token_hash=<hash>&type=<type>
 *         → verifyOtp. Works from any browser.
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

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    return outcome(error ? statusForError(error) : "success")
  }

  if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })
    return outcome(error ? statusForError(error) : "success")
  }

  return outcome("invalid")
}

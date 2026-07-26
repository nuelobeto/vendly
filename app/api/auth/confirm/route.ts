import { NextResponse, type NextRequest } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

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

/**
 * Email confirmation callback. Supabase appends `token_hash` and `type` to the
 * `emailRedirectTo` URL; exchanging them here sets the session cookies.
 *
 * Always redirects to /auth/confirm, which renders the outcome. The token is
 * consumed here rather than on the page so it never reaches the client and is
 * not left sitting in browser history against a rendered URL.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = searchParams.get("next")

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

  if (!tokenHash || !isEmailOtpType(type)) {
    return outcome("invalid")
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  })

  if (error) {
    // Supabase returns 401/403 for a consumed or expired one-time token.
    const isExpired =
      error.status === 401 ||
      error.status === 403 ||
      error.code === "otp_expired"

    return outcome(isExpired ? "expired" : "error")
  }

  return outcome("success")
}

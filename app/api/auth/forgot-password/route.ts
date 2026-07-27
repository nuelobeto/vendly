import { NextResponse, type NextRequest } from "next/server"

import { getEnv } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { forgotPasswordSchema } from "@/features/auth/schemas"
import type { ISimpleAuthResponse } from "@/features/auth/types"

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ISimpleAuthResponse>(
      { ok: false, error: "Malformed request body" },
      { status: 400 }
    )
  }

  const parsed = forgotPasswordSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json<ISimpleAuthResponse>(
      {
        ok: false,
        error: "Check the highlighted fields",
        fieldErrors: { email: "Enter a valid email address" },
      },
      { status: 422 }
    )
  }

  const supabase = await createClient()

  /*
   * The recovery link lands on our confirm route, which exchanges the token
   * server-side and then forwards to the password form — so the recovery
   * credential never reaches the browser as a live token in the URL.
   */
  const redirectTo = new URL("/api/auth/confirm", getEnv().NEXT_PUBLIC_SITE_URL)
  redirectTo.searchParams.set("next", "/auth/reset-password")

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: redirectTo.toString() }
  )

  if (error?.status === 429) {
    return NextResponse.json<ISimpleAuthResponse>(
      { ok: false, error: "Please wait a moment before requesting another." },
      { status: 429 }
    )
  }

  /*
   * Always reports success otherwise. Saying "no account with that email"
   * would turn this into an account-enumeration oracle — the same reasoning
   * as the register endpoint.
   */
  return NextResponse.json<ISimpleAuthResponse>({ ok: true }, { status: 200 })
}

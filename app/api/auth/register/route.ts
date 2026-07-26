import { NextResponse, type NextRequest } from "next/server"

import { getEnv } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { registerSchema } from "@/features/auth/schemas"
import type { IRegisterResponse } from "@/features/auth/types"

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json<IRegisterResponse>(
      { ok: false, error: "Malformed request body" },
      { status: 400 }
    )
  }

  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".")
      if (path && !fieldErrors[path]) {
        fieldErrors[path] = issue.message
      }
    }

    return NextResponse.json<IRegisterResponse>(
      { ok: false, error: "Check the highlighted fields", fieldErrors },
      { status: 422 }
    )
  }

  const { email, password } = parsed.data
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getEnv().NEXT_PUBLIC_SITE_URL}/api/auth/confirm`,
    },
  })

  if (error) {
    // Supabase rate limits signups per IP and per email.
    if (error.status === 429) {
      return NextResponse.json<IRegisterResponse>(
        { ok: false, error: "Too many attempts. Try again in a few minutes." },
        { status: 429 }
      )
    }

    // Surface password-policy rejections against the right field.
    if (error.code === "weak_password") {
      return NextResponse.json<IRegisterResponse>(
        {
          ok: false,
          error: "Choose a stronger password",
          fieldErrors: { password: error.message },
        },
        { status: 422 }
      )
    }

    return NextResponse.json<IRegisterResponse>(
      { ok: false, error: "Could not create your account. Please try again." },
      { status: 400 }
    )
  }

  /*
   * Deliberately uniform response.
   *
   * With email confirmation enabled, Supabase returns a *fabricated* user with
   * an empty `identities` array when the address is already registered — it
   * does not error. Branching on that would turn this endpoint into an account
   * enumeration oracle, so we return the same success shape either way and let
   * the email itself tell the real owner what happened.
   */
  const alreadyRegistered = data.user?.identities?.length === 0

  if (alreadyRegistered) {
    console.info("[register] signup attempted for existing address")
  }

  return NextResponse.json<IRegisterResponse>(
    { ok: true, email },
    { status: 200 }
  )
}

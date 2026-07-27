import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { resetPasswordSchema } from "@/features/auth/schemas"
import type { ISimpleAuthResponse } from "@/features/auth/types"

/**
 * Sets a new password.
 *
 * Requires the session established by the recovery link — `updateUser` acts on
 * whoever is signed in, so the recovery token *is* the authorisation. There is
 * no separate token parameter to validate here.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json<ISimpleAuthResponse>(
      {
        ok: false,
        error: "That reset link has expired. Request a new one.",
      },
      { status: 401 }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ISimpleAuthResponse>(
      { ok: false, error: "Malformed request body" },
      { status: 400 }
    )
  }

  const parsed = resetPasswordSchema.safeParse(body)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".")
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return NextResponse.json<ISimpleAuthResponse>(
      { ok: false, error: "Check the highlighted fields", fieldErrors },
      { status: 422 }
    )
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    // Supabase rejects reusing the current password, which is worth surfacing
    // against the field rather than as a generic failure.
    if (error.code === "same_password") {
      return NextResponse.json<ISimpleAuthResponse>(
        {
          ok: false,
          error: "Check the highlighted fields",
          fieldErrors: {
            password: "That's already your password. Choose a different one.",
          },
        },
        { status: 422 }
      )
    }

    if (error.code === "weak_password") {
      return NextResponse.json<ISimpleAuthResponse>(
        {
          ok: false,
          error: "Choose a stronger password",
          fieldErrors: { password: error.message },
        },
        { status: 422 }
      )
    }

    return NextResponse.json<ISimpleAuthResponse>(
      { ok: false, error: "Could not update your password. Please try again." },
      { status: 400 }
    )
  }

  return NextResponse.json<ISimpleAuthResponse>({ ok: true }, { status: 200 })
}

import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { loginSchema, safeNext } from "@/features/auth/schemas"
import type { ILoginResponse } from "@/features/auth/types"

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ILoginResponse>(
      { ok: false, error: "Malformed request body" },
      { status: 400 }
    )
  }

  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".")
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return NextResponse.json<ILoginResponse>(
      { ok: false, error: "Check the highlighted fields", fieldErrors },
      { status: 422 }
    )
  }

  const { email, password } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.status === 429) {
      return NextResponse.json<ILoginResponse>(
        { ok: false, error: "Too many attempts. Try again in a few minutes." },
        { status: 429 }
      )
    }

    /*
     * An unconfirmed account is worth calling out: the credentials are right
     * and the fix is in their inbox, so a generic "invalid" would send them
     * hunting for a typo that isn't there.
     */
    if (error.code === "email_not_confirmed") {
      return NextResponse.json<ILoginResponse>(
        {
          ok: false,
          error:
            "Confirm your email first — check your inbox for the link we sent.",
        },
        { status: 403 }
      )
    }

    /*
     * Everything else collapses to one message. Supabase already returns the
     * same error for a wrong password and an unknown address, and keeping it
     * that way is what stops this endpoint being an account-enumeration oracle.
     */
    return NextResponse.json<ILoginResponse>(
      { ok: false, error: "That email or password isn't right." },
      { status: 401 }
    )
  }

  // Where to land is decided server-side so the client can't be talked into
  // an off-site redirect by a crafted `next`.
  const redirectTo = safeNext(parsed.data.next) ?? "/dashboard"

  return NextResponse.json<ILoginResponse>(
    { ok: true, redirectTo },
    { status: 200 }
  )
}

import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { hashInviteToken } from "@/lib/tokens"
import { acceptInviteSchema } from "@/features/members/schemas"
import type { IAcceptResponse } from "@/features/members/types"

/** The function raises a distinct message per failure; map them to copy. */
const FAILURES: Record<string, { message: string; status: number }> = {
  not_authenticated: {
    message: "Sign in to accept this invite.",
    status: 401,
  },
  invite_not_found: {
    message: "That invite link isn't valid.",
    status: 404,
  },
  invite_revoked: {
    message: "That invite has been revoked.",
    status: 410,
  },
  invite_already_accepted: {
    message: "That invite has already been used.",
    status: 409,
  },
  invite_expired: {
    message: "That invite has expired. Ask for a new one.",
    status: 410,
  },
  invite_email_mismatch: {
    message: "This invite was sent to a different email address.",
    status: 403,
  },
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json<IAcceptResponse>(
      { ok: false, error: FAILURES.not_authenticated.message },
      { status: 401 }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json<IAcceptResponse>(
      { ok: false, error: "Malformed request body" },
      { status: 400 }
    )
  }

  const parsed = acceptInviteSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json<IAcceptResponse>(
      { ok: false, error: "That invite link isn't valid." },
      { status: 422 }
    )
  }

  // Only the hash is stored, so the raw token from the link is hashed here and
  // never touches the database.
  const { data, error } = await supabase.rpc("accept_store_invite", {
    p_token_hash: hashInviteToken(parsed.data.token),
  })

  if (error) {
    const known = Object.entries(FAILURES).find(([key]) =>
      error.message.includes(key)
    )

    if (known) {
      return NextResponse.json<IAcceptResponse>(
        { ok: false, error: known[1].message },
        { status: known[1].status }
      )
    }

    return NextResponse.json<IAcceptResponse>(
      { ok: false, error: "Could not accept that invite. Please try again." },
      { status: 400 }
    )
  }

  return NextResponse.json<IAcceptResponse>(
    { ok: true, storeId: data as string },
    { status: 200 }
  )
}

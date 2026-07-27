import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import type { ISimpleResponse } from "@/features/members/types"

/** Revoking is an UPDATE, not a DELETE — the audit trail is worth keeping. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json<ISimpleResponse>(
      { ok: false, error: "You need to be signed in to do that." },
      { status: 401 }
    )
  }

  // RLS restricts the UPDATE to owners and admins of the invite's store, so an
  // unauthorised caller matches zero rows rather than being told it exists.
  const { data, error } = await supabase
    .from("store_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .select("id")

  if (error) {
    return NextResponse.json<ISimpleResponse>(
      { ok: false, error: "Could not revoke that invite. Please try again." },
      { status: 400 }
    )
  }

  if (!data?.length) {
    return NextResponse.json<ISimpleResponse>(
      { ok: false, error: "That invite no longer exists." },
      { status: 404 }
    )
  }

  return NextResponse.json<ISimpleResponse>({ ok: true }, { status: 200 })
}

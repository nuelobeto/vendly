import { NextResponse, type NextRequest } from "next/server"

import { getEnv } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { getActiveStore } from "@/lib/stores/active-store"
import { generateInviteToken } from "@/lib/tokens"
import { sendInviteEmail } from "@/lib/email/send-invite"
import { inviteSchema } from "@/features/members/schemas"
import type { IInviteResponse } from "@/features/members/types"

const UNIQUE_VIOLATION = "23505"

/**
 * Creates an invite for the caller's store.
 *
 * Authorisation is left to RLS: the INSERT policy requires the caller to hold
 * owner or admin on the store, so a staff member's insert simply fails. The
 * store is resolved from membership rather than taken from the body, so nobody
 * can invite themselves into someone else's store.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json<IInviteResponse>(
      { ok: false, error: "You need to be signed in to do that." },
      { status: 401 }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json<IInviteResponse>(
      { ok: false, error: "Malformed request body" },
      { status: 400 }
    )
  }

  const parsed = inviteSchema.safeParse(body)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".")
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return NextResponse.json<IInviteResponse>(
      { ok: false, error: "Check the highlighted fields", fieldErrors },
      { status: 422 }
    )
  }

  const { email, role } = parsed.data

  /*
   * Invites go to the ACTIVE store. Resolved through the shared helper rather
   * than `.maybeSingle()`, which errors for anyone in more than one store —
   * and picking an arbitrary row would silently invite into the wrong one.
   */
  const { active } = await getActiveStore()
  const membership =
    active && (active.role === "owner" || active.role === "admin")
      ? { store_id: active.store.id, role: active.role }
      : null

  if (!membership) {
    return NextResponse.json<IInviteResponse>(
      { ok: false, error: "Only owners and admins can invite members." },
      { status: 403 }
    )
  }

  const { token, tokenHash } = generateInviteToken()

  const { data: invite, error } = await supabase
    .from("store_invites")
    .insert({
      store_id: membership.store_id,
      email,
      role,
      token_hash: tokenHash,
      invited_by: user.id,
    })
    .select("id, email")
    .single()

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return NextResponse.json<IInviteResponse>(
        {
          ok: false,
          error: "Check the highlighted fields",
          fieldErrors: {
            email: "There's already a pending invite for that address.",
          },
        },
        { status: 409 }
      )
    }

    return NextResponse.json<IInviteResponse>(
      { ok: false, error: "Could not create that invite. Please try again." },
      { status: 400 }
    )
  }

  // The raw token exists only in this request. It is never stored, and is
  // returned to the client only if the email fails (see below).
  const url = `${getEnv().NEXT_PUBLIC_SITE_URL}/invite/${token}`

  const [{ data: store }, { data: inviter }] = await Promise.all([
    supabase
      .from("stores")
      .select("name")
      .eq("id", membership.store_id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle(),
  ])

  const inviterName =
    [inviter?.first_name, inviter?.last_name].filter(Boolean).join(" ") || null

  /*
   * A failed send must not fail the invite: the row exists and the link works.
   * The result is reported so the UI can fall back to copy-link rather than
   * claiming an email went out that didn't.
   */
  const result = await sendInviteEmail({
    to: email,
    storeName: store?.name ?? "a Vendly store",
    inviterName,
    role,
    url,
  })

  /*
   * On success the link is withheld — the email is the delivery mechanism and
   * there is no reason to put a live invite token on screen as well.
   *
   * On failure it is returned as the only remaining way to deliver the invite:
   * the row already exists, and store_invites_pending_unique blocks re-inviting
   * that address until it is revoked, so an inviter with neither email nor link
   * would be stuck.
   */
  return NextResponse.json<IInviteResponse>(
    {
      ok: true,
      invite: {
        id: invite.id,
        email: invite.email,
        emailed: result.sent,
        ...(result.sent ? {} : { url }),
      },
    },
    { status: 201 }
  )
}

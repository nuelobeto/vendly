import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { profileSchema } from "@/features/onboarding/schemas"
import type { IProfileResponse } from "@/features/onboarding/types"

/**
 * Saves the profile step of onboarding.
 *
 * The row already exists — handle_new_user() creates it at signup — so this is
 * an UPDATE, never an INSERT. RLS restricts it to the caller's own row, so the
 * user id comes from the session and is never taken from the request body.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json<IProfileResponse>(
      { ok: false, error: "You need to be signed in to do that." },
      { status: 401 }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json<IProfileResponse>(
      { ok: false, error: "Malformed request body" },
      { status: 400 }
    )
  }

  const parsed = profileSchema.safeParse(body)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".")
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message
    }

    return NextResponse.json<IProfileResponse>(
      { ok: false, error: "Check the highlighted fields", fieldErrors },
      { status: 422 }
    )
  }

  const { first_name, last_name, phone, avatar_url } = parsed.data

  const { data, error } = await supabase
    .from("profiles")
    .update({
      first_name,
      last_name,
      phone: phone || null,
      avatar_url: avatar_url || null,
      // Profile step done; the store step is next.
      onboarding_step: "store",
    })
    .eq("id", user.id)
    .select()
    .single()

  if (error) {
    // The DB re-checks the E.164 format independently of the zod schema.
    if (error.code === "23514") {
      return NextResponse.json<IProfileResponse>(
        {
          ok: false,
          error: "Check the highlighted fields",
          fieldErrors: { phone: "That phone number isn't in a valid format" },
        },
        { status: 422 }
      )
    }

    return NextResponse.json<IProfileResponse>(
      { ok: false, error: "Could not save your profile. Please try again." },
      { status: 400 }
    )
  }

  /*
   * A user who registered from an invite link has no membership until the
   * invite is accepted, so up to this point they are indistinguishable from a
   * brand-new merchant and would be sent to store setup.
   *
   * Accepting here is safe because the invite was addressed to this exact
   * address and the address is verified at signup — an unconfirmed account
   * cannot reach this route.
   */
  const { data: joined } = await supabase.rpc("accept_my_invites")

  return NextResponse.json<IProfileResponse>(
    { ok: true, profile: data, joinedStore: (joined ?? 0) > 0 },
    { status: 200 }
  )
}

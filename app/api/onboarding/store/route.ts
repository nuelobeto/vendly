import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { storeSchema } from "@/features/onboarding/schemas"
import type { IStoreResponse } from "@/features/onboarding/types"

/** Postgres unique_violation — name or slug collided. */
const UNIQUE_VIOLATION = "23505"
/** Postgres check_violation — slug format rejected by the DB constraint. */
const CHECK_VIOLATION = "23514"

/**
 * Creates the merchant's store, or updates it if they come back to this step.
 *
 * `owner_id` comes from the session and is never read from the body; RLS
 * enforces the same rule independently.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json<IStoreResponse>(
      { ok: false, error: "You need to be signed in to do that." },
      { status: 401 }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json<IStoreResponse>(
      { ok: false, error: "Malformed request body" },
      { status: 400 }
    )
  }

  const parsed = storeSchema.safeParse(body)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".")
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message
    }

    return NextResponse.json<IStoreResponse>(
      { ok: false, error: "Check the highlighted fields", fieldErrors },
      { status: 422 }
    )
  }

  const { name, currency, logo_url, banner_url, contact_email, contact_phone } =
    parsed.data

  // An existing store keeping its own slug is not a conflict.
  const { data: existing } = await supabase
    .from("stores")
    .select("id, slug")
    .eq("owner_id", user.id)
    .maybeSingle()

  let slug = parsed.data.slug?.trim() ?? ""

  if (!slug) {
    // Blank slug: derive one from the name. Done server-side via RPC so
    // uniqueness and reserved words are settled authoritatively — the client
    // can only guess, and would race anyone else picking the same name.
    const { data: generated, error: generateError } = await supabase.rpc(
      "generate_store_slug",
      { base_name: name }
    )

    if (generateError || !generated) {
      return NextResponse.json<IStoreResponse>(
        {
          ok: false,
          error: "Could not generate an address for that name.",
          fieldErrors: { slug: "Enter an address for your store" },
        },
        { status: 422 }
      )
    }

    slug = generated
  } else {
    // Reserved slugs live in a table the client cannot read, so this is the
    // only place the check can be enforced authoritatively.
    const { data: available, error: slugError } = await supabase.rpc(
      "is_slug_available",
      { candidate: slug }
    )

    if (slugError) {
      return NextResponse.json<IStoreResponse>(
        {
          ok: false,
          error: "Could not verify that address. Please try again.",
        },
        { status: 400 }
      )
    }

    if (!available && existing?.slug !== slug) {
      return NextResponse.json<IStoreResponse>(
        {
          ok: false,
          error: "Check the highlighted fields",
          fieldErrors: { slug: "That address is taken. Try another." },
        },
        { status: 409 }
      )
    }
  }

  const payload = {
    name,
    slug,
    currency: currency as never,
    logo_url: logo_url || null,
    banner_url: banner_url || null,
    // Blank means "use the owner's" — null lets the DB trigger fill it in on
    // insert. On update there's no trigger, so null simply clears the override.
    contact_email: contact_email || null,
    contact_phone: contact_phone || null,
  }

  const { data, error } = existing
    ? await supabase
        .from("stores")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single()
    : await supabase
        .from("stores")
        .insert({ ...payload, owner_id: user.id })
        .select()
        .single()

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      // Both name and slug are unique, so the constraint name decides which
      // field to blame — otherwise a duplicate name reads as a slug problem.
      const isNameClash = error.message.includes("stores_name_lower_key")

      return NextResponse.json<IStoreResponse>(
        {
          ok: false,
          error: "Check the highlighted fields",
          fieldErrors: isNameClash
            ? { name: "A store with that name already exists. Try another." }
            : { slug: "That address was just taken. Try another." },
        },
        { status: 409 }
      )
    }

    if (error.code === CHECK_VIOLATION) {
      return NextResponse.json<IStoreResponse>(
        {
          ok: false,
          error: "Check the highlighted fields",
          fieldErrors: { slug: "That address isn't in a valid format" },
        },
        { status: 422 }
      )
    }

    return NextResponse.json<IStoreResponse>(
      { ok: false, error: "Could not save your store. Please try again." },
      { status: 400 }
    )
  }

  // Onboarding is done once the store exists.
  await supabase
    .from("profiles")
    .update({ onboarding_step: "complete" })
    .eq("id", user.id)

  return NextResponse.json<IStoreResponse>(
    { ok: true, store: data },
    { status: existing ? 200 : 201 }
  )
}

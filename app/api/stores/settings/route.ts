import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getActiveStore } from "@/lib/stores/active-store"
import { storeSchema } from "@/features/onboarding/schemas"
import type { IStoreResponse } from "@/features/onboarding/types"

const UNIQUE_VIOLATION = "23505"
const CHECK_VIOLATION = "23514"

/**
 * Updates the active store.
 *
 * Separate from POST /api/onboarding/store on purpose. That route resolves the
 * store by `owner_id` and inserts when it finds none — so an **admin** saving
 * settings would have created a second store owned by themselves rather than
 * editing the one they manage. This route only ever updates, and only the store
 * the caller is actually an owner or admin of.
 */
export async function PATCH(request: NextRequest) {
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

  const { active } = await getActiveStore()

  if (!active) {
    return NextResponse.json<IStoreResponse>(
      { ok: false, error: "You don't have a store yet." },
      { status: 404 }
    )
  }

  if (active.role !== "owner" && active.role !== "admin") {
    return NextResponse.json<IStoreResponse>(
      { ok: false, error: "Only owners and admins can change store settings." },
      { status: 403 }
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

  /*
   * A blank slug here KEEPS the current address rather than regenerating one.
   * Onboarding treats blank as "derive from the name", but silently changing a
   * live storefront URL because someone cleared a field would break every link
   * anyone had to it.
   */
  const requested = parsed.data.slug?.trim()
  const slug = requested || active.store.slug

  if (slug !== active.store.slug) {
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

    if (!available) {
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

  const { data, error } = await supabase
    .from("stores")
    .update({
      name,
      slug,
      currency: currency as never,
      logo_url: logo_url || null,
      banner_url: banner_url || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
    })
    .eq("id", active.store.id)
    .select()
    .single()

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
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
      { ok: false, error: "Could not save your changes. Please try again." },
      { status: 400 }
    )
  }

  return NextResponse.json<IStoreResponse>(
    { ok: true, store: data },
    { status: 200 }
  )
}

import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getActiveStore } from "@/lib/stores/active-store"
import {
  createProductSchema,
  productFiltersSchema,
} from "@/features/products/schemas"
import type {
  IProductPageResponse,
  IProductResponse,
} from "@/features/products/types"
import { toProduct } from "@/features/products/mappers"

const PRODUCT_SELECT = `
  id, store_id, title, handle, description_html, vendor, product_type,
  status, is_gift_card, seo_title, seo_description, featured_image_url,
  created_at, updated_at
`

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { active } = await getActiveStore()

  if (!active) {
    return NextResponse.json<IProductPageResponse>(
      { ok: false, error: "You don't have a store yet." },
      { status: 404 }
    )
  }

  const parsed = productFiltersSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  )

  if (!parsed.success) {
    return NextResponse.json<IProductPageResponse>(
      { ok: false, error: "Invalid filters" },
      { status: 422 }
    )
  }

  const { page, pageSize, search, status } = parsed.data
  const from = (page - 1) * pageSize

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .eq("store_id", active.store.id)
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1)

  if (status) query = query.eq("status", status)
  // Escape % and _ so a search for "50%" isn't treated as a wildcard.
  if (search)
    query = query.ilike("title", `%${search.replace(/[%_]/g, "\\$&")}%`)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json<IProductPageResponse>(
      { ok: false, error: "Could not load products." },
      { status: 400 }
    )
  }

  return NextResponse.json<IProductPageResponse>({
    ok: true,
    page: {
      items: (data ?? []).map(toProduct),
      page,
      pageSize,
      totalCount: count ?? 0,
    },
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json<IProductResponse>(
      { ok: false, error: "You need to be signed in to do that." },
      { status: 401 }
    )
  }

  const { active } = await getActiveStore()

  if (!active) {
    return NextResponse.json<IProductResponse>(
      { ok: false, error: "You don't have a store yet." },
      { status: 404 }
    )
  }

  // No role gate: every store member manages the catalogue. RLS enforces the
  // same rule, so this route is not the boundary.

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json<IProductResponse>(
      { ok: false, error: "Malformed request body" },
      { status: 400 }
    )
  }

  const parsed = createProductSchema.safeParse(body)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".")
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return NextResponse.json<IProductResponse>(
      { ok: false, error: "Check the highlighted fields", fieldErrors },
      { status: 422 }
    )
  }

  /*
   * One RPC rather than four inserts: product, options, images and variants
   * have to land together or not at all, and PostgREST gives no transaction
   * across separate calls. The function is SECURITY INVOKER, so RLS still
   * decides whether this caller may write.
   */
  const { data: productId, error } = await supabase.rpc("create_product", {
    p_store_id: active.store.id,
    p_payload: parsed.data as never,
  })

  if (error || !productId) {
    // The variant/option mismatch is validated client-side too; if it reaches
    // here the two have drifted, so surface it against the right field.
    if (error?.message.includes("variant_options_mismatch")) {
      return NextResponse.json<IProductResponse>(
        {
          ok: false,
          error: "Check the highlighted fields",
          fieldErrors: {
            variants: "Each variant needs one value per product option.",
          },
        },
        { status: 422 }
      )
    }

    if (error?.code === "23505") {
      return NextResponse.json<IProductResponse>(
        {
          ok: false,
          error: "Check the highlighted fields",
          fieldErrors: { handle: "That handle is already used in this store." },
        },
        { status: 409 }
      )
    }

    return NextResponse.json<IProductResponse>(
      { ok: false, error: "Could not create that product. Please try again." },
      { status: 400 }
    )
  }

  const { data: created } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", productId as string)
    .single()

  return NextResponse.json<IProductResponse>(
    {
      ok: true,
      product: toProduct(created!),
    },
    { status: 201 }
  )
}

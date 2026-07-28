import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { updateProductSchema } from "@/features/products/schemas"
import type { IProduct, IProductResponse } from "@/features/products/types"
import { toProduct } from "@/features/products/mappers"

async function loadProduct(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string
): Promise<IProduct | null> {
  const { data } = await supabase
    .from("products")
    .select(
      `id, store_id, title, handle, description_html, vendor, product_type,
       status, is_gift_card, seo_title, seo_description, featured_image_url,
       created_at, updated_at,
       product_options(id, name, values, position),
       product_images(id, url, alt_text, position, storage_key),
       product_variants(id, title, options, image_id, sku, barcode, price,
         compare_at_price, inventory_quantity, continue_selling_when_out_of_stock,
         requires_shipping, weight, weight_unit, hs_code, created_at, updated_at)`
    )
    .eq("id", id)
    .maybeSingle()

  if (!data) return null

  const product = toProduct(data)

  /*
   * Costs come from the RPC, never the row: the database revokes SELECT on
   * cost_per_item, so it is absent above by construction. No rows back means
   * this caller isn't an owner or admin — distinct from "not set".
   */
  const { data: costs } = await supabase.rpc("get_variant_costs", {
    p_product_id: id,
  })

  if (costs && costs.length > 0) {
    product.variantCosts = Object.fromEntries(
      costs.map((row) => [row.variant_id, row.cost_per_item])
    )
  }

  return product
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const product = await loadProduct(supabase, id)

  if (!product) {
    return NextResponse.json<IProductResponse>(
      { ok: false, error: "That product doesn't exist." },
      { status: 404 }
    )
  }

  return NextResponse.json<IProductResponse>({ ok: true, product })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json<IProductResponse>(
      { ok: false, error: "Malformed request body" },
      { status: 400 }
    )
  }

  const parsed = updateProductSchema.safeParse(body)

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

  const p = parsed.data

  // PATCH semantics: only keys actually present are written, so an omitted
  // field is left alone rather than nulled.
  const patch: Record<string, unknown> = {}
  if (p.title !== undefined) patch.title = p.title
  if (p.handle !== undefined && p.handle !== "") patch.handle = p.handle
  if (p.descriptionHtml !== undefined)
    patch.description_html = p.descriptionHtml
  if (p.vendor !== undefined) patch.vendor = p.vendor
  if (p.productType !== undefined) patch.product_type = p.productType
  if (p.status !== undefined) patch.status = p.status
  if (p.isGiftCard !== undefined) patch.is_gift_card = p.isGiftCard
  if (p.seoTitle !== undefined) patch.seo_title = p.seoTitle
  if (p.seoDescription !== undefined) patch.seo_description = p.seoDescription
  if (p.featuredImageUrl !== undefined)
    patch.featured_image_url = p.featuredImageUrl

  if (Object.keys(patch).length === 0) {
    const product = await loadProduct(supabase, id)
    return product
      ? NextResponse.json<IProductResponse>({ ok: true, product })
      : NextResponse.json<IProductResponse>(
          { ok: false, error: "That product doesn't exist." },
          { status: 404 }
        )
  }

  // RLS decides whether this caller may write; a non-member matches no rows.
  const { data, error } = await supabase
    .from("products")
    .update(patch as never)
    .eq("id", id)
    .select("id")

  if (error) {
    if (error.code === "23505") {
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
      { ok: false, error: "Could not save that product. Please try again." },
      { status: 400 }
    )
  }

  if (!data?.length) {
    return NextResponse.json<IProductResponse>(
      { ok: false, error: "That product doesn't exist." },
      { status: 404 }
    )
  }

  const product = await loadProduct(supabase, id)
  return NextResponse.json<IProductResponse>({ ok: true, product: product! })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select("id")

  if (error || !data?.length) {
    return NextResponse.json<IProductResponse>(
      { ok: false, error: "That product doesn't exist." },
      { status: 404 }
    )
  }

  return new NextResponse(null, { status: 204 })
}

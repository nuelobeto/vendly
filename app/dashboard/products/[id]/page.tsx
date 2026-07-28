import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getActiveStore } from "@/lib/stores/active-store"
import { toProduct } from "@/features/products/mappers"
import { ProductForm } from "@/features/products/components/product-form"
import { DeleteProduct } from "@/features/products/components/delete-product"

export const metadata: Metadata = { title: "Edit product" }

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/auth/login?next=/dashboard/products/${id}`)

  const { active } = await getActiveStore()
  if (!active) redirect("/onboarding/store")

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

  // RLS scopes the read, so a product from another store is simply not found.
  if (!data) notFound()

  const product = toProduct(data)

  /*
   * No rows means this caller may not see costs — distinct from "not set".
   * The column itself is not SELECT-able, so this RPC is the only way in.
   */
  const { data: costs } = await supabase.rpc("get_variant_costs", {
    p_product_id: id,
  })

  if (costs && costs.length > 0) {
    product.variantCosts = Object.fromEntries(
      costs.map((row) => [row.variant_id, row.cost_per_item])
    )
  }

  return (
    <>
      <Link
        href="/dashboard/products"
        className="inline-flex w-fit items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <ArrowLeftIcon className="size-4" />
        Products
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          {product.title}
        </h2>
        {/* Deleting is owner/admin only — RLS refuses everyone else anyway. */}
        {active.role === "owner" || active.role === "admin" ? (
          <DeleteProduct id={product.id} title={product.title} />
        ) : null}
      </div>

      <ProductForm
        storeId={active.store.id}
        product={product}
        canSeeCost={(costs?.length ?? 0) > 0}
      />
    </>
  )
}

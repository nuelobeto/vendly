import type {
  IProduct,
  IProductImage,
  IProductOption,
  IVariant,
  ProductStatus,
} from "@/features/products/types"

type Row = {
  id: string
  store_id: string
  title: string
  handle: string
  description_html: string | null
  vendor: string
  product_type: string | null
  status: ProductStatus
  is_gift_card: boolean
  seo_title: string | null
  seo_description: string | null
  featured_image_url: string | null
  created_at: string
  updated_at: string
  product_options?: unknown
  product_images?: unknown
  product_variants?: unknown
}

/** PostgREST returns an embedded relation as an array, or null when empty. */
function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

/**
 * snake_case rows to the camelCase contract.
 *
 * Ordering is applied here rather than relied on from Postgres: rows come back
 * in no guaranteed order, and option position is what variant `options` arrays
 * line up against.
 */
export function toProduct(row: Row): IProduct {
  const options: IProductOption[] = list<{
    id: string
    name: string
    values: string[]
    position: number
  }>(row.product_options)
    .map((o) => ({
      id: o.id,
      name: o.name,
      values: o.values ?? [],
      position: o.position,
    }))
    .sort((a, b) => a.position - b.position)

  const images: IProductImage[] = list<{
    id: string
    url: string
    alt_text: string | null
    position: number
    storage_key: string | null
  }>(row.product_images)
    .map((i) => ({
      id: i.id,
      url: i.url,
      altText: i.alt_text,
      position: i.position,
      storageKey: i.storage_key,
    }))
    .sort((a, b) => a.position - b.position)

  const variants: IVariant[] = list<{
    id: string
    title: string
    options: string[]
    image_id: string | null
    sku: string | null
    barcode: string | null
    price: number | string
    compare_at_price: number | string | null
    inventory_quantity: number
    continue_selling_when_out_of_stock: boolean
    requires_shipping: boolean
    weight: number | string
    weight_unit: string
    hs_code: string | null
    created_at: string
    updated_at: string
  }>(row.product_variants)
    .map((v) => ({
      id: v.id,
      title: v.title,
      options: v.options ?? [],
      imageId: v.image_id,
      sku: v.sku,
      barcode: v.barcode,
      // numeric comes back as a string from PostgREST; Number() keeps the
      // contract's `number` honest instead of leaking "120.00" into the UI.
      price: Number(v.price),
      compareAtPrice:
        v.compare_at_price === null ? null : Number(v.compare_at_price),
      inventoryQuantity: v.inventory_quantity,
      continueSellingWhenOutOfStock: v.continue_selling_when_out_of_stock,
      requiresShipping: v.requires_shipping,
      weight: Number(v.weight),
      weightUnit: v.weight_unit,
      hsCode: v.hs_code,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
    }))
    .sort((a, b) => a.title.localeCompare(b.title))

  return {
    id: row.id,
    storeId: row.store_id,
    title: row.title,
    handle: row.handle,
    descriptionHtml: row.description_html,
    vendor: row.vendor,
    productType: row.product_type,
    status: row.status,
    isGiftCard: row.is_gift_card,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    featuredImageUrl: row.featured_image_url,
    options,
    images,
    variants,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Adapted from the previous storefront's API contract.
 *
 * Two deliberate deviations, both to match this codebase:
 *   1. `ProductStatus` is lowercase, like `store_role` and `onboarding_step`.
 *   2. `costPerItem` is absent from `IVariant` rather than nullable. The source
 *      contract flagged the null as ambiguous — "not set" or "not allowed to
 *      see it". Here the database refuses the column to staff outright, so it
 *      arrives as a separate optional map and the ambiguity is gone.
 */

export type ProductStatus = "draft" | "active" | "archived"

export const PRODUCT_STATUSES = [
  "draft",
  "active",
  "archived",
] as const satisfies readonly ProductStatus[]

/**
 * A dimension a product varies along.
 *
 * `position` is explicit here, unlike the source contract which relied on array
 * index — rows come back from Postgres unordered unless told otherwise, so the
 * ordering has to be stored rather than implied.
 */
export interface IProductOption {
  id: string
  /** "Size" */
  name: string
  /** ["Small", "Medium", "Large"] — author's order, not sorted. */
  values: string[]
  position: number
}

export interface IVariant {
  id: string
  /** Derived by a trigger: "41 / Black", or "Default Title" when the product doesn't vary. */
  title: string
  /** One value per product option, in the product's option order. Empty when there are none. */
  options: string[]
  /** Which of the product's images shows this variant. Null falls back to featuredImageUrl. */
  imageId: string | null
  sku: string | null
  barcode: string | null
  price: number
  compareAtPrice: number | null
  inventoryQuantity: number
  continueSellingWhenOutOfStock: boolean
  requiresShipping: boolean
  weight: number
  weightUnit: string
  hsCode: string | null
  createdAt: string
  updatedAt: string
}

export interface IProductImage {
  id: string
  url: string
  altText: string | null
  position: number
  /** Supabase Storage object path. Hand it back so the object can be deleted with the row. */
  storageKey: string | null
}

export interface IProduct {
  id: string
  storeId: string
  title: string
  handle: string
  descriptionHtml: string | null
  vendor: string
  productType: string | null
  status: ProductStatus
  isGiftCard: boolean
  seoTitle: string | null
  seoDescription: string | null
  featuredImageUrl: string | null
  options: IProductOption[]
  variants: IVariant[]
  images: IProductImage[]
  createdAt: string
  updatedAt: string
  /**
   * Wholesale cost per variant id. Present only for owners and admins — the
   * database denies staff the column, so its absence means "not permitted",
   * while a missing key inside it means "not set".
   */
  variantCosts?: Record<string, number | null>
}

export interface IProductPage {
  items: IProduct[]
  page: number
  pageSize: number
  totalCount: number
}

export interface ICreateProductOption {
  name: string
  values: string[]
}

export interface ICreateVariant {
  /** Exactly as long as the product's options. Omit when there are none. */
  options?: string[]
  sku?: string
  barcode?: string
  price: number
  compareAtPrice?: number
  costPerItem?: number
  inventoryQuantity?: number
  continueSellingWhenOutOfStock?: boolean
  requiresShipping?: boolean
  weight?: number
  weightUnit?: string
  hsCode?: string
}

export interface IAddProductImage {
  url: string
  altText?: string
  position?: number
  storageKey?: string
}

export interface ICreateProduct {
  title: string
  handle?: string
  descriptionHtml?: string
  vendor?: string
  productType?: string
  status?: ProductStatus
  isGiftCard?: boolean
  seoTitle?: string
  seoDescription?: string
  featuredImageUrl?: string
  /** Max 3. Omit for a product that doesn't vary, which then takes exactly one variant. */
  options?: ICreateProductOption[]
  images?: IAddProductImage[]
  variants: ICreateVariant[]
}

/**
 * PATCH semantics: an omitted field is left alone, and an explicit `null`
 * clears it. The two are genuinely different, so the nullable fields say so
 * rather than inheriting `string | undefined` from ICreateProduct.
 *
 * Options are excluded for the same reason the source contract excluded them —
 * changing them would have to rewrite every variant to match, which is not a
 * patch. Images and variants have their own endpoints.
 */
export interface IUpdateProduct {
  title?: string
  handle?: string
  vendor?: string
  status?: ProductStatus
  isGiftCard?: boolean
  descriptionHtml?: string | null
  productType?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  featuredImageUrl?: string | null
}

export interface IProductFilters {
  page?: number
  pageSize?: number
  search?: string
  status?: ProductStatus
}

export type IProductResponse =
  | { ok: true; product: IProduct }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export type IProductSuccess = Extract<IProductResponse, { ok: true }>

export type IProductPageResponse =
  { ok: true; page: IProductPage } | { ok: false; error: string }

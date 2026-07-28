import { z } from "zod"

import { PRODUCT_STATUSES } from "@/features/products/types"

export const MAX_OPTIONS = 3
export const WEIGHT_UNITS = ["kg", "g", "lb", "oz"] as const

const money = z.number().min(0, "Must be zero or more").max(99_999_999)

export const productOptionSchema = z.object({
  name: z.string().trim().min(1, "Option name is required").max(60),
  values: z
    .array(z.string().trim().min(1))
    .min(1, "Add at least one value")
    .max(50, "That's too many values"),
})

export const createVariantSchema = z.object({
  options: z.array(z.string().trim()).optional(),
  sku: z.string().trim().max(100).optional(),
  barcode: z.string().trim().max(100).optional(),
  price: money,
  compareAtPrice: money.optional(),
  costPerItem: money.optional(),
  inventoryQuantity: z.number().int().min(0).optional(),
  continueSellingWhenOutOfStock: z.boolean().optional(),
  requiresShipping: z.boolean().optional(),
  weight: z.number().min(0).optional(),
  weightUnit: z.enum(WEIGHT_UNITS).optional(),
  hsCode: z.string().trim().max(20).optional(),
})

export const addProductImageSchema = z.object({
  url: z.url("Invalid image URL"),
  altText: z.string().trim().max(255).optional(),
  position: z.number().int().min(0).optional(),
  storageKey: z.string().trim().max(500).optional(),
})

export const createProductSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(255),
    // Blank means "derive from the title", the same convention the store slug uses.
    handle: z.string().trim().toLowerCase().max(255).optional(),
    descriptionHtml: z.string().max(50_000).optional(),
    vendor: z.string().trim().max(255).optional(),
    productType: z.string().trim().max(255).optional(),
    status: z.enum(PRODUCT_STATUSES).optional(),
    isGiftCard: z.boolean().optional(),
    seoTitle: z.string().trim().max(255).optional(),
    seoDescription: z.string().trim().max(500).optional(),
    featuredImageUrl: z.url().optional(),
    options: z.array(productOptionSchema).max(MAX_OPTIONS).optional(),
    images: z.array(addProductImageSchema).max(20).optional(),
    variants: z
      .array(createVariantSchema)
      .min(1, "A product needs at least one variant"),
  })
  .superRefine((data, ctx) => {
    const optionCount = data.options?.length ?? 0

    // The database enforces this too, via set_variant_title(). Checking here
    // turns a raised exception into a field error the form can point at.
    data.variants.forEach((variant, index) => {
      const supplied = variant.options?.length ?? 0
      if (supplied !== optionCount) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", index, "options"],
          message: `Give exactly ${optionCount} option value${optionCount === 1 ? "" : "s"}`,
        })
      }
    })

    // Duplicate option names would make the variant matrix ambiguous.
    const names = (data.options ?? []).map((o) => o.name.toLowerCase())
    if (new Set(names).size !== names.length) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Option names must be different",
      })
    }
  })

export type CreateProductInput = z.infer<typeof createProductSchema>

export const updateProductSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  handle: z.string().trim().toLowerCase().max(255).optional(),
  descriptionHtml: z.string().max(50_000).nullable().optional(),
  vendor: z.string().trim().max(255).optional(),
  productType: z.string().trim().max(255).nullable().optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  isGiftCard: z.boolean().optional(),
  seoTitle: z.string().trim().max(255).nullable().optional(),
  seoDescription: z.string().trim().max(500).nullable().optional(),
  featuredImageUrl: z.url().nullable().optional(),
})

export type UpdateProductInput = z.infer<typeof updateProductSchema>

export const productFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(255).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
})

/** Whole desired state for PUT /api/products/[id]/variants. */
export const saveVariantsSchema = z.object({
  options: z.array(productOptionSchema).max(MAX_OPTIONS),
  variants: z
    .array(
      createVariantSchema.extend({
        /** Present for an existing variant; absent means "create". */
        id: z.uuid().optional(),
      })
    )
    .min(1, "A product needs at least one variant"),
})

export type SaveVariantsInput = z.infer<typeof saveVariantsSchema>

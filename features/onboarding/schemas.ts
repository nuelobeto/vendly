import { z } from "zod"

/** Matches the `profiles_phone_format` CHECK constraint in the DB exactly. */
export const E164 = /^\+[1-9]\d{7,14}$/

/** Curated dial codes. Extend as the merchant base grows. */
export const DIAL_CODES = [
  { code: "+234", label: "Nigeria (+234)" },
  { code: "+1", label: "United States / Canada (+1)" },
  { code: "+44", label: "United Kingdom (+44)" },
  { code: "+233", label: "Ghana (+233)" },
  { code: "+254", label: "Kenya (+254)" },
  { code: "+27", label: "South Africa (+27)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+91", label: "India (+91)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+33", label: "France (+33)" },
  { code: "+43", label: "Austria (+43)" },
  // Escape hatch so a stored number whose country isn't listed above survives
  // a round-trip instead of being re-prefixed with the default code.
  { code: "+", label: "Other — type the full number" },
] as const

export const DEFAULT_DIAL_CODE = DIAL_CODES[0].code

/**
 * National numbers are commonly written with a trunk prefix (`0803…` in NG/GB)
 * which must be dropped before appending a dial code, and people paste all
 * sorts of spacing.
 */
export function toE164(dialCode: string, nationalNumber: string) {
  const digits = nationalNumber.replace(/\D/g, "").replace(/^0+/, "")
  return digits ? `${dialCode}${digits}` : ""
}

/** Splits a stored E.164 number back into form fields. */
export function fromE164(phone: string | null | undefined) {
  if (!phone) return { dialCode: DEFAULT_DIAL_CODE, phoneNumber: "" }

  // Longest dial code first, so +1 doesn't shadow a longer code starting with 1.
  const match = [...DIAL_CODES]
    .map((d) => d.code)
    .sort((a, b) => b.length - a.length)
    .find((code) => phone.startsWith(code))

  return match
    ? { dialCode: match, phoneNumber: phone.slice(match.length) }
    : { dialCode: "+", phoneNumber: phone.replace(/^\+/, "") }
}

const personName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(80, `${label} must be 80 characters or fewer`)
    // Letters plus the marks, apostrophes and hyphens real names contain.
    .regex(/^[\p{L}\p{M}'\-. ]+$/u, `${label} contains unsupported characters`)

/** What the API accepts and writes to `profiles`. */
export const profileSchema = z.object({
  first_name: personName("First name"),
  last_name: personName("Last name"),
  phone: z
    .string()
    .regex(E164, "Enter a valid phone number including country code")
    .nullable()
    .optional(),
  avatar_url: z.url("Invalid avatar URL").nullable().optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>

/** Client-side shape: phone is split across two controls. */
export const profileFormSchema = z
  .object({
    firstName: personName("First name"),
    lastName: personName("Last name"),
    dialCode: z.string().min(1),
    phoneNumber: z.string().trim(),
    avatarUrl: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    // Phone is optional, but a partially-filled one is a mistake, not a skip.
    if (!data.phoneNumber.trim()) return

    if (!E164.test(toE164(data.dialCode, data.phoneNumber))) {
      ctx.addIssue({
        code: "custom",
        path: ["phoneNumber"],
        message: "Enter a valid phone number for the selected country",
      })
    }
  })

export type ProfileFormInput = z.infer<typeof profileFormSchema>

export const UPLOAD_BUCKETS = [
  "avatars",
  "store-logos",
  "store-banners",
] as const
export type UploadBucket = (typeof UPLOAD_BUCKETS)[number]

const RASTER = ["image/jpeg", "image/png", "image/webp", "image/avif"]

/** Mirrors each bucket's `allowed_mime_types`, which Storage enforces too. */
export const IMAGE_MIME_TYPES: Record<UploadBucket, string[]> = {
  avatars: RASTER,
  // Logos are often vector; banners are photographs, so no SVG there.
  "store-logos": [...RASTER, "image/svg+xml"],
  "store-banners": RASTER,
}

/** Mirrors each bucket's `file_size_limit`. A wide banner needs more headroom. */
export const IMAGE_MAX_BYTES: Record<UploadBucket, number> = {
  avatars: 2 * 1024 * 1024,
  "store-logos": 2 * 1024 * 1024,
  "store-banners": 5 * 1024 * 1024,
}

export function formatMaxSize(bucket: UploadBucket) {
  return `${IMAGE_MAX_BYTES[bucket] / (1024 * 1024)} MB`
}

// ---------------------------------------------------------------------------
// Store step
// ---------------------------------------------------------------------------

/** Mirrors the `currency` enum in the database. */
export const CURRENCIES = [
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "NGN", label: "Nigerian Naira (NGN)" },
  { code: "CAD", label: "Canadian Dollar (CAD)" },
  { code: "AUD", label: "Australian Dollar (AUD)" },
] as const

export const DEFAULT_CURRENCY = "USD"

export const SLUG_MIN_LENGTH = 3
export const SLUG_MAX_LENGTH = 63

/** Mirrors the `stores_slug_format` CHECK constraint exactly. */
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/

/**
 * Derives a candidate slug from a store name. Strips accents so "Café Noir"
 * becomes "cafe-noir" rather than losing the character entirely.
 */
export function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, "")
}

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(SLUG_MIN_LENGTH, `Use at least ${SLUG_MIN_LENGTH} characters`)
  .max(SLUG_MAX_LENGTH, `Use ${SLUG_MAX_LENGTH} characters or fewer`)
  .regex(
    SLUG_PATTERN,
    "Use lowercase letters, numbers and hyphens, starting and ending with a letter or number"
  )

/**
 * What the API accepts and writes to `stores`.
 *
 * `slug` is optional: blank means "derive it from the name", which the server
 * does via the generate_store_slug RPC so uniqueness and reserved words are
 * settled authoritatively rather than guessed at on the client.
 */
export const storeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Store name must be at least 2 characters")
    .max(120, "Store name must be 120 characters or fewer"),
  slug: z.union([slug, z.literal("")]).optional(),
  currency: z.enum(CURRENCIES.map((c) => c.code) as [string, ...string[]]),
  logo_url: z.url("Invalid logo URL").nullable().optional(),
  banner_url: z.url("Invalid banner URL").nullable().optional(),
  contact_email: z
    .union([z.email("Enter a valid email address"), z.literal("")])
    .nullable()
    .optional(),
  contact_phone: z
    .union([
      z
        .string()
        .regex(E164, "Enter a valid phone number including country code"),
      z.literal(""),
    ])
    .nullable()
    .optional(),
})

export type StoreInput = z.infer<typeof storeSchema>

export const storeFormSchema = z
  .object({
    name: storeSchema.shape.name,
    slug: z.string().trim().toLowerCase(),
    currency: storeSchema.shape.currency,
    logoUrl: z.string().nullable(),
    bannerUrl: z.string().nullable(),
    contactEmail: z.string().trim(),
    contactDialCode: z.string().min(1),
    contactPhoneNumber: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    // Blank is allowed — the server generates one from the name.
    if (data.slug && !SLUG_PATTERN.test(data.slug)) {
      ctx.addIssue({
        code: "custom",
        path: ["slug"],
        message:
          "Use lowercase letters, numbers and hyphens, at least 3 characters",
      })
    }

    if (data.contactEmail && !z.email().safeParse(data.contactEmail).success) {
      ctx.addIssue({
        code: "custom",
        path: ["contactEmail"],
        message: "Enter a valid email address",
      })
    }

    if (
      data.contactPhoneNumber.trim() &&
      !E164.test(toE164(data.contactDialCode, data.contactPhoneNumber))
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["contactPhoneNumber"],
        message: "Enter a valid phone number for the selected country",
      })
    }
  })

export type StoreFormInput = z.infer<typeof storeFormSchema>

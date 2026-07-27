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

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]

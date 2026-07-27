import { z } from "zod"

/** Owner is excluded: transferring ownership is a separate, deliberate act. */
export const INVITABLE_ROLES = [
  {
    value: "admin",
    label: "Admin",
    hint: "Can manage the store and invite others",
  },
  { value: "staff", label: "Staff", hint: "Can work on orders and products" },
] as const

export const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .pipe(z.email("Enter a valid email address"))
    .transform((value) => value.toLowerCase()),
  role: z.enum(["admin", "staff"]),
})

export type InviteInput = z.infer<typeof inviteSchema>

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Missing invite token"),
})

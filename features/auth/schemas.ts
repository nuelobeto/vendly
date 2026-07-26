import { z } from "zod"

export const PASSWORD_MIN_LENGTH = 8

/**
 * Shared by the client form and the API route so the two can't drift.
 * Keep the rules in sync with the Supabase dashboard's own password policy
 * (Authentication → Providers → Email), which is enforced independently.
 */
export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .pipe(z.email("Enter a valid email address"))
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(72, "Password cannot be longer than 72 characters")
    .regex(/[a-z]/, "Include at least one lowercase letter")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
})

export type RegisterInput = z.infer<typeof registerSchema>

/**
 * Client-only: adds the confirmation field the API doesn't need. Terms
 * acceptance is communicated as inline copy rather than a checkbox, keeping
 * registration to email + password.
 */
export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type RegisterFormInput = z.input<typeof registerFormSchema>

/** 0–4, used by the strength meter. Deliberately simple and honest. */
export function scorePassword(password: string): number {
  if (!password) return 0

  let score = 0
  if (password.length >= PASSWORD_MIN_LENGTH) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  return Math.min(score, 4)
}

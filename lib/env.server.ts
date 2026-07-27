import "server-only"

import { z } from "zod"

/**
 * Server-only environment. The `server-only` import above makes importing this
 * from a client component a build error rather than a silent secret leak.
 *
 * Never prefix any of these with NEXT_PUBLIC_ — that would inline them into the
 * browser bundle.
 */
const serverEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1).optional(),
  // Must be a verified sender on your Resend domain. Accepts either a bare
  // address or the "Name <address>" form.
  RESEND_FROM_EMAIL: z.string().min(3).includes("@").optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

let cached: ServerEnv | null = null

function getServerEnv(): ServerEnv {
  if (cached) return cached

  const parsed = serverEnvSchema.safeParse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  })

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")
    throw new Error(`Invalid server environment variables:\n${details}`)
  }

  cached = parsed.data
  return cached
}

/**
 * Email config, or null when Resend isn't set up.
 *
 * Deliberately optional: without it the app still works and invites fall back
 * to copy-link, so a missing key degrades a feature rather than breaking boot.
 */
export function getEmailConfig() {
  const env = getServerEnv()

  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    // Half-configured is a mistake worth surfacing, unlike not configured.
    if (env.RESEND_API_KEY || env.RESEND_FROM_EMAIL) {
      console.warn(
        "[email] RESEND_API_KEY and RESEND_FROM_EMAIL must both be set; email sending is disabled."
      )
    }
    return null
  }

  return { apiKey: env.RESEND_API_KEY, from: env.RESEND_FROM_EMAIL }
}

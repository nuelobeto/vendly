import { z } from "zod"

/**
 * NEXT_PUBLIC_* vars are inlined at build time, so they must be referenced as
 * full literal property accesses — never `process.env[key]`.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({
    message: "NEXT_PUBLIC_SUPABASE_URL must be a valid URL",
  }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required"),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
})

export type Env = z.infer<typeof publicEnvSchema>

let cached: Env | null = null

/**
 * Validated lazily rather than at module load, so `next build` and CI succeed
 * without Supabase credentials. A missing key then fails on the first request
 * that needs it, with a message that says exactly what to do.
 */
export function getEnv(): Env {
  if (cached) return cached

  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  })

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")

    throw new Error(
      `Invalid environment variables:\n${details}\n\n` +
        `Copy .env.example to .env.local and fill it in.`
    )
  }

  cached = parsed.data
  return cached
}

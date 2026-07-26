import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { getEnv } from "@/lib/env"
import type { Database } from "@/lib/supabase/types"

/**
 * Server-side Supabase client for Server Components, Route Handlers and Server
 * Actions. Must be created per request — never cache or share the instance.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    getEnv().NEXT_PUBLIC_SUPABASE_URL,
    getEnv().NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Server Components cannot set cookies. Safe to ignore as long as
            // proxy.ts refreshes the session — which it does.
          }
        },
      },
    }
  )
}

import { createBrowserClient } from "@supabase/ssr"

import { getEnv } from "@/lib/env"
import type { Database } from "@/lib/supabase/types"

/**
 * Browser-side Supabase client. `createBrowserClient` memoizes internally, so
 * calling this on every render is safe.
 */
export function createClient() {
  return createBrowserClient<Database>(
    getEnv().NEXT_PUBLIC_SUPABASE_URL,
    getEnv().NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
}

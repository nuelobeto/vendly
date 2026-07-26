import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { getEnv } from "@/lib/env"
import type { Database } from "@/lib/supabase/types"

/** Routes that require an authenticated user. */
const PROTECTED_PREFIXES = ["/onboarding", "/dashboard"]

/** Auth pages a signed-in user should be bounced away from. */
const AUTH_PREFIXES = ["/auth/register", "/auth/login"]

/**
 * Refreshes the Supabase session on every matched request and writes rotated
 * tokens back onto the response.
 *
 * Two rules make this correct, and breaking either causes random logouts:
 *   1. Never construct a fresh NextResponse after creating the client — the
 *      refreshed cookies live on `response` and would be dropped.
 *   2. Always call `getUser()`. It revalidates the token with Supabase, unlike
 *      `getSession()`, which trusts whatever the cookie claims.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    getEnv().NEXT_PUBLIC_SUPABASE_URL,
    getEnv().NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  if (user && AUTH_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = "/onboarding/profile"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return response
}

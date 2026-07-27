import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { AuthError } from "@supabase/supabase-js"

import { getEnv } from "@/lib/env"
import type { Database } from "@/lib/supabase/types"

/** Routes that require an authenticated user. */
const PROTECTED_PREFIXES = ["/onboarding", "/dashboard"]

/** Auth pages a signed-in user should be bounced away from. */
const AUTH_PREFIXES = ["/auth/register", "/auth/login"]

/** `sb-<ref>-auth-token`, plus the `.0`/`.1` chunks used for large sessions. */
const AUTH_COOKIE_PATTERN = /^sb-.+-auth-token(\.\d+)?$/

/**
 * A session whose refresh token the server no longer recognises. The cookies
 * can never recover on their own, and the browser replays them on every single
 * request — so without clearing them this errors forever.
 */
function isStaleSessionError(error: AuthError) {
  return (
    error.code === "refresh_token_not_found" ||
    error.code === "refresh_token_already_used" ||
    error.code === "session_not_found" ||
    (error.status === 400 && /refresh token/i.test(error.message))
  )
}

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
    error,
  } = await supabase.auth.getUser()

  const staleSession = !!error && isStaleSessionError(error)

  /**
   * Expire dead auth cookies on whichever response we end up returning, so the
   * next request arrives clean and the app self-heals in one hop. Done by hand
   * rather than via `signOut()`: that re-enters the failing session path and
   * may make a network call, neither of which belongs in a proxy.
   */
  const finalize = (result: NextResponse) => {
    if (staleSession) {
      for (const { name } of request.cookies.getAll()) {
        if (AUTH_COOKIE_PATTERN.test(name)) {
          result.cookies.set(name, "", { maxAge: 0, path: "/" })
        }
      }
    }
    return result
  }

  const { pathname } = request.nextUrl

  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("next", pathname)
    return finalize(NextResponse.redirect(url))
  }

  if (user && AUTH_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()

    /*
     * Honour `next` so someone already signed in who follows an invite link
     * still lands on the invite rather than being dumped on the dashboard.
     *
     * Otherwise go to /dashboard, not straight to onboarding: the dashboard
     * layout already decides between onboarding and the shell based on
     * membership and pending invites, and duplicating that here would give two
     * sources of truth that can disagree.
     */
    const requested = request.nextUrl.searchParams.get("next")
    const target =
      requested && requested.startsWith("/") && !requested.startsWith("//")
        ? requested
        : "/dashboard"

    url.pathname = target.split("?")[0]
    url.search = target.includes("?")
      ? `?${target.split("?").slice(1).join("?")}`
      : ""
    return finalize(NextResponse.redirect(url))
  }

  return finalize(response)
}

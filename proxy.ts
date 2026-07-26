import type { NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"

/**
 * Next.js 16 renamed the `middleware` file convention to `proxy`. Same
 * behaviour, new name — see node_modules/next/dist/docs/.../16-proxy.md.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files. Auth cookie refresh
     * should not run for those — it would add a Supabase round trip per asset.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
}

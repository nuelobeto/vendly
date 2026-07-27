import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

/**
 * POST rather than GET on purpose: a GET sign-out can be triggered by any
 * `<img src>` or prefetch, which makes logging users out a trivial CSRF.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  return NextResponse.redirect(new URL("/", request.nextUrl.origin), {
    // 303 so the browser follows with GET rather than replaying the POST.
    status: 303,
  })
}

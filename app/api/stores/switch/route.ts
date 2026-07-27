import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { ACTIVE_STORE_COOKIE } from "@/lib/stores/active-store"

/**
 * Switches the active store.
 *
 * Membership is re-checked server-side rather than trusted from the form: the
 * cookie decides which store the dashboard renders, so setting it to a store
 * you don't belong to must not be possible. RLS on store_members means a
 * non-member's lookup simply finds nothing.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      new URL("/auth/login", request.nextUrl.origin),
      {
        status: 303,
      }
    )
  }

  const form = await request.formData()
  const storeId = String(form.get("storeId") ?? "")

  const { data: membership } = await supabase
    .from("store_members")
    .select("store_id")
    .eq("user_id", user.id)
    .eq("store_id", storeId)
    .maybeSingle()

  const response = NextResponse.redirect(
    new URL("/dashboard", request.nextUrl.origin),
    // 303 so the browser follows with GET rather than replaying the POST.
    { status: 303 }
  )

  if (membership) {
    response.cookies.set(ACTIVE_STORE_COOKIE, storeId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    })
  }

  return response
}

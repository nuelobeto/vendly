import "server-only"

import { cookies } from "next/headers"

import { createClient } from "@/lib/supabase/server"
import type { Database, StoreRole } from "@/lib/supabase/types"

export const ACTIVE_STORE_COOKIE = "active_store"

type StoreRow = Database["public"]["Tables"]["stores"]["Row"]

export type MembershipStore = {
  store: StoreRow
  role: StoreRole
}

export type ActiveStoreResult = {
  stores: MembershipStore[]
  active: MembershipStore | null
}

/**
 * Every store the signed-in user belongs to, plus which one is active.
 *
 * This exists because a user can belong to more than one store — an owner who
 * is also invited elsewhere, for instance. The codebase previously resolved
 * membership with `.maybeSingle()`, which does not merely pick one: PostgREST
 * *errors* when the filter matches multiple rows, so a second membership made
 * the app believe the user belonged to no store at all and bounced them into
 * onboarding.
 *
 * Ordering is stable — owned stores first, then by join date — so the fallback
 * choice doesn't move around between requests.
 */
export async function getActiveStore(): Promise<ActiveStoreResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { stores: [], active: null }

  const { data } = await supabase
    .from("store_members")
    .select("role, created_at, stores(*)")
    .eq("user_id", user.id)
    .order("created_at")

  const stores: MembershipStore[] = (data ?? [])
    .map((row) => {
      const store = Array.isArray(row.stores) ? row.stores[0] : row.stores
      return store ? { store, role: row.role as StoreRole } : null
    })
    .filter((value): value is MembershipStore => value !== null)
    .sort((a, b) => {
      if (a.role === "owner" && b.role !== "owner") return -1
      if (b.role === "owner" && a.role !== "owner") return 1
      return 0
    })

  if (stores.length === 0) return { stores: [], active: null }

  const cookieStore = await cookies()
  const preferred = cookieStore.get(ACTIVE_STORE_COOKIE)?.value

  // A stale cookie — a store they left, or one that was deleted — must fall
  // back rather than leave them with no active store.
  const active =
    stores.find((entry) => entry.store.id === preferred) ?? stores[0]

  return { stores, active }
}

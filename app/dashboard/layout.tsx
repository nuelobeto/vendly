import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getActiveStore } from "@/lib/stores/active-store"
import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar"
import { DashboardTopbar } from "@/features/dashboard/components/dashboard-topbar"

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Vendly" },
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // proxy.ts guards /dashboard, but a layout reading user data shouldn't rely
  // on a matcher alone — it would be a silent hole if the matcher changed.
  if (!user) {
    redirect("/auth/login?next=/dashboard")
  }

  /*
   * Resolved through membership, not stores.owner_id, and never with
   * `.maybeSingle()` — a user can belong to more than one store, and
   * maybeSingle *errors* on multiple rows rather than picking one.
   */
  const [{ data: profile }, { stores, active }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getActiveStore(),
  ])

  const store = active?.store

  if (!store) {
    // An unaccepted invite means they're a teammate mid-onboarding, not a
    // merchant who still needs to create a store.
    const { data: pendingInvite } = await supabase.rpc("has_pending_invite")
    redirect(
      pendingInvite === true ? "/onboarding/profile" : "/onboarding/store"
    )
  }

  // Read the persisted sidebar state on the server so the first paint matches
  // the user's last choice instead of flashing open then collapsing.
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <DashboardSidebar
        storeName={store.name}
        storeSlug={store.slug}
        storeLogoUrl={store.logo_url}
      />

      <SidebarInset>
        <DashboardTopbar
          name={fullName}
          email={user.email ?? ""}
          avatarUrl={profile?.avatar_url ?? null}
          stores={stores.map((entry) => ({
            id: entry.store.id,
            name: entry.store.name,
            slug: entry.store.slug,
            role: entry.role,
            isActive: entry.store.id === store.id,
          }))}
        />

        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

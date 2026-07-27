import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
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
   * Resolved through store_members, not stores.owner_id. An invited teammate
   * belongs to a store they don't own — keying off ownership would bounce them
   * into onboarding and have them create a second store.
   */
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("store_members")
      .select("role, stores(*)")
      .eq("user_id", user.id)
      .maybeSingle(),
  ])

  const store = Array.isArray(membership?.stores)
    ? membership?.stores[0]
    : membership?.stores

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
        />

        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

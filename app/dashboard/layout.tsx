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

  const [{ data: profile }, { data: store }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("stores").select("*").eq("owner_id", user.id).maybeSingle(),
  ])

  // No store means onboarding never finished; the shell has nothing to frame.
  if (!store) {
    redirect("/onboarding/store")
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

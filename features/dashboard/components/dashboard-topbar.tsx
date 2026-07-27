"use client"

import { usePathname } from "next/navigation"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/landing/theme-toggle"
import { dashboardNav } from "@/features/dashboard/nav-config"
import { UserMenu } from "@/features/dashboard/components/user-menu"

const allNavItems = dashboardNav.flatMap((group) => group.items)

/** Longest match wins, so /dashboard doesn't shadow /dashboard/orders. */
function titleForPath(pathname: string) {
  const match = [...allNavItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    )

  return match?.label ?? "Dashboard"
}

/**
 * Sticky, not fixed.
 *
 * `sticky top-0` keeps the bar pinned while content scrolls beneath it without
 * taking it out of flow — so the content below needs no height compensation,
 * and it behaves correctly inside the sidebar inset on mobile.
 *
 * The title is derived from the path rather than passed down, because the
 * layout renders once while the page beneath it changes on navigation.
 */
function DashboardTopbar({
  name,
  email,
  avatarUrl,
}: {
  name: string
  email: string
  avatarUrl: string | null
}) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background/85 px-4 supports-backdrop-filter:backdrop-blur-md">
      <SidebarTrigger className="-ml-1" />

      <h1 className="truncate font-heading text-sm font-medium">
        {titleForPath(pathname)}
      </h1>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu name={name} email={email} avatarUrl={avatarUrl} />
      </div>
    </header>
  )
}

export { DashboardTopbar }

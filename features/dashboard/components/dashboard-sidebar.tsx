"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLinkIcon, StoreIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { dashboardNav } from "@/features/dashboard/nav-config"

function DashboardSidebar({
  storeName,
  storeSlug,
  storeLogoUrl,
}: {
  storeName: string
  storeSlug: string
  storeLogoUrl: string | null
}) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={storeName}
              render={<Link href="/dashboard" />}
            >
              <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-accent ring-1 ring-sidebar-border">
                {storeLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={storeLogoUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <StoreIcon className="size-4 text-muted-foreground" />
                )}
              </span>
              <span className="flex min-w-0 flex-col text-left leading-tight">
                <span className="truncate font-medium">{storeName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  vendly.shop/{storeSlug}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Already overflow-auto + min-h-0, so long nav lists scroll in place
          rather than stretching the fixed h-svh container. */}
      <SidebarContent>
        {dashboardNav.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  // Exact match for the index route, prefix match for the rest,
                  // so /dashboard isn't active on every child page.
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === item.href
                      : pathname.startsWith(item.href)

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        render={<Link href={item.href} prefetch={false} />}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="View storefront"
              render={
                <a
                  href={`/${storeSlug}`}
                  target="_blank"
                  rel="noreferrer noopener"
                />
              }
            >
              <ExternalLinkIcon />
              <span className={cn("truncate")}>View storefront</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export { DashboardSidebar }

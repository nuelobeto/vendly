import {
  ChartNoAxesColumnIcon,
  LayoutDashboardIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  Users2Icon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react"

export type DashboardNavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export type DashboardNavGroup = {
  label: string
  items: DashboardNavItem[]
}

/**
 * Only `/dashboard` exists so far; the rest are placeholders that will 404
 * until built. Kept here so the shell is complete and each page is a one-line
 * addition rather than a nav refactor.
 */
export const dashboardNav: DashboardNavGroup[] = [
  {
    label: "Selling",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboardIcon },
      { href: "/dashboard/orders", label: "Orders", icon: ShoppingBagIcon },
      { href: "/dashboard/products", label: "Products", icon: PackageIcon },
      { href: "/dashboard/customers", label: "Customers", icon: UsersIcon },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/dashboard/team", label: "Team", icon: Users2Icon },
      { href: "/dashboard/payouts", label: "Payouts", icon: WalletIcon },
      {
        href: "/dashboard/analytics",
        label: "Analytics",
        icon: ChartNoAxesColumnIcon,
      },
      { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
]

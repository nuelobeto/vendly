import {
  ChartNoAxesColumnIcon,
  LayoutDashboardIcon,
  PackageIcon,
  ShoppingBagIcon,
  WalletIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

const sidebar = [
  { icon: LayoutDashboardIcon, label: "Overview", active: true },
  { icon: ShoppingBagIcon, label: "Orders" },
  { icon: PackageIcon, label: "Products" },
  { icon: WalletIcon, label: "Payouts" },
  { icon: ChartNoAxesColumnIcon, label: "Analytics" },
]

const stats = [
  { label: "Revenue", value: "$18,420", delta: "+12.4%" },
  { label: "Orders", value: "312", delta: "+8.1%" },
  { label: "Repeat rate", value: "38%", delta: "+3.2%" },
]

const orders = [
  { initials: "AO", name: "Linen overshirt", status: "Paid", price: "$128.00" },
  {
    initials: "MK",
    name: "Ceramic mug set",
    status: "Packed",
    price: "$54.00",
  },
  { initials: "TD", name: "Wool throw", status: "Shipped", price: "$210.00" },
  { initials: "RN", name: "Brass candle", status: "Paid", price: "$36.00" },
]

const AREA_LINE =
  "M0,72 C20,66 30,50 50,54 C70,58 82,38 104,40 C126,42 138,60 160,52 C182,44 194,26 216,30 C238,34 250,20 272,16 C294,12 306,22 320,14"

/**
 * Decorative product shot built entirely from tokens and inline SVG — no image
 * assets and no remote hosts. Hidden from assistive tech behind one caption.
 */
function DashboardMock({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <span className="sr-only">
        Screenshot of the Vendly merchant dashboard showing revenue, orders and
        inventory.
      </span>

      <div
        aria-hidden="true"
        className="overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 shadow-primary/10 ring-foreground/10"
      >
        {/* Titlebar */}
        <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2.5">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="mx-auto rounded-md bg-background px-3 py-1 font-mono text-[10px] text-muted-foreground ring-1 ring-border">
            vendly.shop/atelier-nord
          </div>
        </div>

        <div className="grid sm:grid-cols-[168px_1fr]">
          {/* Sidebar */}
          <div className="hidden flex-col gap-0.5 border-r p-3 sm:flex">
            {sidebar.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground",
                  item.active && "bg-muted font-medium text-foreground"
                )}
              >
                <item.icon className="size-3.5" />
                {item.label}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 p-3 sm:p-4">
            {/* Stat tiles */}
            <div className="grid grid-cols-3 gap-2">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl border p-2.5">
                  <div className="text-[10px] text-muted-foreground">
                    {stat.label}
                  </div>
                  <div className="mt-1 font-heading text-base font-semibold tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-medium text-primary">
                    {stat.delta}
                  </div>
                </div>
              ))}
            </div>

            {/* Area chart — hand-rolled so recharts stays out of the bundle */}
            <div className="rounded-xl border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-medium">Last 30 days</span>
                <span className="text-[10px] text-muted-foreground">
                  Gross sales
                </span>
              </div>
              <svg
                viewBox="0 0 320 96"
                preserveAspectRatio="none"
                className="h-20 w-full"
              >
                <defs>
                  <linearGradient id="mockArea" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--primary)"
                      stopOpacity="0.35"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--primary)"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                <path
                  d={`${AREA_LINE} L320,96 L0,96 Z`}
                  fill="url(#mockArea)"
                />
                <path
                  d={AREA_LINE}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            {/* Orders list */}
            <div className="flex flex-col divide-y rounded-xl border">
              {orders.map((order) => (
                <div
                  key={order.name}
                  className="flex items-center gap-2.5 px-2.5 py-2"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground">
                    {order.initials}
                  </span>
                  <span className="truncate text-xs">{order.name}</span>
                  <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
                    {order.status}
                  </span>
                  <span className="w-16 text-right font-mono text-[10px] text-muted-foreground">
                    {order.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { DashboardMock }

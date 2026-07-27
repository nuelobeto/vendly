import type { Metadata } from "next"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = { title: "Overview" }

const stats = [
  { label: "Revenue", value: "$0.00" },
  { label: "Orders", value: "0" },
  { label: "Products", value: "0" },
  { label: "Customers", value: "0" },
]

export default function Page() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className="font-heading text-2xl font-semibold tracking-tight">
                {stat.value}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="min-h-96">
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Nothing yet. Orders will appear here once buyers start checking out.
        </CardContent>
      </Card>
    </>
  )
}

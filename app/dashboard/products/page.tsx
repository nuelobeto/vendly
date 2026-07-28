import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { PackageIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { getActiveStore } from "@/lib/stores/active-store"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ProductStatus } from "@/features/products/types"

export const metadata: Metadata = { title: "Products" }

const STATUS_VARIANT: Record<
  ProductStatus,
  "default" | "secondary" | "outline"
> = {
  active: "default",
  draft: "secondary",
  archived: "outline",
}

export default async function Page() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login?next=/dashboard/products")

  const { active } = await getActiveStore()
  if (!active) redirect("/onboarding/store")

  /*
   * Read directly rather than through the API route: this is a server
   * component, so an HTTP hop to our own endpoint would add latency and a
   * cookie round trip for no benefit. RLS scopes the rows either way.
   *
   * Variants are counted, not embedded — a list doesn't need every variant, and
   * cost_per_item isn't SELECT-able here anyway.
   */
  const { data: products } = await supabase
    .from("products")
    .select(
      "id, title, handle, status, featured_image_url, product_variants(id, price, inventory_quantity)"
    )
    .eq("store_id", active.store.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Products
          </h2>
          <p className="text-sm text-muted-foreground">
            {products?.length ?? 0} in {active.store.name}
          </p>
        </div>
        {
          <Link
            href="/dashboard/products/new"
            prefetch={false}
            className={cn(buttonVariants({ size: "lg" }), "h-10 rounded-xl")}
          >
            Add product
          </Link>
        }
      </div>

      {(products?.length ?? 0) === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No products yet</CardTitle>
            <CardDescription>
              Add your first product and it&apos;ll show up here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          {/* Wide on purpose: the table scrolls inside its own container so the
              page body never scrolls sideways on a phone. */}
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Variants</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(products ?? []).map((product) => {
                  const variants = Array.isArray(product.product_variants)
                    ? product.product_variants
                    : []
                  const stock = variants.reduce(
                    (total, v) => total + (v.inventory_quantity ?? 0),
                    0
                  )
                  /*
                   * numeric arrives as a string from PostgREST, so Number() is
                   * required — and the result is filtered, because a column the
                   * query didn't select yields undefined and would render as
                   * "NaN" rather than an honest blank.
                   */
                  const prices = variants
                    .map((v) => Number(v.price))
                    .filter((n) => Number.isFinite(n))
                  const low = prices.length ? Math.min(...prices) : null
                  const high = prices.length ? Math.max(...prices) : null

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          prefetch={false}
                          className="flex items-center gap-3 rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                            {product.featured_image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.featured_image_url}
                                alt=""
                                className="size-full object-cover"
                              />
                            ) : (
                              <PackageIcon className="size-4 text-muted-foreground" />
                            )}
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate font-medium">
                              {product.title}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              /{product.handle}
                            </span>
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[product.status]}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {variants.length}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {stock}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {low === null
                          ? "—"
                          : low === high
                            ? low.toFixed(2)
                            : `${low.toFixed(2)}–${high!.toFixed(2)}`}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  )
}

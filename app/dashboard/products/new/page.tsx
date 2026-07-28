import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getActiveStore } from "@/lib/stores/active-store"
import { ProductForm } from "@/features/products/components/product-form"

export const metadata: Metadata = { title: "New product" }

export default async function Page() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login?next=/dashboard/products/new")

  const { active } = await getActiveStore()
  if (!active) redirect("/onboarding/store")

  // Every member can add products; only owners and admins can read cost back,
  // so staff aren't asked to type into a field they'd never see again.
  const canSeeCost = active.role === "owner" || active.role === "admin"

  return (
    <>
      <Link
        href="/dashboard/products"
        className="inline-flex w-fit items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <ArrowLeftIcon className="size-4" />
        Products
      </Link>

      <h2 className="font-heading text-xl font-semibold tracking-tight">
        New product
      </h2>

      <ProductForm
        storeId={active.store.id}
        product={null}
        canSeeCost={canSeeCost}
      />
    </>
  )
}

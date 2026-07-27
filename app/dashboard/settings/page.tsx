import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ExternalLinkIcon, InfoIcon } from "lucide-react"

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
import { StoreForm } from "@/features/onboarding/components/store-form"

export const metadata: Metadata = { title: "Settings" }

export default async function Page() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login?next=/dashboard/settings")

  const { active } = await getActiveStore()

  if (!active) redirect("/onboarding/store")

  const canEdit = active.role === "owner" || active.role === "admin"

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <span>Store details</span>
            <Badge variant="secondary">{active.store.slug}</Badge>
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <span>How your storefront appears to buyers.</span>
            <Link
              href={`/${active.store.slug}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 rounded-sm underline underline-offset-4 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              View storefront
              <ExternalLinkIcon className="size-3" />
            </Link>
          </CardDescription>
        </CardHeader>

        <CardContent>
          {canEdit ? (
            <StoreForm userId={user.id} store={active.store} mode="settings" />
          ) : (
            /*
              Staff see the values but no form. The API refuses their write
              anyway; rendering a form that always fails would be a worse way
              to communicate the same rule.
            */
            <dl className="flex flex-col divide-y text-sm">
              {[
                ["Name", active.store.name],
                ["Address", `vendly.shop/${active.store.slug}`],
                ["Currency", active.store.currency],
                ["Contact email", active.store.contact_email ?? "—"],
                ["Contact phone", active.store.contact_phone ?? "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="truncate font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Changing your address</CardTitle>
          </CardHeader>
          <CardContent className="flex items-start gap-2 text-sm text-muted-foreground">
            <InfoIcon className="mt-0.5 size-4 shrink-0" />
            <p className="text-pretty">
              Your storefront lives at{" "}
              <span className="font-medium text-foreground">
                vendly.shop/{active.store.slug}
              </span>
              . Changing it breaks any link anyone already has — the old address
              will not redirect. Leave the field blank to keep it as it is.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Read-only</CardTitle>
            <CardDescription>
              Only owners and admins can change store settings. Ask an admin if
              something here needs updating.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
          <CardDescription>Manage who can work on this store.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/dashboard/team"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 rounded-lg"
            )}
          >
            Go to team
          </Link>
        </CardContent>
      </Card>
    </>
  )
}

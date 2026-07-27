import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { PartyPopperIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { Reveal } from "@/components/motion/reveal"
import { scaleIn } from "@/components/motion/variants"
import { OnboardingSteps } from "@/features/onboarding/components/onboarding-steps"

export const metadata: Metadata = {
  title: "You're all set",
  description: "Your Vendly store is ready.",
  robots: { index: false, follow: false },
}

export default async function Page() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?next=/onboarding/complete")
  }

  const { data: store } = await supabase
    .from("stores")
    .select("name, slug")
    .eq("owner_id", user.id)
    .maybeSingle()

  // Reaching this page without a store means onboarding isn't actually done.
  if (!store) {
    redirect("/onboarding/store")
  }

  return (
    <Reveal onMount variants={scaleIn} className="w-full max-w-lg text-center">
      <OnboardingSteps current="done" />

      <div className="mx-auto mt-8 flex size-14 items-center justify-center rounded-2xl bg-brand-subtle text-primary ring-1 ring-primary/15">
        <PartyPopperIcon className="size-7" />
      </div>

      <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">
        {store.name} is live
      </h1>

      <p className="mt-3 text-sm text-pretty text-muted-foreground">
        Your storefront is ready at{" "}
        <span className="font-medium text-foreground">
          vendly.shop/{store.slug}
        </span>
        . Add your first product and start taking orders.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link
          href="/dashboard"
          prefetch={false}
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-11 w-full rounded-xl text-base"
          )}
        >
          Go to my dashboard
        </Link>
        <Link
          href="/onboarding/store"
          className={cn(
            buttonVariants({ variant: "ghost", size: "lg" }),
            "h-10 rounded-xl px-5"
          )}
        >
          Edit store details
        </Link>
      </div>
    </Reveal>
  )
}

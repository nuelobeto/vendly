import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { Reveal } from "@/components/motion/reveal"
import { OnboardingSteps } from "@/features/onboarding/components/onboarding-steps"
import { StoreForm } from "@/features/onboarding/components/store-form"

export const metadata: Metadata = {
  title: "Your store",
  description: "Name your store and claim its address on Vendly.",
  robots: { index: false, follow: false },
}

export default async function Page() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // proxy.ts guards /onboarding, but a page reading user data shouldn't rely
  // on a matcher alone — it would be a silent hole if the matcher changed.
  if (!user) {
    redirect("/auth/login?next=/onboarding/store")
  }

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle()

  return (
    <Reveal onMount className="w-full max-w-lg">
      <OnboardingSteps current="store" />

      <div className="mt-8 text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Set up your store
        </h1>
        <p className="mt-3 text-sm text-pretty text-muted-foreground">
          Pick a name and claim your address. This is what buyers see when they
          visit you.
        </p>
      </div>

      <div className="mt-8">
        <StoreForm userId={user.id} store={store ?? null} />
      </div>
    </Reveal>
  )
}

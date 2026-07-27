import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { Reveal } from "@/components/motion/reveal"
import { OnboardingSteps } from "@/features/onboarding/components/onboarding-steps"
import { ProfileForm } from "@/features/onboarding/components/profile-form"

export const metadata: Metadata = {
  title: "Your details",
  description: "Tell us a little about you to finish setting up Vendly.",
  robots: { index: false, follow: false },
}

export default async function Page() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // proxy.ts already guards /onboarding, but a page that reads user data must
  // not depend on that alone — it would be a silent hole if the matcher changed.
  if (!user) {
    redirect("/auth/login?next=/onboarding/profile")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <Reveal onMount className="w-full max-w-lg">
      <OnboardingSteps current="profile" />

      <div className="mt-8 text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Tell us about you
        </h1>
        <p className="mt-3 text-sm text-pretty text-muted-foreground">
          This is what buyers see when they contact you about an order. You can
          change any of it later.
        </p>
      </div>

      <div className="mt-8">
        <ProfileForm userId={user.id} profile={profile ?? null} />
      </div>
    </Reveal>
  )
}

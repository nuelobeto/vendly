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

  const [{ data: profile }, { data: membership }, { data: pendingInvite }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("store_members")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.rpc("has_pending_invite"),
    ])

  /*
   * A freshly-registered invitee has no membership yet — the invite is only
   * accepted when this step is saved. Keying off membership alone would send
   * them to store setup, which is exactly what an invite is not.
   */
  const isTeammate = !!membership || pendingInvite === true
  const nextHref = isTeammate ? "/dashboard" : "/onboarding/store"

  return (
    <Reveal onMount className="w-full max-w-lg">
      {isTeammate ? null : <OnboardingSteps current="profile" />}

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
        <ProfileForm
          userId={user.id}
          profile={profile ?? null}
          nextHref={nextHref}
        />
      </div>
    </Reveal>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { Reveal } from "@/components/motion/reveal"
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form"

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
}

export default async function Page() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  /*
   * Reaching this page requires the session the recovery link established —
   * `updateUser` acts on whoever is signed in, so that session *is* the
   * authorisation. Without it there is nothing to update, so send them back to
   * request a fresh link rather than render a form that would 401.
   */
  if (!user) {
    redirect("/auth/forgot-password?error=expired")
  }

  return (
    <Reveal onMount className="w-full max-w-md">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Set a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a new password for {user.email}.
        </p>
      </div>

      <div className="mt-8">
        <ResetPasswordForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href="/dashboard"
          prefetch={false}
          className="rounded-sm underline underline-offset-4 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Cancel
        </Link>
      </p>
    </Reveal>
  )
}

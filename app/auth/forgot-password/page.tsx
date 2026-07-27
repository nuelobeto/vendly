import type { Metadata } from "next"
import Link from "next/link"

import { Reveal } from "@/components/motion/reveal"
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"

export const metadata: Metadata = {
  title: "Reset your password",
  description: "We'll email you a link to set a new password.",
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <Reveal onMount className="w-full max-w-md">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="text-sm text-pretty text-muted-foreground">
          Enter the email on your account and we&apos;ll send you a link to set
          a new password.
        </p>
      </div>

      <div className="mt-8">
        <ForgotPasswordForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/auth/login"
          className="rounded-sm font-medium text-foreground underline underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Sign in
        </Link>
      </p>
    </Reveal>
  )
}

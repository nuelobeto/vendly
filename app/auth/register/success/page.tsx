import type { Metadata } from "next"
import Link from "next/link"
import { MailCheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"
import { scaleIn } from "@/components/motion/variants"

export const metadata: Metadata = {
  title: "Check your email",
  description:
    "Confirm your email address to finish creating your Vendly account.",
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <Reveal onMount variants={scaleIn} className="w-full max-w-md text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-subtle text-primary ring-1 ring-primary/15">
        <MailCheckIcon className="size-7" />
      </div>

      <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">
        Check your email
      </h1>

      <p className="mt-3 text-sm text-pretty text-muted-foreground">
        We sent a confirmation link to{" "}
        {email ? (
          <span className="font-medium text-foreground">{email}</span>
        ) : (
          "your email address"
        )}
        . Click it to activate your account and set up your store.
      </p>

      <p className="mt-6 text-sm text-muted-foreground">
        Didn&apos;t get it? Check your spam folder, or{" "}
        <Link
          href="/auth/register"
          className="rounded-sm font-medium text-foreground underline underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          try a different address
        </Link>
        .
      </p>

      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "mt-8 h-10 rounded-xl px-5"
        )}
      >
        Back to home
      </Link>
    </Reveal>
  )
}

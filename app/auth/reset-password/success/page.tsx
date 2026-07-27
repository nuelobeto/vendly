import type { Metadata } from "next"
import Link from "next/link"
import { CircleCheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"
import { scaleIn } from "@/components/motion/variants"

export const metadata: Metadata = {
  title: "Password updated",
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <Reveal onMount variants={scaleIn} className="w-full max-w-md text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-subtle text-primary ring-1 ring-primary/15">
        <CircleCheckIcon className="size-7" />
      </div>

      <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">
        Password updated
      </h1>

      <p className="mt-3 text-sm text-pretty text-muted-foreground">
        You&apos;re signed in with your new password. Anywhere else you were
        signed in will need it next time.
      </p>

      <Link
        href="/dashboard"
        prefetch={false}
        className={cn(
          buttonVariants({ size: "lg" }),
          "mt-8 h-11 w-full rounded-xl text-base"
        )}
      >
        Go to my dashboard
      </Link>
    </Reveal>
  )
}

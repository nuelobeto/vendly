import type { Metadata } from "next"
import Link from "next/link"
import {
  CircleAlertIcon,
  CircleCheckIcon,
  LinkIcon,
  MailWarningIcon,
  MonitorSmartphoneIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"
import { scaleIn } from "@/components/motion/variants"
import { isConfirmStatus, type TConfirmStatus } from "@/features/auth/types"

export const metadata: Metadata = {
  title: "Confirm your email",
  description: "Confirming your Vendly account.",
  // A one-time token landed on the previous URL; keep the whole flow unindexed.
  robots: { index: false, follow: false },
}

type Outcome = {
  icon: typeof CircleCheckIcon
  tone: "success" | "error"
  title: string
  body: string
  primary: { href: string; label: string }
  secondary?: { href: string; label: string }
}

const OUTCOMES: Record<TConfirmStatus, Outcome> = {
  success: {
    icon: CircleCheckIcon,
    tone: "success",
    title: "Email confirmed",
    body: "Your account is active. Next, tell us a little about you and set up your store.",
    primary: { href: "/onboarding/profile", label: "Continue setup" },
    secondary: { href: "/", label: "Back to home" },
  },
  expired: {
    icon: MailWarningIcon,
    tone: "error",
    title: "That link has expired",
    body: "Confirmation links are single-use and time-limited. Sign up again with the same email and we'll send a fresh one.",
    primary: { href: "/auth/register", label: "Get a new link" },
    secondary: { href: "/", label: "Back to home" },
  },
  invalid: {
    icon: LinkIcon,
    tone: "error",
    title: "That link looks broken",
    body: "Some email clients split long links across lines. Try copying the whole URL into your browser, or sign up again for a new one.",
    primary: { href: "/auth/register", label: "Get a new link" },
    secondary: { href: "/", label: "Back to home" },
  },
  wrong_device: {
    icon: MonitorSmartphoneIcon,
    tone: "error",
    title: "This link is an older one",
    body: "It was sent before we updated our confirmation emails, so it only opens in the browser you signed up from. Request a fresh link and it will work on any device.",
    primary: { href: "/auth/register", label: "Send me a new link" },
    secondary: { href: "/", label: "Back to home" },
  },
  error: {
    icon: CircleAlertIcon,
    tone: "error",
    title: "We couldn't confirm your email",
    body: "Something went wrong on our side. Please try the link again, or sign up for a fresh one.",
    primary: { href: "/auth/register", label: "Try again" },
    secondary: { href: "/", label: "Back to home" },
  },
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; next?: string }>
}) {
  const { status, next } = await searchParams

  // Anything unrecognised — including someone opening /auth/confirm directly —
  // is treated as a broken link rather than silently claiming success.
  const resolved: TConfirmStatus = isConfirmStatus(status) ? status : "invalid"
  const outcome = OUTCOMES[resolved]
  const Icon = outcome.icon

  const primaryHref =
    resolved === "success" && next?.startsWith("/") && !next.startsWith("//")
      ? next
      : outcome.primary.href

  return (
    <Reveal onMount variants={scaleIn} className="w-full max-w-md text-center">
      <div
        className={cn(
          "mx-auto flex size-14 items-center justify-center rounded-2xl ring-1",
          outcome.tone === "success"
            ? "bg-brand-subtle text-primary ring-primary/15"
            : "bg-destructive/10 text-destructive ring-destructive/15"
        )}
      >
        <Icon className="size-7" />
      </div>

      <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight">
        {outcome.title}
      </h1>

      <p className="mt-3 text-sm text-pretty text-muted-foreground">
        {outcome.body}
      </p>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link
          href={primaryHref}
          prefetch={false}
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-11 w-full rounded-xl text-base"
          )}
        >
          {outcome.primary.label}
        </Link>

        {outcome.secondary ? (
          <Link
            href={outcome.secondary.href}
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "h-10 rounded-xl px-5"
            )}
          >
            {outcome.secondary.label}
          </Link>
        ) : null}
      </div>
    </Reveal>
  )
}

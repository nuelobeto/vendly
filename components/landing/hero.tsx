import Link from "next/link"
import { ArrowRightIcon, SparklesIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Parallax,
  Reveal,
  Stagger,
  StaggerItem,
} from "@/components/motion/reveal"
import { scaleIn } from "@/components/motion/variants"
import { DashboardMock } from "@/components/landing/dashboard-mock"

const founders = ["AO", "MK", "TD", "RN"]

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
      {/* Brand wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-[42rem] bg-[radial-gradient(60%_50%_at_50%_0%,var(--brand-subtle),transparent_70%)]"
      />
      {/* Dotted grid, masked toward the top */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000,transparent)] [background-size:22px_22px]"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center text-center">
        <Stagger onMount className="flex flex-col items-center">
          <StaggerItem>
            <Badge
              variant="outline"
              className="h-7 gap-1.5 bg-background/60 px-3 backdrop-blur-sm"
            >
              <SparklesIcon className="text-primary" />
              Now in early access
            </Badge>
          </StaggerItem>

          <StaggerItem>
            <h1 className="mt-6 max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Your store. <span className="text-primary">Live in minutes.</span>
            </h1>
          </StaggerItem>

          <StaggerItem>
            <p className="mx-auto mt-6 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
              Vendly gives independent merchants a storefront, checkout, payouts
              and analytics out of the box. No developers, no plugins, no
              monthly surprises.
            </p>
          </StaggerItem>

          <StaggerItem className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/auth/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 w-full rounded-xl px-6 text-base sm:w-auto"
              )}
            >
              Get started
              <ArrowRightIcon className="transition-transform group-hover/button:translate-x-0.5" />
            </Link>
            <Link
              href="#how-it-works"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 w-full rounded-xl px-6 text-base sm:w-auto"
              )}
            >
              See how it works
            </Link>
          </StaggerItem>

          <StaggerItem className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">
              {founders.map((initials) => (
                <span
                  key={initials}
                  aria-hidden="true"
                  className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-background"
                >
                  {initials}
                </span>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              Join 2,400+ merchants already selling
            </span>
          </StaggerItem>
        </Stagger>

        <Reveal variants={scaleIn} className="mt-14 w-full max-w-4xl sm:mt-20">
          <Parallax distance={28}>
            <DashboardMock />
          </Parallax>
        </Reveal>
      </div>
    </section>
  )
}

export { Hero }

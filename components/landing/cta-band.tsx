import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal"
import { scaleIn } from "@/components/motion/variants"

function CtaBand() {
  return (
    <section aria-labelledby="cta-heading" className="px-4 py-20 sm:py-28">
      <Reveal variants={scaleIn} className="mx-auto w-full max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,var(--primary-foreground),transparent_70%)] opacity-10"
          />

          <Stagger className="relative flex flex-col items-center">
            <StaggerItem>
              <h2
                id="cta-heading"
                className="max-w-2xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
              >
                Open your shop before the kettle boils
              </h2>
            </StaggerItem>

            <StaggerItem>
              <p className="mt-4 max-w-lg text-base text-pretty opacity-80">
                Free to start, no card required. Bring your products and
                we&apos;ll handle the rest.
              </p>
            </StaggerItem>

            <StaggerItem className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/auth/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group/button h-11 w-full rounded-xl bg-background px-6 text-base text-foreground hover:bg-background/90 sm:w-auto"
                )}
              >
                Get started
                <ArrowRightIcon className="transition-transform group-hover/button:translate-x-0.5" />
              </Link>
              <Link
                href="#pricing"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 w-full rounded-xl px-6 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
                )}
              >
                Compare plans
              </Link>
            </StaggerItem>
          </Stagger>
        </div>
      </Reveal>
    </section>
  )
}

export { CtaBand }

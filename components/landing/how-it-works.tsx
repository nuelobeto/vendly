import { Stagger, StaggerItem } from "@/components/motion/reveal"
import { scaleIn, staggerParentSlow } from "@/components/motion/variants"
import { Section, SectionHeading } from "@/components/landing/section"

const steps = [
  {
    title: "Create your shop",
    description:
      "Name it, pick a look, and you're live on a Vendly subdomain. No card required to start.",
  },
  {
    title: "Add your products",
    description:
      "Upload in bulk or one at a time. Variants, stock levels and pricing come along for the ride.",
  },
  {
    title: "Get paid",
    description:
      "Share your link, take orders, and watch payouts land on the schedule you picked.",
  },
]

function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="border-t bg-muted/30"
    >
      <SectionHeading
        id="how-heading"
        eyebrow="Three steps"
        title="From nothing to selling, this afternoon"
        description="No migration project, no agency, no six-week build."
      />

      <Stagger
        variants={staggerParentSlow}
        className="relative mt-14 grid gap-10 lg:grid-cols-3 lg:gap-6"
      >
        {/* Connector rail, lg only */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-4 right-0 left-0 hidden h-px bg-linear-to-r from-transparent via-border to-transparent lg:block"
        />

        {steps.map((step, index) => (
          <StaggerItem
            key={step.title}
            className="relative flex flex-col items-start gap-3 lg:items-center lg:text-center"
          >
            {/* Nested item — variant state propagates down from the parent. */}
            <StaggerItem variants={scaleIn}>
              <span className="flex size-8 items-center justify-center rounded-full bg-primary font-mono text-sm font-medium text-primary-foreground ring-4 ring-background">
                {index + 1}
              </span>
            </StaggerItem>
            <h3 className="font-heading text-lg font-medium tracking-tight">
              {step.title}
            </h3>
            <p className="max-w-xs text-sm text-pretty text-muted-foreground">
              {step.description}
            </p>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  )
}

export { HowItWorks }

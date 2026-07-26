import Link from "next/link"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Stagger, StaggerItem } from "@/components/motion/reveal"
import { scaleIn } from "@/components/motion/variants"
import { Section, SectionHeading } from "@/components/landing/section"

const plans = [
  {
    name: "Starter",
    price: "$0",
    cadence: "/mo",
    rate: "3% per sale",
    description: "Everything you need to open the doors.",
    features: [
      "Unlimited products",
      "vendly.shop subdomain",
      "Checkout and payouts",
      "Basic analytics",
    ],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Growth",
    price: "$29",
    cadence: "/mo",
    rate: "1.5% per sale",
    description: "For shops with steady orders coming in.",
    features: [
      "Everything in Starter",
      "Your own domain",
      "Abandoned cart recovery",
      "Discounts and gift cards",
      "Priority support",
    ],
    cta: "Get started",
    featured: true,
  },
  {
    name: "Scale",
    price: "Custom",
    cadence: "",
    rate: "Negotiated rates",
    description: "High volume, multiple storefronts, or both.",
    features: [
      "Everything in Growth",
      "Multiple storefronts",
      "API and webhooks",
      "Dedicated account manager",
    ],
    cta: "Talk to us",
    featured: false,
  },
]

function PricingTeaser() {
  return (
    <Section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="border-t bg-muted/30"
    >
      <SectionHeading
        id="pricing-heading"
        eyebrow="Pricing"
        title="Priced so it works before you're big"
        description="Start free and pay a share of what you sell. Move up only when the maths says you should."
      />

      <Stagger className="mt-14 grid items-start gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <StaggerItem
            key={plan.name}
            variants={plan.featured ? scaleIn : undefined}
          >
            <Card
              className={cn(
                "h-full",
                plan.featured && "relative ring-2 ring-primary"
              )}
            >
              {plan.featured ? (
                <Badge className="absolute top-4 right-4">Most popular</Badge>
              ) : null}

              <CardHeader className="gap-2">
                <CardTitle>
                  <h3>{plan.name}</h3>
                </CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-3xl font-semibold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {plan.cadence}
                  </span>
                </div>
                <CardDescription>
                  {plan.rate} · {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="flex flex-col gap-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Link
                  href="/get-started"
                  prefetch={false}
                  className={cn(
                    buttonVariants({
                      variant: plan.featured ? "default" : "outline",
                      size: "lg",
                    }),
                    "h-10 w-full rounded-xl"
                  )}
                >
                  {plan.cta}
                </Link>
              </CardFooter>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        No setup fees. Cancel any time.{" "}
        <Link
          href="#faq"
          className="rounded-sm underline underline-offset-4 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Read the pricing FAQ
        </Link>
        .
      </p>
    </Section>
  )
}

export { PricingTeaser }

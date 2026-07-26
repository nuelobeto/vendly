import {
  ChartNoAxesColumnIcon,
  CreditCardIcon,
  PackageIcon,
  ShieldCheckIcon,
  StoreIcon,
  TruckIcon,
} from "lucide-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Stagger, StaggerItem } from "@/components/motion/reveal"
import { springSoft } from "@/components/motion/variants"
import { Section, SectionHeading } from "@/components/landing/section"

const features = [
  {
    icon: StoreIcon,
    title: "A storefront that sells",
    description:
      "Pick a theme, add products, and publish on your own vendly.shop subdomain — or bring your domain.",
  },
  {
    icon: CreditCardIcon,
    title: "Checkout and payouts",
    description:
      "Cards, wallets and bank transfer at checkout. Money lands in your account on a schedule you choose.",
  },
  {
    icon: PackageIcon,
    title: "Inventory that stays honest",
    description:
      "Stock syncs across every channel and variant, so you never sell something you can't ship.",
  },
  {
    icon: TruckIcon,
    title: "Shipping, sorted",
    description:
      "Live carrier rates, printable labels, and tracking your buyers can actually follow.",
  },
  {
    icon: ChartNoAxesColumnIcon,
    title: "Know what's working",
    description:
      "Revenue, conversion and repeat-buyer rate on day one — without wiring up an analytics stack.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Fraud and disputes handled",
    description:
      "Risk scoring on every order and a dispute flow that doesn't require a lawyer to follow.",
  },
]

function FeaturesGrid() {
  return (
    <Section id="features" aria-labelledby="features-heading">
      <SectionHeading
        id="features-heading"
        eyebrow="Everything included"
        title="The whole shop, not just the shopfront"
        description="Most platforms hand you a template and a plugin bill. Vendly ships the operational parts too."
      />

      <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <StaggerItem
            key={feature.title}
            whileHover={{ y: -4 }}
            transition={springSoft}
          >
            <Card className="h-full">
              <CardHeader className="gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-subtle text-primary ring-1 ring-primary/15">
                  <feature.icon className="size-5" />
                </div>
                <CardTitle>
                  <h3>{feature.title}</h3>
                </CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  )
}

export { FeaturesGrid }

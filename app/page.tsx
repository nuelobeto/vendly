import { SiteHeader } from "@/components/landing/site-header"
import { Hero } from "@/components/landing/hero"
import { LogoStrip } from "@/components/landing/logo-strip"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { HowItWorks } from "@/components/landing/how-it-works"
import { StatsBand } from "@/components/landing/stats-band"
import { Testimonials } from "@/components/landing/testimonials"
import { PricingTeaser } from "@/components/landing/pricing-teaser"
import { Faq } from "@/components/landing/faq"
import { CtaBand } from "@/components/landing/cta-band"
import { SiteFooter } from "@/components/landing/site-footer"

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex flex-col">
        <Hero />
        <LogoStrip />
        <FeaturesGrid />
        <HowItWorks />
        <StatsBand />
        <Testimonials />
        <PricingTeaser />
        <Faq />
        <CtaBand />
      </main>
      <SiteFooter />
    </>
  )
}

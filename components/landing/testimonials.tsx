import { QuoteIcon, StarIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Stagger, StaggerItem } from "@/components/motion/reveal"
import { Section, SectionHeading } from "@/components/landing/section"

/** Illustrative testimonials — replace with real ones before launch. */
const testimonials = [
  {
    quote:
      "I moved 240 SKUs over on a Sunday and took my first order before dinner. The part I dreaded — variants and stock — just worked.",
    name: "Amara Okonjo",
    shop: "Atelier Nord",
    initials: "AO",
  },
  {
    quote:
      "Payouts arrive when Vendly says they will. After two years of chasing a payment processor, that alone was worth the switch.",
    name: "Marcus Kelly",
    shop: "Fold & Co",
    initials: "MK",
  },
  {
    quote:
      "I'm a ceramicist, not a developer. I've never had to open a settings page I didn't understand, and I've never paid for a plugin.",
    name: "Thea Duarte",
    shop: "Kiln Studio",
    initials: "TD",
  },
]

function Stars() {
  return (
    <div role="img" aria-label="Rated 5 out of 5" className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon key={index} className="size-3.5 fill-primary text-primary" />
      ))}
    </div>
  )
}

function Testimonials() {
  return (
    <Section aria-labelledby="testimonials-heading">
      <SectionHeading
        id="testimonials-heading"
        eyebrow="Merchant stories"
        title="Built for people who make things"
        description="Vendly's customers are makers, not engineering teams."
      />

      <Stagger className="mt-14 grid gap-4 md:grid-cols-3">
        {testimonials.map((testimonial) => (
          <StaggerItem key={testimonial.name}>
            <Card className="h-full">
              <CardContent>
                <figure className="flex h-full flex-col gap-4">
                  <QuoteIcon className="size-6 text-primary/25" />
                  <blockquote className="text-sm text-pretty">
                    {testimonial.quote}
                  </blockquote>
                  <figcaption className="mt-auto flex items-center gap-3 pt-2">
                    <span
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
                    >
                      {testimonial.initials}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-medium">
                        {testimonial.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {testimonial.shop}
                      </span>
                    </span>
                    <span className="ml-auto">
                      <Stars />
                    </span>
                  </figcaption>
                </figure>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  )
}

export { Testimonials }

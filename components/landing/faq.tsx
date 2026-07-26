import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Reveal } from "@/components/motion/reveal"
import { Section, SectionHeading } from "@/components/landing/section"

const faqs = [
  {
    value: "fees",
    question: "What does Vendly actually cost?",
    answer:
      "Starter is free with a 3% fee per sale. Growth is $29 a month and drops that to 1.5%. There are no setup fees, no plugin bills, and no charge for the storefront itself.",
  },
  {
    value: "developer",
    question: "Do I need a developer?",
    answer:
      "No. Themes, product pages, checkout and payouts are configured from the dashboard. If you do want to build something custom, the Scale plan includes an API and webhooks.",
  },
  {
    value: "domain",
    question: "Can I use my own domain?",
    answer:
      "Yes, on Growth and above. Every shop starts on a free vendly.shop subdomain, and you can point a custom domain at it whenever you're ready — links keep working.",
  },
  {
    value: "payouts",
    question: "How fast do payouts land?",
    answer:
      "Daily, weekly or monthly — you pick. First payouts take a little longer while we verify your account, and after that they arrive on the schedule you set.",
  },
  {
    value: "products",
    question: "What can I sell?",
    answer:
      "Physical goods, digital downloads and services. Restricted categories are listed in our acceptable use policy, and we'll tell you before you build a shop we can't support.",
  },
  {
    value: "migrate",
    question: "Can I migrate from Shopify or Etsy?",
    answer:
      "Yes. Import products, variants and customers from a CSV export, or let us run the migration for you if you're bringing more than a thousand SKUs.",
  },
]

function Faq() {
  return (
    <Section id="faq" aria-labelledby="faq-heading">
      <SectionHeading
        id="faq-heading"
        eyebrow="Questions"
        title="The things merchants ask first"
      />

      {/* One Reveal around the whole accordion — wrapping items would fight
          base-ui's panel height measurement. */}
      <Reveal className="mx-auto mt-12 max-w-3xl">
        <Accordion defaultValue={["fees"]}>
          {faqs.map((faq) => (
            <AccordionItem key={faq.value} value={faq.value}>
              <AccordionTrigger className="text-base">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </Section>
  )
}

export { Faq }

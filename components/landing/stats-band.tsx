import { Stagger, StaggerItem } from "@/components/motion/reveal"

/** Illustrative figures — replace with real numbers before launch. */
const stats = [
  { value: "$40M+", label: "Processed for merchants" },
  { value: "2,400+", label: "Shops on Vendly" },
  { value: "99.98%", label: "Storefront uptime" },
  { value: "4 min", label: "Median time to first product" },
]

function StatsBand() {
  return (
    <section aria-labelledby="stats-heading" className="border-y px-4 py-16">
      <h2 id="stats-heading" className="sr-only">
        Vendly by the numbers
      </h2>
      <Stagger className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-8 lg:grid-cols-4">
        {stats.map((stat) => (
          <StaggerItem
            key={stat.label}
            className="flex flex-col items-center gap-1 text-center"
          >
            <span className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {stat.value}
            </span>
            <span className="text-sm text-pretty text-muted-foreground">
              {stat.label}
            </span>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}

export { StatsBand }

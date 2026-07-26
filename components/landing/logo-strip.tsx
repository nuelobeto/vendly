import { Stagger, StaggerItem } from "@/components/motion/reveal"
import { fadeIn, staggerParentFast } from "@/components/motion/variants"

/** Fictional customer brands — swap before any real launch. */
const brands = [
  { name: "Atelier Nord", path: "M4 16 12 4l8 12z" },
  {
    name: "Maison Ora",
    path: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 5a4 4 0 1 1 0 8 4 4 0 0 1 0-8z",
  },
  { name: "Fold & Co", path: "M3 6h18v4H3zm0 8h12v4H3z" },
  { name: "Kiln", path: "M12 2 22 12 12 22 2 12z" },
  {
    name: "Verdant",
    path: "M12 22C7 18 4 14 4 10a8 8 0 1 1 16 0c0 4-3 8-8 12z",
  },
  { name: "Ridgeway", path: "M2 18 8 8l4 6 3-4 7 8z" },
]

function LogoStrip() {
  return (
    <section
      aria-labelledby="logos-heading"
      className="border-y bg-muted/30 px-4 py-14"
    >
      <div className="mx-auto w-full max-w-6xl">
        <h2
          id="logos-heading"
          className="text-center text-xs font-medium tracking-widest text-muted-foreground uppercase"
        >
          Trusted by independent brands everywhere
        </h2>

        <Stagger
          variants={staggerParentFast}
          className="mt-8 grid grid-cols-2 items-center gap-x-8 gap-y-6 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 sm:grid-cols-3 lg:grid-cols-6"
        >
          {brands.map((brand) => (
            <StaggerItem
              key={brand.name}
              variants={fadeIn}
              className="flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
                <path d={brand.path} fill="currentColor" />
              </svg>
              <span className="font-heading text-base font-semibold tracking-tight whitespace-nowrap">
                {brand.name}
              </span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

export { LogoStrip }

import * as React from "react"

import { cn } from "@/lib/utils"
import { Reveal } from "@/components/motion/reveal"

/** Shared section shell. `scroll-mt-24` keeps anchors clear of the sticky header. */
function Section({
  className,
  innerClassName,
  children,
  ...props
}: React.ComponentProps<"section"> & { innerClassName?: string }) {
  return (
    <section
      className={cn("scroll-mt-24 px-4 py-20 sm:py-28", className)}
      {...props}
    >
      <div className={cn("mx-auto w-full max-w-6xl", innerClassName)}>
        {children}
      </div>
    </section>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  align = "center",
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  id?: string
  align?: "center" | "start"
  className?: string
}) {
  return (
    <Reveal
      className={cn(
        "flex max-w-2xl flex-col gap-3",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow ? (
        <span className="text-xs font-medium tracking-widest text-primary uppercase">
          {eyebrow}
        </span>
      ) : null}
      <h2
        id={id}
        className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="text-base text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
    </Reveal>
  )
}

export { Section, SectionHeading }

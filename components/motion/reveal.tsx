"use client"

import * as React from "react"
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react"

import { cn } from "@/lib/utils"
import { fadeUp, staggerParent, VIEWPORT } from "@/components/motion/variants"

type MotionDivProps = React.ComponentProps<typeof motion.div>

type RevealProps = Omit<MotionDivProps, "variants"> & {
  variants?: Variants
  /** Animate immediately on mount instead of waiting for the viewport. */
  onMount?: boolean
}

/**
 * Wraps server-rendered children and reveals them on scroll. Children stay in
 * the server bundle — only this wrapper crosses the client boundary.
 */
function Reveal({
  className,
  variants = fadeUp,
  onMount = false,
  children,
  ...props
}: RevealProps) {
  const trigger = onMount
    ? { animate: "visible" as const }
    : { whileInView: "visible" as const, viewport: VIEWPORT }

  return (
    <motion.div
      data-slot="reveal"
      initial="hidden"
      variants={variants}
      className={cn(className)}
      {...trigger}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/** Parent that cascades its `visible` state down to nested `StaggerItem`s. */
function Stagger({
  className,
  variants = staggerParent,
  onMount = false,
  children,
  ...props
}: RevealProps) {
  const trigger = onMount
    ? { animate: "visible" as const }
    : { whileInView: "visible" as const, viewport: VIEWPORT }

  return (
    <motion.div
      data-slot="reveal"
      initial="hidden"
      variants={variants}
      className={cn(className)}
      {...trigger}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Child of `Stagger`. Deliberately has no viewport trigger of its own —
 * it inherits the parent's state, which is what produces the cascade.
 */
function StaggerItem({
  className,
  variants = fadeUp,
  children,
  ...props
}: Omit<MotionDivProps, "variants"> & { variants?: Variants }) {
  return (
    <motion.div
      data-slot="reveal"
      variants={variants}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/** Scroll-linked parallax. No-ops entirely under reduced motion. */
function Parallax({
  className,
  distance = 60,
  children,
}: {
  className?: string
  distance?: number
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const raw = useTransform(scrollYProgress, [0, 1], [distance, -distance])
  const y = useSpring(raw, { stiffness: 120, damping: 24, mass: 0.6 })

  return (
    <div ref={ref} className={className}>
      {/* MotionConfig does not govern raw scroll-linked values, so gate manually. */}
      <motion.div style={reduced ? undefined : { y }}>{children}</motion.div>
    </div>
  )
}

export { Reveal, Stagger, StaggerItem, Parallax }

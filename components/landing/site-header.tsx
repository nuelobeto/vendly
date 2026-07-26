"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useMotionValueEvent, useScroll } from "motion/react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { easeOutExpo } from "@/components/motion/variants"
import { Logo } from "@/components/landing/logo"
import { MobileNav } from "@/components/landing/mobile-nav"
import { mainNav } from "@/components/landing/nav-config"
import { ThemeToggle } from "@/components/landing/theme-toggle"

function SiteHeader() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = React.useState(false)

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 8)
  })

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: easeOutExpo }}
      data-scrolled={scrolled || undefined}
      className="sticky top-0 z-50 w-full border-b border-transparent bg-background/70 transition-colors data-scrolled:border-border supports-backdrop-filter:backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4">
        <Link
          href="/"
          className="rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Logo />
          <span className="sr-only">Vendly home</span>
        </Link>

        <nav
          aria-label="Main"
          className="ml-4 hidden items-center gap-1 md:flex"
        >
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <Link
            href="/sign-in"
            prefetch={false}
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "hidden h-10 px-4 sm:inline-flex"
            )}
          >
            Sign in
          </Link>
          <Link
            href="/get-started"
            prefetch={false}
            className={cn(
              buttonVariants({ size: "lg" }),
              "hidden h-10 rounded-xl px-4 sm:inline-flex"
            )}
          >
            Get started
          </Link>
          <MobileNav />
        </div>
      </div>
    </motion.header>
  )
}

export { SiteHeader }

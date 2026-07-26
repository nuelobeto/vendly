"use client"

import Link from "next/link"
import { MenuIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Logo } from "@/components/landing/logo"
import { mainNav } from "@/components/landing/nav-config"

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="ghost" size="icon-lg" className="md:hidden" />}
      >
        <MenuIcon />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>
      <SheetContent side="right" className="gap-0">
        <SheetHeader>
          <SheetTitle>
            <Logo />
          </SheetTitle>
          <SheetDescription className="sr-only">
            Vendly navigation
          </SheetDescription>
        </SheetHeader>

        <nav aria-label="Mobile" className="flex flex-col px-4">
          {mainNav.map((item) => (
            <SheetClose
              key={item.href}
              render={
                <Link
                  href={item.href}
                  className="rounded-lg py-3 text-base font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                />
              }
            >
              {item.label}
            </SheetClose>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 p-4">
          <SheetClose
            render={
              <Link
                href="/get-started"
                prefetch={false}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 rounded-xl text-base"
                )}
              />
            }
          >
            Get started
          </SheetClose>
          <SheetClose
            render={
              <Link
                href="/sign-in"
                prefetch={false}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 rounded-xl text-base"
                )}
              />
            }
          >
            Sign in
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { MobileNav }

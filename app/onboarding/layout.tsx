import Link from "next/link"

import { Logo } from "@/components/landing/logo"

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative flex min-h-svh flex-col px-4 py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-144 bg-[radial-gradient(60%_50%_at_50%_0%,var(--brand-subtle),transparent_70%)]"
      />

      <header className="relative mx-auto w-full max-w-6xl">
        <Link
          href="/"
          className="inline-flex rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Logo />
          <span className="sr-only">Vendly home</span>
        </Link>
      </header>

      <main
        id="main"
        className="relative flex flex-1 flex-col items-center justify-center py-12"
      >
        {children}
      </main>
    </div>
  )
}

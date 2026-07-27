import type { Metadata } from "next"
import Link from "next/link"

import { Reveal } from "@/components/motion/reveal"
import { LoginForm } from "@/features/auth/components/login-form"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Vendly account.",
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const registerHref = next
    ? `/auth/register?next=${encodeURIComponent(next)}`
    : "/auth/register"

  return (
    <Reveal onMount className="w-full max-w-md">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to manage your store.
        </p>
      </div>

      <div className="mt-8">
        <LoginForm next={next} />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Vendly?{" "}
        <Link
          href={registerHref}
          className="rounded-sm font-medium text-foreground underline underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Create an account
        </Link>
      </p>
    </Reveal>
  )
}

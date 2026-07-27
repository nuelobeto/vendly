import type { Metadata } from "next"
import Link from "next/link"
import { StoreIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { hashInviteToken } from "@/lib/tokens"
import { Reveal } from "@/components/motion/reveal"
import { scaleIn } from "@/components/motion/variants"
import { AcceptInviteButton } from "@/features/members/components/accept-invite-button"
import type { IInvitePreview } from "@/features/members/types"

export const metadata: Metadata = {
  title: "Store invitation",
  robots: { index: false, follow: false },
}

const DEAD_INVITE: Record<string, string> = {
  accepted: "This invite has already been used.",
  revoked: "This invite has been revoked.",
  expired: "This invite has expired. Ask for a new one.",
}

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  // Deliberately readable without a session — the invitee may not have an
  // account yet and needs to see who is inviting them before signing up.
  // The RPC returns name, logo, role and inviter only.
  const { data } = await supabase.rpc("get_store_invite", {
    p_token_hash: hashInviteToken(token),
  })

  const invite = (data as IInvitePreview[] | null)?.[0]

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-svh items-center justify-center px-4 py-12">
      <Reveal
        onMount
        variants={scaleIn}
        className="w-full max-w-md text-center"
      >
        {children}
      </Reveal>
    </div>
  )

  if (!invite) {
    return shell(
      <>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          That invite link isn&apos;t valid
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Double-check the link, or ask whoever invited you to send a new one.
        </p>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "mt-8 h-10 rounded-xl px-5"
          )}
        >
          Back to home
        </Link>
      </>
    )
  }

  const header = (
    <>
      <div className="mx-auto flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
        {invite.store_logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={invite.store_logo_url}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <StoreIcon className="size-7 text-muted-foreground" />
        )}
      </div>
      <h1 className="mt-6 font-heading text-2xl font-semibold tracking-tight">
        Join {invite.store_name}
      </h1>
      <p className="mt-3 text-sm text-pretty text-muted-foreground">
        {invite.invited_by_name ?? "Someone"} invited{" "}
        <span className="font-medium text-foreground">
          {invite.invite_email}
        </span>{" "}
        to join as{" "}
        <span className="font-medium text-foreground">
          {invite.invite_role}
        </span>
        .
      </p>
    </>
  )

  if (invite.status !== "pending") {
    return shell(
      <>
        {header}
        <p className="mt-6 rounded-lg bg-muted p-3 text-sm">
          {DEAD_INVITE[invite.status]}
        </p>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "mt-6 h-10 rounded-xl px-5"
          )}
        >
          Back to home
        </Link>
      </>
    )
  }

  // Signed in as somebody else: never silently join the wrong account.
  if (user && user.email?.toLowerCase() !== invite.invite_email.toLowerCase()) {
    return shell(
      <>
        {header}
        <p className="mt-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          You&apos;re signed in as {user.email}. Sign out and sign back in as{" "}
          {invite.invite_email} to accept.
        </p>
        <form action="/api/auth/sign-out" method="post" className="mt-6">
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-10 rounded-xl px-5"
            )}
          >
            Sign out
          </button>
        </form>
      </>
    )
  }

  if (!user) {
    const next = encodeURIComponent(`/invite/${token}`)
    return shell(
      <>
        {header}
        <p className="mt-6 text-sm text-muted-foreground">
          Sign in or create an account with that address to continue.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/auth/register?next=${next}`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-11 w-full rounded-xl text-base"
            )}
          >
            Create an account
          </Link>
          <Link
            href={`/auth/login?next=${next}`}
            prefetch={false}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-10 w-full rounded-xl"
            )}
          >
            I already have an account
          </Link>
        </div>
      </>
    )
  }

  return shell(
    <>
      {header}
      <div className="mt-8">
        <AcceptInviteButton token={token} />
      </div>
    </>
  )
}

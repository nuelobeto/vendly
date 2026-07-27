import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProfileForm } from "@/features/onboarding/components/profile-form"

export const metadata: Metadata = { title: "My Account" }

export default async function Page() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login?next=/dashboard/account")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your details</CardTitle>
          <CardDescription>
            How you appear to your teammates and to buyers who contact you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            userId={user.id}
            profile={profile ?? null}
            redirectOnSuccess={false}
            submitLabel="Save changes"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign-in</CardTitle>
          <CardDescription>
            Your email is how you sign in. Changing it isn&apos;t supported yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm">{user.email}</span>
          <Link
            href="/auth/forgot-password"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 rounded-lg"
            )}
          >
            Change password
          </Link>
        </CardContent>
      </Card>
    </>
  )
}

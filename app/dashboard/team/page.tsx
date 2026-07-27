import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getActiveStore } from "@/lib/stores/active-store"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { InviteForm } from "@/features/members/components/invite-form"
import { InviteRowActions } from "@/features/members/components/invite-row-actions"

export const metadata: Metadata = { title: "Team" }

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  staff: "Staff",
}

export default async function Page() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login?next=/dashboard/team")

  // The active store, not "the" store — `.maybeSingle()` here would error for
  // anyone belonging to two.
  const { active } = await getActiveStore()

  if (!active) redirect("/onboarding/store")

  const membership = { store_id: active.store.id, role: active.role }
  const canInvite = active.role === "owner" || active.role === "admin"

  /*
   * The roster comes from get_store_team rather than a store_members ->
   * profiles join: profiles SELECT is "own row only", so the join returned null
   * for every teammate and the list showed them all as "Teammate". The RPC is
   * SECURITY DEFINER, checks the caller belongs to the store, and returns only
   * roster fields — deliberately not `phone`.
   */
  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase.rpc("get_store_team", { p_store_id: membership.store_id }),
    supabase
      .from("store_invites")
      .select("id, email, role, expires_at")
      .eq("store_id", membership.store_id)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
  ])

  return (
    <>
      {canInvite ? (
        <Card>
          <CardHeader>
            <CardTitle>Invite someone</CardTitle>
            <CardDescription>
              Admins can manage the store and invite others. Staff can work on
              orders and products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteForm />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {(members ?? []).map((member) => {
            const fullName = [member.first_name, member.last_name]
              .filter(Boolean)
              .join(" ")
            // Someone invited but yet to finish their profile has no name, so
            // fall back to the address they were invited at — far more useful
            // than a generic placeholder.
            const display = fullName || member.email || "Teammate"
            const initial = display.slice(0, 1).toUpperCase()

            return (
              <div
                key={member.member_id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs text-muted-foreground">
                  {member.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.avatar_url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    initial
                  )}
                </span>

                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm">
                    {display}
                    {member.user_id === user.id ? (
                      <span className="text-muted-foreground"> (you)</span>
                    ) : null}
                  </span>
                  {fullName && member.email ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {member.email}
                    </span>
                  ) : null}
                </span>

                <Badge variant="secondary">
                  {ROLE_LABEL[member.member_role]}
                </Badge>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {canInvite && (invites?.length ?? 0) > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Pending invites</CardTitle>
            <CardDescription>Invite links expire after 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col divide-y">
            {(invites ?? []).map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="min-w-0 flex-1 truncate text-sm">
                  {invite.email}
                </span>
                <Badge variant="outline">{ROLE_LABEL[invite.role]}</Badge>
                <InviteRowActions inviteId={invite.id} />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </>
  )
}

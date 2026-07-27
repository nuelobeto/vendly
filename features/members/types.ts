import type { Database, StoreRole } from "@/lib/supabase/types"

export type IStoreMemberRow =
  Database["public"]["Tables"]["store_members"]["Row"]
export type IStoreInviteRow =
  Database["public"]["Tables"]["store_invites"]["Row"]

/** A member joined to their profile, as the team list needs it. */
export interface IStoreMember {
  id: string
  userId: string
  role: StoreRole
  name: string | null
  email: string | null
  avatarUrl: string | null
  isYou: boolean
}

export interface IStoreInvite {
  id: string
  email: string
  role: StoreRole
  createdAt: string
  expiresAt: string
}

export interface IInvite {
  email: string
  role: "admin" | "staff"
}

export type IInviteResponse =
  | {
      ok: true
      invite: {
        id: string
        email: string
        emailed: boolean
        /** Only returned when the email failed, as a delivery fallback. */
        url?: string
      }
    }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export type IInviteSuccess = Extract<IInviteResponse, { ok: true }>

export type IAcceptResponse =
  { ok: true; storeId: string } | { ok: false; error: string }

export type IAcceptSuccess = Extract<IAcceptResponse, { ok: true }>

export type ISimpleResponse = { ok: true } | { ok: false; error: string }

/** Shape returned by the public get_store_invite RPC. */
export interface IInvitePreview {
  invite_id: string
  store_name: string
  store_slug: string
  store_logo_url: string | null
  invite_role: StoreRole
  invite_email: string
  invited_by_name: string | null
  status: "pending" | "accepted" | "revoked" | "expired"
}

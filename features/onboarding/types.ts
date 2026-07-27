import type { Database } from "@/lib/supabase/types"

export type IProfileRow = Database["public"]["Tables"]["profiles"]["Row"]

/** Payload accepted by PATCH /api/onboarding/profile. */
export interface IProfile {
  first_name: string
  last_name: string
  phone?: string | null
  avatar_url?: string | null
}

export type IProfileResponse =
  | { ok: true; profile: IProfileRow }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export type IProfileSuccess = Extract<IProfileResponse, { ok: true }>

export interface IImageUploadResult {
  path: string
  publicUrl: string
}

export type IStoreRow = Database["public"]["Tables"]["stores"]["Row"]

/**
 * Payload accepted by POST /api/onboarding/store.
 *
 * `slug` may be blank — the server derives one from the name. Blank contact
 * fields fall back to the owner's email and phone.
 */
export interface IStore {
  name: string
  slug?: string
  currency: string
  logo_url?: string | null
  banner_url?: string | null
  contact_email?: string | null
  contact_phone?: string | null
}

export type IStoreResponse =
  | { ok: true; store: IStoreRow }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export type IStoreSuccess = Extract<IStoreResponse, { ok: true }>

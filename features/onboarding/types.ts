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

export interface IAvatarUploadResult {
  path: string
  publicUrl: string
}

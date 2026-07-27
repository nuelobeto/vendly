import axios from "axios"

import { apiClient } from "@/lib/api-client"
import { createClient } from "@/lib/supabase/client"
import { AuthError } from "@/features/auth/services"
import {
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TYPES,
} from "@/features/onboarding/schemas"
import type {
  IAvatarUploadResult,
  IProfile,
  IProfileResponse,
  IProfileSuccess,
} from "@/features/onboarding/types"

export async function updateProfile(
  payload: IProfile
): Promise<IProfileSuccess> {
  try {
    const { data } = await apiClient.patch<IProfileResponse>(
      "/onboarding/profile",
      payload
    )

    if (!data.ok) {
      throw new AuthError(data.error, { fieldErrors: data.fieldErrors })
    }

    return data
  } catch (error) {
    if (error instanceof AuthError) throw error

    if (axios.isAxiosError<IProfileResponse>(error)) {
      const body = error.response?.data

      if (body && !body.ok) {
        throw new AuthError(body.error, {
          fieldErrors: body.fieldErrors,
          status: error.response?.status,
        })
      }

      if (error.code === "ECONNABORTED") {
        throw new AuthError("That took too long. Please try again.")
      }

      if (!error.response) {
        throw new AuthError(
          "Network error. Check your connection and try again."
        )
      }

      throw new AuthError("Could not save your profile. Please try again.", {
        status: error.response.status,
      })
    }

    throw new AuthError("Something went wrong. Please try again.")
  }
}

/**
 * Uploads straight from the browser to Supabase Storage rather than through a
 * route handler: it avoids streaming the file through Next entirely, and the
 * bucket's RLS policies already restrict writes to `<uid>/…`.
 */
export async function uploadAvatar({
  file,
  userId,
}: {
  file: File
  userId: string
}): Promise<IAvatarUploadResult> {
  if (!AVATAR_MIME_TYPES.includes(file.type)) {
    throw new AuthError("Use a JPG, PNG, WebP or AVIF image.")
  }

  if (file.size > AVATAR_MAX_BYTES) {
    throw new AuthError("That image is larger than 2 MB.")
  }

  const supabase = createClient()
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  // Cache-busting name so a replaced avatar isn't served from the CDN cache.
  const path = `${userId}/avatar-${Date.now()}.${extension}`

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: true })

  if (error) {
    throw new AuthError("Could not upload that image. Please try again.")
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path)

  return { path, publicUrl }
}

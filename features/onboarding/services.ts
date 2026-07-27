import axios from "axios"

import { apiClient } from "@/lib/api-client"
import { createClient } from "@/lib/supabase/client"
import { AuthError } from "@/features/auth/services"
import {
  formatMaxSize,
  IMAGE_MAX_BYTES,
  IMAGE_MIME_TYPES,
  type UploadBucket,
} from "@/features/onboarding/schemas"
import type {
  IImageUploadResult,
  IProfile,
  IProfileResponse,
  IProfileSuccess,
  IStore,
  IStoreResponse,
  IStoreSuccess,
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
 * route handler: it avoids streaming the file through Next entirely, and each
 * bucket's RLS policies already restrict writes to `<uid>/…`.
 */
export async function uploadImage({
  file,
  userId,
  bucket,
}: {
  file: File
  userId: string
  bucket: UploadBucket
}): Promise<IImageUploadResult> {
  if (!IMAGE_MIME_TYPES[bucket].includes(file.type)) {
    throw new AuthError("That file type isn't supported.")
  }

  if (file.size > IMAGE_MAX_BYTES[bucket]) {
    throw new AuthError(`That image is larger than ${formatMaxSize(bucket)}.`)
  }

  const supabase = createClient()
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  // Cache-busting name so a replaced image isn't served from the CDN cache.
  const path = `${userId}/${Date.now()}.${extension}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: true })

  if (error) {
    throw new AuthError("Could not upload that image. Please try again.")
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path)

  return { path, publicUrl }
}

/**
 * Availability is checked through the `is_slug_available` RPC rather than by
 * reading `stores`: the RPC is SECURITY DEFINER, so it can also consult
 * `reserved_slugs` without exposing the merchant list to the client.
 */
export async function checkSlugAvailability(slug: string): Promise<boolean> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc("is_slug_available", {
    candidate: slug,
  })

  if (error) {
    throw new AuthError("Could not check that address. Please try again.")
  }

  return data === true
}

export async function createStore(payload: IStore): Promise<IStoreSuccess> {
  try {
    const { data } = await apiClient.post<IStoreResponse>(
      "/onboarding/store",
      payload
    )

    if (!data.ok) {
      throw new AuthError(data.error, { fieldErrors: data.fieldErrors })
    }

    return data
  } catch (error) {
    if (error instanceof AuthError) throw error

    if (axios.isAxiosError<IStoreResponse>(error)) {
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

      throw new AuthError("Could not create your store. Please try again.", {
        status: error.response.status,
      })
    }

    throw new AuthError("Something went wrong. Please try again.")
  }
}

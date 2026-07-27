import axios from "axios"

import { apiClient } from "@/lib/api-client"
import { AuthError } from "@/features/auth/services"
import type {
  IAcceptSuccess,
  IInvite,
  IInviteSuccess,
} from "@/features/members/types"

async function post<T extends { ok: boolean }>(
  path: string,
  payload: unknown,
  fallback: string
): Promise<Extract<T, { ok: true }>> {
  try {
    const { data } = await apiClient.post<T>(path, payload)

    if (!data.ok) {
      const body = data as Extract<T, { ok: false }> & {
        error: string
        fieldErrors?: Record<string, string>
      }
      throw new AuthError(body.error, { fieldErrors: body.fieldErrors })
    }

    return data as Extract<T, { ok: true }>
  } catch (error) {
    if (error instanceof AuthError) throw error

    if (
      axios.isAxiosError<{
        ok: false
        error: string
        fieldErrors?: Record<string, string>
      }>(error)
    ) {
      const body = error.response?.data

      if (body && !body.ok) {
        throw new AuthError(body.error, {
          fieldErrors: body.fieldErrors,
          status: error.response?.status,
        })
      }

      if (!error.response) {
        throw new AuthError(
          "Network error. Check your connection and try again."
        )
      }

      throw new AuthError(fallback, { status: error.response.status })
    }

    throw new AuthError("Something went wrong. Please try again.")
  }
}

export function createInvite(payload: IInvite) {
  return post<IInviteSuccess | { ok: false; error: string }>(
    "/stores/invites",
    payload,
    "Could not create that invite. Please try again."
  ) as Promise<IInviteSuccess>
}

export function revokeInvite(inviteId: string) {
  return post<{ ok: true } | { ok: false; error: string }>(
    `/stores/invites/${inviteId}/revoke`,
    {},
    "Could not revoke that invite. Please try again."
  )
}

export function acceptInvite(token: string) {
  return post<IAcceptSuccess | { ok: false; error: string }>(
    "/invites/accept",
    { token },
    "Could not accept that invite. Please try again."
  ) as Promise<IAcceptSuccess>
}

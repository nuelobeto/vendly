import axios from "axios"

import { apiClient } from "@/lib/api-client"
import type {
  IAuthError,
  IRegister,
  IRegisterResponse,
  IRegisterSuccess,
} from "@/features/auth/types"

/**
 * Carries the API's field-level errors through react-query's error channel so
 * the form can map them back onto the right inputs.
 */
export class AuthError extends Error implements IAuthError {
  fieldErrors?: Record<string, string>
  status?: number

  constructor(message: string, options: Omit<IAuthError, "message"> = {}) {
    super(message)
    this.name = "AuthError"
    this.fieldErrors = options.fieldErrors
    this.status = options.status
  }
}

export async function register(payload: IRegister): Promise<IRegisterSuccess> {
  try {
    const { data } = await apiClient.post<IRegisterResponse>(
      "/auth/register",
      payload
    )

    // Defensive: a 2xx carrying `ok: false` shouldn't happen, but don't let it
    // fall through as a success.
    if (!data.ok) {
      throw new AuthError(data.error, { fieldErrors: data.fieldErrors })
    }

    return data
  } catch (error) {
    if (error instanceof AuthError) {
      throw error
    }

    if (axios.isAxiosError<IRegisterResponse>(error)) {
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

      throw new AuthError("Could not create your account. Please try again.", {
        status: error.response.status,
      })
    }

    throw new AuthError("Something went wrong. Please try again.")
  }
}

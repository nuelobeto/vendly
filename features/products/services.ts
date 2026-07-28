import axios from "axios"

import { apiClient } from "@/lib/api-client"
import { AuthError } from "@/features/auth/services"
import type {
  ICreateProduct,
  IProductSuccess,
  IUpdateProduct,
} from "@/features/products/types"
import type { SaveVariantsInput } from "@/features/products/schemas"

async function unwrap<T extends { ok: boolean }>(
  run: () => Promise<{ data: T }>,
  fallback: string
): Promise<Extract<T, { ok: true }>> {
  try {
    const { data } = await run()

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

export function createProduct(payload: ICreateProduct) {
  return unwrap<IProductSuccess | { ok: false; error: string }>(
    () => apiClient.post("/products", payload),
    "Could not create that product. Please try again."
  ) as Promise<IProductSuccess>
}

export function updateProduct(id: string, payload: IUpdateProduct) {
  return unwrap<IProductSuccess | { ok: false; error: string }>(
    () => apiClient.patch(`/products/${id}`, payload),
    "Could not save that product. Please try again."
  ) as Promise<IProductSuccess>
}

export async function deleteProduct(id: string) {
  try {
    await apiClient.delete(`/products/${id}`)
  } catch {
    throw new AuthError("Could not delete that product. Please try again.")
  }
}

/** PUT, not PATCH — this replaces the whole option/variant state. */
export function saveVariants(id: string, payload: SaveVariantsInput) {
  return unwrap<{ ok: true } | { ok: false; error: string }>(
    () => apiClient.put(`/products/${id}/variants`, payload),
    "Could not save those variants. Please try again."
  )
}

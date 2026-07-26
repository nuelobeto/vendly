import axios from "axios"

/**
 * Shared axios instance for calling this app's own route handlers.
 *
 * Browser-only: the relative `baseURL` has no meaning on the server, where you
 * should query Supabase directly rather than HTTP-calling your own API.
 */
export const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  // Our route handlers signal failure with a status code and a JSON body we
  // want to read, so let axios reject and unwrap `error.response.data`.
  timeout: 20_000,
})

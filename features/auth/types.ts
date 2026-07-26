export interface IRegister {
  email: string
  password: string
}

/** Wire format returned by POST /api/auth/register. */
export type IRegisterResponse =
  | { ok: true; email: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export type IRegisterSuccess = Extract<IRegisterResponse, { ok: true }>

/** Normalised failure the UI can render without knowing about axios. */
export interface IAuthError {
  message: string
  fieldErrors?: Record<string, string>
  status?: number
}

/**
 * Outcome of the email confirmation exchange. Produced by
 * GET /api/auth/confirm and rendered by /auth/confirm.
 */
export const CONFIRM_STATUSES = [
  "success",
  "expired",
  "invalid",
  "error",
] as const

export type TConfirmStatus = (typeof CONFIRM_STATUSES)[number]

export function isConfirmStatus(value: unknown): value is TConfirmStatus {
  return CONFIRM_STATUSES.includes(value as TConfirmStatus)
}

export interface IRegister {
  email: string
  password: string
  /** Relative path to return to after email confirmation. */
  next?: string
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
  /** PKCE verifier cookie missing — link opened on a different browser/device. */
  "wrong_device",
  "error",
] as const

export type TConfirmStatus = (typeof CONFIRM_STATUSES)[number]

export function isConfirmStatus(value: unknown): value is TConfirmStatus {
  return CONFIRM_STATUSES.includes(value as TConfirmStatus)
}

export interface ILogin {
  email: string
  password: string
  next?: string
}

export type ILoginResponse =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export type ILoginSuccess = Extract<ILoginResponse, { ok: true }>

export interface IForgotPassword {
  email: string
}

export interface IResetPassword {
  password: string
}

export type ISimpleAuthResponse =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

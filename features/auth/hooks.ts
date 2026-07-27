"use client"

import { useMutation, type UseMutationOptions } from "@tanstack/react-query"

import {
  AuthError,
  forgotPassword,
  login,
  register,
  resetPassword,
} from "@/features/auth/services"
import type {
  IForgotPassword,
  ILogin,
  ILoginSuccess,
  IRegister,
  IRegisterSuccess,
  IResetPassword,
} from "@/features/auth/types"

export const authKeys = {
  all: ["auth"] as const,
  register: () => [...authKeys.all, "register"] as const,
  login: () => [...authKeys.all, "login"] as const,
  forgotPassword: () => [...authKeys.all, "forgot-password"] as const,
  resetPassword: () => [...authKeys.all, "reset-password"] as const,
}

type RegisterMutationOptions = Omit<
  UseMutationOptions<IRegisterSuccess, AuthError, IRegister>,
  "mutationFn" | "mutationKey"
>

export function useRegisterMutation(options?: RegisterMutationOptions) {
  return useMutation<IRegisterSuccess, AuthError, IRegister>({
    mutationKey: authKeys.register(),
    mutationFn: register,
    // Registration is not idempotent — a retry could send a second
    // confirmation email, so never retry automatically.
    retry: false,
    ...options,
  })
}

export function useLoginMutation(
  options?: Omit<
    UseMutationOptions<ILoginSuccess, AuthError, ILogin>,
    "mutationFn" | "mutationKey"
  >
) {
  return useMutation<ILoginSuccess, AuthError, ILogin>({
    mutationKey: authKeys.login(),
    mutationFn: login,
    retry: false,
    ...options,
  })
}

export function useForgotPasswordMutation(
  options?: Omit<
    UseMutationOptions<{ ok: true }, AuthError, IForgotPassword>,
    "mutationFn" | "mutationKey"
  >
) {
  return useMutation<{ ok: true }, AuthError, IForgotPassword>({
    mutationKey: authKeys.forgotPassword(),
    mutationFn: forgotPassword,
    retry: false,
    ...options,
  })
}

export function useResetPasswordMutation(
  options?: Omit<
    UseMutationOptions<{ ok: true }, AuthError, IResetPassword>,
    "mutationFn" | "mutationKey"
  >
) {
  return useMutation<{ ok: true }, AuthError, IResetPassword>({
    mutationKey: authKeys.resetPassword(),
    mutationFn: resetPassword,
    retry: false,
    ...options,
  })
}

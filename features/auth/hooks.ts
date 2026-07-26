"use client"

import { useMutation, type UseMutationOptions } from "@tanstack/react-query"

import { AuthError, register } from "@/features/auth/services"
import type { IRegister, IRegisterSuccess } from "@/features/auth/types"

export const authKeys = {
  all: ["auth"] as const,
  register: () => [...authKeys.all, "register"] as const,
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

"use client"

import { useMutation, type UseMutationOptions } from "@tanstack/react-query"

import type { AuthError } from "@/features/auth/services"
import {
  acceptInvite,
  createInvite,
  revokeInvite,
} from "@/features/members/services"
import type {
  IAcceptSuccess,
  IInvite,
  IInviteSuccess,
} from "@/features/members/types"

export const memberKeys = {
  all: ["members"] as const,
  invite: () => [...memberKeys.all, "invite"] as const,
  revoke: () => [...memberKeys.all, "revoke"] as const,
  accept: () => [...memberKeys.all, "accept"] as const,
}

export function useCreateInviteMutation(
  options?: Omit<
    UseMutationOptions<IInviteSuccess, AuthError, IInvite>,
    "mutationFn" | "mutationKey"
  >
) {
  return useMutation<IInviteSuccess, AuthError, IInvite>({
    mutationKey: memberKeys.invite(),
    mutationFn: createInvite,
    retry: false,
    ...options,
  })
}

export function useRevokeInviteMutation(
  options?: Omit<
    UseMutationOptions<{ ok: true }, AuthError, string>,
    "mutationFn" | "mutationKey"
  >
) {
  return useMutation<{ ok: true }, AuthError, string>({
    mutationKey: memberKeys.revoke(),
    mutationFn: revokeInvite,
    retry: false,
    ...options,
  })
}

export function useAcceptInviteMutation(
  options?: Omit<
    UseMutationOptions<IAcceptSuccess, AuthError, string>,
    "mutationFn" | "mutationKey"
  >
) {
  return useMutation<IAcceptSuccess, AuthError, string>({
    mutationKey: memberKeys.accept(),
    // Accepting is not idempotent — a retry would hit "already accepted".
    mutationFn: acceptInvite,
    retry: false,
    ...options,
  })
}

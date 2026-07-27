"use client"

import { useMutation, type UseMutationOptions } from "@tanstack/react-query"

import type { AuthError } from "@/features/auth/services"
import { updateProfile, uploadAvatar } from "@/features/onboarding/services"
import type {
  IAvatarUploadResult,
  IProfile,
  IProfileSuccess,
} from "@/features/onboarding/types"

export const onboardingKeys = {
  all: ["onboarding"] as const,
  profile: () => [...onboardingKeys.all, "profile"] as const,
  avatar: () => [...onboardingKeys.all, "avatar"] as const,
}

export function useUpdateProfileMutation(
  options?: Omit<
    UseMutationOptions<IProfileSuccess, AuthError, IProfile>,
    "mutationFn" | "mutationKey"
  >
) {
  return useMutation<IProfileSuccess, AuthError, IProfile>({
    mutationKey: onboardingKeys.profile(),
    mutationFn: updateProfile,
    retry: false,
    ...options,
  })
}

export function useUploadAvatarMutation(
  options?: Omit<
    UseMutationOptions<
      IAvatarUploadResult,
      AuthError,
      { file: File; userId: string }
    >,
    "mutationFn" | "mutationKey"
  >
) {
  return useMutation<
    IAvatarUploadResult,
    AuthError,
    { file: File; userId: string }
  >({
    mutationKey: onboardingKeys.avatar(),
    mutationFn: uploadAvatar,
    retry: false,
    ...options,
  })
}

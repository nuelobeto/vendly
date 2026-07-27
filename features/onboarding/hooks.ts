"use client"

import {
  useMutation,
  useQuery,
  type UseMutationOptions,
} from "@tanstack/react-query"

import type { AuthError } from "@/features/auth/services"
import {
  checkSlugAvailability,
  createStore,
  updateProfile,
  uploadImage,
} from "@/features/onboarding/services"
import type {
  IImageUploadResult,
  IProfile,
  IProfileSuccess,
  IStore,
  IStoreSuccess,
} from "@/features/onboarding/types"

export const onboardingKeys = {
  all: ["onboarding"] as const,
  profile: () => [...onboardingKeys.all, "profile"] as const,
  image: () => [...onboardingKeys.all, "image"] as const,
  store: () => [...onboardingKeys.all, "store"] as const,
  slug: (candidate: string) =>
    [...onboardingKeys.all, "slug", candidate] as const,
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

export function useUploadImageMutation(
  options?: Omit<
    UseMutationOptions<
      IImageUploadResult,
      AuthError,
      Parameters<typeof uploadImage>[0]
    >,
    "mutationFn" | "mutationKey"
  >
) {
  return useMutation({
    mutationKey: onboardingKeys.image(),
    mutationFn: uploadImage,
    retry: false,
    ...options,
  })
}

export function useCreateStoreMutation(
  options?: Omit<
    UseMutationOptions<IStoreSuccess, AuthError, IStore>,
    "mutationFn" | "mutationKey"
  >
) {
  return useMutation<IStoreSuccess, AuthError, IStore>({
    mutationKey: onboardingKeys.store(),
    mutationFn: createStore,
    retry: false,
    ...options,
  })
}

/**
 * Pass an already-debounced, already-format-valid slug. Disabled otherwise, so
 * we never spend a round trip on input the client can reject itself.
 */
export function useSlugAvailability(candidate: string, enabled: boolean) {
  return useQuery({
    queryKey: onboardingKeys.slug(candidate),
    queryFn: () => checkSlugAvailability(candidate),
    enabled: enabled && candidate.length > 0,
    // Availability can change under us; never serve a stale "available".
    staleTime: 0,
    retry: false,
  })
}

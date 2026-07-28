"use client"

import { useMutation, type UseMutationOptions } from "@tanstack/react-query"

import type { AuthError } from "@/features/auth/services"
import {
  createProduct,
  deleteProduct,
  saveVariants,
  updateProduct,
} from "@/features/products/services"
import type { SaveVariantsInput } from "@/features/products/schemas"
import type {
  ICreateProduct,
  IProductSuccess,
  IUpdateProduct,
} from "@/features/products/types"

export const productKeys = {
  all: ["products"] as const,
  create: () => [...productKeys.all, "create"] as const,
  update: () => [...productKeys.all, "update"] as const,
  remove: () => [...productKeys.all, "delete"] as const,
  variants: () => [...productKeys.all, "variants"] as const,
}

export function useCreateProductMutation(
  options?: Omit<
    UseMutationOptions<IProductSuccess, AuthError, ICreateProduct>,
    "mutationFn" | "mutationKey"
  >
) {
  return useMutation<IProductSuccess, AuthError, ICreateProduct>({
    mutationKey: productKeys.create(),
    mutationFn: createProduct,
    // Creation is not idempotent — a retry would make a second product.
    retry: false,
    ...options,
  })
}

export function useUpdateProductMutation(
  id: string,
  options?: Omit<
    UseMutationOptions<IProductSuccess, AuthError, IUpdateProduct>,
    "mutationFn" | "mutationKey"
  >
) {
  return useMutation<IProductSuccess, AuthError, IUpdateProduct>({
    mutationKey: productKeys.update(),
    mutationFn: (payload) => updateProduct(id, payload),
    retry: false,
    ...options,
  })
}

export function useDeleteProductMutation(
  options?: Omit<
    UseMutationOptions<void, AuthError, string>,
    "mutationFn" | "mutationKey"
  >
) {
  return useMutation<void, AuthError, string>({
    mutationKey: productKeys.remove(),
    mutationFn: deleteProduct,
    retry: false,
    ...options,
  })
}

export function useSaveVariantsMutation(
  id: string,
  options?: Omit<
    UseMutationOptions<{ ok: true }, AuthError, SaveVariantsInput>,
    "mutationFn" | "mutationKey"
  >
) {
  return useMutation<{ ok: true }, AuthError, SaveVariantsInput>({
    mutationKey: productKeys.variants(),
    mutationFn: (payload) => saveVariants(id, payload),
    retry: false,
    ...options,
  })
}

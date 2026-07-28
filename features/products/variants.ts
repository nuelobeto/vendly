import type { ICreateProductOption } from "@/features/products/types"

/**
 * Every combination of option values, in option order.
 *
 * This is what the source contract meant by a variant carrying "one value per
 * product option, in the product's option order" — the grid the merchant fills
 * in is the cartesian product of the options they defined.
 *
 * Returns a single empty combination for a product with no options, which is
 * exactly the one "Default Title" variant such a product must have.
 */
export function buildVariantMatrix(
  options: ICreateProductOption[]
): string[][] {
  const usable = options
    .map((option) => option.values.map((v) => v.trim()).filter(Boolean))
    .filter((values) => values.length > 0)

  if (usable.length === 0) return [[]]

  return usable.reduce<string[][]>(
    (rows, values) => rows.flatMap((row) => values.map((v) => [...row, v])),
    [[]]
  )
}

/** Matches the trigger's derivation, so the UI can preview the stored title. */
export function variantTitle(combination: string[]) {
  return combination.length === 0 ? "Default Title" : combination.join(" / ")
}

/** Splits the comma-separated input the options editor uses. */
export function parseOptionValues(input: string) {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    )
  )
}

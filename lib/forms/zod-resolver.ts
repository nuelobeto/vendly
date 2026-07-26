import type { FieldValues, Resolver } from "react-hook-form"
import type { ZodType } from "zod"

/**
 * Minimal react-hook-form resolver for zod 4.
 *
 * We don't use @hookform/resolvers: v5 pulls a peerOptional valibot@^1 that
 * conflicts with the valibot@0.39 already in the tree (via the shadcn CLI's
 * @typeschema stack), and v3 reads `error.errors`, which zod 4 removed in
 * favour of `error.issues`. This is the whole surface we actually need.
 */
export function zodResolver<TInput extends FieldValues, TOutput>(
  schema: ZodType<TOutput, TInput>
): Resolver<TInput, unknown, TInput> {
  return async (values) => {
    const result = await schema.safeParseAsync(values)

    if (result.success) {
      return { values, errors: {} }
    }

    const errors: Record<string, { type: string; message: string }> = {}

    for (const issue of result.error.issues) {
      const path = issue.path.join(".")
      // First issue per field wins, matching @hookform/resolvers' default.
      if (path && !errors[path]) {
        errors[path] = { type: issue.code, message: issue.message }
      }
    }

    return {
      values: {} as TInput,
      errors: errors as never,
    }
  }
}

import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { saveVariantsSchema } from "@/features/products/schemas"
import type { IProductResponse } from "@/features/products/types"

/**
 * Replaces a product's options and reconciles its variants.
 *
 * PUT, not PATCH: this takes the whole desired state. The source contract
 * excluded options from PATCH because editing them has to rewrite every variant
 * — so this is a replacement, and the reconciliation happens in one transaction
 * inside save_product_variants().
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json<IProductResponse>(
      { ok: false, error: "You need to be signed in to do that." },
      { status: 401 }
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json<IProductResponse>(
      { ok: false, error: "Malformed request body" },
      { status: 400 }
    )
  }

  const parsed = saveVariantsSchema.safeParse(body)

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".")
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message
    }
    return NextResponse.json<IProductResponse>(
      { ok: false, error: "Check the highlighted fields", fieldErrors },
      { status: 422 }
    )
  }

  const { error } = await supabase.rpc("save_product_variants", {
    p_product_id: id,
    p_options: parsed.data.options as never,
    p_variants: parsed.data.variants as never,
  })

  if (error) {
    if (error.message.includes("variants_required")) {
      return NextResponse.json<IProductResponse>(
        {
          ok: false,
          error: "Check the highlighted fields",
          fieldErrors: { variants: "A product needs at least one variant." },
        },
        { status: 422 }
      )
    }

    if (error.message.includes("variant_options_mismatch")) {
      return NextResponse.json<IProductResponse>(
        {
          ok: false,
          error: "Check the highlighted fields",
          fieldErrors: {
            variants: "Each variant needs one value per product option.",
          },
        },
        { status: 422 }
      )
    }

    if (error.code === "23505") {
      return NextResponse.json<IProductResponse>(
        {
          ok: false,
          error: "Check the highlighted fields",
          fieldErrors: { variants: "Two variants share a SKU." },
        },
        { status: 409 }
      )
    }

    return NextResponse.json<IProductResponse>(
      { ok: false, error: "Could not save those variants. Please try again." },
      { status: 400 }
    )
  }

  return NextResponse.json<IProductResponse>({ ok: true } as never, {
    status: 200,
  })
}

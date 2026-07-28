"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AlertCircleIcon, Loader2Icon, PlusIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  useCreateProductMutation,
  useSaveVariantsMutation,
  useUpdateProductMutation,
} from "@/features/products/hooks"
import { MAX_OPTIONS } from "@/features/products/schemas"
import {
  buildVariantMatrix,
  parseOptionValues,
  variantTitle,
} from "@/features/products/variants"
import {
  PRODUCT_STATUSES,
  type ICreateProductOption,
  type IProduct,
} from "@/features/products/types"
import {
  ProductImages,
  type DraftImage,
} from "@/features/products/components/product-images"

type OptionDraft = { name: string; valuesText: string }
type VariantDraft = {
  price: string
  sku: string
  inventory: string
  cost: string
  /** Present for a variant that already exists, so a save updates it. */
  id?: string
}

function ProductForm({
  storeId,
  product,
  canSeeCost,
}: {
  storeId: string
  /** Null when creating. */
  product: IProduct | null
  /** Staff cannot read cost back, so they aren't asked to write it. */
  canSeeCost: boolean
}) {
  const router = useRouter()
  const isEdit = !!product

  const [title, setTitle] = React.useState(product?.title ?? "")
  const [handle, setHandle] = React.useState(product?.handle ?? "")
  const [description, setDescription] = React.useState(
    product?.descriptionHtml ?? ""
  )
  const [vendor, setVendor] = React.useState(product?.vendor ?? "")
  const [productType, setProductType] = React.useState(
    product?.productType ?? ""
  )
  const [status, setStatus] = React.useState(product?.status ?? "draft")
  const [images, setImages] = React.useState<DraftImage[]>(
    (product?.images ?? []).map((i) => ({
      url: i.url,
      storageKey: i.storageKey ?? undefined,
    }))
  )

  const [options, setOptions] = React.useState<OptionDraft[]>(
    (product?.options ?? []).map((o) => ({
      name: o.name,
      valuesText: o.values.join(", "),
    }))
  )

  const parsedOptions: ICreateProductOption[] = options
    .map((o) => ({
      name: o.name.trim(),
      values: parseOptionValues(o.valuesText),
    }))
    .filter((o) => o.name && o.values.length > 0)

  const combinations = buildVariantMatrix(parsedOptions)

  // Keyed by title so edits survive re-generation when another option changes.
  const [variantDrafts, setVariantDrafts] = React.useState<
    Record<string, VariantDraft>
  >(() =>
    Object.fromEntries(
      (product?.variants ?? []).map((v) => [
        v.title,
        {
          price: String(v.price),
          sku: v.sku ?? "",
          inventory: String(v.inventoryQuantity),
          cost: product?.variantCosts?.[v.id]?.toString() ?? "",
          id: v.id,
        },
      ])
    )
  )

  /*
   * Existing variants are keyed by the title they had when loaded. Renaming an
   * option changes the derived title, so the id is looked up by matching option
   * values instead — that is what keeps stock and cost attached to the right
   * row through a rename rather than silently recreating it.
   */
  const idForCombination = React.useCallback(
    (combination: string[]) => {
      const byPosition = (product?.variants ?? []).find(
        (v) =>
          v.options.length === combination.length &&
          v.options.every((value, index) => value === combination[index])
      )
      return byPosition?.id ?? variantDrafts[variantTitle(combination)]?.id
    },
    [product?.variants, variantDrafts]
  )

  const draftFor = (key: string): VariantDraft =>
    variantDrafts[key] ?? { price: "", sku: "", inventory: "0", cost: "" }

  const setDraft = (key: string, patch: Partial<VariantDraft>) =>
    setVariantDrafts((current) => ({
      ...current,
      [key]: { ...draftFor(key), ...patch },
    }))

  const variantsMutation = useSaveVariantsMutation(product?.id ?? "", {
    onSuccess: () => router.refresh(),
  })

  const createMutation = useCreateProductMutation({
    onSuccess: (data) => router.push(`/dashboard/products/${data.product.id}`),
  })
  const updateMutation = useUpdateProductMutation(product?.id ?? "", {
    onSuccess: () => router.refresh(),
  })

  const mutation = isEdit ? updateMutation : createMutation
  const isBusy =
    mutation.isPending ||
    variantsMutation.isPending ||
    (!isEdit && mutation.isSuccess)

  function submit(event: React.FormEvent) {
    event.preventDefault()

    if (isEdit) {
      /*
       * PATCH only carries the product's own fields. Options can't change this
       * way — the source contract excluded them for the same reason: an option
       * edit would have to rewrite every variant, which isn't a patch.
       */
      updateMutation.mutate({
        title,
        handle: handle || undefined,
        descriptionHtml: description || null,
        vendor,
        productType: productType || null,
        status,
        featuredImageUrl: images[0]?.url ?? null,
      })

      // Options and variants are replaced wholesale in one transaction — see
      // save_product_variants. They cannot ride along on the PATCH.
      variantsMutation.mutate({
        options: parsedOptions,
        variants: combinations.map((combination) => {
          const draft = draftFor(variantTitle(combination))
          return {
            id: idForCombination(combination),
            options: combination.length > 0 ? combination : undefined,
            price: Number(draft.price || 0),
            sku: draft.sku || undefined,
            inventoryQuantity: Number(draft.inventory || 0),
            ...(canSeeCost && draft.cost
              ? { costPerItem: Number(draft.cost) }
              : {}),
          }
        }),
      })
      return
    }

    createMutation.mutate({
      title,
      handle: handle || undefined,
      descriptionHtml: description || undefined,
      vendor: vendor || undefined,
      productType: productType || undefined,
      status,
      options: parsedOptions.length > 0 ? parsedOptions : undefined,
      images: images.map((image, index) => ({ ...image, position: index })),
      variants: combinations.map((combination) => {
        const draft = draftFor(variantTitle(combination))
        return {
          options: combination.length > 0 ? combination : undefined,
          price: Number(draft.price || 0),
          sku: draft.sku || undefined,
          inventoryQuantity: Number(draft.inventory || 0),
          costPerItem:
            canSeeCost && draft.cost ? Number(draft.cost) : undefined,
        }
      }),
    })
  }

  const fieldErrors = mutation.error?.fieldErrors ?? {}

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {mutation.isError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{mutation.error.message}</span>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field data-invalid={!!fieldErrors.title}>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Runner Low"
              disabled={isBusy}
              className="h-10"
            />
            <FieldError>{fieldErrors.title}</FieldError>
          </Field>

          <Field data-invalid={!!fieldErrors.handle}>
            <FieldLabel htmlFor="handle">
              Handle{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </FieldLabel>
            <Input
              id="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="runner-low"
              disabled={isBusy}
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank and we&apos;ll build one from the title.
            </p>
            <FieldError>{fieldErrors.handle}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={isBusy}
            />
            <p className="text-xs text-muted-foreground">
              Plain text for now — HTML isn&apos;t sanitised yet, so it is never
              rendered as markup.
            </p>
          </Field>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="vendor">Vendor</FieldLabel>
              <Input
                id="vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                disabled={isBusy}
                className="h-10"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="productType">Type</FieldLabel>
              <Input
                id="productType"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                disabled={isBusy}
                className="h-10"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="status">Status</FieldLabel>
              <NativeSelect
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as (typeof PRODUCT_STATUSES)[number])
                }
                disabled={isBusy}
                className="h-10"
              >
                {PRODUCT_STATUSES.map((s) => (
                  <NativeSelectOption key={s} value={s}>
                    {s}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>
            The first image becomes the one shown in listings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductImages
            storeId={storeId}
            images={images}
            onChange={setImages}
            disabled={isBusy}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Options and variants</CardTitle>
          <CardDescription>
            Up to {MAX_OPTIONS}. Leave empty for a product that doesn&apos;t
            vary.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {
            <>
              {options.map((option, index) => (
                <div key={index} className="flex flex-wrap items-end gap-2">
                  <Field className="min-w-32 flex-1">
                    <FieldLabel htmlFor={`option-name-${index}`}>
                      Option name
                    </FieldLabel>
                    <Input
                      id={`option-name-${index}`}
                      value={option.name}
                      placeholder="Size"
                      disabled={isBusy}
                      className="h-10"
                      onChange={(e) =>
                        setOptions((current) =>
                          current.map((o, i) =>
                            i === index ? { ...o, name: e.target.value } : o
                          )
                        )
                      }
                    />
                  </Field>
                  <Field className="min-w-48 flex-2">
                    <FieldLabel htmlFor={`option-values-${index}`}>
                      Values, comma separated
                    </FieldLabel>
                    <Input
                      id={`option-values-${index}`}
                      value={option.valuesText}
                      placeholder="Small, Medium, Large"
                      disabled={isBusy}
                      className="h-10"
                      onChange={(e) =>
                        setOptions((current) =>
                          current.map((o, i) =>
                            i === index
                              ? { ...o, valuesText: e.target.value }
                              : o
                          )
                        )
                      }
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isBusy}
                    onClick={() =>
                      setOptions((c) => c.filter((_, i) => i !== index))
                    }
                  >
                    <XIcon />
                    <span className="sr-only">Remove option</span>
                  </Button>
                </div>
              ))}

              {options.length < MAX_OPTIONS ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isBusy}
                  onClick={() =>
                    setOptions((c) => [...c, { name: "", valuesText: "" }])
                  }
                  className="h-9 w-fit rounded-lg"
                >
                  <PlusIcon />
                  Add option
                </Button>
              ) : null}

              {(fieldErrors.options ??
              variantsMutation.error?.fieldErrors?.variants) ? (
                <p role="alert" className="text-sm text-destructive">
                  {fieldErrors.options ??
                    variantsMutation.error?.fieldErrors?.variants}
                </p>
              ) : null}
            </>
          }

          <div className="flex flex-col gap-2">
            {combinations.map((combination) => {
              const key = variantTitle(combination)
              const draft = draftFor(key)

              return (
                <div
                  key={key}
                  className={cn(
                    "grid gap-2 rounded-lg border p-3",
                    canSeeCost
                      ? "sm:grid-cols-[1fr_repeat(4,7rem)]"
                      : "sm:grid-cols-[1fr_repeat(3,7rem)]"
                  )}
                >
                  <span className="self-center truncate text-sm font-medium">
                    {key}
                  </span>
                  <Input
                    aria-label={`Price for ${key}`}
                    inputMode="decimal"
                    placeholder="Price"
                    value={draft.price}
                    disabled={isBusy}
                    className="h-9"
                    onChange={(e) => setDraft(key, { price: e.target.value })}
                  />
                  {canSeeCost ? (
                    <Input
                      aria-label={`Cost for ${key}`}
                      inputMode="decimal"
                      placeholder="Cost"
                      value={draft.cost}
                      disabled={isBusy}
                      className="h-9"
                      onChange={(e) => setDraft(key, { cost: e.target.value })}
                    />
                  ) : null}
                  <Input
                    aria-label={`SKU for ${key}`}
                    placeholder="SKU"
                    value={draft.sku}
                    disabled={isBusy}
                    className="h-9"
                    onChange={(e) => setDraft(key, { sku: e.target.value })}
                  />
                  <Input
                    aria-label={`Stock for ${key}`}
                    inputMode="numeric"
                    placeholder="Stock"
                    value={draft.inventory}
                    disabled={isBusy}
                    className="h-9"
                    onChange={(e) =>
                      setDraft(key, { inventory: e.target.value })
                    }
                  />
                </div>
              )
            })}
          </div>

          {isEdit ? (
            <p className="text-xs text-muted-foreground">
              Changing an option rewrites the variant list. Rows matching an
              existing combination keep their stock and history.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          size="lg"
          disabled={isBusy || !title.trim()}
          className="h-11 rounded-xl"
        >
          {isBusy ? (
            <>
              <Loader2Icon className="animate-spin" />
              Saving…
            </>
          ) : isEdit ? (
            "Save changes"
          ) : (
            "Create product"
          )}
        </Button>
        {isEdit && updateMutation.isSuccess && variantsMutation.isSuccess ? (
          <span aria-live="polite" className="text-sm text-primary">
            Saved.
          </span>
        ) : null}
      </div>
    </form>
  )
}

export { ProductForm }

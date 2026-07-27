"use client"

import * as React from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CheckIcon,
  ImageIcon,
  Loader2Icon,
  StoreIcon,
  XIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { zodResolver } from "@/lib/forms/zod-resolver"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  useCreateStoreMutation,
  useSlugAvailability,
} from "@/features/onboarding/hooks"
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  DIAL_CODES,
  fromE164,
  SLUG_PATTERN,
  slugify,
  storeFormSchema,
  toE164,
  type StoreFormInput,
} from "@/features/onboarding/schemas"
import type { IStoreRow } from "@/features/onboarding/types"
import { ImageUpload } from "@/features/onboarding/components/image-upload"

const SLUG_DEBOUNCE_MS = 400

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = React.useState(value)

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}

function StoreForm({
  userId,
  store,
}: {
  userId: string
  store: IStoreRow | null
}) {
  // True once the user edits the slug directly, after which we stop deriving it
  // from the name — otherwise typing the name would clobber their choice.
  const [slugTouched, setSlugTouched] = React.useState(!!store?.slug)

  const initialContactPhone = fromE164(store?.contact_phone)

  const form = useForm<StoreFormInput>({
    resolver: zodResolver(storeFormSchema),
    mode: "onBlur",
    defaultValues: {
      name: store?.name ?? "",
      slug: store?.slug ?? "",
      currency: store?.currency ?? DEFAULT_CURRENCY,
      logoUrl: store?.logo_url ?? null,
      bannerUrl: store?.banner_url ?? null,
      contactEmail: store?.contact_email ?? "",
      contactDialCode: initialContactPhone.dialCode,
      contactPhoneNumber: initialContactPhone.phoneNumber,
    },
  })

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors },
  } = form

  const name = useWatch({ control, name: "name" })
  const slug = useWatch({ control, name: "slug" })

  // Derive the slug from the name until the user takes over.
  React.useEffect(() => {
    if (slugTouched) return
    setValue("slug", slugify(name ?? ""), { shouldValidate: false })
  }, [name, slugTouched, setValue])

  const debouncedSlug = useDebounced(slug ?? "", SLUG_DEBOUNCE_MS)
  const slugFormatValid = SLUG_PATTERN.test(debouncedSlug)
  // Keeping your own existing slug is always fine — don't flag it as taken.
  const isOwnSlug = !!store?.slug && store.slug === debouncedSlug

  const availability = useSlugAvailability(
    debouncedSlug,
    slugFormatValid && !isOwnSlug
  )

  const mutation = useCreateStoreMutation({
    onError: (error) => {
      const map: Record<string, keyof StoreFormInput> = {
        name: "name",
        slug: "slug",
        currency: "currency",
        logo_url: "logoUrl",
        banner_url: "bannerUrl",
        contact_email: "contactEmail",
        contact_phone: "contactPhoneNumber",
      }
      for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
        const target = map[field]
        if (target) setError(target, { message })
      }
    },
    onSuccess: () => {
      window.location.assign("/onboarding/complete")
    },
  })

  const onSubmit = handleSubmit((values) => {
    mutation.mutate({
      name: values.name,
      // Blank is intentional: the server derives one from the name.
      slug: values.slug,
      currency: values.currency,
      logo_url: values.logoUrl,
      banner_url: values.bannerUrl,
      contact_email: values.contactEmail,
      contact_phone: toE164(values.contactDialCode, values.contactPhoneNumber),
    })
  })

  const isBusy = mutation.isPending || mutation.isSuccess
  const taken = availability.data === false
  // Block submit while a check is in flight so we can't race past a taken slug.
  const blocked =
    taken || (slugFormatValid && !isOwnSlug && availability.isPending)

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {mutation.isError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{mutation.error.message}</span>
        </div>
      ) : null}

      <Controller
        control={control}
        name="bannerUrl"
        render={({ field }) => (
          <ImageUpload
            bucket="store-banners"
            userId={userId}
            value={field.value}
            onChange={field.onChange}
            disabled={isBusy}
            shape="wide"
            icon={<ImageIcon className="size-7 text-muted-foreground" />}
            addLabel="Add a banner"
            changeLabel="Change banner"
            hint="Optional · the wide header on your storefront · max 5 MB"
          />
        )}
      />

      <Controller
        control={control}
        name="logoUrl"
        render={({ field }) => (
          <ImageUpload
            bucket="store-logos"
            userId={userId}
            value={field.value}
            onChange={field.onChange}
            disabled={isBusy}
            shape="square"
            icon={<StoreIcon className="size-7 text-muted-foreground" />}
            addLabel="Add a logo"
            changeLabel="Change logo"
            hint="Optional · JPG, PNG, SVG or WebP · max 2 MB"
          />
        )}
      />

      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Store name</FieldLabel>
          <Input
            id="name"
            autoComplete="organization"
            placeholder="Atelier Nord"
            aria-invalid={!!errors.name}
            disabled={isBusy}
            className="h-10"
            {...register("name")}
          />
          <FieldError errors={errors.name ? [errors.name] : undefined} />
        </Field>

        <Field data-invalid={!!errors.slug || taken}>
          <FieldLabel htmlFor="slug">Store address</FieldLabel>
          <div className="flex items-center gap-0">
            <span className="flex h-10 items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              vendly.shop/
            </span>
            <Input
              id="slug"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="atelier-nord"
              aria-invalid={!!errors.slug || taken}
              aria-describedby="slug-status"
              disabled={isBusy}
              className="h-10 rounded-l-none"
              {...register("slug", {
                onChange: () => setSlugTouched(true),
              })}
            />
          </div>

          <p
            id="slug-status"
            aria-live="polite"
            className={cn(
              "flex items-center gap-1.5 text-sm",
              taken ? "text-destructive" : "text-muted-foreground",
              availability.data === true && "text-primary"
            )}
          >
            {!slug ? (
              "Leave blank and we'll create one from your store name."
            ) : !slugFormatValid ? (
              "Lowercase letters, numbers and hyphens — at least 3 characters."
            ) : isOwnSlug ? (
              <>
                <CheckIcon className="size-3.5" /> This is your current address
              </>
            ) : availability.isPending ? (
              <>
                <Loader2Icon className="size-3.5 animate-spin" /> Checking
                availability…
              </>
            ) : availability.data === true ? (
              <>
                <CheckIcon className="size-3.5" /> vendly.shop/{debouncedSlug}{" "}
                is available
              </>
            ) : taken ? (
              <>
                <XIcon className="size-3.5" /> That address is taken or reserved
              </>
            ) : availability.isError ? (
              "Couldn't check availability — we'll confirm when you continue."
            ) : null}
          </p>

          <FieldError errors={errors.slug ? [errors.slug] : undefined} />
        </Field>

        <Field data-invalid={!!errors.contactEmail}>
          <FieldLabel htmlFor="contactEmail">
            Contact email{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </FieldLabel>
          <Input
            id="contactEmail"
            type="email"
            autoComplete="email"
            placeholder="hello@yourshop.com"
            aria-invalid={!!errors.contactEmail}
            disabled={isBusy}
            className="h-10"
            {...register("contactEmail")}
          />
          <p className="text-xs text-muted-foreground">
            Where buyers reach you. Defaults to your account email.
          </p>
          <FieldError
            errors={errors.contactEmail ? [errors.contactEmail] : undefined}
          />
        </Field>

        <Field data-invalid={!!errors.contactPhoneNumber}>
          <FieldLabel htmlFor="contactPhoneNumber">
            Contact phone{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </FieldLabel>
          <div className="flex gap-2">
            <NativeSelect
              aria-label="Contact country dialling code"
              disabled={isBusy}
              className="h-10 w-40 shrink-0"
              {...register("contactDialCode")}
            >
              {DIAL_CODES.map((option) => (
                <NativeSelectOption key={option.code} value={option.code}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Input
              id="contactPhoneNumber"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="801 234 5678"
              aria-invalid={!!errors.contactPhoneNumber}
              disabled={isBusy}
              className="h-10"
              {...register("contactPhoneNumber")}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Defaults to the phone number on your profile.
          </p>
          <FieldError
            errors={
              errors.contactPhoneNumber
                ? [errors.contactPhoneNumber]
                : undefined
            }
          />
        </Field>

        <Field data-invalid={!!errors.currency}>
          <FieldLabel htmlFor="currency">Currency</FieldLabel>
          <NativeSelect
            id="currency"
            disabled={isBusy}
            className="h-10"
            {...register("currency")}
          >
            {CURRENCIES.map((option) => (
              <NativeSelectOption key={option.code} value={option.code}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <p className="text-xs text-muted-foreground">
            What buyers are charged in. This can&apos;t be changed once you take
            your first order.
          </p>
          <FieldError
            errors={errors.currency ? [errors.currency] : undefined}
          />
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        size="lg"
        disabled={isBusy || blocked}
        className="h-11 w-full rounded-xl text-base"
      >
        {isBusy ? (
          <>
            <Loader2Icon className="animate-spin" />
            Creating your store…
          </>
        ) : (
          <>
            {store ? "Save and continue" : "Create my store"}
            <ArrowRightIcon className="transition-transform group-hover/button:translate-x-0.5" />
          </>
        )}
      </Button>
    </form>
  )
}

export { StoreForm }

"use client"

import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CameraIcon,
  Loader2Icon,
} from "lucide-react"

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
import { useUpdateProfileMutation } from "@/features/onboarding/hooks"
import {
  DIAL_CODES,
  fromE164,
  profileFormSchema,
  toE164,
  type ProfileFormInput,
} from "@/features/onboarding/schemas"
import type { IProfileRow } from "@/features/onboarding/types"
import { ImageUpload } from "@/features/onboarding/components/image-upload"

function ProfileForm({
  userId,
  profile,
  nextHref = "/onboarding/store",
}: {
  userId: string
  profile: IProfileRow | null
  /** Invited teammates skip store setup and go straight to the dashboard. */
  nextHref?: string
}) {
  const initialPhone = fromE164(profile?.phone)

  const form = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: profile?.first_name ?? "",
      lastName: profile?.last_name ?? "",
      dialCode: initialPhone.dialCode,
      phoneNumber: initialPhone.phoneNumber,
      avatarUrl: profile?.avatar_url ?? null,
    },
  })

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = form

  const mutation = useUpdateProfileMutation({
    onError: (error) => {
      // Map API field names back onto form field names.
      const map: Record<string, keyof ProfileFormInput> = {
        first_name: "firstName",
        last_name: "lastName",
        phone: "phoneNumber",
        avatar_url: "avatarUrl",
      }
      for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
        const target = map[field]
        if (target) setError(target, { message })
      }
    },
    onSuccess: (data) => {
      // The save may have accepted a pending invite, which settles the
      // destination more authoritatively than anything computed at render.
      window.location.assign(data.joinedStore ? "/dashboard" : nextHref)
    },
  })

  const onSubmit = handleSubmit((values) => {
    mutation.mutate({
      first_name: values.firstName,
      last_name: values.lastName,
      phone: toE164(values.dialCode, values.phoneNumber) || null,
      avatar_url: values.avatarUrl,
    })
  })

  const isBusy = mutation.isPending || mutation.isSuccess

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
        name="avatarUrl"
        render={({ field }) => (
          <ImageUpload
            bucket="avatars"
            userId={userId}
            value={field.value}
            onChange={field.onChange}
            disabled={isBusy}
            shape="circle"
            icon={<CameraIcon className="size-7 text-muted-foreground" />}
            addLabel="Add a photo"
            changeLabel="Change photo"
            hint="Optional · JPG, PNG or WebP · max 2 MB"
          />
        )}
      />

      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={!!errors.firstName}>
            <FieldLabel htmlFor="firstName">First name</FieldLabel>
            <Input
              id="firstName"
              autoComplete="given-name"
              aria-invalid={!!errors.firstName}
              disabled={isBusy}
              className="h-10"
              {...register("firstName")}
            />
            <FieldError
              errors={errors.firstName ? [errors.firstName] : undefined}
            />
          </Field>

          <Field data-invalid={!!errors.lastName}>
            <FieldLabel htmlFor="lastName">Last name</FieldLabel>
            <Input
              id="lastName"
              autoComplete="family-name"
              aria-invalid={!!errors.lastName}
              disabled={isBusy}
              className="h-10"
              {...register("lastName")}
            />
            <FieldError
              errors={errors.lastName ? [errors.lastName] : undefined}
            />
          </Field>
        </div>

        <Field data-invalid={!!errors.phoneNumber}>
          <FieldLabel htmlFor="phoneNumber">
            Phone number{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </FieldLabel>
          <div className="flex gap-2">
            <NativeSelect
              aria-label="Country dialling code"
              disabled={isBusy}
              className="h-10 w-40 shrink-0"
              {...register("dialCode")}
            >
              {DIAL_CODES.map((option) => (
                <NativeSelectOption key={option.code} value={option.code}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Input
              id="phoneNumber"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="801 234 5678"
              aria-invalid={!!errors.phoneNumber}
              disabled={isBusy}
              className="h-10"
              {...register("phoneNumber")}
            />
          </div>
          <FieldError
            errors={errors.phoneNumber ? [errors.phoneNumber] : undefined}
          />
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        size="lg"
        disabled={isBusy}
        className="h-11 w-full rounded-xl text-base"
      >
        {isBusy ? (
          <>
            <Loader2Icon className="animate-spin" />
            Saving…
          </>
        ) : (
          <>
            Continue
            <ArrowRightIcon className="transition-transform group-hover/button:translate-x-0.5" />
          </>
        )}
      </Button>
    </form>
  )
}

export { ProfileForm }

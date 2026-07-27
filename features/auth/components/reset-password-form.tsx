"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { AlertCircleIcon, EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"

import { zodResolver } from "@/lib/forms/zod-resolver"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { useResetPasswordMutation } from "@/features/auth/hooks"
import {
  resetPasswordFormSchema,
  type ResetPasswordFormInput,
} from "@/features/auth/schemas"
import { PasswordStrength } from "@/features/auth/components/password-strength"

function ResetPasswordForm() {
  const [showPassword, setShowPassword] = React.useState(false)

  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    mode: "onBlur",
    defaultValues: { password: "", confirmPassword: "" },
  })

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = form

  const password = useWatch({ control, name: "password" })

  const mutation = useResetPasswordMutation({
    onError: (error) => {
      for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
        setError(field as keyof ResetPasswordFormInput, { message })
      }
    },
    onSuccess: () => window.location.assign("/auth/reset-password/success"),
  })

  const onSubmit = handleSubmit((values) =>
    mutation.mutate({ password: values.password })
  )

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

      <FieldGroup>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              disabled={isBusy}
              className="h-10 pr-10"
              {...register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute top-1/2 right-1.5 -translate-y-1/2"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          </div>
          <PasswordStrength password={password ?? ""} />
          <p className="text-xs text-muted-foreground">
            At least 8 characters, with an uppercase letter, a lowercase letter
            and a number.
          </p>
          <FieldError
            errors={errors.password ? [errors.password] : undefined}
          />
        </Field>

        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">
            Confirm new password
          </FieldLabel>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            disabled={isBusy}
            className="h-10"
            {...register("confirmPassword")}
          />
          <FieldError
            errors={
              errors.confirmPassword ? [errors.confirmPassword] : undefined
            }
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
            Updating…
          </>
        ) : (
          "Set new password"
        )}
      </Button>
    </form>
  )
}

export { ResetPasswordForm }

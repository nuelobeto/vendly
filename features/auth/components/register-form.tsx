"use client"

import * as React from "react"
import Link from "next/link"
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
import { useRegisterMutation } from "@/features/auth/hooks"
import {
  registerFormSchema,
  safeNext,
  type RegisterFormInput,
} from "@/features/auth/schemas"
import { PasswordStrength } from "@/features/auth/components/password-strength"

function RegisterForm({ next }: { next?: string }) {
  const [showPassword, setShowPassword] = React.useState(false)

  const form = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "", confirmPassword: "" },
  })

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = form

  // useWatch rather than form.watch(): it's a real hook, so it subscribes to
  // just this field and doesn't opt the component out of React Compiler.
  const password = useWatch({ control, name: "password" })

  const mutation = useRegisterMutation({
    onError: (error) => {
      for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
        setError(field as keyof RegisterFormInput, { message })
      }
    },
    onSuccess: (data) => {
      const params = new URLSearchParams({ email: data.email })
      const target = safeNext(next)
      if (target) params.set("next", target)

      // Full navigation so the success page reads fresh cookies from the proxy.
      window.location.assign(`/auth/register/success?${params.toString()}`)
    },
  })

  const onSubmit = handleSubmit((values) => {
    mutation.mutate({ email: values.email, password: values.password })
  })

  // Stays true through the success redirect so the button never flicks back.
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
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            disabled={isBusy}
            className="h-10"
            {...register("email")}
          />
          <FieldError errors={errors.email ? [errors.email] : undefined} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby="password-requirements"
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
          <p
            id="password-requirements"
            className="text-xs text-muted-foreground"
          >
            At least 8 characters, with an uppercase letter, a lowercase letter
            and a number.
          </p>
          <FieldError
            errors={errors.password ? [errors.password] : undefined}
          />
        </Field>

        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
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
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By creating an account you agree to Vendly&apos;s{" "}
        <Link href="#" className="underline underline-offset-4">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  )
}

export { RegisterForm }

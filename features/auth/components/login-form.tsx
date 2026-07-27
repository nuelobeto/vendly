"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
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
import { useLoginMutation } from "@/features/auth/hooks"
import { loginSchema, safeNext, type LoginInput } from "@/features/auth/schemas"

function LoginForm({ next }: { next?: string }) {
  const [showPassword, setShowPassword] = React.useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  })

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = form

  const mutation = useLoginMutation({
    onError: (error) => {
      for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
        setError(field as keyof LoginInput, { message })
      }
    },
    // Full navigation so the destination renders with the new session cookies.
    onSuccess: (data) => window.location.assign(data.redirectTo),
  })

  const onSubmit = handleSubmit((values) =>
    mutation.mutate({ ...values, next: safeNext(next) })
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
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/auth/forgot-password"
              className="rounded-sm text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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
          <FieldError
            errors={errors.password ? [errors.password] : undefined}
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
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  )
}

export { LoginForm }

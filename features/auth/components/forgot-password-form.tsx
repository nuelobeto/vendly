"use client"

import { useForm } from "react-hook-form"
import { AlertCircleIcon, Loader2Icon } from "lucide-react"

import { zodResolver } from "@/lib/forms/zod-resolver"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { useForgotPasswordMutation } from "@/features/auth/hooks"
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/features/auth/schemas"

function ForgotPasswordForm() {
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    defaultValues: { email: "" },
  })

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = form

  const mutation = useForgotPasswordMutation({
    onError: (error) => {
      for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
        setError(field as keyof ForgotPasswordInput, { message })
      }
    },
    onSuccess: () => {
      // The success page never echoes the address back — see the page comment.
      window.location.assign("/auth/forgot-password/success")
    },
  })

  const onSubmit = handleSubmit((values) => mutation.mutate(values))
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

      <Button
        type="submit"
        size="lg"
        disabled={isBusy}
        className="h-11 w-full rounded-xl text-base"
      >
        {isBusy ? (
          <>
            <Loader2Icon className="animate-spin" />
            Sending…
          </>
        ) : (
          "Send reset link"
        )}
      </Button>
    </form>
  )
}

export { ForgotPasswordForm }

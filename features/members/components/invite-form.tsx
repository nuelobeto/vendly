"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import {
  AlertCircleIcon,
  CheckIcon,
  CopyIcon,
  Loader2Icon,
  MailCheckIcon,
} from "lucide-react"

import { zodResolver } from "@/lib/forms/zod-resolver"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { useCreateInviteMutation } from "@/features/members/hooks"
import { INVITABLE_ROLES, inviteSchema } from "@/features/members/schemas"
import type { InviteInput } from "@/features/members/schemas"

type Result =
  | { emailed: true; email: string }
  // The link surfaces only when delivery failed — it's then the last way to
  // hand the invite over, since the row already blocks re-inviting that address.
  | { emailed: false; email: string; url: string }

function InviteForm() {
  const router = useRouter()
  const [result, setResult] = React.useState<Result | null>(null)
  const [copied, setCopied] = React.useState(false)

  const form = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    mode: "onBlur",
    defaultValues: { email: "", role: "staff" },
  })

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = form

  const mutation = useCreateInviteMutation({
    onError: (error) => {
      for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
        setError(field as keyof InviteInput, { message })
      }
    },
    onSuccess: (data) => {
      const { email, emailed, url } = data.invite

      setResult(
        emailed || !url
          ? { emailed: true, email }
          : { emailed: false, email, url }
      )
      setCopied(false)
      reset({ email: "", role: "staff" })
      router.refresh()
    },
  })

  const onSubmit = handleSubmit((values) => mutation.mutate(values))

  async function copyLink() {
    if (!result || result.emailed) return
    await navigator.clipboard.writeText(result.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-3 sm:flex-row sm:items-start"
      >
        <Field data-invalid={!!errors.email} className="flex-1">
          <FieldLabel htmlFor="invite-email" className="sr-only">
            Email address
          </FieldLabel>
          <Input
            id="invite-email"
            type="email"
            autoComplete="off"
            placeholder="teammate@example.com"
            aria-invalid={!!errors.email}
            disabled={mutation.isPending}
            className="h-10"
            {...register("email")}
          />
          <FieldError errors={errors.email ? [errors.email] : undefined} />
        </Field>

        <Field className="sm:w-40">
          <FieldLabel htmlFor="invite-role" className="sr-only">
            Role
          </FieldLabel>
          <NativeSelect
            id="invite-role"
            disabled={mutation.isPending}
            className="h-10"
            {...register("role")}
          >
            {INVITABLE_ROLES.map((role) => (
              <NativeSelectOption key={role.value} value={role.value}>
                {role.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Button
          type="submit"
          size="lg"
          disabled={mutation.isPending}
          className="h-10 rounded-xl sm:w-auto"
        >
          {mutation.isPending ? (
            <>
              <Loader2Icon className="animate-spin" />
              Inviting…
            </>
          ) : (
            "Send invite"
          )}
        </Button>
      </form>

      {mutation.isError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{mutation.error.message}</span>
        </div>
      ) : null}

      {result?.emailed ? (
        <p
          aria-live="polite"
          className="flex items-center gap-2 rounded-lg bg-brand-subtle p-3 text-sm ring-1 ring-primary/15"
        >
          <MailCheckIcon className="size-4 shrink-0 text-primary" />
          <span>
            Invite sent to <span className="font-medium">{result.email}</span>.
            It expires in 7 days.
          </span>
        </p>
      ) : null}

      {result && !result.emailed ? (
        <div
          aria-live="polite"
          className="flex flex-col gap-2 rounded-lg bg-destructive/10 p-3 ring-1 ring-destructive/20"
        >
          <p className="text-sm text-destructive">
            Invite created for{" "}
            <span className="font-medium">{result.email}</span>, but the email
            couldn&apos;t be sent. Share this link instead —{" "}
            <strong>it&apos;s shown only once</strong>.
          </p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={result.url}
              onFocus={(event) => event.currentTarget.select()}
              className="h-9 font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyLink}
              className="h-9 shrink-0 rounded-lg"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export { InviteForm }

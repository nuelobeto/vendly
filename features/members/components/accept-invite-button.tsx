"use client"

import { AlertCircleIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAcceptInviteMutation } from "@/features/members/hooks"

function AcceptInviteButton({ token }: { token: string }) {
  const mutation = useAcceptInviteMutation({
    // Full navigation so the dashboard renders with the new membership.
    onSuccess: () => window.location.assign("/dashboard"),
  })

  const isBusy = mutation.isPending || mutation.isSuccess

  return (
    <div className="flex flex-col gap-3">
      {mutation.isError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-left text-sm text-destructive"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{mutation.error.message}</span>
        </div>
      ) : null}

      <Button
        type="button"
        size="lg"
        disabled={isBusy}
        onClick={() => mutation.mutate(token)}
        className="h-11 w-full rounded-xl text-base"
      >
        {isBusy ? (
          <>
            <Loader2Icon className="animate-spin" />
            Joining…
          </>
        ) : (
          "Join this store"
        )}
      </Button>
    </div>
  )
}

export { AcceptInviteButton }

"use client"

import { useRouter } from "next/navigation"
import { Loader2Icon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useRevokeInviteMutation } from "@/features/members/hooks"

function InviteRowActions({ inviteId }: { inviteId: string }) {
  const router = useRouter()
  const mutation = useRevokeInviteMutation({
    onSuccess: () => router.refresh(),
  })

  return (
    <div className="flex items-center gap-2">
      {mutation.isError ? (
        <span role="alert" className="text-xs text-destructive">
          {mutation.error.message}
        </span>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate(inviteId)}
        className="h-8 rounded-lg"
      >
        {mutation.isPending ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <XIcon />
        )}
        Revoke
      </Button>
    </div>
  )
}

export { InviteRowActions }

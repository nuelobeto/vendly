"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useDeleteProductMutation } from "@/features/products/hooks"

/**
 * Only rendered for owners and admins. RLS refuses everyone else regardless —
 * this just avoids showing a button that would always fail.
 */
function DeleteProduct({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  const mutation = useDeleteProductMutation({
    onSuccess: () => {
      router.push("/dashboard/products")
      router.refresh()
    },
  })

  const isBusy = mutation.isPending || mutation.isSuccess

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="destructive"
            size="lg"
            className="h-11 rounded-xl"
          />
        }
      >
        <Trash2Icon />
        Delete
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {title}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the product, its options, variants and image records.
            It can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {mutation.isError ? (
          <p role="alert" className="px-4 text-sm text-destructive">
            {mutation.error.message}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            nativeButton
            disabled={isBusy}
            onClick={(event) => {
              // Keep the dialog open so a failure is visible rather than
              // vanishing along with the dialog.
              event.preventDefault()
              mutation.mutate(id)
            }}
          >
            {isBusy ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
            Delete product
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { DeleteProduct }

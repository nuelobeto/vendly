"use client"

import * as React from "react"
import { CameraIcon, Loader2Icon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useUploadAvatarMutation } from "@/features/onboarding/hooks"
import { AVATAR_MIME_TYPES } from "@/features/onboarding/schemas"

function AvatarUpload({
  userId,
  value,
  onChange,
  disabled,
}: {
  userId: string
  value: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [error, setError] = React.useState<string | null>(null)
  // Shown immediately on pick so the image doesn't pop in after the round trip.
  const [preview, setPreview] = React.useState<string | null>(null)

  const upload = useUploadAvatarMutation({
    onSuccess: (result) => onChange(result.publicUrl),
    onError: (uploadError) => {
      setError(uploadError.message)
      setPreview(null)
    },
  })

  // Object URLs are leaked unless explicitly revoked.
  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const shown = preview ?? value
  const isBusy = upload.isPending || disabled

  function pick(file: File | undefined) {
    if (!file) return
    setError(null)
    setPreview(URL.createObjectURL(file))
    upload.mutate({ file, userId })
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div
          className={cn(
            "flex size-24 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border",
            isBusy && "opacity-60"
          )}
        >
          {shown ? (
            // Supabase Storage host isn't configured for next/image, and this
            // is a single small avatar — a plain img is the right call here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shown}
              alt=""
              className="size-full object-cover"
              width={96}
              height={96}
            />
          ) : (
            <CameraIcon className="size-7 text-muted-foreground" />
          )}
        </div>

        {upload.isPending ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2Icon className="size-6 animate-spin text-primary" />
          </div>
        ) : null}

        {shown && !upload.isPending ? (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={isBusy}
            onClick={() => {
              setPreview(null)
              onChange(null)
              if (inputRef.current) inputRef.current.value = ""
            }}
            className="absolute right-0 bottom-0 rounded-full"
          >
            <XIcon />
            <span className="sr-only">Remove photo</span>
          </Button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_MIME_TYPES.join(",")}
        className="sr-only"
        id="avatar"
        disabled={isBusy}
        onChange={(event) => pick(event.target.files?.[0])}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isBusy}
        onClick={() => inputRef.current?.click()}
        className="h-8 rounded-lg"
      >
        {upload.isPending
          ? "Uploading…"
          : shown
            ? "Change photo"
            : "Add a photo"}
      </Button>

      {error ? (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Optional · JPG, PNG or WebP · max 2 MB
        </p>
      )}
    </div>
  )
}

export { AvatarUpload }

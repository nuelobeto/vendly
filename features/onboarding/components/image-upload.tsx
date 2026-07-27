"use client"

import * as React from "react"
import { ImageIcon, Loader2Icon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useUploadImageMutation } from "@/features/onboarding/hooks"
import {
  IMAGE_MIME_TYPES,
  type UploadBucket,
} from "@/features/onboarding/schemas"

/**
 * Shared picker + preview + upload for avatars, store logos and store banners.
 * The only differences between them are the bucket, the crop shape and the
 * copy — all props.
 */
function ImageUpload({
  bucket,
  userId,
  value,
  onChange,
  disabled,
  shape = "circle",
  icon,
  addLabel = "Add an image",
  changeLabel = "Change image",
  hint,
}: {
  bucket: UploadBucket
  userId: string
  value: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
  shape?: "circle" | "square" | "wide"
  icon?: React.ReactNode
  addLabel?: string
  changeLabel?: string
  hint?: string
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [error, setError] = React.useState<string | null>(null)
  // Shown immediately on pick so the image doesn't pop in after the round trip.
  const [preview, setPreview] = React.useState<string | null>(null)

  const upload = useUploadImageMutation({
    onSuccess: (result) => onChange(result.publicUrl),
    onError: (uploadError) => {
      setError(uploadError.message)
      setPreview(null)
    },
  })

  // Object URLs leak unless explicitly revoked.
  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const shown = preview ?? value
  const isBusy = upload.isPending || disabled
  const inputId = `image-upload-${bucket}`

  const isWide = shape === "wide"

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        isWide ? "w-full items-stretch" : "items-center"
      )}
    >
      <div className={cn("relative", isWide && "w-full")}>
        <div
          className={cn(
            "flex items-center justify-center overflow-hidden bg-muted ring-1 ring-border",
            shape === "circle" && "size-24 rounded-full",
            shape === "square" && "size-24 rounded-2xl",
            // 3:1 mirrors how a storefront header actually renders.
            isWide && "aspect-3/1 w-full rounded-xl",
            isBusy && "opacity-60"
          )}
        >
          {shown ? (
            // Supabase Storage isn't configured as a next/image host, and
            // these are single small images — a plain img is the right call.
            // Intrinsic size is left off: the container fixes the box, and a
            // hardcoded 96x96 would be a lie for the 3:1 banner.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="size-full object-cover" />
          ) : (
            (icon ?? <ImageIcon className="size-7 text-muted-foreground" />)
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
            <span className="sr-only">Remove image</span>
          </Button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={IMAGE_MIME_TYPES[bucket].join(",")}
        className="sr-only"
        disabled={isBusy}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) return
          setError(null)
          setPreview(URL.createObjectURL(file))
          upload.mutate({ file, userId, bucket })
        }}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isBusy}
        onClick={() => inputRef.current?.click()}
        className={cn("h-8 rounded-lg", isWide && "self-center")}
      >
        {upload.isPending ? "Uploading…" : shown ? changeLabel : addLabel}
      </Button>

      {error ? (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p
          className={cn(
            "text-xs text-muted-foreground",
            isWide && "text-center"
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export { ImageUpload }

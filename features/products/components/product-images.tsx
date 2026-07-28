"use client"

import * as React from "react"
import { ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export type DraftImage = { url: string; storageKey?: string }

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/avif"]

/**
 * Uploads straight to Storage, like the avatar and logo pickers.
 *
 * Objects are keyed `<store-id>/…` rather than by user: a catalogue image
 * belongs to the store, so any member must be able to replace one a colleague
 * uploaded. The bucket's RLS enforces exactly that.
 */
function ProductImages({
  storeId,
  images,
  onChange,
  disabled,
}: {
  storeId: string
  images: DraftImage[]
  onChange: (images: DraftImage[]) => void
  disabled?: boolean
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    setBusy(true)

    const supabase = createClient()
    const uploaded: DraftImage[] = []

    for (const file of Array.from(files)) {
      if (!ACCEPT.includes(file.type)) {
        setError("Use JPG, PNG, WebP or AVIF images.")
        continue
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is larger than 5 MB.`)
        continue
      }

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
      const path = `${storeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type })

      if (uploadError) {
        setError("Could not upload that image. Please try again.")
        continue
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(path)

      uploaded.push({ url: publicUrl, storageKey: path })
    }

    setBusy(false)
    if (inputRef.current) inputRef.current.value = ""
    if (uploaded.length) onChange([...images, ...uploaded])
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {images.map((image, index) => (
          <div key={image.url} className="relative">
            <span className="flex size-24 items-center justify-center overflow-hidden rounded-xl bg-muted ring-1 ring-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="size-full object-cover" />
            </span>
            {index === 0 ? (
              <span className="absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                Featured
              </span>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={disabled || busy}
              onClick={() => onChange(images.filter((_, i) => i !== index))}
              className="absolute right-0 bottom-0 rounded-full border-primary text-primary ring-primary hover:text-primary"
            >
              <XIcon />
              <span className="sr-only">Remove image</span>
            </Button>
          </div>
        ))}

        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="flex size-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-xs text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60"
        >
          {busy ? (
            <Loader2Icon className="size-5 animate-spin" />
          ) : (
            <ImagePlusIcon className="size-5" />
          )}
          {busy ? "Uploading" : "Add"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT.join(",")}
        className="sr-only"
        disabled={disabled || busy}
        onChange={(event) => upload(event.target.files)}
      />

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WebP or AVIF · max 5 MB each
        </p>
      )}
    </div>
  )
}

export { ProductImages }

"use client"

import { useState, useEffect, useCallback } from "react"
import { ImageOff, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type MediaImageProps = {
  mediaId?: string | null
  fallbackUrl?: string | null
  alt: string
  className?: string
  aspectRatio?: string
  fill?: boolean
  width?: number
  height?: number
  objectFit?: "cover" | "contain"
  placeholder?: "blur" | "shimmer"
  onLoad?: () => void
  onError?: () => void
}

type ResolvedState =
  | { status: "loading" }
  | { status: "resolved"; url: string }
  | { status: "error" }

const PROXY_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL
const PROXY_KEY = process.env.NEXT_PUBLIC_MEDIA_PROXY_KEY

function buildProxyUrl(mediaId: string): string {
  return `${PROXY_BASE}/functions/v1/media-proxy?id=${mediaId}&key=${PROXY_KEY}`
}

export function MediaImage({
  mediaId,
  fallbackUrl,
  alt,
  className,
  aspectRatio,
  fill,
  width,
  height,
  objectFit = "cover",
  placeholder = "shimmer",
  onLoad,
  onError,
}: MediaImageProps) {
  const [state, setState] = useState<ResolvedState>({ status: "loading" })
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const resolveUrl = useCallback(async () => {
    setState({ status: "loading" })
    setImgLoaded(false)
    setImgError(false)

    // No mediaId — use fallback directly
    if (!mediaId) {
      if (fallbackUrl) {
        setState({ status: "resolved", url: fallbackUrl })
      } else {
        setState({ status: "error" })
      }
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("media_files")
        .select("status, storage_bucket, storage_path, google_drive_file_id")
        .eq("id", mediaId)
        .single()

      if (error || !data) {
        // Fallback if lookup fails
        if (fallbackUrl) {
          setState({ status: "resolved", url: fallbackUrl })
        } else {
          setState({ status: "error" })
        }
        return
      }

      if (data.status === "active" && data.storage_bucket && data.storage_path) {
        // Active — serve from Supabase Storage
        const { data: urlData } = supabase.storage
          .from(data.storage_bucket)
          .getPublicUrl(data.storage_path)
        setState({ status: "resolved", url: urlData.publicUrl })
      } else if (data.status === "exported" && data.google_drive_file_id) {
        // Exported — serve via proxy
        setState({ status: "resolved", url: buildProxyUrl(mediaId) })
      } else if (fallbackUrl) {
        setState({ status: "resolved", url: fallbackUrl })
      } else {
        setState({ status: "error" })
      }
    } catch {
      if (fallbackUrl) {
        setState({ status: "resolved", url: fallbackUrl })
      } else {
        setState({ status: "error" })
      }
    }
  }, [mediaId, fallbackUrl])

  useEffect(() => {
    resolveUrl()
  }, [resolveUrl, retryCount])

  const handleRetry = () => {
    setRetryCount((c) => c + 1)
  }

  const handleImgLoad = () => {
    setImgLoaded(true)
    onLoad?.()
  }

  const handleImgError = () => {
    setImgError(true)
    onError?.()
  }

  // Nothing to render
  if (!mediaId && !fallbackUrl) {
    return null
  }

  const containerStyle: React.CSSProperties = {
    ...(width && !fill ? { width } : {}),
    ...(height && !fill ? { height } : {}),
  }

  const imgStyle: React.CSSProperties = {
    objectFit,
    ...(fill ? { position: "absolute" as const, inset: 0, width: "100%", height: "100%" } : {}),
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[var(--color-bg-secondary,#F5F0E8)]",
        fill && "relative w-full h-full",
        aspectRatio,
        className,
      )}
      style={containerStyle}
      data-testid="media-image"
    >
      {/* Loading placeholder */}
      {(state.status === "loading" || (state.status === "resolved" && !imgLoaded && !imgError)) && (
        <div
          className={cn(
            "absolute inset-0",
            placeholder === "shimmer"
              ? "animate-pulse bg-[var(--color-bg-secondary,#F5F0E8)]"
              : "bg-[var(--color-bg-secondary,#F5F0E8)] backdrop-blur-sm",
          )}
          data-testid="media-placeholder"
        />
      )}

      {/* Resolved image */}
      {state.status === "resolved" && !imgError && (
        <img
          src={state.url}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          loading="lazy"
          className={cn(
            "transition-opacity duration-300",
            imgLoaded ? "opacity-100" : "opacity-0",
            fill ? "absolute inset-0 w-full h-full" : "w-full h-full",
          )}
          style={imgStyle}
          onLoad={handleImgLoad}
          onError={handleImgError}
          data-testid="media-img"
        />
      )}

      {/* Error state */}
      {(state.status === "error" || imgError) && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--color-bg-secondary,#F5F0E8)]"
          data-testid="media-error"
        >
          <ImageOff className="h-6 w-6 text-[var(--color-text-secondary,#8C8279)]" />
          <button
            onClick={handleRetry}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-[var(--color-text-secondary,#8C8279)] hover:bg-[var(--color-border-subtle,rgba(44,40,37,0.08))]"
            data-testid="media-retry-btn"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, SwitchCamera, X } from "lucide-react"
import { useSnap } from "@/lib/hooks/use-snap"
import { useAuth } from "@/lib/providers/AuthProvider"
import { uploadMedia } from "@/lib/media-upload"
import { cn } from "@/lib/utils"
import { MAX_CAPTION_LENGTH, SNAP_WINDOW_SECONDS } from "@/lib/types/snap.types"

type CaptureState =
  | "camera"
  | "preview"
  | "uploading"
  | "done"
  | "error"
  | "permission_denied"

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function CameraCapture() {
  const { user } = useAuth()
  const { todaySnap, isWindowOpen, windowTimeRemaining, submitSnap, error: snapError } = useSnap()

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [captureState, setCaptureState] = useState<CaptureState>("camera")
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [retakeUsed, setRetakeUsed] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const hasGetUserMedia =
    typeof navigator !== "undefined" &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function"

  // ── Start camera ────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (!hasGetUserMedia) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1200 }, height: { ideal: 1200 } },
        audio: false,
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      streamRef.current = stream
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setCaptureState("permission_denied")
      } else {
        setCaptureState("error")
      }
    }
  }, [facingMode, hasGetUserMedia])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  // Start camera on mount and when facingMode changes
  useEffect(() => {
    if (captureState === "camera") {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [captureState, startCamera, stopCamera])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // ── Toggle camera ───────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    stopCamera()
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }, [stopCamera])

  // ── Capture frame ───────────────────────────────────────────
  const captureFrame = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob)
          setPreviewUrl(URL.createObjectURL(blob))
          setCaptureState("preview")
          stopCamera()
        }
      },
      "image/jpeg",
      0.9
    )
  }, [stopCamera])

  // ── Handle file input (desktop fallback) ────────────────────
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setCapturedBlob(file)
      setPreviewUrl(URL.createObjectURL(file))
      setCaptureState("preview")
    },
    []
  )

  // ── Retake ──────────────────────────────────────────────────
  const handleRetake = useCallback(() => {
    setRetakeUsed(true)
    setCapturedBlob(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setCaptureState("camera")
  }, [previewUrl])

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!capturedBlob || !user) return

    setCaptureState("uploading")
    setUploadError(null)

    const file = new File([capturedBlob], "snap.jpg", { type: "image/jpeg" })

    const result = await uploadMedia({
      file,
      userId: user.id,
      bucket: "snap-photos",
      sourceTable: "snaps",
      sourceColumn: "photo_url",
      sourceRowId: todaySnap?.id ?? crypto.randomUUID(),
      maxWidth: 1200,
      maxHeight: 1200,
    })

    if ("error" in result) {
      setUploadError(result.error)
      setCaptureState("error")
      return
    }

    await submitSnap(result.url, caption || undefined)
    setCaptureState("done")
  }, [capturedBlob, user, todaySnap, submitSnap, caption])

  // ── Determine if window is late ─────────────────────────────
  const isLate = windowTimeRemaining !== null && windowTimeRemaining <= 0

  // ── Render: Permission denied ───────────────────────────────
  if (captureState === "permission_denied") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background-primary gap-4 p-6">
        <Camera className="h-12 w-12 text-text-secondary" />
        <h2 className="text-lg font-display text-text-primary text-center">
          Camera Access Needed
        </h2>
        <p className="text-sm text-text-secondary text-center max-w-xs">
          Please allow camera access in your browser settings to take your snap.
        </p>
      </div>
    )
  }

  // ── Render: Done ────────────────────────────────────────────
  if (captureState === "done") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background-primary gap-4 p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="h-20 w-20 rounded-full bg-accent-primary flex items-center justify-center"
        >
          <span className="text-3xl">📸</span>
        </motion.div>
        <h2 className="text-lg font-display text-text-primary">Snap Sent!</h2>
      </div>
    )
  }

  // ── Render: Error ───────────────────────────────────────────
  if (captureState === "error") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background-primary gap-4 p-6">
        <X className="h-12 w-12 text-red-500" />
        <h2 className="text-lg font-display text-text-primary">Something went wrong</h2>
        <p className="text-sm text-text-secondary text-center max-w-xs">
          {uploadError ?? snapError ?? "Failed to take snap. Please try again."}
        </p>
        <button
          onClick={() => setCaptureState("camera")}
          className="px-6 py-2 rounded-full bg-accent-primary text-white text-sm font-body"
        >
          Try Again
        </button>
      </div>
    )
  }

  // ── Render: Preview ─────────────────────────────────────────
  if (captureState === "preview" && previewUrl) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        {/* Preview image */}
        <div className="flex-1 relative">
          <img
            src={previewUrl}
            alt="Snap preview"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Caption + Actions */}
        <div className="bg-background-primary p-4 space-y-3">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION_LENGTH))}
            placeholder="Add a caption..."
            maxLength={MAX_CAPTION_LENGTH}
            className="w-full bg-background-secondary rounded-lg p-3 text-sm text-text-primary placeholder:text-text-secondary resize-none h-16 font-body"
            aria-label="Caption"
          />
          <p className="text-xs text-text-secondary text-end">
            {caption.length}/{MAX_CAPTION_LENGTH}
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              disabled={retakeUsed}
              className={cn(
                "flex-1 py-3 rounded-full text-sm font-body border border-border-default",
                retakeUsed
                  ? "opacity-40 cursor-not-allowed text-text-secondary"
                  : "text-text-primary"
              )}
            >
              Retake
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-full bg-accent-primary text-white text-sm font-body"
            >
              Use This
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Uploading ───────────────────────────────────────
  if (captureState === "uploading") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background-primary gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 rounded-full border-2 border-accent-primary border-t-transparent"
        />
        <p className="text-sm text-text-secondary font-body">Sending your snap...</p>
      </div>
    )
  }

  // ── Render: Camera ──────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Camera feed */}
      <div className="flex-1 relative overflow-hidden">
        {hasGetUserMedia ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-background-secondary gap-4 p-6">
            <Camera className="h-12 w-12 text-text-secondary" />
            <p className="text-sm text-text-secondary text-center">
              Camera not available. Choose a photo instead.
            </p>
            <label className="px-6 py-2 rounded-full bg-accent-primary text-white text-sm font-body cursor-pointer">
              Choose Photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Choose photo"
              />
            </label>
          </div>
        )}

        {/* Rule-of-thirds grid */}
        <div className="absolute inset-0 pointer-events-none z-[2]" aria-hidden="true">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
        </div>

        {/* Top bar overlay */}
        <div className="absolute top-0 inset-x-0 p-4 flex items-start justify-between">
          {/* Camera toggle */}
          <button
            onClick={toggleCamera}
            className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
            aria-label="Switch camera"
          >
            <SwitchCamera className="h-5 w-5 text-white" />
          </button>

          {/* Timer */}
          {windowTimeRemaining !== null && (
            <div
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-mono backdrop-blur-sm",
                isLate
                  ? "bg-red-500/80 text-white"
                  : "bg-black/40 text-white"
              )}
            >
              {isLate ? "Late" : formatCountdown(windowTimeRemaining)}
            </div>
          )}
        </div>
      </div>

      {/* Bottom: capture button */}
      <div className="bg-black py-6 flex items-center justify-center">
        <button
          onClick={captureFrame}
          className="h-[72px] w-[72px] rounded-full border-4 border-[var(--accent-copper,#B87333)] bg-[var(--accent-copper,#B87333)]/20 active:bg-[var(--accent-copper,#B87333)]/40 transition-colors"
          aria-label="Take photo"
        />
      </div>
    </div>
  )
}

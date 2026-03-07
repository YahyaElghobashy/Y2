"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Camera, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { parsePairingCode } from "@/lib/pairing-link"

type QRCodeScannerProps = {
  onScan: (code: string) => void
  className?: string
}

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function QRCodeScanner({ onScan, className }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number>(0)

  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = 0
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const handleClose = useCallback(() => {
    stopCamera()
    setIsOpen(false)
    setError(null)
  }, [stopCamera])

  const startScanning = useCallback(async () => {
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Detect scanner method
      const useBarcodeDetector =
        typeof globalThis !== "undefined" && "BarcodeDetector" in globalThis

      if (useBarcodeDetector) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (globalThis as any).BarcodeDetector({
          formats: ["qr_code"],
        })
        const scan = async () => {
          if (!videoRef.current || !streamRef.current) return
          try {
            const barcodes = await detector.detect(videoRef.current)
            for (const barcode of barcodes) {
              const code = parsePairingCode(barcode.rawValue)
              if (code) {
                onScan(code)
                handleClose()
                return
              }
            }
          } catch {
            // detection failed, retry
          }
          animFrameRef.current = requestAnimationFrame(scan)
        }
        animFrameRef.current = requestAnimationFrame(scan)
      } else {
        // Fallback: jsQR
        const jsQR = (await import("jsqr")).default
        const canvas = canvasRef.current
        const ctx = canvas?.getContext("2d", { willReadFrequently: true })

        const scan = () => {
          if (!videoRef.current || !canvas || !ctx || !streamRef.current) return
          const video = videoRef.current
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const result = jsQR(imageData.data, imageData.width, imageData.height)
            if (result?.data) {
              const code = parsePairingCode(result.data)
              if (code) {
                onScan(code)
                handleClose()
                return
              }
            }
          }
          animFrameRef.current = requestAnimationFrame(scan)
        }
        animFrameRef.current = requestAnimationFrame(scan)
      }
    } catch {
      setError("Camera access denied. Please allow camera permission.")
    }
  }, [onScan, handleClose])

  useEffect(() => {
    if (isOpen) {
      startScanning()
    }
    return () => stopCamera()
  }, [isOpen, startScanning, stopCamera])

  return (
    <div className={className}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full gap-2 rounded-xl border-[var(--color-border-subtle)] py-3 font-body text-[14px] font-medium text-[var(--color-text-secondary)]"
        data-testid="scan-qr-btn"
      >
        <Camera size={18} />
        Scan QR Code
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            data-testid="scanner-overlay"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute end-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"
              data-testid="scanner-close"
            >
              <X size={20} />
            </button>

            {/* Title */}
            <p className="mb-6 font-body text-[16px] font-medium text-white">
              Scan partner&apos;s QR code
            </p>

            {/* Viewfinder */}
            <div className="relative h-[280px] w-[280px] overflow-hidden rounded-2xl" data-testid="scanner-viewfinder">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                playsInline
                muted
                data-testid="scanner-video"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Corner markers */}
              <div className="pointer-events-none absolute inset-0">
                {/* Top-left */}
                <div className="absolute start-0 top-0 h-8 w-8 border-s-3 border-t-3 border-[var(--color-accent-primary)] rounded-tl-lg" />
                {/* Top-right */}
                <div className="absolute end-0 top-0 h-8 w-8 border-e-3 border-t-3 border-[var(--color-accent-primary)] rounded-tr-lg" />
                {/* Bottom-left */}
                <div className="absolute bottom-0 start-0 h-8 w-8 border-b-3 border-s-3 border-[var(--color-accent-primary)] rounded-bl-lg" />
                {/* Bottom-right */}
                <div className="absolute bottom-0 end-0 h-8 w-8 border-b-3 border-e-3 border-[var(--color-accent-primary)] rounded-br-lg" />
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                className="mt-4 max-w-[280px] text-center font-body text-[13px] text-red-400"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                data-testid="scanner-error"
              >
                {error}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

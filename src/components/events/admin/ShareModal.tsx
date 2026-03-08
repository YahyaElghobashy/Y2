"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Copy, Check, Share2, MessageCircle, QrCode } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type Props = {
  isOpen: boolean
  onClose: () => void
  portalTitle: string
  portalSlug: string
}

export function ShareModal({ isOpen, onClose, portalTitle, portalSlug }: Props) {
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/e/${portalSlug}`
    : `/e/${portalSlug}`

  // Generate QR code
  useEffect(() => {
    if (!isOpen || !showQR) return

    let cancelled = false

    async function generate() {
      try {
        const QRCode = await import("qrcode")
        const dataUrl = await QRCode.toDataURL(shareUrl, {
          width: 200,
          margin: 2,
          color: { dark: "#2C2825", light: "#FFFFFF" },
          errorCorrectionLevel: "M",
        })
        if (!cancelled) setQrDataUrl(dataUrl)
      } catch {
        // Silently fail
      }
    }

    generate()
    return () => { cancelled = true }
  }, [isOpen, showQR, shareUrl])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }, [shareUrl])

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: portalTitle,
          text: `Check out ${portalTitle}`,
          url: shareUrl,
        })
      } catch {
        // User cancelled
      }
    } else {
      handleCopy()
    }
  }, [portalTitle, shareUrl, handleCopy])

  const handleWhatsApp = useCallback(() => {
    const text = encodeURIComponent(`${portalTitle}: ${shareUrl}`)
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer")
  }, [portalTitle, shareUrl])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setCopied(false)
      setShowQR(false)
      setQrDataUrl(null)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            data-testid="share-backdrop"
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md overflow-hidden rounded-2xl bg-white shadow-xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            data-testid="share-modal"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold">Share Portal</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 hover:bg-gray-100"
                data-testid="share-close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 px-5 py-4">
              {/* URL bar + copy */}
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 truncate rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600"
                  data-testid="share-url"
                >
                  {shareUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                  data-testid="share-copy"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Share options */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors hover:bg-gray-50"
                  data-testid="share-whatsapp"
                >
                  <MessageCircle className="h-6 w-6 text-green-600" />
                  <span className="text-xs font-medium">WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors hover:bg-gray-50"
                  data-testid="share-native"
                >
                  <Share2 className="h-6 w-6 text-blue-600" />
                  <span className="text-xs font-medium">Share</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQR(!showQR)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors ${
                    showQR ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                  data-testid="share-qr-toggle"
                >
                  <QrCode className="h-6 w-6 text-purple-600" />
                  <span className="text-xs font-medium">QR Code</span>
                </button>
              </div>

              {/* QR Code */}
              <AnimatePresence>
                {showQR && (
                  <motion.div
                    className="flex flex-col items-center gap-3 rounded-xl bg-gray-50 p-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    data-testid="share-qr-section"
                  >
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt={`QR code for ${portalTitle}`}
                        width={200}
                        height={200}
                        className="rounded-lg"
                        data-testid="share-qr-image"
                      />
                    ) : (
                      <div
                        className="h-[200px] w-[200px] animate-pulse rounded-lg bg-gray-200"
                        data-testid="share-qr-loading"
                      />
                    )}
                    <p className="text-center text-xs text-gray-500">
                      Scan to view portal
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

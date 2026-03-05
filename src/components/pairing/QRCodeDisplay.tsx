"use client"

import { useEffect, useState } from "react"
import { Copy, Share2, Check } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { generatePairingLink } from "@/lib/pairing-link"

type QRCodeDisplayProps = {
  code: string | null
  className?: string
}

export function QRCodeDisplay({ code, className }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!code) return

    let cancelled = false

    async function generate() {
      try {
        const QRCode = await import("qrcode")
        const url = generatePairingLink(code!)
        const dataUrl = await QRCode.toDataURL(url, {
          width: 200,
          margin: 2,
          color: {
            dark: "#C4956A",
            light: "#FBF8F4",
          },
          errorCorrectionLevel: "M",
        })
        if (!cancelled) setQrDataUrl(dataUrl)
      } catch {
        // QR generation failed silently
      }
    }

    generate()
    return () => { cancelled = true }
  }, [code])

  if (!code) {
    return (
      <div className={className} data-testid="qr-display-loading">
        <div className="flex flex-col items-center gap-3">
          <div className="h-[200px] w-[200px] animate-pulse rounded-2xl bg-[var(--color-bg-secondary)]" />
        </div>
      </div>
    )
  }

  const pairingLink = generatePairingLink(code)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pairingLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback silently
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Hayah",
          text: `Join me on Hayah! Use my invite code: ${code}`,
          url: pairingLink,
        })
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className={className} data-testid="qr-display">
      <div className="flex flex-col items-center gap-4">
        {/* QR Code */}
        <motion.div
          className="overflow-hidden rounded-2xl bg-[var(--color-bg-elevated)] p-3 shadow-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code for pairing link`}
              width={200}
              height={200}
              className="block"
              data-testid="qr-image"
            />
          ) : (
            <div
              className="h-[200px] w-[200px] animate-pulse rounded-xl bg-[var(--color-bg-secondary)]"
              data-testid="qr-generating"
            />
          )}
        </motion.div>

        {/* Code display */}
        <p
          className="font-[family-name:var(--font-mono)] text-[28px] font-bold tracking-[0.3em] text-[var(--color-accent-primary)]"
          data-testid="qr-code-text"
        >
          {code}
        </p>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2 rounded-xl border-[var(--color-border-subtle)] font-[family-name:var(--font-body)]"
            data-testid="qr-copy-btn"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-2 rounded-xl border-[var(--color-border-subtle)] font-[family-name:var(--font-body)]"
            data-testid="qr-share-btn"
          >
            <Share2 size={16} />
            Share
          </Button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Copy, Share2, Check } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

type InviteCodeDisplayProps = {
  code: string | null
  className?: string
}

export function InviteCodeDisplay({ code, className }: InviteCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  if (!code) {
    return (
      <div className={className}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-32 animate-pulse rounded bg-[var(--color-bg-secondary)]" />
          <div className="h-10 w-48 animate-pulse rounded bg-[var(--color-bg-secondary)]" />
          <div className="flex gap-3">
            <div className="h-10 w-24 animate-pulse rounded-xl bg-[var(--color-bg-secondary)]" />
            <div className="h-10 w-24 animate-pulse rounded-xl bg-[var(--color-bg-secondary)]" />
          </div>
        </div>
      </div>
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text approach
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Hayah Invite Code",
          text: `Join me on Hayah! Use my invite code: ${code}`,
        })
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-4">
        <p className="font-[family-name:var(--font-body)] text-[14px] text-[var(--color-text-secondary)]">
          Your invite code
        </p>
        <motion.p
          className="font-[family-name:var(--font-mono)] text-[32px] font-bold tracking-[0.3em] text-[var(--color-accent-primary)]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          data-testid="invite-code"
        >
          {code}
        </motion.p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2 rounded-xl border-[var(--color-border-subtle)] font-[family-name:var(--font-body)]"
            data-testid="copy-code-btn"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-2 rounded-xl border-[var(--color-border-subtle)] font-[family-name:var(--font-body)]"
            data-testid="share-code-btn"
          >
            <Share2 size={16} />
            Share
          </Button>
        </div>
      </div>
    </div>
  )
}

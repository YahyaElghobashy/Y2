"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Heart } from "lucide-react"
import { PageTransition } from "@/components/animations"
import { QRCodeDisplay } from "@/components/pairing/QRCodeDisplay"
import { QRCodeScanner } from "@/components/pairing/QRCodeScanner"
import { PairPartnerForm } from "@/components/pairing/PairPartnerForm"
import { useAuth } from "@/lib/providers/AuthProvider"

export default function PairPage() {
  const { profile, isLoading } = useAuth()
  const router = useRouter()

  // Redirect if already paired
  useEffect(() => {
    if (!isLoading && profile?.pairing_status === "paired") {
      router.replace("/")
    }
  }, [isLoading, profile, router])

  const handleScan = (code: string) => {
    router.push(`/pair/${code}`)
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="h-12 w-12 animate-pulse rounded-full bg-[var(--color-bg-secondary)]" />
      </main>
    )
  }

  if (profile?.pairing_status === "paired") {
    return null
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-primary)] px-5 pb-24">
      <PageTransition>
        <div className="flex w-full max-w-sm flex-col items-center gap-10">
          {/* Header */}
          <div className="flex flex-col items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
                <Heart size={28} className="text-[var(--color-accent-primary)]" />
              </div>
            </motion.div>
            <h1 className="font-display text-[26px] font-bold text-[var(--color-text-primary)]">
              Find your partner
            </h1>
            <p className="text-center font-body text-[14px] text-[var(--color-text-secondary)]">
              Share your QR code or scan theirs to connect
            </p>
          </div>

          {/* QR Code Display */}
          <QRCodeDisplay code={profile?.invite_code ?? null} />

          {/* Divider */}
          <div className="flex w-full items-center gap-4">
            <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
            <span className="font-body text-[12px] uppercase tracking-wider text-[var(--color-text-muted)]">
              or
            </span>
            <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
          </div>

          {/* QR Scanner */}
          <QRCodeScanner onScan={handleScan} />

          {/* Divider */}
          <div className="flex w-full items-center gap-4">
            <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
            <span className="font-body text-[12px] uppercase tracking-wider text-[var(--color-text-muted)]">
              or
            </span>
            <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
          </div>

          {/* Manual Code Entry */}
          <PairPartnerForm onPaired={() => router.replace("/")} />
        </div>
      </PageTransition>
    </main>
  )
}

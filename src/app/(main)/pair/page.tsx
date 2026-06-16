"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Heart } from "lucide-react"
import { PageTransition } from "@/components/animations"
import { QRCodeDisplay } from "@/components/pairing/QRCodeDisplay"
import { QRCodeScanner } from "@/components/pairing/QRCodeScanner"
import { PairPartnerForm } from "@/components/pairing/PairPartnerForm"
import { PairingCelebration } from "@/components/pairing/PairingCelebration"
import { useAuth } from "@/lib/providers/AuthProvider"

export default function PairPage() {
  const { profile, isLoading, refreshProfile } = useAuth()
  const router = useRouter()

  // The keepsake celebration to play once paired (null = not yet).
  const [celebrate, setCelebrate] = useState<{ a: string; b: string } | null>(null)

  // Redirect if already paired — but never while the celebration is playing,
  // or it would unmount the keepsake before it's seen.
  useEffect(() => {
    if (!isLoading && profile?.pairing_status === "paired" && !celebrate) {
      router.replace("/")
    }
  }, [isLoading, profile, router, celebrate])

  const handleScan = (code: string) => {
    router.push(`/pair/${code}`)
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-paper, #F7EFE3)" }}>
        <div className="h-12 w-12 animate-pulse rounded-full bg-[var(--color-sand,#EBDDC7)]" />
      </main>
    )
  }

  // Already paired (and not mid-celebration) → the effect above redirects.
  if (profile?.pairing_status === "paired" && !celebrate) {
    return null
  }

  return (
    <>
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pb-24" style={{ background: "var(--color-paper, #F7EFE3)" }}>
        {/* Golden-hour wash — the first warmth of finding each other */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: "radial-gradient(120% 60% at 50% -6%, rgba(242,169,59,0.18) 0%, rgba(232,205,174,0.08) 40%, transparent 70%)" }}
          aria-hidden="true"
        />
        <PageTransition>
          <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-10">
            {/* Header */}
            <div className="flex flex-col items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full shadow-warm-md" style={{ background: "radial-gradient(circle at 30% 25%, var(--color-amber,#F2A93B), var(--color-terracotta,#C8552B))" }}>
                  <Heart size={28} className="fill-current text-[var(--color-bg-warm-white,#FFFDF9)]" />
                </div>
              </motion.div>
              <h1 className="text-[28px] font-extrabold tracking-tight text-[var(--color-ink,#2A2018)]" style={{ fontFamily: "var(--font-display)" }}>
                Find your partner
              </h1>
              <p className="text-center text-[15px] text-[var(--color-ink-soft,#6B5D4F)]" style={{ fontFamily: "var(--font-serif)" }}>
                Share your QR code or scan theirs to connect
              </p>
            </div>

            {/* QR Code Display */}
            <QRCodeDisplay code={profile?.invite_code ?? null} />

            {/* Divider */}
            <div className="flex w-full items-center gap-4">
              <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
              <span className="font-nav text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                or
              </span>
              <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
            </div>

            {/* QR Scanner */}
            <QRCodeScanner onScan={handleScan} />

            {/* Divider */}
            <div className="flex w-full items-center gap-4">
              <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
              <span className="font-nav text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                or
              </span>
              <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
            </div>

            {/* Manual Code Entry */}
            <PairPartnerForm
              onPaired={(partnerName) =>
                setCelebrate({ a: profile?.display_name?.trim() || "You", b: partnerName })
              }
            />
          </div>
        </PageTransition>
      </main>

      {celebrate && (
        <PairingCelebration
          variant="seal"
          nameA={celebrate.a}
          nameB={celebrate.b}
          onDone={async () => {
            await refreshProfile()
            router.replace("/")
          }}
        />
      )}
    </>
  )
}

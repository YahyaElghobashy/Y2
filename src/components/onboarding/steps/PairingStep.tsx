"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/providers/AuthProvider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { InviteCodeDisplay } from "@/components/pairing/InviteCodeDisplay"
import { QRCodeDisplay } from "@/components/pairing/QRCodeDisplay"
import { PairPartnerForm } from "@/components/pairing/PairPartnerForm"
import { PairingCelebration } from "./PairingCelebration"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

type PairingStepProps = {
  onContinue: () => Promise<void>
  onSkip: () => Promise<void>
}

type PairingState = "unpaired" | "celebration"

export function PairingStep({ onContinue, onSkip }: PairingStepProps) {
  const { user, profile, partner, refreshProfile } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [pairingState, setPairingState] = useState<PairingState>(
    profile?.pairing_status === "paired" ? "celebration" : "unpaired"
  )

  // Realtime subscription to detect partner pairing
  useEffect(() => {
    if (!user || pairingState === "celebration") return

    const channel = supabase
      .channel("onboarding_pairing")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          const newProfile = payload.new as Record<string, unknown>
          if (newProfile.pairing_status === "paired") {
            await refreshProfile()
            setPairingState("celebration")
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, pairingState, supabase, refreshProfile])

  const handlePaired = useCallback(async () => {
    await refreshProfile()
    setPairingState("celebration")
  }, [refreshProfile])

  const userName = profile?.display_name || "You"
  const partnerName = partner?.display_name || "Your partner"

  if (pairingState === "celebration") {
    return (
      <PairingCelebration
        userName={userName}
        partnerName={partnerName}
        onContinue={onContinue}
      />
    )
  }

  return (
    <div className="flex w-full flex-col items-center gap-8" data-testid="pairing-step">
      {/* Header */}
      <motion.div
        className="flex flex-col items-center gap-2 text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
      >
        <h2
          className="font-[family-name:var(--font-display)] text-[22px] font-bold text-[var(--color-text-primary)]"
          data-testid="pairing-heading"
        >
          Find your partner
        </h2>
        <p className="font-[family-name:var(--font-body)] text-[14px] text-[var(--color-text-secondary)]">
          Share your code or enter theirs to connect
        </p>
      </motion.div>

      {/* Invite code + QR */}
      <motion.div
        className="flex w-full flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3, ease: EASE_OUT }}
      >
        <InviteCodeDisplay code={profile?.invite_code ?? null} />
        <QRCodeDisplay code={profile?.invite_code ?? null} />
      </motion.div>

      {/* Divider */}
      <div className="flex w-full max-w-xs items-center gap-4">
        <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
        <span className="font-[family-name:var(--font-body)] text-[12px] uppercase tracking-wider text-[var(--color-text-muted)]">
          or
        </span>
        <div className="h-px flex-1 bg-[var(--color-border-subtle)]" />
      </div>

      {/* Manual code entry */}
      <PairPartnerForm onPaired={handlePaired} />

      {/* Continue alone option */}
      <motion.button
        className="mt-2 font-[family-name:var(--font-body)] text-[13px] text-[var(--color-text-muted)] opacity-40"
        onClick={onSkip}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        data-testid="pairing-skip-btn"
      >
        Continue alone for now
      </motion.button>
    </div>
  )
}

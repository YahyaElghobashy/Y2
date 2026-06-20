"use client"

import { DecideHub } from "@/components/decide/DecideHub"
import { useDecisions } from "@/lib/hooks/use-decisions"
import { useAuth } from "@/lib/providers/AuthProvider"

export default function DecidePage() {
  const { user, partner } = useAuth()
  const { decisions, isLoading, saveDecision, clearDecision } = useDecisions()

  return (
    <DecideHub
      decisions={decisions}
      isLoading={isLoading}
      currentUserId={user?.id ?? null}
      partnerName={partner?.display_name ?? null}
      onSaveDecision={saveDecision}
      onClearDecision={clearDecision}
    />
  )
}

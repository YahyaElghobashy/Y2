"use client"

import { useState, useMemo } from "react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { RitualsView, type RitualGroup } from "@/components/rituals/RitualsView"
import { CreateRitualForm } from "@/components/rituals/CreateRitualForm"
import { MonthlyLetterComposer } from "@/components/rituals/MonthlyLetterComposer"
import { useRituals } from "@/lib/hooks/use-rituals"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { Cadence } from "@/lib/types/rituals.types"

const CADENCE_ORDER: Record<string, number> = { daily: 0, weekly: 1, monthly: 2 }
const CADENCE_LABEL: Record<string, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" }

const LETTER_RITUAL_TITLE = "Monthly Letter"

export default function RitualsPage() {
  const { partner } = useAuth()
  const {
    rituals,
    isLoading,
    error,
    logRitual,
    isLoggedThisPeriod,
    partnerLoggedThisPeriod,
    createRitual,
    uploadRitualPhoto,
  } = useRituals()

  const [showForm, setShowForm] = useState(false)
  const [showLetterComposer, setShowLetterComposer] = useState(false)

  const partnerName = partner?.display_name ?? "Yara"

  // The monthly letter is surfaced via its own CTA, not as a tappable ritual row.
  const letterRitual = useMemo(
    () => rituals.find((r) => r.title === LETTER_RITUAL_TITLE && r.cadence === "monthly"),
    [rituals],
  )

  // Map real rituals → the redesigned View's RitualGroup[] shape, grouped + ordered by cadence.
  const groups: RitualGroup[] = useMemo(() => {
    const buckets: Record<string, RitualGroup["items"]> = { daily: [], weekly: [], monthly: [] }
    for (const r of rituals) {
      if (r.id === letterRitual?.id) continue // letter handled by the CTA
      const key = r.cadence in buckets ? r.cadence : "daily"
      buckets[key].push({
        id: r.id,
        emoji: r.icon,
        title: r.title,
        // TODO(wire): streak has no hook source — default to 0 until a streak field exists.
        streak: 0,
        shared: r.is_shared,
        doneByPartner: r.is_shared ? partnerLoggedThisPeriod(r.id) : undefined,
        done: isLoggedThisPeriod(r.id),
      })
    }
    return Object.entries(buckets)
      .filter(([, items]) => items.length > 0)
      .sort(([a], [b]) => (CADENCE_ORDER[a] ?? 0) - (CADENCE_ORDER[b] ?? 0))
      .map(([cadence, items]) => ({ cadence: CADENCE_LABEL[cadence] ?? cadence, items }))
  }, [rituals, letterRitual, isLoggedThisPeriod, partnerLoggedThisPeriod])

  const handleCreate = async (data: {
    title: string
    description?: string
    icon: string
    cadence: Cadence
    is_shared: boolean
    coyyns_reward: number
  }) => {
    await createRitual(data)
  }

  const handleSendLetter = async (content: string, photoUrl?: string) => {
    let ritualId = letterRitual?.id

    // Auto-create the letter ritual if it doesn't exist (mirrors the old page).
    if (!ritualId) {
      ritualId = (await createRitual({
        title: LETTER_RITUAL_TITLE,
        description: "A monthly letter to your partner",
        icon: "💌",
        cadence: "monthly",
        is_shared: true,
        coyyns_reward: 10,
      })) ?? undefined
    }

    if (!ritualId) return

    await logRitual(ritualId, content, photoUrl)
  }

  if (isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Rituals" backHref="/me" />
        <div className="px-5 py-6">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <PageHeader title="Rituals" backHref="/me" />
        <div data-testid="rituals-error" className="px-5 py-5 text-center text-[14px]" style={{ color: "var(--color-error)" }}>
          {error}
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <RitualsView
        groups={groups}
        letterPartnerName={partnerName}
        onToggleRitual={(id) => void logRitual(id)}
        onCreate={() => setShowForm(true)}
        onWriteLetter={() => setShowLetterComposer(true)}
      />

      {/* Preserve the working create flow behind the redesigned FAB. */}
      <CreateRitualForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />

      {/* Preserve the monthly-letter compose+send flow behind the redesigned CTA. */}
      <MonthlyLetterComposer
        open={showLetterComposer}
        partnerName={partnerName}
        onClose={() => setShowLetterComposer(false)}
        onSend={handleSendLetter}
        onUploadPhoto={uploadRitualPhoto}
      />
    </PageTransition>
  )
}

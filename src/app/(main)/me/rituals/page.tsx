"use client"

import { useState, useMemo } from "react"
import { Plus, Repeat } from "lucide-react"
import { motion } from "framer-motion"
import { useRituals } from "@/lib/hooks/use-rituals"
import { useAuth } from "@/lib/providers/AuthProvider"
import { RitualCard } from "@/components/rituals/RitualCard"
import { CreateRitualForm } from "@/components/rituals/CreateRitualForm"
import { MonthlyLetterComposer } from "@/components/rituals/MonthlyLetterComposer"
import { LetterCard } from "@/components/rituals/LetterCard"
import { StaggerList } from "@/components/animations"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageHeader } from "@/components/shared/PageHeader"
import type { Cadence } from "@/lib/types/rituals.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

const CADENCE_ORDER: Record<string, number> = {
  daily: 0,
  weekly: 1,
  monthly: 2,
}

const LETTER_RITUAL_TITLE = "Monthly Letter"

export default function RitualsPage() {
  const { partner } = useAuth()
  const {
    rituals,
    logs,
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

  // Find or check for letter ritual
  const letterRitual = useMemo(
    () => rituals.find((r) => r.title === LETTER_RITUAL_TITLE && r.cadence === "monthly"),
    [rituals]
  )

  // Get letter logs (from both user and partner)
  const letterLogs = useMemo(() => {
    if (!letterRitual) return []
    return logs
      .filter((l) => l.ritual_id === letterRitual.id && l.note)
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
  }, [letterRitual, logs])

  // Group rituals by cadence
  const grouped = useMemo(() => {
    const groups: Record<string, typeof rituals> = {
      daily: [],
      weekly: [],
      monthly: [],
    }
    for (const r of rituals) {
      const key = r.cadence in groups ? r.cadence : "daily"
      groups[key].push(r)
    }
    return Object.entries(groups)
      .filter(([, items]) => items.length > 0)
      .sort(([a], [b]) => (CADENCE_ORDER[a] ?? 0) - (CADENCE_ORDER[b] ?? 0))
  }, [rituals])

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

    // Auto-create the letter ritual if it doesn't exist
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

  const partnerName = partner?.display_name ?? "Partner"

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Rituals" backHref="/me" />
        <div data-testid="rituals-loading" className="flex flex-col gap-3 px-5 py-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl bg-[var(--bg-secondary)]"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Rituals" backHref="/me" />
        <div data-testid="rituals-error" className="px-5 py-5 text-center text-[14px] text-red-500">
          {error}
        </div>
      </div>
    )
  }

  const letterIsLogged = letterRitual ? isLoggedThisPeriod(letterRitual.id) : false

  return (
    <div data-testid="rituals-page">
      <PageHeader
        title="Rituals"
        backHref="/me"
        rightAction={
          <motion.button
            data-testid="add-ritual-button"
            onClick={() => setShowForm(true)}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            className="text-[var(--accent-primary)]"
            aria-label="Create ritual"
          >
            <Plus size={22} />
          </motion.button>
        }
      />

      <div className="flex flex-col gap-6 px-5 py-5 pb-8">
        {rituals.length === 0 && (
          <EmptyState
            icon={<Repeat size={48} strokeWidth={1.5} />}
            title="No rituals yet"
            subtitle="Create a daily habit to get started"
            actionLabel="Create Ritual"
            onAction={() => setShowForm(true)}
          />
        )}

        {/* Monthly Letter CTA */}
        {!letterIsLogged && (
          <motion.button
            onClick={() => setShowLetterComposer(true)}
            className="w-full rounded-2xl bg-[#FBF8F4] border-2 border-dashed border-[var(--accent-primary,#C4956A)]/30 px-5 py-4 text-start"
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.1 }}
            data-testid="write-letter-cta"
          >
            <div className="flex items-center gap-3">
              <span className="text-[28px]">💌</span>
              <div>
                <p className="text-[14px] font-semibold text-[var(--color-text-primary,#2C2825)] font-display">
                  Write a letter to {partnerName}
                </p>
                <p className="text-[12px] text-[var(--color-text-muted,#B5AFA7)]">
                  A monthly note from the heart
                </p>
              </div>
            </div>
          </motion.button>
        )}

        {/* Past letters */}
        {letterLogs.length > 0 && (
          <div data-testid="letter-history">
            <h3 className="mb-2 font-body text-[13px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Letters
            </h3>
            <div className="flex flex-col gap-2">
              {letterLogs.map((log) => (
                <LetterCard
                  key={log.id}
                  content={log.note!}
                  date={log.logged_at}
                  authorName={log.user_id === partner?.id ? partnerName : "You"}
                  photoUrl={log.photo_url}
                />
              ))}
            </div>
          </div>
        )}

        {grouped.map(([cadence, items]) => (
          <div key={cadence} data-testid={`cadence-group-${cadence}`}>
            <h3 className="mb-2 font-body text-[13px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {cadence}
            </h3>
            <StaggerList className="flex flex-col gap-2">
              {items.map((ritual) => (
                <RitualCard
                  key={ritual.id}
                  ritual={ritual}
                  isLogged={isLoggedThisPeriod(ritual.id)}
                  partnerLogged={partnerLoggedThisPeriod(ritual.id)}
                  onLog={logRitual}
                />
              ))}
            </StaggerList>
          </div>
        ))}
      </div>

      <CreateRitualForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />

      <MonthlyLetterComposer
        open={showLetterComposer}
        partnerName={partnerName}
        onClose={() => setShowLetterComposer(false)}
        onSend={handleSendLetter}
        onUploadPhoto={uploadRitualPhoto}
      />
    </div>
  )
}

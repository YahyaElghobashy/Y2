"use client"

import { useState, useMemo } from "react"
import { Plus, Repeat } from "lucide-react"
import { motion } from "framer-motion"
import { useRituals } from "@/lib/hooks/use-rituals"
import { RitualCard } from "@/components/rituals/RitualCard"
import { CreateRitualForm } from "@/components/rituals/CreateRitualForm"
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

export default function RitualsPage() {
  const {
    rituals,
    isLoading,
    error,
    logRitual,
    isLoggedThisPeriod,
    partnerLoggedThisPeriod,
    createRitual,
  } = useRituals()

  const [showForm, setShowForm] = useState(false)

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

        {grouped.map(([cadence, items]) => (
          <div key={cadence} data-testid={`cadence-group-${cadence}`}>
            <h3 className="mb-2 font-[family-name:var(--font-body)] text-[13px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
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
    </div>
  )
}

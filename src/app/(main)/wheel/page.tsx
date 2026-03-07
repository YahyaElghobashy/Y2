"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, Target } from "lucide-react"
import { useWheel } from "@/lib/hooks/use-wheel"
import { PresetCard } from "@/components/wheel/PresetCard"
import { CreatePresetForm } from "@/components/wheel/CreatePresetForm"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { cn } from "@/lib/utils"
import type { CreatePresetInput, WheelSession } from "@/lib/types/wheel.types"

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

// Default starter presets
const STARTER_PRESETS: CreatePresetInput[] = [
  {
    name: "Restaurant Picker",
    icon: "🍕",
    items: [
      { label: "Pizza" },
      { label: "Sushi" },
      { label: "Tacos" },
      { label: "Burgers" },
      { label: "Thai" },
    ],
  },
  {
    name: "Movie Night",
    icon: "🎬",
    items: [
      { label: "Action" },
      { label: "Comedy" },
      { label: "Drama" },
      { label: "Horror" },
      { label: "Anime" },
    ],
  },
  {
    name: "Who Does Chores",
    icon: "🧹",
    items: [
      { label: "You" },
      { label: "Me" },
    ],
  },
  {
    name: "Random Decision",
    icon: "🎲",
    items: [
      { label: "Yes" },
      { label: "No" },
      { label: "Maybe" },
    ],
  },
]

export default function WheelPresetsPage() {
  const router = useRouter()
  const {
    presets,
    isLoading,
    error,
    createPreset,
    deletePreset,
    sessionHistory,
  } = useWheel()

  const [showForm, setShowForm] = useState(false)
  const [startersCreated, setStartersCreated] = useState(false)

  // Auto-create starter presets on first load if none exist
  useEffect(() => {
    if (isLoading || startersCreated || presets.length > 0) return

    setStartersCreated(true)
    ;(async () => {
      for (const starter of STARTER_PRESETS) {
        await createPreset(starter)
      }
    })()
  }, [isLoading, presets.length, startersCreated, createPreset])

  const handlePlay = useCallback(
    (presetId: string) => {
      router.push(`/wheel/${presetId}`)
    },
    [router]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      await deletePreset(id)
    },
    [deletePreset]
  )

  const handleSave = useCallback(
    async (data: CreatePresetInput) => {
      await createPreset(data)
      setShowForm(false)
    },
    [createPreset]
  )

  // Stats
  const totalSpins = useMemo(
    () => sessionHistory.reduce((sum: number, s: WheelSession) => sum + (s.best_of_rounds ?? 0), 0),
    [sessionHistory]
  )

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Spin the Wheel" />
        <div data-testid="wheel-loading" className="flex flex-col gap-3 px-5 py-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--bg-secondary)]" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Spin the Wheel" />
        <div data-testid="wheel-error" className="px-5 py-5 text-center text-[14px] text-red-500">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Spin the Wheel" />

      <div data-testid="wheel-presets-page" className="flex flex-col gap-5 px-5 py-5 pb-24">
        {/* Stats bar */}
        {sessionHistory.length > 0 && (
          <div data-testid="wheel-stats" className="flex items-center justify-center gap-6 rounded-xl bg-[var(--accent-soft,#E8D5C0)] py-2.5">
            <div className="text-center">
              <p className="font-display text-[16px] font-bold text-[var(--accent-copper,#B87333)]">
                {sessionHistory.length}
              </p>
              <p className="font-nav text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Sessions</p>
            </div>
            <div className="h-6 w-px bg-[var(--accent-copper,#B87333)] opacity-30" />
            <div className="text-center">
              <p className="font-display text-[16px] font-bold text-[var(--accent-copper,#B87333)]">
                {totalSpins}
              </p>
              <p className="font-nav text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Total Rounds</p>
            </div>
          </div>
        )}

        {/* Create new button */}
        {!showForm && (
          <motion.button
            data-testid="new-preset-btn"
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15, ease: EASE_OUT }}
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--accent-copper,#B87333)] py-4 font-nav text-[13px] font-medium text-[var(--accent-copper,#B87333)]"
          >
            <Plus size={16} />
            Create New Wheel
          </motion.button>
        )}

        {/* Create form */}
        {showForm && (
          <CreatePresetForm
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Presets gallery */}
        {presets.length > 0 ? (
          <div data-testid="presets-gallery" className="grid grid-cols-2 gap-3">
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                onPlay={handlePlay}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          !showForm && (
            <EmptyState
              icon={<Target size={48} strokeWidth={1.5} />}
              title="No presets yet"
              subtitle="Create your first wheel"
              className="min-h-[120px]"
            />
          )
        )}

        {/* Session history */}
        {sessionHistory.length > 0 && (
          <div>
            <h2 className="mb-3 font-nav text-[11px] font-medium uppercase tracking-widest text-[var(--text-secondary)]">
              Past Sessions
            </h2>
            <div data-testid="session-history" className="flex flex-col gap-2">
              {sessionHistory.slice(0, 10).map((session) => (
                <div
                  key={session.id}
                  data-testid={`history-${session.id}`}
                  className="flex items-center justify-between rounded-xl bg-[var(--bg-elevated,#FFFFFF)] px-4 py-3 shadow-sm"
                >
                  <div>
                    <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] font-medium capitalize text-[var(--text-muted)]">
                      {session.mode.replace("_", " ")}
                    </span>
                    <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                      {new Date(session.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {session.winner_label && (
                    <p className="text-[13px] font-semibold text-[var(--accent-primary,#C4956A)]">
                      {session.winner_label}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

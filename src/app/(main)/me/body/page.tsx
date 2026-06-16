"use client"

import { useMemo, useState } from "react"
import { Settings } from "lucide-react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { BodyView, type BodyData } from "@/components/health/BodyView"
import { FitnessView } from "@/components/health/FitnessView"
import { CycleConfigForm } from "@/components/health/CycleConfigForm"
import { useCycle } from "@/lib/hooks/use-cycle"
import { useFitness } from "@/lib/hooks/use-fitness"
import { useAuth } from "@/lib/providers/AuthProvider"

export default function BodyPage() {
  const { profile: authProfile } = useAuth()
  const {
    config,
    currentDay,
    phase,
    daysUntilBreak,
    daysUntilActive,
    isPMSWindow,
    isLoading,
  } = useCycle()
  const fitness = useFitness()
  const isAdmin = authProfile?.role === "admin"
  const [configOpen, setConfigOpen] = useState(false)

  // Admin gating: cycle data is only ever computed/rendered for admins WITH a config.
  // useCycle itself returns a null state for non-admins, so `config` is always null
  // for them — this guard is belt-and-braces so cycle data is never exposed.
  const showCycle = isAdmin && !!config

  // Map the pill-cycle hook (active/break) → BodyView's visual BodyData. We label
  // on-pill days as "follicular" and break/period days as "menstrual"; we do NOT
  // fabricate fertility/ovulation timing the hook doesn't model.
  const bodyData: BodyData | null = useMemo(() => {
    if (!showCycle || !config || currentDay === null || phase === null) return null

    const activeDays = config.active_days
    const breakDays = config.break_days
    const cycleLength = activeDays + breakDays

    const ribbon: BodyData["ribbon"] = Array.from({ length: cycleLength }, (_, i) =>
      i < activeDays ? "follicular" : "menstrual",
    )

    // Days until the next period START (break begins). In the active phase that's
    // daysUntilBreak; in the break phase the period is current, so the next one is
    // after the upcoming active stretch.
    const nextPeriodDays =
      phase === "active" ? daysUntilBreak ?? 0 : (daysUntilActive ?? 0) + activeDays

    const energy = phase === "break" ? "Gentle" : isPMSWindow ? "Winding down" : "Steady"

    return {
      day: currentDay,
      cycleLength,
      phase: phase === "break" ? "menstrual" : "follicular",
      nextPeriodDays,
      energy,
      ribbon,
      // Fitness has no real hook/table source yet. Do NOT fabricate progress on the
      // authed route — pass null so BodyView renders its honest "coming soon" state.
      fitness: null,
    }
  }, [showCycle, config, currentDay, phase, daysUntilBreak, daysUntilActive, isPMSWindow])

  if (isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Body" backHref="/me" />
        <div className="px-5 py-6">
          <LoadingSkeleton variant="card" count={2} />
        </div>
      </PageTransition>
    )
  }

  // ── Admin WITH config: redesigned cycle companion ──
  if (showCycle && bodyData) {
    return (
      <PageTransition>
        <PageHeader
          title="Body"
          backHref="/me"
          rightAction={
            <button
              type="button"
              onClick={() => setConfigOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ color: "var(--color-ink-soft)" }}
              aria-label="Cycle settings"
            >
              <Settings size={20} strokeWidth={1.5} />
            </button>
          }
        />

        {/* Redesigned BodyView renders the phase hero, insights, and ribbon. Its own
            fitness block is suppressed (showFitness={false}); the real, data-backed
            FitnessView is rendered just below in its own padded section. */}
        <BodyView data={bodyData} showFitness={false} />
        <div className="skin-aware px-5 pb-28" style={{ background: "var(--background)" }}>
          <FitnessView
            history={fitness.history}
            isLoading={fitness.isLoading}
            onLog={fitness.logWeight}
            onDelete={fitness.deleteWeight}
          />
        </div>

        <CycleConfigForm
          open={configOpen}
          onClose={() => setConfigOpen(false)}
          onSuccess={() => setConfigOpen(false)}
          initialConfig={config ?? undefined}
        />
      </PageTransition>
    )
  }

  // ── Non-admins, and admins without a config: NO cycle data exposed. ──
  return (
    <PageTransition>
      <PageHeader title="Body" backHref="/me" />

      <div className="flex flex-col gap-6 px-5 py-6">
        {/* Admin without a config → setup prompt (preserved from the old page). */}
        {isAdmin && !config && (
          <EmptyState
            icon={<Settings size={48} strokeWidth={1.25} />}
            title="Set up cycle tracking"
            subtitle="Configure pill cycle dates to get personalized insights"
            actionLabel="Set Up"
            onAction={() => setConfigOpen(true)}
          />
        )}

        {/* Real fitness tracking — owner-only weight log, history + trend. Visible to
            every authed user (each sees only their own rows via RLS). */}
        <FitnessView
          history={fitness.history}
          isLoading={fitness.isLoading}
          onLog={fitness.logWeight}
          onDelete={fitness.deleteWeight}
        />
      </div>

      {/* Config form only mounted for admins (setup flow). */}
      {isAdmin && (
        <CycleConfigForm
          open={configOpen}
          onClose={() => setConfigOpen(false)}
          onSuccess={() => setConfigOpen(false)}
          initialConfig={config ?? undefined}
        />
      )}
    </PageTransition>
  )
}

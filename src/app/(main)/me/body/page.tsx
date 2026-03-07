"use client"

import { useState } from "react"
import { Settings, ChevronDown, ChevronUp, Dumbbell } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { CycleDayWidget } from "@/components/health/CycleDayWidget"
import { CycleInsightCard } from "@/components/health/CycleInsightCard"
import { CycleCalendarView } from "@/components/health/CycleCalendarView"
import { CycleConfigForm } from "@/components/health/CycleConfigForm"
import { useCycle } from "@/lib/hooks/use-cycle"
import { useAuth } from "@/lib/providers/AuthProvider"

export default function BodyPage() {
  const { profile: authProfile } = useAuth()
  const { config, isLoading } = useCycle()
  const isAdmin = authProfile?.role === "admin"
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)

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

  return (
    <PageTransition>
      <PageHeader
        title="Body"
        backHref="/me"
        rightAction={
          isAdmin && config ? (
            <button
              type="button"
              onClick={() => setConfigOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary"
              aria-label="Cycle settings"
            >
              <Settings size={20} strokeWidth={1.5} />
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-6 px-5 py-6">
        {/* Cycle Tracker Section (admin/Yahya only) */}
        {isAdmin && (
          config ? (
            <>
              {/* Hero: Cycle Day Widget */}
              <div className="flex justify-center rounded-2xl border-l-4 border-l-[#F4A8B8] bg-[var(--bg-elevated,#FFFFFF)] p-4 shadow-[var(--shadow-soft)]">
                <CycleDayWidget />
              </div>

              {/* Insight Card */}
              <div className="rounded-2xl border-l-4 border-l-[#F4A8B8] bg-[var(--bg-elevated,#FFFFFF)] p-4 shadow-[var(--shadow-soft)]"><CycleInsightCard /></div>

              {/* Expandable Calendar */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setCalendarOpen((prev) => !prev)}
                  className="flex items-center justify-between py-2 text-[14px] font-medium font-serif italic text-text-secondary"
                >
                  <span>{calendarOpen ? "Hide Calendar" : "View Calendar"}</span>
                  {calendarOpen ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
                <AnimatePresence>
                  {calendarOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <CycleCalendarView />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Settings size={48} strokeWidth={1.25} />}
              title="Set up cycle tracking"
              subtitle="Configure pill cycle dates to get personalized insights"
              actionLabel="Set Up"
              onAction={() => setConfigOpen(true)}
            />
          )
        )}

        {/* Fitness Placeholder (always visible) */}
        <EmptyState
          icon={<Dumbbell size={48} strokeWidth={1.25} />}
          title="Fitness tracking coming soon"
          subtitle="Tracking your journey to 85kg"
        />
      </div>

      {/* Config Form Modal (admin only) */}
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

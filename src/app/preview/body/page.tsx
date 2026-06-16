"use client"

import { BodyView, BODY_MOCK } from "@/components/health/BodyView"
import { FitnessView, FITNESS_MOCK } from "@/components/health/FitnessView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewBodyPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      {/* Cycle companion (mock) with its own fitness block suppressed; the real,
          data-shaped FitnessView is rendered below with mock weight history. Callbacks
          are omitted → default no-ops, so /preview never touches Supabase. */}
      <BodyView data={BODY_MOCK} showFitness={false} />
      <div className="px-5 pb-28" style={{ background: "var(--background)" }}>
        <FitnessView history={FITNESS_MOCK} />
      </div>
      <BottomNav />
    </div>
  )
}

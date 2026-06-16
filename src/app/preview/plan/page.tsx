"use client"

import { PlanView, PLAN_MOCK } from "@/components/calendar/PlanView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewPlanPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <PlanView data={PLAN_MOCK} />
      <BottomNav />
    </div>
  )
}

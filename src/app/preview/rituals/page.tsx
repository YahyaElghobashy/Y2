"use client"

import { RitualsView, RITUALS_MOCK } from "@/components/rituals/RitualsView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewRitualsPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <RitualsView groups={RITUALS_MOCK} />
      <BottomNav />
    </div>
  )
}

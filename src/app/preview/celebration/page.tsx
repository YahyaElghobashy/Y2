"use client"

import { Celebration } from "@/components/shared/Celebration"

export default function PreviewCelebrationPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--color-paper)" }}>
      {/* Held open (no auto-dismiss) for visual QA. */}
      <Celebration open tone="big" title="Mabrouk!" subtitle="100 days together" autoMs={9_999_999} />
    </div>
  )
}

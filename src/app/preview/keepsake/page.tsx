"use client"

import { KeepsakeView, KEEPSAKE_MOCK } from "@/components/keepsake/KeepsakeView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewKeepsakePage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <KeepsakeView data={KEEPSAKE_MOCK} />
      <BottomNav />
    </div>
  )
}

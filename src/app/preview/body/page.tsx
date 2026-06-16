"use client"

import { BodyView, BODY_MOCK } from "@/components/health/BodyView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewBodyPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <BodyView data={BODY_MOCK} />
      <BottomNav />
    </div>
  )
}

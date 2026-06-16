"use client"

import { GardenView, GARDEN_MOCK } from "@/components/garden/GardenView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewGardenPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <GardenView data={GARDEN_MOCK} />
      <BottomNav />
    </div>
  )
}

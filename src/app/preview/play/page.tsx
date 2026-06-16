"use client"

import { PlayView, PLAY_MOCK } from "@/components/game/PlayView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewPlayPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <PlayView data={PLAY_MOCK} />
      <BottomNav />
    </div>
  )
}

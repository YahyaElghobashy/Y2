"use client"

import { WatchView, WATCH_MOCK } from "@/components/watch/WatchView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewWatchPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <WatchView items={WATCH_MOCK} />
      <BottomNav />
    </div>
  )
}

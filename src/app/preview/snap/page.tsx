"use client"

import { SnapView, SNAP_MOCK } from "@/components/snap/SnapView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewSnapPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <SnapView days={SNAP_MOCK} />
      <BottomNav />
    </div>
  )
}

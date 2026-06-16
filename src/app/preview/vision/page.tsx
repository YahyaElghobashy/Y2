"use client"

import { VisionView, VISION_MINE, VISION_PARTNER } from "@/components/vision-board/VisionView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewVisionPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <VisionView mine={VISION_MINE} partner={VISION_PARTNER} />
      <BottomNav />
    </div>
  )
}

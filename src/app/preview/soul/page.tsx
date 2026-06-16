"use client"

import { SoulView, SOUL_MOCK } from "@/components/spiritual/SoulView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewSoulPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <SoulView data={SOUL_MOCK} />
      <BottomNav />
    </div>
  )
}

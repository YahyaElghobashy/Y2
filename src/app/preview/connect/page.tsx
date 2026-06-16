"use client"

import { ConnectView, CONNECT_MOCK } from "@/components/prompts/ConnectView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewConnectPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <ConnectView data={CONNECT_MOCK} />
      <BottomNav />
    </div>
  )
}

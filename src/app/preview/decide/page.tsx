"use client"

import { DecideHub, DECIDE_MOCK } from "@/components/decide/DecideHub"
import { BottomNav } from "@/components/shared/BottomNav"

/**
 * Preview mock for the Decide Together suite — public, no auth. Renders the real
 * DecideHub with mock decisions; the authed /decide page renders the same hub
 * wired to useDecisions.
 */
export default function PreviewDecidePage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <DecideHub decisions={DECIDE_MOCK} currentUserId="me" partnerName="Yara" />
      <BottomNav />
    </div>
  )
}

"use client"

import {
  ChallengesView,
  CHALLENGES_PENDING_MOCK,
  CHALLENGES_ACTIVE_MOCK,
  CHALLENGES_PAST_MOCK,
  BOUNTIES_MOCK,
} from "@/components/challenges/ChallengesView"
import { BottomNav } from "@/components/shared/BottomNav"

export default function PreviewChallengesPage() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-[430px]" style={{ background: "var(--background)" }}>
      <ChallengesView
        pending={CHALLENGES_PENDING_MOCK}
        active={CHALLENGES_ACTIVE_MOCK}
        past={CHALLENGES_PAST_MOCK}
        bounties={BOUNTIES_MOCK}
        initialBalance={248}
      />
      <BottomNav />
    </div>
  )
}

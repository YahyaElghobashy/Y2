"use client"

import { useMemo } from "react"
import { PageTransition } from "@/components/animations"
import { PageHeader } from "@/components/shared/PageHeader"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import {
  ChallengesView,
  type ChallengeItem,
  type BountyItem,
} from "@/components/challenges/ChallengesView"
import { useChallenges } from "@/lib/hooks/use-challenges"
import { useBounties } from "@/lib/hooks/use-bounties"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { Challenge, Bounty } from "@/lib/types/challenges.types"

const ACCENTS: ChallengeItem["accent"][] = ["coral", "rose", "amber", "teal", "indigo", "terracotta"]

function deadlineLine(deadline: string | null): string | undefined {
  if (!deadline) return "in progress"
  const d = new Date(deadline)
  if (Number.isNaN(d.getTime())) return "in progress"
  return `ends ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
}

export default function TreasuryChallengesPage() {
  const { user } = useAuth()
  const { wallet } = useCoyyns()
  const balance = wallet?.balance ?? 0
  const {
    pendingChallenges,
    activeChallenges,
    historyChallenges,
    acceptChallenge,
    declineChallenge,
    claimVictory,
    isLoading: challengesLoading,
  } = useChallenges()
  const { activeBounties, claimBounty, isLoading: bountiesLoading } = useBounties()

  const pending: ChallengeItem[] = useMemo(
    () =>
      pendingChallenges.map((c: Challenge, i) => ({
        id: c.id,
        title: c.title,
        emoji: c.emoji ?? "🎯",
        stakes: c.stakes,
        accent: ACCENTS[i % ACCENTS.length],
        from: "your love",
      })),
    [pendingChallenges],
  )

  const active: ChallengeItem[] = useMemo(
    () =>
      activeChallenges.map((c: Challenge, i) => ({
        id: c.id,
        title: c.title,
        emoji: c.emoji ?? "🔥",
        stakes: c.stakes,
        accent: ACCENTS[i % ACCENTS.length],
        deadline: deadlineLine(c.deadline),
      })),
    [activeChallenges],
  )

  const past: ChallengeItem[] = useMemo(
    () =>
      historyChallenges.map((c: Challenge, i) => ({
        id: c.id,
        title: c.title,
        emoji: c.emoji ?? "🏅",
        stakes: c.stakes,
        accent: ACCENTS[i % ACCENTS.length],
        winner: c.winner_id ? (c.winner_id === user?.id ? "You" : "Your love") : "—",
      })),
    [historyChallenges, user?.id],
  )

  const bounties: BountyItem[] = useMemo(
    () =>
      activeBounties.map((b: Bounty) => ({
        id: b.id,
        title: b.title,
        trigger: b.trigger_description,
        reward: b.reward,
        emoji: "🎁",
        recurring: b.is_recurring ?? false,
      })),
    [activeBounties],
  )

  if (challengesLoading || bountiesLoading) {
    return (
      <PageTransition>
        <PageHeader title="Challenges" backHref="/treasury" />
        <div className="px-5 py-6">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <ChallengesView
        pending={pending}
        active={active}
        past={past}
        bounties={bounties}
        initialBalance={balance}
        onAccept={(id) => void acceptChallenge(id)}
        onDecline={(id) => void declineChallenge(id)}
        onClaim={(id) => void claimVictory(id)}
        onClaimBounty={(id) => void claimBounty(id)}
      />
    </PageTransition>
  )
}

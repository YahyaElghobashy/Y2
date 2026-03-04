import type { Database } from "@/lib/types/database.types"

// ── Challenge Types ───────────────────────────────────────────

export type Challenge = Database["public"]["Tables"]["challenges"]["Row"]
export type ChallengeInsert = Database["public"]["Tables"]["challenges"]["Insert"]
export type ChallengeUpdate = Database["public"]["Tables"]["challenges"]["Update"]

export type ChallengeStatus =
  | "pending_acceptance"
  | "active"
  | "pending_resolution"
  | "completed"
  | "resolved"
  | "disputed"
  | "expired"
  | "cancelled"

export type CreateChallengeData = {
  title: string
  description?: string
  emoji?: string
  stakes: number
  deadline?: string
}

// ── Bounty Types ──────────────────────────────────────────────

export type Bounty = Database["public"]["Tables"]["bounties"]["Row"]
export type BountyInsert = Database["public"]["Tables"]["bounties"]["Insert"]
export type BountyUpdate = Database["public"]["Tables"]["bounties"]["Update"]

export type BountyClaim = Database["public"]["Tables"]["bounty_claims"]["Row"]
export type BountyClaimInsert = Database["public"]["Tables"]["bounty_claims"]["Insert"]

export type BountyClaimStatus = "pending" | "confirmed" | "denied"

export type CreateBountyData = {
  title: string
  trigger_description: string
  reward: number
  is_recurring?: boolean
}

// ── Hook Return Types ─────────────────────────────────────────

export type UseChallengesReturn = {
  activeChallenges: Challenge[]
  pendingChallenges: Challenge[]
  historyChallenges: Challenge[]
  isLoading: boolean
  error: string | null
  createChallenge: (data: CreateChallengeData) => Promise<void>
  acceptChallenge: (challengeId: string) => Promise<void>
  declineChallenge: (challengeId: string) => Promise<void>
  claimVictory: (challengeId: string) => Promise<void>
  confirmVictory: (challengeId: string) => Promise<void>
  disputeChallenge: (challengeId: string, reason?: string) => Promise<void>
  refreshChallenges: () => Promise<void>
}

export type UseBountiesReturn = {
  activeBounties: Bounty[]
  pendingClaims: BountyClaim[]
  isLoading: boolean
  error: string | null
  createBounty: (data: CreateBountyData) => Promise<void>
  claimBounty: (bountyId: string) => Promise<void>
  confirmClaim: (claimId: string) => Promise<void>
  denyClaim: (claimId: string) => Promise<void>
  refreshBounties: () => Promise<void>
}

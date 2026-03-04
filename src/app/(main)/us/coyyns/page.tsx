"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, ChevronDown, Swords, Gift } from "lucide-react"
import { CoyynsWallet } from "@/components/relationship/CoyynsWallet"
import { CoyynsHistory } from "@/components/relationship/CoyynsHistory"
import { ChallengeCard } from "@/components/relationship/ChallengeCard"
import { BountyCard } from "@/components/bounties/BountyCard"
import { CreateChallengeForm } from "@/components/relationship/CreateChallengeForm"
import { CreateBountyForm } from "@/components/bounties/CreateBountyForm"
import { ChallengeAcceptFlow } from "@/components/challenges/ChallengeAcceptFlow"
import { ChallengeResolveFlow } from "@/components/challenges/ChallengeResolveFlow"
import { ChallengeWinAnimation } from "@/components/challenges/ChallengeWinAnimation"
import { BountyClaimFlow } from "@/components/bounties/BountyClaimFlow"
import { useChallenges } from "@/lib/hooks/use-challenges"
import { useBounties } from "@/lib/hooks/use-bounties"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { Challenge } from "@/lib/types/challenges.types"

type CardStatus = "pending" | "active" | "completed" | "declined"

function mapChallengeStatus(status: string): CardStatus {
  switch (status) {
    case "pending_acceptance":
      return "pending"
    case "active":
    case "pending_resolution":
    case "disputed":
      return "active"
    case "resolved":
    case "completed":
      return "completed"
    case "cancelled":
    case "expired":
      return "declined"
    default:
      return "active"
  }
}

export default function CoyynsTabPage() {
  const { user, partner } = useAuth()
  const {
    activeChallenges,
    pendingChallenges,
    historyChallenges,
    refreshChallenges,
  } = useChallenges()
  const { activeBounties, pendingClaims, refreshBounties } = useBounties()

  const [showCreateChallenge, setShowCreateChallenge] = useState(false)
  const [showCreateBounty, setShowCreateBounty] = useState(false)
  const [selectedAcceptChallenge, setSelectedAcceptChallenge] =
    useState<Challenge | null>(null)
  const [selectedResolveChallenge, setSelectedResolveChallenge] =
    useState<Challenge | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  // Win animation state
  const [winAnimation, setWinAnimation] = useState<{
    open: boolean
    isWinner: boolean
    amount: number
  }>({ open: false, isWinner: false, amount: 0 })

  // Bounty claim flow state
  const [selectedBountyClaimId, setSelectedBountyClaimId] = useState<
    string | null
  >(null)

  const selectedBountyClaim = selectedBountyClaimId
    ? pendingClaims.find((c) => c.bounty_id === selectedBountyClaimId) ?? null
    : null
  const selectedClaimBounty = selectedBountyClaimId
    ? activeBounties.find((b) => b.id === selectedBountyClaimId) ?? null
    : null

  const userName = user?.id ?? ""
  const userInitial =
    (partner?.display_name ?? "P").charAt(0).toUpperCase()
  const partnerInitial =
    (partner?.display_name ?? "P").charAt(0).toUpperCase()

  const getParticipants = (challenge: Challenge) => {
    const isCreator = challenge.creator_id === user?.id
    return [
      { name: isCreator ? "You" : (partner?.display_name ?? "Partner"), initial: isCreator ? "Y" : partnerInitial },
      { name: isCreator ? (partner?.display_name ?? "Partner") : "You", initial: isCreator ? partnerInitial : "Y" },
    ]
  }

  const handleResolved = (winnerId: string) => {
    const challenge = selectedResolveChallenge
    if (!challenge) return
    const isWinner = winnerId === userName
    setWinAnimation({
      open: true,
      isWinner,
      amount: challenge.stakes * 2,
    })
    refreshChallenges()
  }

  const handleClaimBounty = (bountyId: string) => {
    // This opens the claim flow for the bounty
    setSelectedBountyClaimId(bountyId)
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <CoyynsWallet />
      <CoyynsHistory compact limit={5} />

      {/* Challenges Section */}
      <section data-testid="challenges-section">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Swords size={18} strokeWidth={1.5} className="text-text-secondary" />
            <h2 className="font-body text-[16px] font-semibold text-text-primary">
              Challenges
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateChallenge(true)}
            className="flex h-8 items-center gap-1 rounded-full bg-accent-soft px-3 text-[13px] font-medium font-body text-accent-primary"
            data-testid="new-challenge-btn"
          >
            <Plus size={14} />
            New
          </button>
        </div>

        {/* Pending challenges */}
        {pendingChallenges.length > 0 && (
          <div className="flex flex-col gap-3 mb-3" data-testid="pending-challenges">
            {pendingChallenges.map((ch) => (
              <ChallengeCard
                key={ch.id}
                title={`${ch.emoji ?? ""} ${ch.title}`.trim()}
                stakes={`${ch.stakes} CoYYns`}
                status={mapChallengeStatus(ch.status)}
                participants={getParticipants(ch)}
                onAccept={() => setSelectedAcceptChallenge(ch)}
                onDecline={() => setSelectedAcceptChallenge(ch)}
              />
            ))}
          </div>
        )}

        {/* Active challenges */}
        {activeChallenges.length > 0 ? (
          <div className="flex flex-col gap-3" data-testid="active-challenges">
            {activeChallenges.map((ch) => (
              <div
                key={ch.id}
                onClick={() => setSelectedResolveChallenge(ch)}
                className="cursor-pointer"
                data-testid="challenge-card-wrapper"
              >
                <ChallengeCard
                  title={`${ch.emoji ?? ""} ${ch.title}`.trim()}
                  stakes={`${ch.stakes} CoYYns`}
                  status={mapChallengeStatus(ch.status)}
                  participants={getParticipants(ch)}
                />
              </div>
            ))}
          </div>
        ) : (
          pendingChallenges.length === 0 && (
            <div
              className="flex flex-col items-center gap-2 py-8 text-center"
              data-testid="challenges-empty"
            >
              <Swords size={32} strokeWidth={1} className="text-text-muted" />
              <p className="font-body text-[14px] text-text-muted">
                No active challenges. Create one to get started!
              </p>
            </div>
          )
        )}
      </section>

      {/* Bounties Section */}
      <section data-testid="bounties-section">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift size={18} strokeWidth={1.5} className="text-text-secondary" />
            <h2 className="font-body text-[16px] font-semibold text-text-primary">
              Bounties
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateBounty(true)}
            className="flex h-8 items-center gap-1 rounded-full bg-accent-soft px-3 text-[13px] font-medium font-body text-accent-primary"
            data-testid="new-bounty-btn"
          >
            <Plus size={14} />
            New
          </button>
        </div>

        {activeBounties.length > 0 ? (
          <div className="flex flex-col gap-3" data-testid="active-bounties">
            {activeBounties.map((b) => (
              <BountyCard
                key={b.id}
                bounty={b}
                pendingClaim={
                  pendingClaims.find((c) => c.bounty_id === b.id) ?? null
                }
                onClaim={handleClaimBounty}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center gap-2 py-8 text-center"
            data-testid="bounties-empty"
          >
            <Gift size={32} strokeWidth={1} className="text-text-muted" />
            <p className="font-body text-[14px] text-text-muted">
              No bounties yet. Create one for your partner!
            </p>
          </div>
        )}
      </section>

      {/* History Section */}
      {historyChallenges.length > 0 && (
        <section data-testid="history-section">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="flex w-full items-center justify-between"
            data-testid="history-toggle"
          >
            <h2 className="font-body text-[16px] font-semibold text-text-primary">
              History
            </h2>
            <motion.div
              animate={{ rotate: showHistory ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={18} className="text-text-secondary" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-3 pt-3" data-testid="history-list">
                  {historyChallenges.map((ch) => (
                    <ChallengeCard
                      key={ch.id}
                      title={`${ch.emoji ?? ""} ${ch.title}`.trim()}
                      stakes={`${ch.stakes} CoYYns`}
                      status={mapChallengeStatus(ch.status)}
                      participants={getParticipants(ch)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Modals */}
      <CreateChallengeForm
        open={showCreateChallenge}
        onClose={() => setShowCreateChallenge(false)}
        onCreated={refreshChallenges}
      />

      <CreateBountyForm
        open={showCreateBounty}
        onClose={() => setShowCreateBounty(false)}
        onCreated={refreshBounties}
      />

      <ChallengeAcceptFlow
        challenge={selectedAcceptChallenge}
        open={!!selectedAcceptChallenge}
        onClose={() => setSelectedAcceptChallenge(null)}
        onAccepted={refreshChallenges}
        onDeclined={refreshChallenges}
      />

      <ChallengeResolveFlow
        challenge={selectedResolveChallenge}
        open={!!selectedResolveChallenge}
        onClose={() => setSelectedResolveChallenge(null)}
        onResolved={handleResolved}
      />

      <ChallengeWinAnimation
        open={winAnimation.open}
        isWinner={winAnimation.isWinner}
        amount={winAnimation.amount}
        onComplete={() => setWinAnimation((s) => ({ ...s, open: false }))}
      />

      <BountyClaimFlow
        bounty={selectedClaimBounty}
        claim={selectedBountyClaim}
        open={!!selectedBountyClaimId}
        onClose={() => setSelectedBountyClaimId(null)}
        onConfirmed={refreshBounties}
        onDenied={refreshBounties}
      />
    </div>
  )
}

import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useCoyyns } from "@/lib/hooks/use-coyyns"
import type {
  Challenge,
  ChallengeStatus,
  CreateChallengeData,
  UseChallengesReturn,
} from "@/lib/types/challenges.types"

const CHALLENGE_LIMIT = 50

const ACTIVE_STATUSES: ChallengeStatus[] = ["active", "pending_resolution", "disputed"]
const PENDING_STATUSES: ChallengeStatus[] = ["pending_acceptance"]
const HISTORY_STATUSES: ChallengeStatus[] = ["completed", "resolved", "expired", "cancelled"]

export function useChallenges(): UseChallengesReturn {
  const { user } = useAuth()
  const { spendCoyyns } = useCoyyns()
  const supabase = getSupabaseBrowserClient()

  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Derived state ──────────────────────────────────────────

  const activeChallenges = challenges.filter((c) =>
    ACTIVE_STATUSES.includes(c.status as ChallengeStatus)
  )
  const pendingChallenges = challenges.filter((c) =>
    PENDING_STATUSES.includes(c.status as ChallengeStatus)
  )
  const historyChallenges = challenges.filter((c) =>
    HISTORY_STATUSES.includes(c.status as ChallengeStatus)
  )

  // ── Fetch ──────────────────────────────────────────────────

  const fetchChallenges = useCallback(async () => {
    if (!user) return

    const { data, error: fetchError } = await supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(CHALLENGE_LIMIT)

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    setChallenges((data as Challenge[]) ?? [])
  }, [user, supabase])

  const refreshChallenges = useCallback(async () => {
    await fetchChallenges()
  }, [fetchChallenges])

  // ── Initial load ───────────────────────────────────────────

  useEffect(() => {
    if (!user) {
      setChallenges([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function load() {
      await fetchChallenges()
      if (mounted) setIsLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [user, fetchChallenges])

  // ── Realtime ───────────────────────────────────────────────

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`challenges_${user.id}`)
      .on(
        "postgres_changes" as never,
        {
          event: "*",
          schema: "public",
          table: "challenges",
        },
        () => {
          fetchChallenges()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, fetchChallenges])

  // ── Actions ────────────────────────────────────────────────

  const createChallenge = useCallback(
    async (data: CreateChallengeData) => {
      if (!user) return
      setError(null)

      if (data.stakes < 5) {
        setError("Minimum stake is 5 CoYYns")
        return
      }

      try {
        await spendCoyyns(data.stakes, `Challenge: ${data.title}`, "challenge_stake")

        const { error: insertError } = await supabase.from("challenges").insert({
          creator_id: user.id,
          title: data.title,
          description: data.description ?? null,
          emoji: data.emoji ?? null,
          stakes: data.stakes,
          deadline: data.deadline ?? null,
          status: "pending_acceptance",
        })

        if (insertError) throw insertError

        await refreshChallenges()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create challenge")
      }
    },
    [user, supabase, spendCoyyns, refreshChallenges]
  )

  const acceptChallenge = useCallback(
    async (challengeId: string) => {
      if (!user) return
      setError(null)

      const challenge = challenges.find((c) => c.id === challengeId)
      if (!challenge) {
        setError("Challenge not found")
        return
      }

      try {
        await spendCoyyns(challenge.stakes, `Challenge: ${challenge.title}`, "challenge_stake")

        const { error: updateError } = await supabase
          .from("challenges")
          .update({
            status: "active",
            acceptor_id: user.id,
          })
          .eq("id", challengeId)

        if (updateError) throw updateError

        await refreshChallenges()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to accept challenge")
      }
    },
    [user, supabase, challenges, spendCoyyns, refreshChallenges]
  )

  const declineChallenge = useCallback(
    async (challengeId: string) => {
      if (!user) return
      setError(null)

      try {
        const { error: rpcError } = await supabase.rpc("refund_challenge_stake", {
          p_challenge_id: challengeId,
        })

        if (rpcError) throw rpcError

        await refreshChallenges()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to decline challenge")
      }
    },
    [user, supabase, refreshChallenges]
  )

  const claimVictory = useCallback(
    async (challengeId: string) => {
      if (!user) return
      setError(null)

      try {
        const { error: updateError } = await supabase
          .from("challenges")
          .update({
            status: "pending_resolution",
            claimed_by: user.id,
          })
          .eq("id", challengeId)

        if (updateError) throw updateError

        await refreshChallenges()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to claim victory")
      }
    },
    [user, supabase, refreshChallenges]
  )

  const confirmVictory = useCallback(
    async (challengeId: string) => {
      if (!user) return
      setError(null)

      const challenge = challenges.find((c) => c.id === challengeId)
      if (!challenge || !challenge.claimed_by) {
        setError("Challenge not found or no claimant")
        return
      }

      try {
        const { error: rpcError } = await supabase.rpc("resolve_challenge_payout", {
          p_challenge_id: challengeId,
          p_winner_id: challenge.claimed_by,
          p_amount: challenge.stakes * 2,
        })

        if (rpcError) throw rpcError

        await refreshChallenges()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to confirm victory")
      }
    },
    [user, supabase, challenges, refreshChallenges]
  )

  const disputeChallenge = useCallback(
    async (challengeId: string, reason?: string) => {
      if (!user) return
      setError(null)

      try {
        const { error: updateError } = await supabase
          .from("challenges")
          .update({
            status: "disputed",
            resolution_note: reason ?? null,
          })
          .eq("id", challengeId)

        if (updateError) throw updateError

        await refreshChallenges()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to dispute challenge")
      }
    },
    [user, supabase, refreshChallenges]
  )

  // ── Auth-safe return ───────────────────────────────────────

  if (!user) {
    return {
      activeChallenges: [],
      pendingChallenges: [],
      historyChallenges: [],
      isLoading: false,
      error: null,
      createChallenge: async () => {},
      acceptChallenge: async () => {},
      declineChallenge: async () => {},
      claimVictory: async () => {},
      confirmVictory: async () => {},
      disputeChallenge: async () => {},
      refreshChallenges: async () => {},
    }
  }

  return {
    activeChallenges,
    pendingChallenges,
    historyChallenges,
    isLoading,
    error,
    createChallenge,
    acceptChallenge,
    declineChallenge,
    claimVictory,
    confirmVictory,
    disputeChallenge,
    refreshChallenges,
  }
}

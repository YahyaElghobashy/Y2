import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type {
  Bounty,
  BountyClaim,
  CreateBountyData,
  UseBountiesReturn,
} from "@/lib/types/challenges.types"

export function useBounties(): UseBountiesReturn {
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [bounties, setBounties] = useState<Bounty[]>([])
  const [claims, setClaims] = useState<BountyClaim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Derived state ──────────────────────────────────────────

  const activeBounties = bounties.filter((b) => b.is_active)
  const pendingClaims = claims.filter((c) => c.status === "pending")

  // ── Fetch ──────────────────────────────────────────────────

  const fetchBounties = useCallback(async () => {
    if (!user) return

    const { data, error: fetchError } = await supabase
      .from("bounties")
      .select("*")
      .order("created_at", { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    setBounties((data as Bounty[]) ?? [])
  }, [user, supabase])

  const fetchClaims = useCallback(async () => {
    if (!user) return

    const { data, error: fetchError } = await supabase
      .from("bounty_claims")
      .select("*")
      .order("created_at", { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    setClaims((data as BountyClaim[]) ?? [])
  }, [user, supabase])

  const refreshBounties = useCallback(async () => {
    await Promise.all([fetchBounties(), fetchClaims()])
  }, [fetchBounties, fetchClaims])

  // ── Initial load ───────────────────────────────────────────

  useEffect(() => {
    if (!user) {
      setBounties([])
      setClaims([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function load() {
      await Promise.all([fetchBounties(), fetchClaims()])
      if (mounted) setIsLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [user, fetchBounties, fetchClaims])

  // ── Realtime ───────────────────────────────────────────────

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`bounties_${user.id}`)
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "bounties" },
        () => {
          fetchBounties()
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "bounty_claims" },
        () => {
          fetchClaims()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, fetchBounties, fetchClaims])

  // ── Actions ────────────────────────────────────────────────

  const createBounty = useCallback(
    async (data: CreateBountyData) => {
      if (!user) return
      setError(null)

      if (data.reward <= 0) {
        setError("Reward must be greater than 0")
        return
      }

      try {
        const { error: insertError } = await supabase.from("bounties").insert({
          creator_id: user.id,
          title: data.title,
          trigger_description: data.trigger_description,
          reward: data.reward,
          is_recurring: data.is_recurring ?? true,
        })

        if (insertError) throw insertError

        await refreshBounties()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create bounty")
      }
    },
    [user, supabase, refreshBounties]
  )

  const claimBounty = useCallback(
    async (bountyId: string) => {
      if (!user) return
      setError(null)

      try {
        const { error: insertError } = await supabase.from("bounty_claims").insert({
          bounty_id: bountyId,
          claimer_id: user.id,
        })

        if (insertError) throw insertError

        await refreshBounties()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to claim bounty")
      }
    },
    [user, supabase, refreshBounties]
  )

  const confirmClaim = useCallback(
    async (claimId: string) => {
      if (!user) return
      setError(null)

      try {
        const { error: rpcError } = await supabase.rpc("confirm_bounty_claim", {
          p_claim_id: claimId,
        })

        if (rpcError) throw rpcError

        await refreshBounties()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to confirm claim")
      }
    },
    [user, supabase, refreshBounties]
  )

  const denyClaim = useCallback(
    async (claimId: string) => {
      if (!user) return
      setError(null)

      try {
        const { error: updateError } = await supabase
          .from("bounty_claims")
          .update({ status: "denied" })
          .eq("id", claimId)

        if (updateError) throw updateError

        await refreshBounties()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to deny claim")
      }
    },
    [user, supabase, refreshBounties]
  )

  // ── Auth-safe return ───────────────────────────────────────

  if (!user) {
    return {
      activeBounties: [],
      pendingClaims: [],
      isLoading: false,
      error: null,
      createBounty: async () => {},
      claimBounty: async () => {},
      confirmClaim: async () => {},
      denyClaim: async () => {},
      refreshBounties: async () => {},
    }
  }

  return {
    activeBounties,
    pendingClaims,
    isLoading,
    error,
    createBounty,
    claimBounty,
    confirmClaim,
    denyClaim,
    refreshBounties,
  }
}

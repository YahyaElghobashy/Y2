import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { CoyynsWallet, CoyynsTransaction } from "@/lib/types/coyyns.types"

type UseCoyynsReturn = {
  wallet: CoyynsWallet | null
  partnerWallet: CoyynsWallet | null
  transactions: CoyynsTransaction[]
  isLoading: boolean
  error: string | null
  addCoyyns: (amount: number, description: string, category?: string) => Promise<void>
  spendCoyyns: (amount: number, description: string, category?: string) => Promise<void>
  refreshWallet: () => Promise<void>
}

const TRANSACTION_LIMIT = 50

export function useCoyyns(): UseCoyynsReturn {
  const { user, partner } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [wallet, setWallet] = useState<CoyynsWallet | null>(null)
  const [partnerWallet, setPartnerWallet] = useState<CoyynsWallet | null>(null)
  const [transactions, setTransactions] = useState<CoyynsTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserWallet = useCallback(async (userId: string) => {
    // maybeSingle() (not single()) so a missing wallet row resolves to null
    // instead of a PostgREST 406 error. A user/partner may legitimately have
    // no wallet row yet (pre-051 accounts, or a transient gap before the
    // signup trigger fires); callers treat null as balance 0 / lifetime 0.
    const { data, error: fetchError } = await supabase
      .from("coyyns_wallets")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (fetchError || !data) return null
    return data as CoyynsWallet
  }, [supabase])

  const fetchTransactions = useCallback(async (userId: string) => {
    const { data, error: fetchError } = await supabase
      .from("coyyns_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(TRANSACTION_LIMIT)

    if (fetchError || !data) return []
    return data as CoyynsTransaction[]
  }, [supabase])

  const refreshWallet = useCallback(async () => {
    if (!user) return

    const [walletData, txData] = await Promise.all([
      fetchUserWallet(user.id),
      fetchTransactions(user.id),
    ])

    setWallet(walletData)
    setTransactions(txData)
  }, [user, fetchUserWallet, fetchTransactions])

  // Initial data load
  useEffect(() => {
    if (!user) {
      setWallet(null)
      setPartnerWallet(null)
      setTransactions([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function loadInitialData() {
      const promises: [
        Promise<CoyynsWallet | null>,
        Promise<CoyynsWallet | null>,
        Promise<CoyynsTransaction[]>,
      ] = [
        fetchUserWallet(user!.id),
        partner ? fetchUserWallet(partner.id) : Promise.resolve(null),
        fetchTransactions(user!.id),
      ]

      const [walletData, partnerData, txData] = await Promise.all(promises)

      if (!mounted) return

      setWallet(walletData)
      setPartnerWallet(partnerData)
      setTransactions(txData)
      setIsLoading(false)
    }

    loadInitialData()

    return () => {
      mounted = false
    }
  }, [user, partner, fetchUserWallet, fetchTransactions])

  // Realtime subscription for wallet changes
  useEffect(() => {
    if (!user) return

    const channelName = `coyyns_wallets_${user.id}`
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "coyyns_wallets",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: { new: CoyynsWallet }) => {
          setWallet(payload.new)
        }
      )

    if (partner) {
      channel.on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "coyyns_wallets",
          filter: `user_id=eq.${partner.id}`,
        },
        (payload: { new: CoyynsWallet }) => {
          setPartnerWallet(payload.new)
        }
      )
    }

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, partner, supabase])

  // NOTE: addCoyyns / spendCoyyns THROW on failure. A swallowed failure
  // (setError + return void) let callers proceed as if the transaction
  // succeeded — e.g. delivering a marketplace item with no CoYYns charged.
  // Every caller awaits inside a try/catch and must gate its side effects
  // on success. Do not revert to silent returns.
  const addCoyyns = useCallback(async (
    amount: number,
    description: string,
    category?: string,
  ) => {
    setError(null)

    if (!user) throw new Error("Not authenticated")

    if (!Number.isInteger(amount) || amount <= 0) {
      const message = "Amount must be a positive integer"
      setError(message)
      throw new Error(message)
    }

    const { error: insertError } = await supabase
      .from("coyyns_transactions")
      .insert({
        user_id: user.id,
        amount,
        type: "earn",
        category: category ?? "manual",
        description,
      })

    if (insertError) {
      setError(insertError.message)
      throw new Error(insertError.message)
    }

    await refreshWallet()
  }, [user, supabase, refreshWallet])

  const spendCoyyns = useCallback(async (
    amount: number,
    description: string,
    category?: string,
  ) => {
    setError(null)

    if (!user) throw new Error("Not authenticated")

    if (!Number.isInteger(amount) || amount <= 0) {
      const message = "Amount must be a positive integer"
      setError(message)
      throw new Error(message)
    }

    // Optimistic local guard. The authoritative check is the balance >= 0
    // CHECK constraint enforced by the DB trigger, which rejects the INSERT
    // (and surfaces as insertError below) if the wallet can't cover the spend.
    if (!wallet || wallet.balance < amount) {
      const message = "Insufficient CoYYns balance"
      setError(message)
      throw new Error(message)
    }

    const { error: insertError } = await supabase
      .from("coyyns_transactions")
      .insert({
        user_id: user.id,
        amount: -Math.abs(amount),
        type: "spend",
        category: category ?? "manual",
        description,
      })

    if (insertError) {
      setError(insertError.message)
      throw new Error(insertError.message)
    }

    await refreshWallet()
  }, [user, wallet, supabase, refreshWallet])

  // When user is null, return inert state with no-op functions
  if (!user) {
    return {
      wallet: null,
      partnerWallet: null,
      transactions: [],
      isLoading: false,
      error: null,
      addCoyyns: async () => {},
      spendCoyyns: async () => {},
      refreshWallet: async () => {},
    }
  }

  return {
    wallet,
    partnerWallet,
    transactions,
    isLoading,
    error,
    addCoyyns,
    spendCoyyns,
    refreshWallet,
  }
}

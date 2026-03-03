import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { Coupon, CreateCouponData, UseCouponsReturn } from "@/lib/types/relationship.types"

export function useCoupons(): UseCouponsReturn {
  const { user, partner } = useAuth()
  const supabase = getSupabaseBrowserClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const [myCoupons, setMyCoupons] = useState<Coupon[]>([])
  const [receivedCoupons, setReceivedCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pendingApprovals = useMemo(
    () => myCoupons.filter((c) => c.status === "pending_approval"),
    [myCoupons]
  )

  const fetchCoupons = useCallback(async () => {
    if (!user) return

    try {
      const [myResult, receivedResult] = await Promise.all([
        supabase
          .from("coupons")
          .select("*")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("coupons")
          .select("*")
          .eq("recipient_id", user.id)
          .order("created_at", { ascending: false }),
      ])

      if (myResult.error) {
        setError(myResult.error.message)
      } else {
        setMyCoupons((myResult.data ?? []) as Coupon[])
      }

      if (receivedResult.error) {
        setError(receivedResult.error.message)
      } else {
        setReceivedCoupons((receivedResult.data ?? []) as Coupon[])
      }
    } catch {
      setError("Failed to load coupons")
    }
  }, [user, supabase])

  const refreshCoupons = useCallback(async () => {
    await fetchCoupons()
  }, [fetchCoupons])

  // Initial fetch + realtime subscription
  useEffect(() => {
    if (!user) {
      setMyCoupons([])
      setReceivedCoupons([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function init() {
      await fetchCoupons()
      if (mounted) setIsLoading(false)
    }

    init()

    // Set up realtime
    const channel = supabase
      .channel(`coupons_${user.id}`)
      .on(
        "postgres_changes" as never,
        {
          event: "*",
          schema: "public",
          table: "coupons",
        },
        () => {
          fetchCoupons()
        }
      )

    channel.subscribe()
    channelRef.current = channel

    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user, supabase, fetchCoupons])

  const createCoupon = useCallback(
    async (data: CreateCouponData): Promise<Coupon> => {
      setError(null)

      if (!user) throw new Error("Not authenticated")
      if (!partner) {
        setError("Partner not connected")
        throw new Error("Partner not connected")
      }

      const { data: inserted, error: insertError } = await supabase
        .from("coupons")
        .insert({
          creator_id: user.id,
          recipient_id: partner.id,
          title: data.title,
          description: data.description ?? null,
          emoji: data.emoji ?? null,
          category: data.category ?? "general",
          image_url: data.image_url ?? null,
          status: "active",
          is_surprise: data.is_surprise ?? false,
          surprise_revealed: data.is_surprise ? false : true,
          expires_at: data.expires_at ?? null,
        })
        .select()
        .single()

      if (insertError || !inserted) {
        const msg = insertError?.message ?? "Failed to create coupon"
        setError(msg)
        throw new Error(msg)
      }

      await refreshCoupons()
      return inserted as Coupon
    },
    [user, partner, supabase, refreshCoupons]
  )

  const redeemCoupon = useCallback(
    async (couponId: string) => {
      setError(null)

      if (!user || !partner) return

      // Find the coupon
      const coupon = receivedCoupons.find((c) => c.id === couponId)
      if (!coupon || coupon.status !== "active") {
        setError("Coupon is not redeemable")
        return
      }

      const { error: updateError } = await supabase
        .from("coupons")
        .update({ status: "pending_approval", redeemed_at: new Date().toISOString() })
        .eq("id", couponId)

      if (updateError) {
        setError(updateError.message)
        return
      }

      await refreshCoupons()
    },
    [user, partner, receivedCoupons, supabase, refreshCoupons]
  )

  const approveCoupon = useCallback(
    async (couponId: string) => {
      setError(null)

      if (!user || !partner) return

      const coupon = myCoupons.find((c) => c.id === couponId)
      if (!coupon || coupon.status !== "pending_approval") {
        setError("Coupon is not awaiting approval")
        return
      }

      const { error: updateError } = await supabase
        .from("coupons")
        .update({ status: "redeemed", approved_at: new Date().toISOString() })
        .eq("id", couponId)

      if (updateError) {
        setError(updateError.message)
        return
      }

      await refreshCoupons()
    },
    [user, partner, myCoupons, supabase, refreshCoupons]
  )

  const rejectCoupon = useCallback(
    async (couponId: string, reason?: string) => {
      setError(null)

      if (!user || !partner) return

      const coupon = myCoupons.find((c) => c.id === couponId)
      if (!coupon || coupon.status !== "pending_approval") {
        setError("Coupon is not awaiting approval")
        return
      }

      const { error: updateError } = await supabase
        .from("coupons")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
          rejection_reason: reason ?? null,
        })
        .eq("id", couponId)

      if (updateError) {
        setError(updateError.message)
        return
      }

      await refreshCoupons()
    },
    [user, partner, myCoupons, supabase, refreshCoupons]
  )

  const revealSurprise = useCallback(
    async (couponId: string) => {
      setError(null)

      if (!user || !partner) return

      const coupon = myCoupons.find((c) => c.id === couponId)
      if (!coupon) return
      if (coupon.surprise_revealed) return

      const { error: updateError } = await supabase
        .from("coupons")
        .update({ surprise_revealed: true })
        .eq("id", couponId)

      if (updateError) {
        setError(updateError.message)
        return
      }

      // Log the reveal event
      await supabase.from("coupon_history").insert({
        coupon_id: couponId,
        event: "revealed",
        actor_id: user.id,
      })

      await refreshCoupons()
    },
    [user, partner, myCoupons, supabase, refreshCoupons]
  )

  if (!user) {
    return {
      myCoupons: [],
      receivedCoupons: [],
      pendingApprovals: [],
      isLoading: false,
      error: null,
      createCoupon: async () => {
        throw new Error("Not authenticated")
      },
      redeemCoupon: async () => {},
      approveCoupon: async () => {},
      rejectCoupon: async () => {},
      revealSurprise: async () => {},
      refreshCoupons: async () => {},
    }
  }

  return {
    myCoupons,
    receivedCoupons,
    pendingApprovals,
    isLoading,
    error,
    createCoupon,
    redeemCoupon,
    approveCoupon,
    rejectCoupon,
    revealSurprise,
    refreshCoupons,
  }
}

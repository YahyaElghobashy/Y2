"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { Coupon } from "@/lib/types/relationship.types"

const LAST_SEEN_KEY = "last_coupon_seen_at"

export type UseNewCouponDetectionReturn = {
  newCoupon: Coupon | null
  showAnimation: boolean
  onAnimationComplete: () => void
  onSaveForLater: () => void
}

export function useNewCouponDetection(): UseNewCouponDetectionReturn {
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()
  const [newCoupon, setNewCoupon] = useState<Coupon | null>(null)
  const [showAnimation, setShowAnimation] = useState(false)
  const checkingRef = useRef(false)

  const checkForNewCoupons = useCallback(async () => {
    if (!user || checkingRef.current) return
    checkingRef.current = true

    try {
      const lastSeen = localStorage.getItem(LAST_SEEN_KEY) ?? "1970-01-01T00:00:00Z"

      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("recipient_id", user.id)
        .eq("status", "active")
        .gt("created_at", lastSeen)
        .order("created_at", { ascending: false })
        .limit(1)

      if (error || !data || data.length === 0) return

      const coupon = data[0] as Coupon
      setNewCoupon(coupon)
      setShowAnimation(true)
    } finally {
      checkingRef.current = false
    }
  }, [user, supabase])

  // Check on mount
  useEffect(() => {
    if (!user) return
    checkForNewCoupons()
  }, [user, checkForNewCoupons])

  // Re-check on visibility change (app focus)
  useEffect(() => {
    if (!user) return

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        checkForNewCoupons()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [user, checkForNewCoupons])

  const markAsSeen = useCallback(() => {
    if (newCoupon) {
      localStorage.setItem(LAST_SEEN_KEY, newCoupon.created_at)
    }
    setShowAnimation(false)
    setNewCoupon(null)
  }, [newCoupon])

  const onAnimationComplete = useCallback(() => {
    markAsSeen()
  }, [markAsSeen])

  const onSaveForLater = useCallback(() => {
    markAsSeen()
  }, [markAsSeen])

  if (!user) {
    return {
      newCoupon: null,
      showAnimation: false,
      onAnimationComplete: () => {},
      onSaveForLater: () => {},
    }
  }

  return {
    newCoupon,
    showAnimation,
    onAnimationComplete,
    onSaveForLater,
  }
}

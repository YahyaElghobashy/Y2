import { useState, useEffect, useRef } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"

const DAILY_BONUS_AMOUNT = 5
const DAILY_BONUS_CATEGORY = "daily_bonus"
const DAILY_BONUS_DESCRIPTION = "Daily login bonus"

type UseDailyBonusReturn = {
  claimed: boolean
  justClaimed: boolean
}

/**
 * Returns today's and tomorrow's dates in UTC as YYYY-MM-DD strings.
 * Uses UTC to prevent timezone boundary issues.
 * Returns [today, tomorrow] for half-open interval [today 00:00, tomorrow 00:00).
 */
function getUTCDateBounds(): [string, string] {
  const now = new Date()
  const today = now.toISOString().split("T")[0]
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  )
    .toISOString()
    .split("T")[0]
  return [today, tomorrow]
}

/**
 * Hook that checks for and awards daily login bonus CoYYns.
 *
 * On mount (home page load), checks coyyns_transactions for today's
 * date with category = 'daily_bonus'. If none exists, inserts a +5
 * earn transaction. Returns { claimed, justClaimed } for UI feedback.
 *
 * - claimed: true if bonus was already claimed or just claimed
 * - justClaimed: true only on the first render that triggers the bonus
 */
export function useDailyBonus(): UseDailyBonusReturn {
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [claimed, setClaimed] = useState(false)
  const [justClaimed, setJustClaimed] = useState(false)
  const hasChecked = useRef(false)

  useEffect(() => {
    if (!user || hasChecked.current) return
    hasChecked.current = true

    const [todayUTC, tomorrowUTC] = getUTCDateBounds()

    async function checkAndClaim() {
      // Check if bonus already claimed today (half-open interval)
      const { data: existing, error: checkError } = await supabase
        .from("coyyns_transactions")
        .select("id")
        .eq("user_id", user!.id)
        .eq("category", DAILY_BONUS_CATEGORY)
        .gte("created_at", `${todayUTC}T00:00:00.000Z`)
        .lt("created_at", `${tomorrowUTC}T00:00:00.000Z`)
        .limit(1)

      if (checkError) {
        // Silently fail — bonus is non-critical
        return
      }

      if (existing && existing.length > 0) {
        // Already claimed today
        setClaimed(true)
        return
      }

      // Claim the bonus
      const { error: insertError } = await supabase
        .from("coyyns_transactions")
        .insert({
          user_id: user!.id,
          amount: DAILY_BONUS_AMOUNT,
          type: "earn",
          category: DAILY_BONUS_CATEGORY,
          description: DAILY_BONUS_DESCRIPTION,
        })

      if (insertError) {
        // Silently fail — bonus is non-critical
        return
      }

      setClaimed(true)
      setJustClaimed(true)
    }

    checkAndClaim()
  }, [user, supabase])

  // If user is not authenticated, return inert state
  if (!user) {
    return { claimed: false, justClaimed: false }
  }

  return { claimed, justClaimed }
}

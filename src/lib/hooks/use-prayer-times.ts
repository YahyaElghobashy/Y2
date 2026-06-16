import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import {
  computePrayerTimes,
  getNextPrayer,
  formatPrayerTime,
  formatCountdown,
  type DailyPrayerTimes,
  type NextPrayer,
} from "@/lib/prayer/compute"

/** A formatted prayer row for the UI (no raw Dates needed by the view). */
export type PrayerTimeRow = {
  key: string
  /** Localized "h:mm AM/PM". */
  label: string
  /** True for the single next-upcoming obligatory prayer. */
  isNext: boolean
}

export type UsePrayerTimesReturn = {
  /** Computed times for today, or null when no location is set. */
  times: DailyPrayerTimes | null
  /** Formatted rows for the 5 obligatory prayers + sunrise. */
  rows: PrayerTimeRow[]
  /** Next obligatory prayer (today or tomorrow's Fajr), or null with no location. */
  next: (NextPrayer & { label: string }) | null
  /** Live "h:mm:ss" countdown to the next prayer. */
  countdown: string | null
  /** True when the profile has no saved coordinates. */
  needsLocation: boolean
  /** Detect device location and persist it. Resolves true on success. */
  detectLocation: () => Promise<boolean>
  /** Manually persist coordinates (e.g. from a city picker / fallback). */
  setLocation: (lat: number, lng: number) => Promise<boolean>
  isSaving: boolean
  error: string | null
}

/**
 * use-prayer-times — factual, location-based prayer times.
 *
 * Reads the user's saved lat/lng from their profile and COMPUTES the five
 * daily prayers (+ sunrise) with the adhan library. No fabricated times.
 * When no location is saved, exposes `needsLocation` so the UI can prompt.
 */
export function usePrayerTimes(): UsePrayerTimesReturn {
  const { user, profile, refreshProfile } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [now, setNow] = useState<Date>(() => new Date())
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const lat = profile?.latitude ?? null
  const lng = profile?.longitude ?? null
  const method = profile?.prayer_method ?? null
  const timeZone = profile?.timezone ?? null
  const hasLocation = lat != null && lng != null

  // Tick once a second so the countdown stays live.
  useEffect(() => {
    if (!hasLocation) return
    intervalRef.current = setInterval(() => setNow(new Date()), 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [hasLocation])

  const times = useMemo<DailyPrayerTimes | null>(() => {
    if (lat == null || lng == null) return null
    return computePrayerTimes(lat, lng, method, now)
    // Recompute only when location/method/day changes — `now` ticks every
    // second but the date portion rarely changes; cheap enough to recompute.
  }, [lat, lng, method, now])

  const next = useMemo(() => {
    if (lat == null || lng == null) return null
    const n = getNextPrayer(lat, lng, method, now)
    return { ...n, label: formatPrayerTime(n.time, timeZone) }
  }, [lat, lng, method, timeZone, now])

  const rows = useMemo<PrayerTimeRow[]>(() => {
    if (!times) return []
    return times.slots.map((s) => ({
      key: s.key,
      label: formatPrayerTime(s.time, timeZone),
      // sunrise is never an obligatory "next" prayer; next.key is always a
      // PrayerName so it can never equal "sunrise" anyway.
      isNext: s.key !== "sunrise" && next?.key === s.key,
    }))
  }, [times, next, timeZone])

  const countdown = useMemo(() => (next ? formatCountdown(next.msUntil) : null), [next])

  const persist = useCallback(
    async (latitude: number, longitude: number): Promise<boolean> => {
      if (!user) {
        setError("Not signed in")
        return false
      }
      setIsSaving(true)
      setError(null)
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || null
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ latitude, longitude, timezone: tz })
        .eq("id", user.id)

      setIsSaving(false)
      if (updateError) {
        setError(updateError.message)
        return false
      }
      await refreshProfile()
      return true
    },
    [user, supabase, refreshProfile],
  )

  const setLocation = useCallback(
    (lat: number, lng: number) => persist(lat, lng),
    [persist],
  )

  const detectLocation = useCallback((): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not available on this device.")
      return Promise.resolve(false)
    }
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const ok = await persist(pos.coords.latitude, pos.coords.longitude)
          resolve(ok)
        },
        (geoErr) => {
          setError(geoErr.message || "Could not get your location.")
          resolve(false)
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
      )
    })
  }, [persist])

  return {
    times,
    rows,
    next,
    countdown,
    needsLocation: !hasLocation,
    detectLocation,
    setLocation,
    isSaving,
    error,
  }
}

import { useState, useEffect, useCallback, useMemo } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type {
  WheelPreset,
  WheelSession,
  WheelSpin,
  WheelItem,
  WheelMode,
  CreatePresetInput,
  SpinResult,
} from "@/lib/types/wheel.types"

type UseWheelReturn = {
  presets: WheelPreset[]
  isLoading: boolean
  error: string | null
  createPreset: (data: CreatePresetInput) => Promise<string | null>
  updatePreset: (id: string, data: Partial<CreatePresetInput>) => Promise<void>
  deletePreset: (id: string) => Promise<void>
  activeSession: WheelSession | null
  startSession: (presetId: string, mode: WheelMode, bestOfTarget?: number) => Promise<void>
  spin: () => { resultIndex: number; angle: number; label: string }
  recordSpin: (result: SpinResult) => Promise<void>
  abandonSession: () => Promise<void>
  completeSession: (winnerLabel: string) => Promise<void>
  currentSpins: WheelSpin[]
  remainingItems: WheelItem[]
  tally: Record<string, number>
  isComplete: boolean
  winner: string | null
  sessionHistory: WheelSession[]
}

export function useWheel(): UseWheelReturn {
  const { user, partner } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [presets, setPresets] = useState<WheelPreset[]>([])
  const [sessions, setSessions] = useState<WheelSession[]>([])
  const [currentSpins, setCurrentSpins] = useState<WheelSpin[]>([])
  const [remainingItems, setRemainingItems] = useState<WheelItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch presets + sessions ────────────────────────────────
  useEffect(() => {
    if (!user) {
      setPresets([])
      setSessions([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function load() {
      const { data: presetData, error: presetErr } = await supabase
        .from("wheel_presets")
        .select("*")
        .order("created_at", { ascending: false })

      if (!mounted) return

      if (presetErr) {
        setError(presetErr.message)
        setIsLoading(false)
        return
      }

      setPresets((presetData ?? []) as WheelPreset[])

      const { data: sessionData, error: sessionErr } = await supabase
        .from("wheel_sessions")
        .select("*")
        .order("created_at", { ascending: false })

      if (!mounted) return

      if (sessionErr) {
        setError(sessionErr.message)
        setIsLoading(false)
        return
      }

      setSessions((sessionData ?? []) as WheelSession[])
      setIsLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [user, supabase])

  // ── Load spins for active session ──────────────────────────
  const activeSession = useMemo(
    () => sessions.find((s) => s.status === "active") ?? null,
    [sessions]
  )

  useEffect(() => {
    if (!activeSession) {
      setCurrentSpins([])
      setRemainingItems([])
      return
    }

    let mounted = true

    async function loadSpins() {
      const { data, error: spinErr } = await supabase
        .from("wheel_spins")
        .select("*")
        .eq("session_id", activeSession!.id)
        .order("spin_number", { ascending: true })

      if (!mounted) return

      if (spinErr) {
        setError(spinErr.message)
        return
      }

      const spins = (data ?? []) as WheelSpin[]
      setCurrentSpins(spins)

      // Derive remaining items from last spin or preset
      if (spins.length > 0) {
        const last = spins[spins.length - 1]
        if (last.remaining_items) {
          setRemainingItems(last.remaining_items)
        }
      } else {
        // Get items from preset
        const preset = presets.find((p) => p.id === activeSession!.preset_id)
        if (preset) {
          setRemainingItems(preset.items)
        }
      }
    }

    loadSpins()

    return () => {
      mounted = false
    }
  }, [activeSession, supabase, presets])

  // ── Realtime subscriptions ─────────────────────────────────
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("wheel_realtime")
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "wheel_presets" },
        (payload: { eventType: string; new: WheelPreset; old: { id: string } }) => {
          if (payload.eventType === "INSERT") {
            setPresets((prev) => {
              if (prev.some((p) => p.id === payload.new.id)) return prev
              return [payload.new, ...prev]
            })
          } else if (payload.eventType === "UPDATE") {
            setPresets((prev) =>
              prev.map((p) => (p.id === payload.new.id ? payload.new : p))
            )
          } else if (payload.eventType === "DELETE") {
            setPresets((prev) => prev.filter((p) => p.id !== payload.old.id))
          }
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "wheel_sessions" },
        (payload: { eventType: string; new: WheelSession }) => {
          if (payload.eventType === "INSERT") {
            setSessions((prev) => {
              if (prev.some((s) => s.id === payload.new.id)) return prev
              return [payload.new, ...prev]
            })
          } else if (payload.eventType === "UPDATE") {
            setSessions((prev) =>
              prev.map((s) => (s.id === payload.new.id ? payload.new : s))
            )
          }
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "INSERT", schema: "public", table: "wheel_spins" },
        (payload: { new: WheelSpin }) => {
          setCurrentSpins((prev) => {
            if (prev.some((s) => s.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
          if (payload.new.remaining_items) {
            setRemainingItems(payload.new.remaining_items)
          }
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // ── Derived state ──────────────────────────────────────────

  const tally = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const spin of currentSpins) {
      counts[spin.result_label] = (counts[spin.result_label] ?? 0) + 1
    }
    return counts
  }, [currentSpins])

  const isComplete = useMemo(() => {
    if (!activeSession) return false
    return activeSession.status === "completed"
  }, [activeSession])

  const winner = useMemo(() => {
    if (!activeSession) return null
    return activeSession.winner_label
  }, [activeSession])

  const sessionHistory = useMemo(
    () => sessions.filter((s) => s.status !== "active"),
    [sessions]
  )

  // ── Actions ────────────────────────────────────────────────

  const createPreset = useCallback(
    async (data: CreatePresetInput): Promise<string | null> => {
      setError(null)
      if (!user) return null

      const items: WheelItem[] = data.items.map((item) => ({
        id: crypto.randomUUID(),
        ...item,
      }))

      const { data: inserted, error: insertErr } = await supabase
        .from("wheel_presets")
        .insert({
          user_id: user.id,
          name: data.name,
          icon: data.icon ?? "🎯",
          items: JSON.parse(JSON.stringify(items)),
          is_shared: data.is_shared ?? true,
        })
        .select("*")
        .single()

      if (insertErr) {
        setError(insertErr.message)
        return null
      }

      const preset = inserted as WheelPreset
      setPresets((prev) => [preset, ...prev])
      return preset.id
    },
    [user, supabase]
  )

  const updatePreset = useCallback(
    async (id: string, data: Partial<CreatePresetInput>) => {
      setError(null)
      if (!user) return

      const updates: Record<string, unknown> = {}
      if (data.name !== undefined) updates.name = data.name
      if (data.icon !== undefined) updates.icon = data.icon
      if (data.is_shared !== undefined) updates.is_shared = data.is_shared
      if (data.items !== undefined) {
        updates.items = JSON.parse(
          JSON.stringify(
            data.items.map((item) => ({
              id: crypto.randomUUID(),
              ...item,
            }))
          )
        )
      }

      const prev = presets.find((p) => p.id === id)
      if (prev) {
        setPresets((all) =>
          all.map((p) => (p.id === id ? { ...p, ...updates } as WheelPreset : p))
        )
      }

      const { error: updateErr } = await supabase
        .from("wheel_presets")
        .update(updates)
        .eq("id", id)

      if (updateErr) {
        if (prev) setPresets((all) => all.map((p) => (p.id === id ? prev : p)))
        setError(updateErr.message)
      }
    },
    [user, supabase, presets]
  )

  const deletePreset = useCallback(
    async (id: string) => {
      setError(null)
      if (!user) return

      const prev = presets.find((p) => p.id === id)
      setPresets((all) => all.filter((p) => p.id !== id))

      const { error: deleteErr } = await supabase
        .from("wheel_presets")
        .delete()
        .eq("id", id)

      if (deleteErr) {
        if (prev) setPresets((all) => [prev, ...all])
        setError(deleteErr.message)
      }
    },
    [user, supabase, presets]
  )

  const startSession = useCallback(
    async (presetId: string, mode: WheelMode, bestOfTarget?: number) => {
      setError(null)
      if (!user) return

      const { data: inserted, error: insertErr } = await supabase
        .from("wheel_sessions")
        .insert({
          preset_id: presetId,
          started_by: user.id,
          mode,
          best_of_target: mode === "best_of" ? (bestOfTarget ?? 3) : null,
        })
        .select("*")
        .single()

      if (insertErr) {
        setError(insertErr.message)
        return
      }

      const session = inserted as WheelSession
      setSessions((prev) => [session, ...prev])
      setCurrentSpins([])

      // Initialize remaining items from preset
      const preset = presets.find((p) => p.id === presetId)
      if (preset) {
        setRemainingItems(preset.items)
      }
    },
    [user, supabase, presets]
  )

  const spin = useCallback(() => {
    if (remainingItems.length === 0) {
      return { resultIndex: 0, angle: 0, label: "" }
    }

    // Weighted random selection
    const totalWeight = remainingItems.reduce(
      (sum, item) => sum + (item.weight ?? 1),
      0
    )
    let random = Math.random() * totalWeight
    let resultIndex = 0

    for (let i = 0; i < remainingItems.length; i++) {
      random -= remainingItems[i].weight ?? 1
      if (random <= 0) {
        resultIndex = i
        break
      }
    }

    // Calculate angle: 3-6 full rotations + landing position
    const sliceAngle = 360 / remainingItems.length
    const landingAngle = resultIndex * sliceAngle + sliceAngle / 2
    const fullRotations = (3 + Math.random() * 3) * 360
    const angle = fullRotations + (360 - landingAngle)

    return {
      resultIndex,
      angle,
      label: remainingItems[resultIndex].label,
    }
  }, [remainingItems])

  const recordSpin = useCallback(
    async (result: SpinResult) => {
      setError(null)
      if (!user || !activeSession) return

      const spinNumber = currentSpins.length + 1

      // For elimination mode, compute new remaining items
      let newRemaining: WheelItem[] | undefined
      let eliminatedItem: string | undefined

      if (activeSession.mode === "elimination") {
        eliminatedItem = result.label
        newRemaining = remainingItems.filter(
          (item) => item.label !== result.label
        )
        setRemainingItems(newRemaining)
      }

      const spinRecord: WheelSpin = {
        id: crypto.randomUUID(),
        session_id: activeSession.id,
        spin_number: spinNumber,
        spun_by: user.id,
        result_label: result.label,
        result_index: result.resultIndex,
        remaining_items: newRemaining ?? result.remainingItems ?? null,
        eliminated_item: eliminatedItem ?? result.eliminatedItem ?? null,
        spin_duration_ms: result.spinDurationMs ?? null,
        created_at: new Date().toISOString(),
      }

      setCurrentSpins((prev) => [...prev, spinRecord])

      const { error: insertErr } = await supabase
        .from("wheel_spins")
        .insert({
          session_id: activeSession.id,
          spin_number: spinNumber,
          spun_by: user.id,
          result_label: result.label,
          result_index: result.resultIndex,
          remaining_items: newRemaining
            ? JSON.parse(JSON.stringify(newRemaining))
            : null,
          eliminated_item: eliminatedItem ?? null,
          spin_duration_ms: result.spinDurationMs ?? null,
        })
        .select("*")
        .single()

      if (insertErr) {
        setCurrentSpins((prev) => prev.filter((s) => s.id !== spinRecord.id))
        setError(insertErr.message)
      }
    },
    [user, activeSession, currentSpins, remainingItems, supabase]
  )

  const abandonSession = useCallback(async () => {
    setError(null)
    if (!activeSession) return

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id ? { ...s, status: "abandoned" as const } : s
      )
    )

    const { error: updateErr } = await supabase
      .from("wheel_sessions")
      .update({ status: "abandoned" })
      .eq("id", activeSession.id)

    if (updateErr) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id ? { ...s, status: "active" as const } : s
        )
      )
      setError(updateErr.message)
    }
  }, [activeSession, supabase])

  const completeSession = useCallback(
    async (winnerLabel: string) => {
      setError(null)
      if (!activeSession) return

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? { ...s, status: "completed" as const, winner_label: winnerLabel }
            : s
        )
      )

      const { error: updateErr } = await supabase
        .from("wheel_sessions")
        .update({ status: "completed", winner_label: winnerLabel })
        .eq("id", activeSession.id)

      if (updateErr) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSession.id
              ? { ...s, status: "active" as const, winner_label: null }
              : s
          )
        )
        setError(updateErr.message)
      }
    },
    [activeSession, supabase]
  )

  // ── Inert return when no user ──────────────────────────────
  if (!user) {
    return {
      presets: [],
      isLoading: false,
      error: null,
      createPreset: async () => null,
      updatePreset: async () => {},
      deletePreset: async () => {},
      activeSession: null,
      startSession: async () => {},
      spin: () => ({ resultIndex: 0, angle: 0, label: "" }),
      recordSpin: async () => {},
      abandonSession: async () => {},
      completeSession: async () => {},
      currentSpins: [],
      remainingItems: [],
      tally: {},
      isComplete: false,
      winner: null,
      sessionHistory: [],
    }
  }

  return {
    presets,
    isLoading,
    error,
    createPreset,
    updatePreset,
    deletePreset,
    activeSession,
    startSession,
    spin,
    recordSpin,
    abandonSession,
    completeSession,
    currentSpins,
    remainingItems,
    tally,
    isComplete,
    winner,
    sessionHistory,
  }
}

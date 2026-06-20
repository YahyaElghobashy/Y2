import { useState, useEffect, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import { uid } from "@/components/decide/shared/random"
import type { DecideOption, DecideResult, SelectorKind } from "@/components/decide/contract"
import type { Decision, DecisionRow, SaveDecisionInput } from "@/lib/types/decisions.types"

type UseDecisionsReturn = {
  decisions: Decision[]
  isLoading: boolean
  error: string | null
  /** Persist a finished decision. Returns the new row id, or null on failure. */
  saveDecision: (input: SaveDecisionInput) => Promise<string | null>
  /** Delete one of the current user's own decisions. */
  clearDecision: (id: string) => Promise<void>
}

/** Narrow a raw DB row's jsonb columns to the suite contract types. */
function toDecision(row: DecisionRow): Decision {
  return {
    id: row.id,
    created_by: row.created_by,
    kind: row.kind as SelectorKind,
    tool_id: row.tool_id,
    options: (Array.isArray(row.options) ? row.options : []) as unknown as DecideOption[],
    result: (row.result ?? {}) as unknown as DecideResult,
    created_at: row.created_at,
  }
}

/**
 * useDecisions — own + partner-shared rows of `decision_history` (read via RLS,
 * which already returns the couple's rows). Mirrors the repo hook pattern:
 * mounted-guard fetch → realtime subscription → optimistic insert with rollback
 * → inert no-user return.
 */
export function useDecisions(): UseDecisionsReturn {
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [decisions, setDecisions] = useState<Decision[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch on mount (own + partner via RLS) ──────────────────
  useEffect(() => {
    if (!user) {
      setDecisions([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function load() {
      const { data, error: fetchErr } = await supabase
        .from("decision_history")
        .select("*")
        .order("created_at", { ascending: false })

      if (!mounted) return

      if (fetchErr) {
        setError(fetchErr.message)
        setIsLoading(false)
        return
      }

      setDecisions(((data ?? []) as DecisionRow[]).map(toDecision))
      setIsLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [user, supabase])

  // ── Realtime: keep the couple's feed in sync ────────────────
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("decision_history_realtime")
      .on(
        "postgres_changes" as never,
        { event: "INSERT", schema: "public", table: "decision_history" },
        (payload: { new: DecisionRow }) => {
          const incoming = toDecision(payload.new)
          setDecisions((prev) => {
            if (prev.some((d) => d.id === incoming.id)) return prev
            return [incoming, ...prev]
          })
        },
      )
      .on(
        "postgres_changes" as never,
        { event: "DELETE", schema: "public", table: "decision_history" },
        (payload: { old: { id: string } }) => {
          setDecisions((prev) => prev.filter((d) => d.id !== payload.old.id))
        },
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // ── Save a finished decision (optimistic + rollback) ────────
  const saveDecision = useCallback(
    async (input: SaveDecisionInput): Promise<string | null> => {
      setError(null)
      if (!user) return null

      const tempId = uid()
      const optimistic: Decision = {
        id: tempId,
        created_by: user.id,
        kind: input.kind,
        tool_id: input.toolId,
        options: input.options,
        result: input.result,
        created_at: new Date().toISOString(),
      }
      setDecisions((prev) => [optimistic, ...prev])

      const { data: inserted, error: insertErr } = await supabase
        .from("decision_history")
        .insert({
          created_by: user.id,
          kind: input.kind,
          tool_id: input.toolId,
          options: JSON.parse(JSON.stringify(input.options)),
          result: JSON.parse(JSON.stringify(input.result)),
        })
        .select("*")
        .single()

      if (insertErr || !inserted) {
        setDecisions((prev) => prev.filter((d) => d.id !== tempId))
        setError(insertErr?.message ?? "Failed to save decision")
        return null
      }

      const saved = toDecision(inserted as DecisionRow)
      setDecisions((prev) => prev.map((d) => (d.id === tempId ? saved : d)))
      return saved.id
    },
    [user, supabase],
  )

  // ── Clear one own decision (optimistic + rollback) ──────────
  const clearDecision = useCallback(
    async (id: string): Promise<void> => {
      setError(null)
      if (!user) return

      const prev = decisions.find((d) => d.id === id)
      setDecisions((all) => all.filter((d) => d.id !== id))

      const { error: deleteErr } = await supabase
        .from("decision_history")
        .delete()
        .eq("id", id)

      if (deleteErr) {
        if (prev) setDecisions((all) => [prev, ...all])
        setError(deleteErr.message)
      }
    },
    [user, supabase, decisions],
  )

  // ── Inert return when no user ───────────────────────────────
  if (!user) {
    return {
      decisions: [],
      isLoading: false,
      error: null,
      saveDecision: async () => null,
      clearDecision: async () => {},
    }
  }

  return { decisions, isLoading, error, saveDecision, clearDecision }
}

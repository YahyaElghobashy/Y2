import { useState, useEffect, useCallback, useRef } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type { AzkarSession } from "@/lib/types/spiritual.types"
import { type AzkarSessionType } from "@/lib/types/spiritual.types"

type UseAzkarReturn = {
  session: AzkarSession | null
  sessionType: AzkarSessionType
  increment: () => void
  reset: () => void
  setTarget: (target: number) => void
  switchType: (type: AzkarSessionType) => void
  isLoading: boolean
  error: string | null
  justCompleted: boolean
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0]
}

export function useAzkar(): UseAzkarReturn {
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [session, setSession] = useState<AzkarSession | null>(null)
  const [sessionType, setSessionType] = useState<AzkarSessionType>("morning")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [justCompleted, setJustCompleted] = useState(false)
  const completedRef = useRef(false)

  // Fetch session on mount and when type changes
  useEffect(() => {
    if (!user) {
      setSession(null)
      setIsLoading(false)
      return
    }

    let mounted = true
    const date = getTodayDate()

    async function loadSession() {
      setIsLoading(true)

      const { data, error: fetchError } = await supabase
        .from("azkar_sessions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", date)
        .eq("session_type", sessionType)
        .maybeSingle()

      if (!mounted) return

      if (fetchError) {
        setError(fetchError.message)
        setIsLoading(false)
        return
      }

      if (!data) {
        // Upsert new session
        const { data: newRow, error: upsertError } = await supabase
          .from("azkar_sessions")
          .upsert(
            { user_id: user!.id, date, session_type: sessionType },
            { onConflict: "user_id,date,session_type" }
          )
          .select("*")
          .single()

        if (!mounted) return

        if (upsertError) {
          setError(upsertError.message)
        } else {
          setSession(newRow as AzkarSession)
        }
      } else {
        setSession(data as AzkarSession)
      }

      setIsLoading(false)
    }

    completedRef.current = false
    setJustCompleted(false)
    loadSession()

    return () => {
      mounted = false
    }
  }, [user, supabase, sessionType])

  const increment = useCallback(() => {
    if (!user || !session) return

    const newCount = session.count + 1

    // Optimistic update
    setSession((prev) => (prev ? { ...prev, count: newCount } : prev))

    // Check for completion (fire once per target reach)
    if (newCount >= session.target && !completedRef.current) {
      completedRef.current = true
      setJustCompleted(true)
    }

    const date = getTodayDate()

    supabase
      .from("azkar_sessions")
      .upsert(
        { user_id: user.id, date, session_type: sessionType, count: newCount },
        { onConflict: "user_id,date,session_type" }
      )
      .then(({ error: upsertError }) => {
        if (upsertError) {
          setSession((prev) =>
            prev ? { ...prev, count: session.count } : prev
          )
          setError(upsertError.message)
        }
      })
  }, [user, session, supabase, sessionType])

  const reset = useCallback(() => {
    if (!user || !session) return

    const prevCount = session.count

    // Optimistic update
    setSession((prev) => (prev ? { ...prev, count: 0 } : prev))
    completedRef.current = false
    setJustCompleted(false)

    const date = getTodayDate()

    supabase
      .from("azkar_sessions")
      .upsert(
        { user_id: user.id, date, session_type: sessionType, count: 0 },
        { onConflict: "user_id,date,session_type" }
      )
      .then(({ error: upsertError }) => {
        if (upsertError) {
          setSession((prev) =>
            prev ? { ...prev, count: prevCount } : prev
          )
          setError(upsertError.message)
        }
      })
  }, [user, session, supabase, sessionType])

  const setTarget = useCallback(
    (target: number) => {
      if (!user || !session) return
      if (target < 1) return

      const prevTarget = session.target

      setSession((prev) => (prev ? { ...prev, target } : prev))

      const date = getTodayDate()

      supabase
        .from("azkar_sessions")
        .upsert(
          { user_id: user.id, date, session_type: sessionType, target },
          { onConflict: "user_id,date,session_type" }
        )
        .then(({ error: upsertError }) => {
          if (upsertError) {
            setSession((prev) =>
              prev ? { ...prev, target: prevTarget } : prev
            )
            setError(upsertError.message)
          }
        })
    },
    [user, session, supabase, sessionType]
  )

  const switchType = useCallback((type: AzkarSessionType) => {
    setSessionType(type)
  }, [])

  if (!user) {
    return {
      session: null,
      sessionType: "morning",
      increment: () => {},
      reset: () => {},
      setTarget: () => {},
      switchType: () => {},
      isLoading: false,
      error: null,
      justCompleted: false,
    }
  }

  return {
    session,
    sessionType,
    increment,
    reset,
    setTarget,
    switchType,
    isLoading,
    error,
    justCompleted,
  }
}

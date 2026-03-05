import { useState, useEffect, useCallback, useMemo } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import { getPromptForDate, PROMPTS_BANK } from "@/data/prompts-bank"
import type { CouplePrompt, PromptAnswer } from "@/lib/types/prompts.types"

type PromptWithAnswers = CouplePrompt & {
  my_answer?: PromptAnswer
  partner_answer?: PromptAnswer
}

type UseDailyPromptReturn = {
  todayPrompt: CouplePrompt | null
  myAnswer: PromptAnswer | null
  partnerAnswer: PromptAnswer | null
  history: PromptWithAnswers[]
  streak: number
  isLoading: boolean
  error: string | null
  submitAnswer: (text: string) => Promise<void>
}

export function useDailyPrompt(): UseDailyPromptReturn {
  const { user, partner } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [prompts, setPrompts] = useState<CouplePrompt[]>([])
  const [answers, setAnswers] = useState<PromptAnswer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch prompts + answers + auto-create today ───────────
  useEffect(() => {
    if (!user) {
      setPrompts([])
      setAnswers([])
      setIsLoading(false)
      return
    }

    let mounted = true

    async function load() {
      // Fetch all prompts
      const { data: promptData, error: promptErr } = await supabase
        .from("couple_prompts")
        .select("*")
        .order("prompt_date", { ascending: false })

      if (!mounted) return

      if (promptErr) {
        setError(promptErr.message)
        setIsLoading(false)
        return
      }

      let fetchedPrompts = (promptData ?? []) as CouplePrompt[]

      // Auto-create today's prompt if it doesn't exist
      const todayStr = new Date().toISOString().split("T")[0]
      const todayExists = fetchedPrompts.some((p) => p.prompt_date === todayStr)

      if (!todayExists) {
        const todayEntry = getPromptForDate(new Date(), PROMPTS_BANK)
        const { data: newPrompt, error: createErr } = await supabase
          .from("couple_prompts")
          .insert({
            prompt_date: todayStr,
            prompt_text: todayEntry.text,
            prompt_category: todayEntry.category,
          })
          .select("*")
          .single()

        if (!mounted) return

        if (!createErr && newPrompt) {
          fetchedPrompts = [newPrompt as CouplePrompt, ...fetchedPrompts]
        }
      }

      setPrompts(fetchedPrompts)

      // Fetch all answers
      const { data: answerData, error: answerErr } = await supabase
        .from("prompt_answers")
        .select("*")
        .order("submitted_at", { ascending: false })

      if (!mounted) return

      if (answerErr) {
        setError(answerErr.message)
        setIsLoading(false)
        return
      }

      setAnswers((answerData ?? []) as PromptAnswer[])
      setIsLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [user, supabase])

  // ── Realtime subscriptions ────────────────────────────────
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("prompts_realtime")
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "couple_prompts" },
        (payload: { eventType: string; new: CouplePrompt }) => {
          if (payload.eventType === "UPDATE") {
            setPrompts((prev) =>
              prev.map((p) => (p.id === payload.new.id ? payload.new : p))
            )
          }
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "INSERT", schema: "public", table: "prompt_answers" },
        (payload: { new: PromptAnswer }) => {
          setAnswers((prev) => {
            if (prev.some((a) => a.id === payload.new.id)) return prev
            return [payload.new, ...prev]
          })
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // ── Derived state ─────────────────────────────────────────
  const todayStr = new Date().toISOString().split("T")[0]

  const todayPrompt = useMemo(
    () => prompts.find((p) => p.prompt_date === todayStr) ?? null,
    [prompts, todayStr]
  )

  const myAnswer = useMemo(() => {
    if (!user || !todayPrompt) return null
    return answers.find(
      (a) => a.prompt_id === todayPrompt.id && a.user_id === user.id
    ) ?? null
  }, [answers, todayPrompt, user])

  const partnerAnswer = useMemo(() => {
    if (!partner || !todayPrompt || !todayPrompt.both_answered) return null
    return answers.find(
      (a) => a.prompt_id === todayPrompt.id && a.user_id === partner.id
    ) ?? null
  }, [answers, todayPrompt, partner])

  // History with answers merged
  const history: PromptWithAnswers[] = useMemo(() => {
    if (!user) return []
    return prompts.map((p) => ({
      ...p,
      my_answer: answers.find(
        (a) => a.prompt_id === p.id && a.user_id === user.id
      ),
      partner_answer: p.both_answered
        ? answers.find(
            (a) => a.prompt_id === p.id && a.user_id === partner?.id
          )
        : undefined,
    }))
  }, [prompts, answers, user, partner])

  // Streak: consecutive days where both answered (from today backwards)
  const streak = useMemo(() => {
    let count = 0
    const sorted = [...prompts]
      .filter((p) => p.both_answered)
      .sort((a, b) => b.prompt_date.localeCompare(a.prompt_date))

    const today = new Date()
    for (let i = 0; i < sorted.length; i++) {
      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)
      const expectedStr = expectedDate.toISOString().split("T")[0]

      if (sorted[i]?.prompt_date === expectedStr) {
        count++
      } else {
        break
      }
    }
    return count
  }, [prompts])

  // ── Actions ───────────────────────────────────────────────
  const submitAnswer = useCallback(
    async (text: string) => {
      setError(null)
      if (!user || !todayPrompt) return
      if (!text.trim()) return

      const trimmed = text.trim().slice(0, 2000)
      const tempId = crypto.randomUUID()
      const optimistic: PromptAnswer = {
        id: tempId,
        prompt_id: todayPrompt.id,
        user_id: user.id,
        answer_text: trimmed,
        submitted_at: new Date().toISOString(),
      }

      setAnswers((prev) => [optimistic, ...prev])

      const { data: inserted, error: insertErr } = await supabase
        .from("prompt_answers")
        .insert({
          prompt_id: todayPrompt.id,
          user_id: user.id,
          answer_text: trimmed,
        })
        .select("*")
        .single()

      if (insertErr) {
        setAnswers((prev) => prev.filter((a) => a.id !== tempId))
        setError(insertErr.message)
        return
      }

      setAnswers((prev) =>
        prev.map((a) => (a.id === tempId ? (inserted as PromptAnswer) : a))
      )
    },
    [user, todayPrompt, supabase]
  )

  // ── Inert return when no user ─────────────────────────────
  if (!user) {
    return {
      todayPrompt: null,
      myAnswer: null,
      partnerAnswer: null,
      history: [],
      streak: 0,
      isLoading: false,
      error: null,
      submitAnswer: async () => {},
    }
  }

  return {
    todayPrompt,
    myAnswer,
    partnerAnswer,
    history,
    streak,
    isLoading,
    error,
    submitAnswer,
  }
}

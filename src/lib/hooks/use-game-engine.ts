"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import type {
  GameMode,
  SessionConfig,
  GameSessionRow,
  GameRoundRow,
  QuestionBankRow,
  GameDareRow,
  SessionCustomContentRow,
  AnswerHistoryRow,
  AnswerValue,
  RoundState,
  UseGameEngineReturn,
  CheckInConfig,
} from "@/lib/types/game.types"

// Helper: game tables aren't in generated database.types.ts yet (migration pending).
// Use untyped .from() until `supabase gen types` is re-run after migration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function gameTable(supabase: ReturnType<typeof getSupabaseBrowserClient>, table: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table)
}

export function useGameEngine(sessionId?: string): UseGameEngineReturn {
  const { user, partner } = useAuth()
  // Cast to any: game tables aren't in generated database.types.ts until migration runs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowserClient() as any

  const [session, setSession] = useState<GameSessionRow | null>(null)
  const [rounds, setRounds] = useState<GameRoundRow[]>([])
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [questions, setQuestions] = useState<Map<string, QuestionBankRow>>(new Map())
  const [dares, setDares] = useState<Map<string, GameDareRow>>(new Map())
  const [customContent, setCustomContent] = useState<Map<string, SessionCustomContentRow>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isWaitingForPartner, setIsWaitingForPartner] = useState(false)
  const [partnerHasAnswered, setPartnerHasAnswered] = useState(false)
  const [activeSession, setActiveSession] = useState<GameSessionRow | null>(null)

  const mountedRef = useRef(true)

  // Determine player number (1 = session creator, 2 = partner)
  const isPlayer1 = session?.created_by === user?.id

  // ---------- Data Loading ----------

  const loadSession = useCallback(async (sid: string) => {
    const { data, error: fetchError } = await gameTable(supabase, "game_sessions")
      .select("*")
      .eq("id", sid)
      .single()

    if (fetchError) {
      setError(fetchError.message)
      return null
    }
    if (mountedRef.current) setSession(data as GameSessionRow)
    return data as GameSessionRow
  }, [supabase])

  const loadRounds = useCallback(async (sid: string) => {
    const { data, error: fetchError } = await gameTable(supabase, "game_rounds")
      .select("*")
      .eq("session_id", sid)
      .order("round_number", { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      return []
    }

    const roundData = (data as GameRoundRow[]) ?? []
    if (mountedRef.current) setRounds(roundData)

    // Load associated questions and dares
    const questionIds = roundData.filter(r => r.question_id).map(r => r.question_id!)
    const dareIds = roundData.filter(r => r.dare_id).map(r => r.dare_id!)
    const customIds = roundData.filter(r => r.custom_content_id).map(r => r.custom_content_id!)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [qData, dData, cData] = await Promise.all([
      questionIds.length > 0
        ? gameTable(supabase, "question_bank").select("*").in("id", questionIds).then((r: any) => r.data ?? [])
        : Promise.resolve([]),
      dareIds.length > 0
        ? gameTable(supabase, "game_dares").select("*").in("id", dareIds).then((r: any) => r.data ?? [])
        : Promise.resolve([]),
      customIds.length > 0
        ? gameTable(supabase, "session_custom_content").select("*").in("id", customIds).then((r: any) => r.data ?? [])
        : Promise.resolve([]),
    ])

    if (mountedRef.current) {
      setQuestions(new Map((qData as QuestionBankRow[]).map(q => [q.id, q])))
      setDares(new Map((dData as GameDareRow[]).map(d => [d.id, d])))
      setCustomContent(new Map((cData as SessionCustomContentRow[]).map(c => [c.id, c])))
    }

    return roundData
  }, [supabase])

  // Initial load
  useEffect(() => {
    mountedRef.current = true
    if (!sessionId || !user) {
      setIsLoading(false)
      return
    }

    async function load() {
      await Promise.all([loadSession(sessionId!), loadRounds(sessionId!)])
      if (mountedRef.current) setIsLoading(false)
    }

    load()

    return () => { mountedRef.current = false }
  }, [sessionId, user, loadSession, loadRounds])

  // ---------- Realtime Subscription ----------

  useEffect(() => {
    if (!sessionId || !user) return

    const channel = supabase
      .channel(`game_rounds_${sessionId}`)
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "game_rounds",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: { new: GameRoundRow }) => {
          const updated = payload.new

          setRounds(prev => prev.map(r => r.id === updated.id ? updated : r))

          // Check if partner answered current round
          if (updated.both_answered) {
            setIsWaitingForPartner(false)
            setPartnerHasAnswered(true)
          }
        }
      )
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload: { new: GameSessionRow }) => {
          setSession(payload.new)
        }
      )

    channel.subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId, user, supabase])

  // ---------- Current Round State ----------

  const currentRound: RoundState | null = (() => {
    const round = rounds[currentRoundIndex]
    if (!round) return null

    const question = round.question_id ? questions.get(round.question_id) ?? null : null
    const dare = round.dare_id ? dares.get(round.dare_id) ?? null : null
    const custom = round.custom_content_id ? customContent.get(round.custom_content_id) ?? null : null
    const isPartnerAuthored = custom !== null
    const authorName = isPartnerAuthored && custom
      ? (custom.author_id === user?.id ? "You" : partner?.display_name ?? "Partner")
      : null

    return { round, question, dare, customContent: custom, isPartnerAuthored, authorName }
  })()

  // ---------- Session Lifecycle ----------

  const createSession = useCallback(async (mode: GameMode, config: SessionConfig): Promise<string | null> => {
    if (!user || !partner) return null
    setError(null)

    const { data, error: insertError } = await supabase
      .from("game_sessions")
      .insert({
        created_by: user.id,
        partner_id: partner.id,
        mode,
        status: "setup",
        config: config as unknown as Record<string, unknown>,
        relationship_pulse: mode === "check_in" ? (config as CheckInConfig).relationshipPulse : null,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      return null
    }

    const newSession = data as GameSessionRow
    setSession(newSession)
    return newSession.id
  }, [user, partner, supabase])

  const generateRounds = useCallback(async (sid: string, sess: GameSessionRow) => {
    const config = sess.config as unknown as SessionConfig
    const mode = sess.mode

    let roundsToInsert: Array<{
      session_id: string
      round_number: number
      question_id?: string | null
      dare_id?: string | null
      custom_content_id?: string | null
      round_type: string
    }> = []

    if (mode === "check_in") {
      const cfg = config as CheckInConfig
      const { data: qs } = await supabase
        .from("question_bank")
        .select("*")
        .contains("suitable_modes", ["check_in"])
        .in("category", cfg.categories)
        .eq("is_active", true)
        .limit(cfg.questionCount * 2)

      const questions = (qs ?? []) as QuestionBankRow[]
      // Prioritize scale questions for alignment, mix in open for variety
      const scaleQs = questions.filter(q => q.answer_type === "scale_1_10")
      const otherQs = questions.filter(q => q.answer_type !== "scale_1_10")
      const selected = [...shuffleArray(scaleQs), ...shuffleArray(otherQs)].slice(0, cfg.questionCount)

      roundsToInsert = selected.map((q, i) => ({
        session_id: sid,
        round_number: i + 1,
        question_id: q.id,
        round_type: "question",
      }))
    } else if (mode === "deep_dive") {
      const cfg = config as { primaryCategory: string; secondaryCategories?: string[]; questionCount: number; difficultyPreference?: string[] }
      const categories = [cfg.primaryCategory, ...(cfg.secondaryCategories ?? [])]

      const { data: qs } = await supabase
        .from("question_bank")
        .select("*")
        .contains("suitable_modes", ["deep_dive"])
        .in("category", categories)
        .eq("is_active", true)
        .limit(cfg.questionCount * 2)

      const questions = shuffleArray((qs ?? []) as QuestionBankRow[]).slice(0, cfg.questionCount)

      roundsToInsert = questions.map((q, i) => ({
        session_id: sid,
        round_number: i + 1,
        question_id: q.id,
        round_type: "question",
      }))
    } else if (mode === "date_night") {
      const cfg = config as { categories: string[]; questionsPerCategory: number; daresEnabled: boolean; maxHeatLevel: number; wildcardCount: number; truthOrDareEnabled: boolean }

      // Fetch questions
      const { data: qs } = await supabase
        .from("question_bank")
        .select("*")
        .contains("suitable_modes", ["date_night"])
        .in("category", cfg.categories)
        .eq("is_active", true)
        .limit(cfg.questionsPerCategory * cfg.categories.length * 2)

      const bankQuestions = shuffleArray((qs ?? []) as QuestionBankRow[])
        .slice(0, cfg.questionsPerCategory * cfg.categories.length)

      // Fetch dares if enabled
      let bankDares: GameDareRow[] = []
      if (cfg.daresEnabled) {
        const { data: ds } = await supabase
          .from("game_dares")
          .select("*")
          .lte("heat_level", cfg.maxHeatLevel)
          .eq("is_active", true)
          .limit(cfg.wildcardCount * 2)

        bankDares = shuffleArray((ds ?? []) as GameDareRow[]).slice(0, cfg.wildcardCount)
      }

      // Fetch partner-authored custom content
      const { data: customs } = await supabase
        .from("session_custom_content")
        .select("*")
        .eq("session_id", sid)
        .eq("is_revealed", false)

      const customItems = (customs ?? []) as SessionCustomContentRow[]

      // Build round sequence: questions + dares + custom content, shuffled
      let roundNum = 0
      const allRounds: typeof roundsToInsert = []

      // Add question rounds
      for (const q of bankQuestions) {
        roundNum++
        allRounds.push({
          session_id: sid,
          round_number: roundNum,
          question_id: q.id,
          round_type: cfg.truthOrDareEnabled ? "truth_or_dare" : "question",
        })
      }

      // Add dare rounds
      for (const d of bankDares) {
        roundNum++
        allRounds.push({
          session_id: sid,
          round_number: roundNum,
          dare_id: d.id,
          round_type: cfg.truthOrDareEnabled ? "truth_or_dare" : "dare",
        })
      }

      // Add custom content rounds
      for (const c of customItems) {
        roundNum++
        allRounds.push({
          session_id: sid,
          round_number: roundNum,
          custom_content_id: c.id,
          round_type: c.content_type === "dare" ? "dare" : "question",
        })
      }

      // Shuffle and re-number
      const shuffled = shuffleArray(allRounds)
      roundsToInsert = shuffled.map((r, i) => ({ ...r, round_number: i + 1 }))
    }

    if (roundsToInsert.length === 0) return

    const { error: insertError } = await supabase
      .from("game_rounds")
      .insert(roundsToInsert)

    if (insertError) {
      setError(insertError.message)
      return
    }

    // Update session total_rounds
    await supabase
      .from("game_sessions")
      .update({ total_rounds: roundsToInsert.length })
      .eq("id", sid)
  }, [supabase])

  const startSession = useCallback(async (sid: string) => {
    if (!user) return
    setError(null)

    const sess = await loadSession(sid)
    if (!sess) return

    // Generate rounds
    await generateRounds(sid, sess)

    // Update session status
    await supabase
      .from("game_sessions")
      .update({ status: "playing", started_at: new Date().toISOString() })
      .eq("id", sid)

    await loadSession(sid)
    await loadRounds(sid)
    setCurrentRoundIndex(0)
  }, [user, supabase, loadSession, loadRounds, generateRounds])

  const pauseSession = useCallback(async () => {
    if (!session) return
    await supabase
      .from("game_sessions")
      .update({ status: "paused" })
      .eq("id", session.id)
  }, [session, supabase])

  const resumeSession = useCallback(async () => {
    if (!session) return
    await supabase
      .from("game_sessions")
      .update({ status: "playing" })
      .eq("id", session.id)
    await loadRounds(session.id)
  }, [session, supabase, loadRounds])

  const completeSession = useCallback(async () => {
    if (!session) return

    const startedAt = session.started_at ? new Date(session.started_at) : new Date()
    const durationSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000)

    // Compute alignment score for check_in mode
    let alignmentScore: number | null = null
    let categoryScores: Record<string, number> | null = null

    if (session.mode === "check_in") {
      const scaleRounds = rounds.filter(r => r.both_answered && r.alignment_gap !== null)
      if (scaleRounds.length > 0) {
        // alignment = 100 - (avg gap * 10)
        const avgGap = scaleRounds.reduce((sum, r) => sum + (r.alignment_gap ?? 0), 0) / scaleRounds.length
        alignmentScore = Math.max(0, Math.round((1 - avgGap / 10) * 100))

        // Per-category scores
        const catMap = new Map<string, number[]>()
        for (const r of scaleRounds) {
          const q = r.question_id ? questions.get(r.question_id) : null
          if (q) {
            const gaps = catMap.get(q.category) ?? []
            gaps.push(r.alignment_gap ?? 0)
            catMap.set(q.category, gaps)
          }
        }
        categoryScores = {}
        for (const [cat, gaps] of catMap) {
          const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length
          categoryScores[cat] = Math.max(0, Math.round((1 - avg / 10) * 100))
        }
      }
    }

    await supabase
      .from("game_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        completed_rounds: rounds.filter(r => r.both_answered || r.dare_completed !== null || r.is_skipped).length,
        alignment_score: alignmentScore,
        category_scores: categoryScores,
      })
      .eq("id", session.id)

    await loadSession(session.id)
  }, [session, rounds, questions, supabase, loadSession])

  const abandonSession = useCallback(async () => {
    if (!session) return
    await supabase
      .from("game_sessions")
      .update({ status: "abandoned" })
      .eq("id", session.id)
  }, [session, supabase])

  // ---------- Round Actions ----------

  const submitAnswer = useCallback(async (answer: AnswerValue) => {
    if (!session || !user) return
    const round = rounds[currentRoundIndex]
    if (!round) return

    const answerField = isPlayer1 ? "player1_answer" : "player2_answer"
    const timeField = isPlayer1 ? "player1_answered_at" : "player2_answered_at"

    await supabase
      .from("game_rounds")
      .update({
        [answerField]: answer,
        [timeField]: new Date().toISOString(),
      })
      .eq("id", round.id)

    // Save to answer_history if question-based
    if (round.question_id) {
      await supabase
        .from("answer_history")
        .insert({
          user_id: user.id,
          question_id: round.question_id,
          session_id: session.id,
          round_id: round.id,
          answer_value: answer,
        })
    }

    // Check if partner already answered
    const partnerAnswer = isPlayer1 ? round.player2_answer : round.player1_answer
    if (!partnerAnswer) {
      setIsWaitingForPartner(true)
      setPartnerHasAnswered(false)
    }

    // Refresh round
    await loadRounds(session.id)
  }, [session, user, rounds, currentRoundIndex, isPlayer1, supabase, loadRounds])

  const submitJournal = useCallback(async (text: string) => {
    if (!session || !user) return
    const round = rounds[currentRoundIndex]
    if (!round) return

    const journalField = isPlayer1 ? "player1_journal" : "player2_journal"

    await supabase
      .from("game_rounds")
      .update({ [journalField]: text })
      .eq("id", round.id)

    // Also save to answer_history
    if (round.question_id) {
      await supabase
        .from("answer_history")
        .insert({
          user_id: user.id,
          question_id: round.question_id,
          session_id: session.id,
          round_id: round.id,
          answer_value: { text },
        })
    }

    await loadRounds(session.id)
  }, [session, user, rounds, currentRoundIndex, isPlayer1, supabase, loadRounds])

  const completeDare = useCallback(async () => {
    if (!session || !user) return
    const round = rounds[currentRoundIndex]
    if (!round) return

    const dare = round.dare_id ? dares.get(round.dare_id) : null
    const custom = round.custom_content_id ? customContent.get(round.custom_content_id) : null
    const reward = dare?.coyyns_reward ?? custom?.coyyns_reward ?? 15

    await supabase
      .from("game_rounds")
      .update({
        dare_completed: true,
        dare_completed_by: user.id,
        coyyns_earned: reward,
      })
      .eq("id", round.id)

    // Update session scores
    const scoreField = isPlayer1 ? "player1_score" : "player2_score"
    await supabase
      .from("game_sessions")
      .update({
        [scoreField]: (isPlayer1 ? session.player1_score : session.player2_score) + reward,
        total_coyyns_earned: session.total_coyyns_earned + reward,
      })
      .eq("id", session.id)

    // Reveal custom content if applicable
    if (round.custom_content_id) {
      await supabase
        .from("session_custom_content")
        .update({ is_revealed: true })
        .eq("id", round.custom_content_id)
    }

    await loadRounds(session.id)
    await loadSession(session.id)
  }, [session, user, rounds, currentRoundIndex, isPlayer1, dares, customContent, supabase, loadRounds, loadSession])

  const skipDare = useCallback(async () => {
    if (!session || !user) return
    const round = rounds[currentRoundIndex]
    if (!round) return

    const dare = round.dare_id ? dares.get(round.dare_id) : null
    const custom = round.custom_content_id ? customContent.get(round.custom_content_id) : null
    const penalty = dare?.coyyns_penalty ?? custom?.coyyns_penalty ?? 10

    await supabase
      .from("game_rounds")
      .update({
        dare_completed: false,
        dare_completed_by: user.id,
        coyyns_earned: -penalty,
        is_skipped: true,
      })
      .eq("id", round.id)

    const scoreField = isPlayer1 ? "player1_score" : "player2_score"
    await supabase
      .from("game_sessions")
      .update({
        [scoreField]: Math.max(0, (isPlayer1 ? session.player1_score : session.player2_score) - penalty),
      })
      .eq("id", session.id)

    if (round.custom_content_id) {
      await supabase
        .from("session_custom_content")
        .update({ is_revealed: true })
        .eq("id", round.custom_content_id)
    }

    await loadRounds(session.id)
    await loadSession(session.id)
  }, [session, user, rounds, currentRoundIndex, isPlayer1, dares, customContent, supabase, loadRounds, loadSession])

  const skipRound = useCallback(async () => {
    if (!session) return
    const round = rounds[currentRoundIndex]
    if (!round) return

    await supabase
      .from("game_rounds")
      .update({ is_skipped: true })
      .eq("id", round.id)

    await loadRounds(session.id)
  }, [session, rounds, currentRoundIndex, supabase, loadRounds])

  const nextRound = useCallback(() => {
    setCurrentRoundIndex(prev => Math.min(prev + 1, rounds.length - 1))
    setIsWaitingForPartner(false)
    setPartnerHasAnswered(false)
  }, [rounds.length])

  // ---------- Partner-Authored Content ----------

  const saveCustomContent = useCallback(async (
    items: { type: "question" | "dare"; text: string; heatLevel?: number }[]
  ) => {
    if (!session || !user || !partner) return

    const inserts = items.map(item => ({
      session_id: session.id,
      author_id: user.id,
      target_partner_id: partner.id,
      content_type: item.type,
      text: item.text,
      heat_level: item.heatLevel ?? 0,
      coyyns_reward: item.type === "dare" ? (item.heatLevel === 3 ? 45 : item.heatLevel === 2 ? 30 : 15) : 0,
      coyyns_penalty: item.type === "dare" ? (item.heatLevel === 3 ? 30 : item.heatLevel === 2 ? 20 : 10) : 0,
    }))

    await gameTable(supabase, "session_custom_content").insert(inserts)
  }, [session, user, partner, supabase])

  const getCustomContentStatus = useCallback(() => {
    if (!session || !user) return { myCount: 0, partnerDone: false }

    // This is a simplified check — real implementation would query
    return { myCount: 0, partnerDone: false }
  }, [session, user])

  // ---------- History ----------

  const getAnswerHistory = useCallback(async (questionId: string): Promise<AnswerHistoryRow[]> => {
    if (!user) return []

    const { data } = await supabase
      .from("answer_history")
      .select("*")
      .eq("question_id", questionId)
      .order("created_at", { ascending: true })

    return (data as AnswerHistoryRow[]) ?? []
  }, [user, supabase])

  // ---------- Active Session Detection ----------

  const loadActiveSession = useCallback(async () => {
    if (!user) return

    const { data } = await supabase
      .from("game_sessions")
      .select("*")
      .or(`created_by.eq.${user.id},partner_id.eq.${user.id}`)
      .in("status", ["setup", "authoring", "playing", "paused"])
      .order("updated_at", { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      setActiveSession(data[0] as GameSessionRow)
    } else {
      setActiveSession(null)
    }
  }, [user, supabase])

  // Inert return when not ready
  if (!user) {
    return {
      session: null,
      rounds: [],
      currentRound: null,
      currentRoundIndex: 0,
      isLoading: false,
      error: null,
      createSession: async () => null,
      startSession: async () => {},
      pauseSession: async () => {},
      resumeSession: async () => {},
      completeSession: async () => {},
      abandonSession: async () => {},
      submitAnswer: async () => {},
      submitJournal: async () => {},
      completeDare: async () => {},
      skipDare: async () => {},
      skipRound: async () => {},
      nextRound: () => {},
      saveCustomContent: async () => {},
      getCustomContentStatus: () => ({ myCount: 0, partnerDone: false }),
      getAnswerHistory: async () => [],
      isWaitingForPartner: false,
      partnerHasAnswered: false,
      activeSession: null,
      loadActiveSession: async () => {},
    }
  }

  return {
    session,
    rounds,
    currentRound,
    currentRoundIndex,
    isLoading,
    error,
    createSession,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    abandonSession,
    submitAnswer,
    submitJournal,
    completeDare,
    skipDare,
    skipRound,
    nextRound,
    saveCustomContent,
    getCustomContentStatus,
    getAnswerHistory,
    isWaitingForPartner,
    partnerHasAnswered,
    activeSession,
    loadActiveSession,
  }
}

// ---------- Utility ----------

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

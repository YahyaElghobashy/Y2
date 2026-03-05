import { useState, useEffect, useCallback, useMemo } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/providers/AuthProvider"
import { uploadMedia } from "@/lib/media-upload"
import type {
  VisionBoard,
  VisionCategory,
  VisionItem,
  MonthlyEvaluation,
  CategoryScore,
  CategoryWithItems,
  EvaluationWithScores,
  ActiveBoard,
} from "@/lib/types/vision-board.types"

type UseVisionBoardReturn = {
  myBoard: VisionBoard | null
  partnerBoard: VisionBoard | null
  categories: CategoryWithItems[]
  evaluations: EvaluationWithScores[]
  isLoading: boolean
  error: string | null
  activeBoard: ActiveBoard
  switchBoard: (board: ActiveBoard) => void
  currentBoard: VisionBoard | null
  createBoard: (data: { title: string; theme?: string; year?: number }) => Promise<string | null>
  setHeroBanner: (boardId: string, file: File) => Promise<void>
  addCategory: (boardId: string, name: string, icon?: string) => Promise<string | null>
  removeCategory: (categoryId: string) => Promise<void>
  reorderCategories: (categoryIds: string[]) => Promise<void>
  addItem: (categoryId: string, data: { title: string; description?: string; file?: File }) => Promise<string | null>
  toggleAchieved: (itemId: string) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  submitEvaluation: (data: {
    boardId: string
    month: number
    overallScore: number
    categoryScores: { categoryId: string; score: number; note?: string }[]
    reflection?: string
  }) => Promise<string | null>
  getEvaluations: (boardId: string) => Promise<EvaluationWithScores[]>
  hasEvaluatedThisMonth: boolean
}

const CURRENT_YEAR = new Date().getFullYear()

export function useVisionBoard(): UseVisionBoardReturn {
  const { user, partner } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [myBoard, setMyBoard] = useState<VisionBoard | null>(null)
  const [partnerBoard, setPartnerBoard] = useState<VisionBoard | null>(null)
  const [categoriesRaw, setCategoriesRaw] = useState<VisionCategory[]>([])
  const [items, setItems] = useState<VisionItem[]>([])
  const [evaluationsRaw, setEvaluationsRaw] = useState<MonthlyEvaluation[]>([])
  const [categoryScores, setCategoryScores] = useState<CategoryScore[]>([])
  const [activeBoard, setActiveBoard] = useState<ActiveBoard>("mine")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentBoard = activeBoard === "mine" ? myBoard : partnerBoard

  // ── Fetch boards on mount ──────────────────────────────────
  useEffect(() => {
    if (!user) {
      setMyBoard(null)
      setPartnerBoard(null)
      setIsLoading(false)
      return
    }

    let mounted = true

    async function load() {
      // Fetch own board for current year
      const { data: myData, error: myErr } = await supabase
        .from("vision_boards")
        .select("*")
        .eq("owner_id", user!.id)
        .eq("year", CURRENT_YEAR)
        .maybeSingle()

      if (!mounted) return
      if (myErr) {
        setError(myErr.message)
        setIsLoading(false)
        return
      }
      setMyBoard(myData as VisionBoard | null)

      // Fetch partner board
      if (partner) {
        const { data: pData } = await supabase
          .from("vision_boards")
          .select("*")
          .eq("owner_id", partner.id)
          .eq("year", CURRENT_YEAR)
          .maybeSingle()

        if (!mounted) return
        setPartnerBoard(pData as VisionBoard | null)
      }

      setIsLoading(false)
    }

    load()
    return () => { mounted = false }
  }, [user, partner, supabase])

  // ── Fetch categories + items when currentBoard changes ─────
  useEffect(() => {
    if (!currentBoard) {
      setCategoriesRaw([])
      setItems([])
      return
    }

    let mounted = true

    async function loadCategoriesAndItems() {
      const { data: catData } = await supabase
        .from("vision_categories")
        .select("*")
        .eq("board_id", currentBoard!.id)
        .order("sort_order", { ascending: true })

      if (!mounted) return
      const cats = (catData ?? []) as VisionCategory[]
      setCategoriesRaw(cats)

      if (cats.length === 0) {
        setItems([])
        return
      }

      const catIds = cats.map((c) => c.id)
      const { data: itemData } = await supabase
        .from("vision_items")
        .select("*")
        .in("category_id", catIds)
        .order("sort_order", { ascending: true })

      if (!mounted) return
      setItems((itemData ?? []) as VisionItem[])
    }

    loadCategoriesAndItems()
    return () => { mounted = false }
  }, [currentBoard, supabase])

  // ── Fetch evaluations when currentBoard changes ────────────
  useEffect(() => {
    if (!currentBoard) {
      setEvaluationsRaw([])
      setCategoryScores([])
      return
    }

    let mounted = true

    async function loadEvaluations() {
      const { data: evalData } = await supabase
        .from("monthly_evaluations")
        .select("*")
        .eq("board_id", currentBoard!.id)
        .order("month", { ascending: true })

      if (!mounted) return
      const evals = (evalData ?? []) as MonthlyEvaluation[]
      setEvaluationsRaw(evals)

      if (evals.length === 0) {
        setCategoryScores([])
        return
      }

      const evalIds = evals.map((e) => e.id)
      const { data: scoreData } = await supabase
        .from("category_scores")
        .select("*")
        .in("evaluation_id", evalIds)

      if (!mounted) return
      setCategoryScores((scoreData ?? []) as CategoryScore[])
    }

    loadEvaluations()
    return () => { mounted = false }
  }, [currentBoard, supabase])

  // ── Realtime: vision_items changes ─────────────────────────
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("vision_items_realtime")
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "vision_items" },
        (payload: { eventType: string; new: VisionItem; old: { id: string } }) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) => {
              if (prev.some((i) => i.id === payload.new.id)) return prev
              return [...prev, payload.new]
            })
          } else if (payload.eventType === "UPDATE") {
            setItems((prev) =>
              prev.map((i) => (i.id === payload.new.id ? payload.new : i))
            )
          } else if (payload.eventType === "DELETE") {
            setItems((prev) => prev.filter((i) => i.id !== payload.old.id))
          }
        }
      )

    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, supabase])

  // ── Derived state ──────────────────────────────────────────
  const categories: CategoryWithItems[] = useMemo(() => {
    return categoriesRaw.map((cat) => ({
      ...cat,
      items: items.filter((item) => item.category_id === cat.id),
    }))
  }, [categoriesRaw, items])

  const evaluations: EvaluationWithScores[] = useMemo(() => {
    return evaluationsRaw.map((ev) => ({
      ...ev,
      category_scores: categoryScores.filter((cs) => cs.evaluation_id === ev.id),
    }))
  }, [evaluationsRaw, categoryScores])

  const hasEvaluatedThisMonth = useMemo(() => {
    if (!user || !myBoard) return false
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    return evaluationsRaw.some(
      (e) =>
        e.board_id === myBoard.id &&
        e.evaluator_id === user.id &&
        e.month === month &&
        e.year === year
    )
  }, [user, myBoard, evaluationsRaw])

  // ── Actions ────────────────────────────────────────────────
  const switchBoard = useCallback((board: ActiveBoard) => {
    setActiveBoard(board)
  }, [])

  const createBoard = useCallback(
    async (data: { title: string; theme?: string; year?: number }): Promise<string | null> => {
      setError(null)
      if (!user) return null

      const year = data.year ?? CURRENT_YEAR
      const { data: inserted, error: insertErr } = await supabase
        .from("vision_boards")
        .insert({
          owner_id: user.id,
          year,
          title: data.title,
          theme: data.theme ?? null,
        })
        .select("*")
        .single()

      if (insertErr || !inserted) {
        setError(insertErr?.message ?? "Failed to create board")
        return null
      }

      const board = inserted as VisionBoard
      setMyBoard(board)
      return board.id
    },
    [user, supabase]
  )

  const setHeroBanner = useCallback(
    async (boardId: string, file: File) => {
      setError(null)
      if (!user) return

      const result = await uploadMedia({
        file,
        userId: user.id,
        bucket: "vision-board-images",
        sourceTable: "vision_boards",
        sourceColumn: "hero_media_id",
        sourceRowId: boardId,
        maxWidth: 1920,
        maxHeight: 1080,
      })

      if ("error" in result) {
        setError(result.error)
        return
      }

      const { error: updateErr } = await supabase
        .from("vision_boards")
        .update({ hero_media_id: result.mediaId })
        .eq("id", boardId)

      if (updateErr) {
        setError(updateErr.message)
        return
      }

      // Update local state
      const updater = (prev: VisionBoard | null) =>
        prev?.id === boardId ? { ...prev, hero_media_id: result.mediaId } : prev
      setMyBoard(updater)
      setPartnerBoard(updater)
    },
    [user, supabase]
  )

  const addCategory = useCallback(
    async (boardId: string, name: string, icon?: string): Promise<string | null> => {
      setError(null)
      if (!user) return null

      const nextOrder = categoriesRaw.length
      const { data: inserted, error: insertErr } = await supabase
        .from("vision_categories")
        .insert({
          board_id: boardId,
          name,
          icon: icon ?? "✨",
          sort_order: nextOrder,
        })
        .select("*")
        .single()

      if (insertErr || !inserted) {
        setError(insertErr?.message ?? "Failed to add category")
        return null
      }

      const cat = inserted as VisionCategory
      setCategoriesRaw((prev) => [...prev, cat])
      return cat.id
    },
    [user, categoriesRaw.length, supabase]
  )

  const removeCategory = useCallback(
    async (categoryId: string) => {
      setError(null)
      if (!user) return

      const prev = [...categoriesRaw]
      setCategoriesRaw((curr) => curr.filter((c) => c.id !== categoryId))
      setItems((curr) => curr.filter((i) => i.category_id !== categoryId))

      const { error: deleteErr } = await supabase
        .from("vision_categories")
        .delete()
        .eq("id", categoryId)

      if (deleteErr) {
        setCategoriesRaw(prev)
        setError(deleteErr.message)
      }
    },
    [user, categoriesRaw, supabase]
  )

  const reorderCategories = useCallback(
    async (categoryIds: string[]) => {
      setError(null)
      if (!user) return

      // Optimistic reorder
      setCategoriesRaw((prev) => {
        const map = new Map(prev.map((c) => [c.id, c]))
        return categoryIds
          .map((id, i) => {
            const cat = map.get(id)
            return cat ? { ...cat, sort_order: i } : null
          })
          .filter(Boolean) as VisionCategory[]
      })

      // Persist each update
      const updates = categoryIds.map((id, i) =>
        supabase.from("vision_categories").update({ sort_order: i }).eq("id", id)
      )
      const results = await Promise.all(updates)
      const failed = results.find((r) => r.error)
      if (failed?.error) {
        setError(failed.error.message)
      }
    },
    [user, supabase]
  )

  const addItem = useCallback(
    async (
      categoryId: string,
      data: { title: string; description?: string; file?: File }
    ): Promise<string | null> => {
      setError(null)
      if (!user) return null

      const currentItems = items.filter((i) => i.category_id === categoryId)
      const nextOrder = currentItems.length

      // Insert the item first (so we have a row ID for media tracking)
      const { data: inserted, error: insertErr } = await supabase
        .from("vision_items")
        .insert({
          category_id: categoryId,
          title: data.title,
          description: data.description ?? null,
          sort_order: nextOrder,
        })
        .select("*")
        .single()

      if (insertErr || !inserted) {
        setError(insertErr?.message ?? "Failed to add item")
        return null
      }

      let item = inserted as VisionItem

      // Upload photo if provided
      if (data.file) {
        const result = await uploadMedia({
          file: data.file,
          userId: user.id,
          bucket: "vision-board-images",
          sourceTable: "vision_items",
          sourceColumn: "media_id",
          sourceRowId: item.id,
          maxWidth: 800,
          maxHeight: 800,
        })

        if (!("error" in result)) {
          const { data: updated } = await supabase
            .from("vision_items")
            .update({ media_id: result.mediaId })
            .eq("id", item.id)
            .select("*")
            .single()

          if (updated) {
            item = updated as VisionItem
          }
        }
      }

      setItems((prev) => [...prev, item])
      return item.id
    },
    [user, items, supabase]
  )

  const toggleAchieved = useCallback(
    async (itemId: string) => {
      setError(null)
      if (!user) return

      const item = items.find((i) => i.id === itemId)
      if (!item) return

      const newAchieved = !item.is_achieved
      const achievedAt = newAchieved ? new Date().toISOString() : null

      // Optimistic update
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, is_achieved: newAchieved, achieved_at: achievedAt } : i
        )
      )

      const { error: updateErr } = await supabase
        .from("vision_items")
        .update({ is_achieved: newAchieved, achieved_at: achievedAt })
        .eq("id", itemId)

      if (updateErr) {
        // Rollback
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, is_achieved: item.is_achieved, achieved_at: item.achieved_at } : i
          )
        )
        setError(updateErr.message)
      }
    },
    [user, items, supabase]
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      setError(null)
      if (!user) return

      const prev = [...items]
      setItems((curr) => curr.filter((i) => i.id !== itemId))

      const { error: deleteErr } = await supabase
        .from("vision_items")
        .delete()
        .eq("id", itemId)

      if (deleteErr) {
        setItems(prev)
        setError(deleteErr.message)
      }
    },
    [user, items, supabase]
  )

  const submitEvaluation = useCallback(
    async (data: {
      boardId: string
      month: number
      overallScore: number
      categoryScores: { categoryId: string; score: number; note?: string }[]
      reflection?: string
    }): Promise<string | null> => {
      setError(null)
      if (!user) return null

      const year = CURRENT_YEAR

      const { data: evalRow, error: evalErr } = await supabase
        .from("monthly_evaluations")
        .insert({
          board_id: data.boardId,
          evaluator_id: user.id,
          month: data.month,
          year,
          overall_score: data.overallScore,
          reflection: data.reflection ?? null,
        })
        .select("*")
        .single()

      if (evalErr || !evalRow) {
        setError(evalErr?.message ?? "Failed to submit evaluation")
        return null
      }

      const evaluation = evalRow as MonthlyEvaluation

      // Insert category scores
      if (data.categoryScores.length > 0) {
        const scoreRows = data.categoryScores.map((cs) => ({
          evaluation_id: evaluation.id,
          category_id: cs.categoryId,
          score: cs.score,
          note: cs.note ?? null,
        }))

        const { data: insertedScores, error: scoresErr } = await supabase
          .from("category_scores")
          .insert(scoreRows)
          .select("*")

        if (scoresErr) {
          setError(scoresErr.message)
        }

        if (insertedScores) {
          setCategoryScores((prev) => [...prev, ...(insertedScores as CategoryScore[])])
        }
      }

      setEvaluationsRaw((prev) => [...prev, evaluation])
      return evaluation.id
    },
    [user, supabase]
  )

  const getEvaluations = useCallback(
    async (boardId: string): Promise<EvaluationWithScores[]> => {
      const { data: evalData } = await supabase
        .from("monthly_evaluations")
        .select("*")
        .eq("board_id", boardId)
        .order("month", { ascending: true })

      if (!evalData || evalData.length === 0) return []

      const evals = evalData as MonthlyEvaluation[]
      const evalIds = evals.map((e) => e.id)

      const { data: scoreData } = await supabase
        .from("category_scores")
        .select("*")
        .in("evaluation_id", evalIds)

      const scores = (scoreData ?? []) as CategoryScore[]

      return evals.map((ev) => ({
        ...ev,
        category_scores: scores.filter((s) => s.evaluation_id === ev.id),
      }))
    },
    [supabase]
  )

  // ── Inert return when no user ──────────────────────────────
  if (!user) {
    return {
      myBoard: null,
      partnerBoard: null,
      categories: [],
      evaluations: [],
      isLoading: false,
      error: null,
      activeBoard: "mine",
      switchBoard: () => {},
      currentBoard: null,
      createBoard: async () => null,
      setHeroBanner: async () => {},
      addCategory: async () => null,
      removeCategory: async () => {},
      reorderCategories: async () => {},
      addItem: async () => null,
      toggleAchieved: async () => {},
      removeItem: async () => {},
      submitEvaluation: async () => null,
      getEvaluations: async () => [],
      hasEvaluatedThisMonth: false,
    }
  }

  return {
    myBoard,
    partnerBoard,
    categories,
    evaluations,
    isLoading,
    error,
    activeBoard,
    switchBoard,
    currentBoard,
    createBoard,
    setHeroBanner,
    addCategory,
    removeCategory,
    reorderCategories,
    addItem,
    toggleAchieved,
    removeItem,
    submitEvaluation,
    getEvaluations,
    hasEvaluatedThisMonth,
  }
}

import { renderHook, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ──────────────────────────────────────────────────
const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(() => ({
    user: { id: "user-1" } as { id: string } | null,
    partner: { id: "partner-1", display_name: "Yara" } as { id: string; display_name: string } | null,
    profile: null,
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  })),
}))

const mockUploadMedia = vi.fn()

// Build a flexible chainable mock — each call to from() returns a fresh chain
const mockChannel = vi.fn()
const mockOn = vi.fn()
const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()

function createChainableMock() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn().mockReturnThis()
  chain.insert = vi.fn().mockReturnThis()
  chain.update = vi.fn().mockReturnThis()
  chain.delete = vi.fn().mockReturnThis()
  chain.eq = vi.fn().mockReturnThis()
  chain.in = vi.fn().mockReturnThis()
  chain.order = vi.fn().mockReturnValue({ data: [], error: null })
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  chain.single = vi.fn().mockResolvedValue({ data: { id: "new-id" }, error: null })
  // Make all methods return self for chaining
  for (const fn of Object.values(chain)) {
    if (!fn.getMockName || fn.getMockName() === "spy") continue
  }
  chain.select.mockReturnValue(chain)
  chain.insert.mockReturnValue(chain)
  chain.update.mockReturnValue(chain)
  chain.delete.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.in.mockReturnValue(chain)
  // order and maybeSingle/single are "terminal" — they resolve data
  chain.order.mockReturnValue({ data: [], error: null, in: chain.in })
  return chain
}

const fromCalls: Array<{ table: string; chain: ReturnType<typeof createChainableMock> }> = []
const mockFrom = vi.fn((table: string) => {
  const chain = createChainableMock()
  fromCalls.push({ table, chain })
  return chain
})

const channelObj = { subscribe: mockSubscribe }
mockChannel.mockReturnValue({ on: mockOn })
mockOn.mockReturnValue(channelObj)
mockSubscribe.mockReturnValue(channelObj)

vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth }))
vi.mock("@/lib/media-upload", () => ({ uploadMedia: (...args: unknown[]) => mockUploadMedia(...args) }))

const mockSupabaseClient = {
  from: mockFrom,
  channel: mockChannel,
  removeChannel: mockRemoveChannel,
}
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabaseClient,
}))

import { useVisionBoard } from "@/lib/hooks/use-vision-board"

/** Helper to find the last from() call for a given table */
function getFromCall(table: string) {
  return fromCalls.filter((c) => c.table === table).pop()
}

// ── Test Suite ─────────────────────────────────────────────
describe("useVisionBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fromCalls.length = 0
    mockChannel.mockReturnValue({ on: mockOn })
    mockOn.mockReturnValue(channelObj)
    mockSubscribe.mockReturnValue(channelObj)
    // Default auth
    useAuth.mockReturnValue({
      user: { id: "user-1" },
      partner: { id: "partner-1", display_name: "Yara" },
      profile: null,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })
  })

  // ── Unit Tests ──────────────────────────────────────────
  describe("unit", () => {
    it("returns loading state initially", () => {
      const { result } = renderHook(() => useVisionBoard())
      expect(result.current.isLoading).toBe(true)
    })

    it("returns inert state when user is null", () => {
      useAuth.mockReturnValue({
        user: null,
        partner: null,
        profile: null,
        isLoading: false,
        profileNeedsSetup: false,
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      })

      const { result } = renderHook(() => useVisionBoard())
      expect(result.current.myBoard).toBeNull()
      expect(result.current.partnerBoard).toBeNull()
      expect(result.current.categories).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.hasEvaluatedThisMonth).toBe(false)
      expect(result.current.activeBoard).toBe("mine")
    })

    it("defaults activeBoard to 'mine'", () => {
      const { result } = renderHook(() => useVisionBoard())
      expect(result.current.activeBoard).toBe("mine")
    })

    it("switchBoard toggles activeBoard", () => {
      const { result } = renderHook(() => useVisionBoard())
      act(() => {
        result.current.switchBoard("partner")
      })
      expect(result.current.activeBoard).toBe("partner")
    })

    it("hasEvaluatedThisMonth returns false with no evaluations", async () => {
      const { result } = renderHook(() => useVisionBoard())
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      expect(result.current.hasEvaluatedThisMonth).toBe(false)
    })

    it("currentBoard reflects activeBoard selection", () => {
      const { result } = renderHook(() => useVisionBoard())
      expect(result.current.currentBoard).toBeNull()
    })
  })

  // ── Integration Tests ───────────────────────────────────
  describe("integration", () => {
    it("fetches own board on mount", async () => {
      renderHook(() => useVisionBoard())
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith("vision_boards")
      })
    })

    it("queries with correct owner_id and year", async () => {
      renderHook(() => useVisionBoard())
      await waitFor(() => {
        const call = getFromCall("vision_boards")
        expect(call).toBeDefined()
        expect(call!.chain.eq).toHaveBeenCalledWith("owner_id", "user-1")
      })
    })

    it("sets up realtime subscription on mount", async () => {
      renderHook(() => useVisionBoard())
      await waitFor(() => {
        expect(mockChannel).toHaveBeenCalledWith("vision_items_realtime")
      })
    })

    it("cleans up realtime channel on unmount", async () => {
      const { unmount } = renderHook(() => useVisionBoard())
      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled()
      })
      unmount()
      expect(mockRemoveChannel).toHaveBeenCalled()
    })

    it("createBoard calls supabase with correct table", async () => {
      const { result } = renderHook(() => useVisionBoard())
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.createBoard({ title: "My 2026", theme: "Growth" })
      })

      const call = getFromCall("vision_boards")
      expect(call).toBeDefined()
      expect(call!.chain.insert).toHaveBeenCalled()
    })

    it("addCategory calls supabase with correct table", async () => {
      const { result } = renderHook(() => useVisionBoard())
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.addCategory("board-1", "Career", "💼")
      })

      const call = getFromCall("vision_categories")
      expect(call).toBeDefined()
      expect(call!.chain.insert).toHaveBeenCalled()
    })

    it("addItem with file calls uploadMedia with correct params", async () => {
      mockUploadMedia.mockResolvedValue({ url: "https://test.com/img.webp", mediaId: "media-1" })

      const { result } = renderHook(() => useVisionBoard())
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const file = new File(["test"], "test.png", { type: "image/png" })
      await act(async () => {
        await result.current.addItem("cat-1", { title: "Dream Job", file })
      })

      expect(mockUploadMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: "vision-board-images",
          sourceTable: "vision_items",
          maxWidth: 800,
          maxHeight: 800,
        })
      )
    })

    it("addItem without file does not call uploadMedia", async () => {
      const { result } = renderHook(() => useVisionBoard())
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.addItem("cat-1", { title: "Text only" })
      })

      expect(mockUploadMedia).not.toHaveBeenCalled()
    })

    it("toggleAchieved on non-existent item is safe", async () => {
      const { result } = renderHook(() => useVisionBoard())
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.toggleAchieved("nonexistent")
      })
      expect(result.current.error).toBeNull()
    })

    it("submitEvaluation inserts evaluation and category scores", async () => {
      const { result } = renderHook(() => useVisionBoard())
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.submitEvaluation({
          boardId: "board-1",
          month: 3,
          overallScore: 7,
          categoryScores: [
            { categoryId: "cat-1", score: 8, note: "Good progress" },
          ],
          reflection: "Great month overall",
        })
      })

      const evalCall = getFromCall("monthly_evaluations")
      expect(evalCall).toBeDefined()
      expect(evalCall!.chain.insert).toHaveBeenCalled()

      const scoresCall = getFromCall("category_scores")
      expect(scoresCall).toBeDefined()
      expect(scoresCall!.chain.insert).toHaveBeenCalled()
    })

    it("removeItem calls delete on vision_items", async () => {
      const { result } = renderHook(() => useVisionBoard())
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.removeItem("item-1")
      })

      const call = getFromCall("vision_items")
      expect(call).toBeDefined()
      expect(call!.chain.delete).toHaveBeenCalled()
    })

    it("removeCategory calls delete on vision_categories", async () => {
      const { result } = renderHook(() => useVisionBoard())
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.removeCategory("cat-1")
      })

      const call = getFromCall("vision_categories")
      expect(call).toBeDefined()
      expect(call!.chain.delete).toHaveBeenCalled()
    })

    it("setHeroBanner uploads media and updates board", async () => {
      mockUploadMedia.mockResolvedValue({ url: "https://test.com/hero.webp", mediaId: "media-hero" })

      const { result } = renderHook(() => useVisionBoard())
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const file = new File(["hero"], "hero.png", { type: "image/png" })
      await act(async () => {
        await result.current.setHeroBanner("board-1", file)
      })

      expect(mockUploadMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: "vision-board-images",
          sourceTable: "vision_boards",
          sourceColumn: "hero_media_id",
          maxWidth: 1920,
          maxHeight: 1080,
        })
      )
    })

    it("getEvaluations returns array from supabase", async () => {
      const { result } = renderHook(() => useVisionBoard())
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let evals: unknown[] = []
      await act(async () => {
        evals = await result.current.getEvaluations("board-1")
      })

      expect(Array.isArray(evals)).toBe(true)
    })

    it("fetches partner board on mount when partner exists", async () => {
      renderHook(() => useVisionBoard())
      await waitFor(() => {
        const calls = fromCalls.filter((c) => c.table === "vision_boards")
        // Should have at least 2 calls: own board + partner board
        expect(calls.length).toBeGreaterThanOrEqual(2)
      })
    })
  })

  // ── Error Handling ──────────────────────────────────────
  describe("error handling", () => {
    it("sets error on board fetch failure", async () => {
      // Override the first from("vision_boards") call to return error
      let callCount = 0
      mockFrom.mockImplementation((table: string) => {
        const chain = createChainableMock()
        if (table === "vision_boards" && callCount === 0) {
          callCount++
          chain.maybeSingle.mockResolvedValue({ data: null, error: { message: "Network error" } })
        }
        fromCalls.push({ table, chain })
        return chain
      })

      const { result } = renderHook(() => useVisionBoard())
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      expect(result.current.error).toBe("Network error")
    })

    it("inert createBoard returns null when user is null", async () => {
      useAuth.mockReturnValue({
        user: null,
        partner: null,
        profile: null,
        isLoading: false,
        profileNeedsSetup: false,
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      })

      const { result } = renderHook(() => useVisionBoard())
      const boardId = await result.current.createBoard({ title: "Test" })
      expect(boardId).toBeNull()
    })

    it("inert submitEvaluation returns null when user is null", async () => {
      useAuth.mockReturnValue({
        user: null,
        partner: null,
        profile: null,
        isLoading: false,
        profileNeedsSetup: false,
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
      })

      const { result } = renderHook(() => useVisionBoard())
      const evalId = await result.current.submitEvaluation({
        boardId: "b",
        month: 1,
        overallScore: 5,
        categoryScores: [],
      })
      expect(evalId).toBeNull()
    })
  })
})

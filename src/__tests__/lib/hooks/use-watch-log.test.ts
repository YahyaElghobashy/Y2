import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────

const mockUser = { id: "user-1", email: "yahya@test.com" }
const mockPartner = { id: "user-2", email: "yara@test.com" }
const mockUseAuth: ReturnType<typeof vi.fn> = vi.fn(() => ({
  user: mockUser,
  partner: mockPartner,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

// ── Test Data ─────────────────────────────────────────────────

const MOCK_WATCHLIST_ITEM = {
  id: "item-1",
  added_by: "user-1",
  title: "Inception",
  item_type: "movie",
  poster_url: "https://image.tmdb.org/t/p/w342/poster1.jpg",
  poster_media_id: null,
  year: 2010,
  tmdb_id: 27205,
  status: "watchlist",
  watched_date: null,
  both_rated: false,
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

const MOCK_WATCHED_ITEM = {
  id: "item-2",
  added_by: "user-1",
  title: "Your Name",
  item_type: "anime",
  poster_url: null,
  poster_media_id: null,
  year: 2016,
  tmdb_id: 372058,
  status: "watched",
  watched_date: "2026-02-20",
  both_rated: true,
  created_at: "2026-02-15T00:00:00Z",
  updated_at: "2026-02-20T00:00:00Z",
}

const MOCK_WATCHING_ITEM = {
  id: "item-3",
  added_by: "user-2",
  title: "Breaking Bad",
  item_type: "series",
  poster_url: null,
  poster_media_id: null,
  year: 2008,
  tmdb_id: 1396,
  status: "watching",
  watched_date: null,
  both_rated: false,
  created_at: "2026-03-01T00:00:00Z",
  updated_at: "2026-03-01T00:00:00Z",
}

const MOCK_MY_RATING = {
  id: "rating-1",
  item_id: "item-2",
  user_id: "user-1",
  score: 9,
  reaction: "Absolutely beautiful!",
  submitted_at: "2026-02-20T12:00:00Z",
}

const MOCK_PARTNER_RATING = {
  id: "rating-2",
  item_id: "item-2",
  user_id: "user-2",
  score: 8,
  reaction: "So touching",
  submitted_at: "2026-02-20T14:00:00Z",
}

// ── Mutable query result refs ─────────────────────────────────

let itemsResult = {
  data: [MOCK_WATCHLIST_ITEM, MOCK_WATCHED_ITEM, MOCK_WATCHING_ITEM] as unknown[] | null,
  error: null as unknown,
}
let ratingsResult = {
  data: [MOCK_MY_RATING, MOCK_PARTNER_RATING] as unknown[] | null,
  error: null as unknown,
}
let insertResult = { data: MOCK_WATCHLIST_ITEM as unknown, error: null as unknown }
let updateResult = { error: null as unknown }
let deleteResult = { error: null as unknown }
let upsertResult = { data: MOCK_MY_RATING as unknown, error: null as unknown }

const insertCalls: unknown[] = []
const upsertCalls: unknown[] = []

const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()
const mockChannelOn = vi.fn(function (this: unknown) { return this })

function buildChain(table: string) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => {
    if (table === "watch_items") return Promise.resolve(itemsResult)
    if (table === "watch_ratings") return Promise.resolve(ratingsResult)
    return Promise.resolve({ data: [], error: null })
  })
  chain.single = vi.fn(() => {
    if (table === "watch_ratings") return Promise.resolve(upsertResult)
    return Promise.resolve(insertResult)
  })
  chain.insert = vi.fn((data: unknown) => {
    insertCalls.push({ table, data })
    return chain
  })
  chain.update = vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve(updateResult)),
  }))
  chain.delete = vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve(deleteResult)),
  }))
  chain.upsert = vi.fn((data: unknown, opts: unknown) => {
    upsertCalls.push({ table, data, opts })
    return chain
  })
  return chain
}

const mockFrom = vi.fn((table: string) => buildChain(table))

const stableSupabase = {
  from: mockFrom,
  channel: vi.fn(() => ({ on: mockChannelOn, subscribe: mockSubscribe })),
  removeChannel: mockRemoveChannel,
  auth: {
    getSession: vi.fn(() =>
      Promise.resolve({
        data: { session: { access_token: "test-token" } },
      })
    ),
  },
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => stableSupabase,
}))

import { useWatchLog } from "@/lib/hooks/use-watch-log"

describe("useWatchLog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser, partner: mockPartner })
    itemsResult = {
      data: [MOCK_WATCHLIST_ITEM, MOCK_WATCHED_ITEM, MOCK_WATCHING_ITEM],
      error: null,
    }
    ratingsResult = { data: [MOCK_MY_RATING, MOCK_PARTNER_RATING], error: null }
    insertResult = { data: MOCK_WATCHLIST_ITEM, error: null }
    updateResult = { error: null }
    deleteResult = { error: null }
    upsertResult = { data: MOCK_MY_RATING, error: null }
    insertCalls.length = 0
    upsertCalls.length = 0
    mockChannelOn.mockImplementation(function (this: unknown) { return this })
  })

  // ── UNIT: Status filtering ────────────────────────────────

  it("splits items into watchlist, watching, and watched arrays", async () => {
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.watchlist).toHaveLength(1)
    expect(result.current.watchlist[0].title).toBe("Inception")

    expect(result.current.watching).toHaveLength(1)
    expect(result.current.watching[0].title).toBe("Breaking Bad")

    expect(result.current.watched).toHaveLength(1)
    expect(result.current.watched[0].title).toBe("Your Name")
  })

  it("returns empty arrays when user is null", () => {
    mockUseAuth.mockReturnValue({ user: null, partner: null })
    const { result } = renderHook(() => useWatchLog())

    expect(result.current.watchlist).toEqual([])
    expect(result.current.watching).toEqual([])
    expect(result.current.watched).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it("sets error state when items fetch fails", async () => {
    itemsResult = { data: null, error: { message: "DB error" } }
    const { result } = renderHook(() => useWatchLog())

    await waitFor(() => expect(result.current.error).toBe("DB error"))
  })

  it("sets error state when ratings fetch fails", async () => {
    ratingsResult = { data: null, error: { message: "Ratings error" } }
    const { result } = renderHook(() => useWatchLog())

    await waitFor(() => expect(result.current.error).toBe("Ratings error"))
  })

  // ── UNIT: Rating masking ──────────────────────────────────

  it("returns my rating for a rated item", async () => {
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const rating = result.current.myRating("item-2")
    expect(rating).not.toBeNull()
    expect(rating!.score).toBe(9)
    expect(rating!.reaction).toBe("Absolutely beautiful!")
  })

  it("returns null for myRating on unrated item", async () => {
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.myRating("item-1")).toBeNull()
  })

  it("returns partner rating when both_rated is true", async () => {
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const rating = result.current.partnerRating("item-2")
    expect(rating).not.toBeNull()
    expect(rating!.score).toBe(8)
  })

  it("masks partner rating when both_rated is false", async () => {
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.partnerRating("item-1")).toBeNull()
  })

  // ── UNIT: Stats computation ───────────────────────────────

  it("computes totalWatched from watched items", async () => {
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.stats.totalWatched).toBe(1)
  })

  it("computes avgScore from user ratings on watched items", async () => {
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.stats.avgScore).toBe(9)
  })

  it("computes byType counts for watched items", async () => {
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.stats.byType.anime).toBe(1)
    expect(result.current.stats.byType.movie).toBe(0)
  })

  it("computes agreeRate as percentage where scores differ by <= 1", async () => {
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // item-2: myScore=9, partnerScore=8, diff=1 → agree
    expect(result.current.stats.agreeRate).toBe(100)
  })

  it("returns 0 agreeRate when no both-rated items", async () => {
    itemsResult = { data: [MOCK_WATCHLIST_ITEM], error: null }
    ratingsResult = { data: [], error: null }
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.stats.agreeRate).toBe(0)
  })

  // ── INTERACTION: addItem ──────────────────────────────────

  it("addItem inserts with correct table and data", async () => {
    const newItem = { ...MOCK_WATCHLIST_ITEM, id: "item-new", title: "Dune Part Two" }
    insertResult = { data: newItem, error: null }

    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.addItem({
        title: "Dune Part Two",
        item_type: "movie",
        tmdb_id: 693134,
      })
    })

    expect(insertCalls).toHaveLength(1)
    expect(insertCalls[0]).toMatchObject({
      table: "watch_items",
      data: expect.objectContaining({ title: "Dune Part Two", tmdb_id: 693134 }),
    })
  })

  it("addItem sets error on failure", async () => {
    insertResult = { data: null, error: { message: "Insert failed" } }

    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.addItem({ title: "Bad Movie" })
    })

    expect(result.current.error).toBe("Insert failed")
  })

  // ── INTERACTION: updateStatus ─────────────────────────────

  it("updateStatus calls supabase update with correct status", async () => {
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.updateStatus("item-1", "watching")
    })

    // Verify from("watch_items").update() was called
    expect(mockFrom).toHaveBeenCalledWith("watch_items")
  })

  it("updateStatus sets error on failure", async () => {
    updateResult = { error: { message: "Update failed" } }
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.updateStatus("item-1", "watching")
    })

    expect(result.current.error).toBe("Update failed")
  })

  // ── INTERACTION: removeItem ───────────────────────────────

  it("removeItem calls supabase delete", async () => {
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.removeItem("item-1")
    })

    expect(mockFrom).toHaveBeenCalledWith("watch_items")
  })

  it("removeItem sets error on failure and rolls back", async () => {
    deleteResult = { error: { message: "Delete failed" } }
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const countBefore = result.current.watchlist.length

    await act(async () => {
      await result.current.removeItem("item-1")
    })

    expect(result.current.error).toBe("Delete failed")
    expect(result.current.watchlist.length).toBe(countBefore)
  })

  // ── INTERACTION: submitRating ─────────────────────────────

  it("submitRating upserts rating with correct score and reaction", async () => {
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.submitRating("item-3", 7, "Great show!")
    })

    expect(upsertCalls).toHaveLength(1)
    expect(upsertCalls[0]).toMatchObject({
      table: "watch_ratings",
      data: expect.objectContaining({
        item_id: "item-3",
        user_id: "user-1",
        score: 7,
        reaction: "Great show!",
      }),
    })
  })

  it("submitRating rejects scores below 1", async () => {
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.submitRating("item-3", 0)
    })

    expect(result.current.error).toBe("Score must be between 1 and 10")
    expect(upsertCalls).toHaveLength(0)
  })

  it("submitRating rejects scores above 10", async () => {
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.submitRating("item-3", 11)
    })

    expect(result.current.error).toBe("Score must be between 1 and 10")
    expect(upsertCalls).toHaveLength(0)
  })

  it("submitRating sets error on failure", async () => {
    upsertResult = { data: null, error: { message: "Upsert failed" } }
    const { result } = renderHook(() => useWatchLog())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.submitRating("item-3", 8)
    })

    expect(result.current.error).toBe("Upsert failed")
  })

  // ── INTEGRATION: Supabase calls ───────────────────────────

  it("fetches from watch_items and watch_ratings on mount", async () => {
    renderHook(() => useWatchLog())

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("watch_items")
      expect(mockFrom).toHaveBeenCalledWith("watch_ratings")
    })
  })

  it("subscribes to realtime channel for watch updates", async () => {
    renderHook(() => useWatchLog())

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled()
    })
  })

  it("cleans up realtime channel on unmount", async () => {
    const { unmount } = renderHook(() => useWatchLog())
    await waitFor(() => expect(mockSubscribe).toHaveBeenCalled())

    unmount()
    expect(mockRemoveChannel).toHaveBeenCalled()
  })

  it("does not subscribe to realtime when user is null", () => {
    mockUseAuth.mockReturnValue({ user: null, partner: null })
    renderHook(() => useWatchLog())

    expect(mockSubscribe).not.toHaveBeenCalled()
  })

  it("does not fetch when user is null", () => {
    mockUseAuth.mockReturnValue({ user: null, partner: null })
    renderHook(() => useWatchLog())

    expect(mockFrom).not.toHaveBeenCalled()
  })
})

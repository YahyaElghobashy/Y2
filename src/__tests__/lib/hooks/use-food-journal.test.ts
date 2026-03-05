import { renderHook, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ────────────────────────────────────────────────────
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

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
}))

// Default chain behavior
mockSelect.mockReturnValue({ order: mockOrder, eq: mockEq, data: [], error: null })
mockOrder.mockReturnValue({ data: [], error: null })
mockEq.mockReturnValue({ data: [], error: null })
mockInsert.mockReturnValue({ select: vi.fn(() => ({ single: mockSingle })) })
mockSingle.mockResolvedValue({ data: null, error: null })
mockUpdate.mockReturnValue({ eq: mockEq })
mockDelete.mockReturnValue({ eq: mockEq })

vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth }))
const mockSupabaseClient = {
  from: mockFrom,
  channel: vi.fn(() => mockChannel),
  removeChannel: vi.fn(),
}
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabaseClient,
}))

import { useFoodJournal } from "@/lib/hooks/use-food-journal"
import type { FoodRating } from "@/lib/types/food-journal.types"

describe("useFoodJournal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset default chain behavior
    mockSelect.mockReturnValue({ order: mockOrder, eq: mockEq, data: [], error: null })
    mockOrder.mockReturnValue({ data: [], error: null })
    mockEq.mockReturnValue({ data: [], error: null })
    mockInsert.mockReturnValue({ select: vi.fn(() => ({ single: mockSingle })) })
    mockSingle.mockResolvedValue({ data: null, error: null })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockDelete.mockReturnValue({ eq: mockEq })
  })

  // ── Unit tests ───────────────────────────────────────────

  it("returns loading state initially", () => {
    const { result } = renderHook(() => useFoodJournal())
    expect(result.current.isLoading).toBe(true)
  })

  it("returns empty state when no user", () => {
    useAuth.mockReturnValue({
      user: null,
      partner: null,
      profile: null,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    })

    const { result } = renderHook(() => useFoodJournal())
    expect(result.current.visits).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.stats.totalVisits).toBe(0)
    expect(result.current.getMyRating("any")).toBeNull()
    expect(result.current.getPartnerRating("any")).toBeNull()
    expect(result.current.getPreferenceDot("any", "vibe_score")).toBeNull()

    // Restore
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

  it("computes stats correctly", async () => {
    const visits = [
      { id: "v1", user_id: "user-1", place_name: "Restaurant A", place_id: null, cuisine_type: "egyptian", is_bookmarked: true, visit_number: 1 },
      { id: "v2", user_id: "user-1", place_name: "Restaurant A", place_id: null, cuisine_type: "egyptian", is_bookmarked: false, visit_number: 2 },
      { id: "v3", user_id: "user-1", place_name: "Restaurant B", place_id: null, cuisine_type: "italian", is_bookmarked: true, visit_number: 1 },
    ]
    const ratings = [
      { id: "r1", visit_id: "v1", user_id: "user-1", overall_average: 8.0 },
      { id: "r2", visit_id: "v2", user_id: "user-1", overall_average: 7.0 },
    ]

    // Mock Promise.all responses
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: visits, error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: ratings, error: null }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })

    const { result } = renderHook(() => useFoodJournal())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.stats.totalVisits).toBe(3)
    expect(result.current.stats.uniquePlaces).toBe(2)
    expect(result.current.stats.avgOverall).toBe(7.5)
    expect(result.current.stats.topCuisine).toBe("egyptian")
    expect(result.current.stats.returnSpots).toBe(1)
    expect(result.current.stats.bookmarkedCount).toBe(2)
  })

  it("masks vibe_score when both_reviewed is false", async () => {
    const partnerRating: Partial<FoodRating> = {
      id: "r-partner",
      visit_id: "v1",
      user_id: "partner-1",
      vibe_score: 9,
      both_reviewed: false,
      overall_average: 7.5,
    }

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [{ id: "v1" }], error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [partnerRating], error: null }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })

    const { result } = renderHook(() => useFoodJournal())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const rating = result.current.getPartnerRating("v1")
    expect(rating).not.toBeNull()
    expect(rating!.vibe_score).toBe(0) // masked
  })

  it("reveals vibe_score when both_reviewed is true", async () => {
    const partnerRating: Partial<FoodRating> = {
      id: "r-partner",
      visit_id: "v1",
      user_id: "partner-1",
      vibe_score: 9,
      both_reviewed: true,
      overall_average: 7.5,
    }

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [{ id: "v1" }], error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [partnerRating], error: null }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })

    const { result } = renderHook(() => useFoodJournal())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const rating = result.current.getPartnerRating("v1")
    expect(rating!.vibe_score).toBe(9) // not masked
  })

  it("computes preference dot correctly", async () => {
    const myRating = {
      id: "r1", visit_id: "v1", user_id: "user-1",
      location_score: 8, parking_score: 5, service_score: 7,
      food_quality: 9, quantity_score: 6, price_score: 7,
      cuisine_score: 8, bathroom_score: 5, vibe_score: 8,
      overall_average: 7.0, both_reviewed: true, created_at: "",
    }
    const partnerRating = {
      id: "r2", visit_id: "v1", user_id: "partner-1",
      location_score: 6, parking_score: 5, service_score: 9,
      food_quality: 9, quantity_score: 6, price_score: 7,
      cuisine_score: 8, bathroom_score: 5, vibe_score: 4,
      overall_average: 6.7, both_reviewed: true, created_at: "",
    }

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [{ id: "v1" }], error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [myRating, partnerRating], error: null }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })

    const { result } = renderHook(() => useFoodJournal())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // location: 8 vs 6 = diff 2 → "me"
    expect(result.current.getPreferenceDot("v1", "location_score")).toBe("me")
    // parking: 5 vs 5 = diff 0 → "similar"
    expect(result.current.getPreferenceDot("v1", "parking_score")).toBe("similar")
    // service: 7 vs 9 = diff -2 → "partner"
    expect(result.current.getPreferenceDot("v1", "service_score")).toBe("partner")
    // food_quality: 9 vs 9 = diff 0 → "similar"
    expect(result.current.getPreferenceDot("v1", "food_quality")).toBe("similar")
    // vibe: 8 vs 4 = diff 4 → "me"
    expect(result.current.getPreferenceDot("v1", "vibe_score")).toBe("me")
  })

  it("returns null preference dot when not both reviewed", () => {
    const { result } = renderHook(() => useFoodJournal())
    expect(result.current.getPreferenceDot("nonexistent", "location_score")).toBeNull()
  })

  it("filters by cuisine types", async () => {
    const visits = [
      { id: "v1", cuisine_type: "egyptian" },
      { id: "v2", cuisine_type: "italian" },
      { id: "v3", cuisine_type: "egyptian" },
    ]

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: visits, error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })

    const { result } = renderHook(() => useFoodJournal())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const filtered = result.current.filterByCuisine(["egyptian"])
    expect(filtered).toHaveLength(2)
    expect(filtered.every((v) => v.cuisine_type === "egyptian")).toBe(true)

    // Empty filter returns all
    const all = result.current.filterByCuisine([])
    expect(all).toHaveLength(3)
  })

  // ── Interaction tests ──────────────────────────────────────

  it("addVisit calls supabase.from('food_visits').insert()", async () => {
    const newVisit = {
      id: "new-1",
      user_id: "user-1",
      place_name: "Test Restaurant",
      cuisine_type: "egyptian",
      visit_date: "2026-03-05",
    }

    const insertSelect = vi.fn(() => ({
      single: vi.fn().mockResolvedValue({ data: newVisit, error: null }),
    }))
    const insertFn = vi.fn(() => ({ select: insertSelect }))

    // First 3 calls for initial load, 4th for addVisit
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })
      .mockReturnValueOnce({ insert: insertFn })

    const { result } = renderHook(() => useFoodJournal())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      const id = await result.current.addVisit({
        place_name: "Test Restaurant",
        cuisine_type: "egyptian",
        visit_date: "2026-03-05",
      })
      expect(id).toBe("new-1")
    })

    expect(mockFrom).toHaveBeenCalledWith("food_visits")
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        place_name: "Test Restaurant",
        cuisine_type: "egyptian",
      })
    )
  })

  it("toggleBookmark optimistically updates is_bookmarked", async () => {
    const visit = {
      id: "v1",
      user_id: "user-1",
      place_name: "Test",
      is_bookmarked: false,
      cuisine_type: "egyptian",
    }

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [visit], error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })
      .mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })

    const { result } = renderHook(() => useFoodJournal())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.toggleBookmark("v1")
    })

    expect(result.current.visits[0].is_bookmarked).toBe(true)
  })

  // ── Integration tests ──────────────────────────────────────

  it("fetches from correct tables on mount", async () => {
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })

    renderHook(() => useFoodJournal())

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("food_visits")
      expect(mockFrom).toHaveBeenCalledWith("food_ratings")
      expect(mockFrom).toHaveBeenCalledWith("food_photos")
    })
  })

  it("sets up realtime subscription on mount", async () => {
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })

    renderHook(() => useFoodJournal())

    await waitFor(() => {
      expect(mockSupabaseClient.channel).toHaveBeenCalledWith("food_journal_realtime")
      expect(mockChannel.on).toHaveBeenCalledTimes(3) // visits, ratings, photos
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })
  })

  it("addRating inserts with correct dimension values", async () => {
    const ratingData = {
      visit_id: "v1",
      location_score: 8,
      parking_score: 7,
      service_score: 9,
      food_quality: 8,
      quantity_score: 7,
      price_score: 6,
      cuisine_score: 9,
      bathroom_score: 5,
      vibe_score: 8,
    }
    const insertedRating = { id: "r-new", ...ratingData, user_id: "user-1", overall_average: 7.4, both_reviewed: false }

    const insertSelect = vi.fn(() => ({
      single: vi.fn().mockResolvedValue({ data: insertedRating, error: null }),
    }))
    const insertFn = vi.fn(() => ({ select: insertSelect }))

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })
      .mockReturnValueOnce({ insert: insertFn })

    const { result } = renderHook(() => useFoodJournal())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.addRating(ratingData)
    })

    expect(mockFrom).toHaveBeenCalledWith("food_ratings")
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        visit_id: "v1",
        location_score: 8,
        vibe_score: 8,
      })
    )
  })

  it("addPhotos inserts multiple photos with user_id", async () => {
    const photoData = [
      { visit_id: "v1", photo_type: "food_plate", storage_path: "/path/1.webp" },
      { visit_id: "v1", photo_type: "partner_eating", storage_path: "/path/2.webp" },
    ]
    const insertedPhotos = photoData.map((p, i) => ({
      id: `p${i}`,
      ...p,
      user_id: "user-1",
      display_order: 0,
      media_file_id: null,
      created_at: "",
    }))

    const insertSelect = vi.fn().mockResolvedValue({ data: insertedPhotos, error: null })
    const insertFn = vi.fn(() => ({ select: insertSelect }))

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })
      .mockReturnValueOnce({ insert: insertFn })

    const { result } = renderHook(() => useFoodJournal())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.addPhotos(photoData as any)
    })

    expect(mockFrom).toHaveBeenCalledWith("food_photos")
    expect(insertFn).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ user_id: "user-1", photo_type: "food_plate" }),
        expect.objectContaining({ user_id: "user-1", photo_type: "partner_eating" }),
      ])
    )
  })

  it("removePhoto optimistically removes and calls delete", async () => {
    const photo = { id: "p1", visit_id: "v1", user_id: "user-1", photo_type: "food_plate", storage_path: "/path/1.webp" }

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [photo], error: null }),
        }),
      })
      .mockReturnValueOnce({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })

    const { result } = renderHook(() => useFoodJournal())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.getPhotos("v1")).toHaveLength(1)

    await act(async () => {
      await result.current.removePhoto("p1")
    })

    expect(result.current.getPhotos("v1")).toHaveLength(0)
  })

  it("getVisitById returns visit with ratings and photos", async () => {
    const visit = { id: "v1", user_id: "user-1", place_name: "Test", cuisine_type: "egyptian" }
    const myRating = { id: "r1", visit_id: "v1", user_id: "user-1", location_score: 8, both_reviewed: true, overall_average: 7 }
    const photo = { id: "p1", visit_id: "v1", user_id: "user-1", photo_type: "food_plate", storage_path: "/test" }

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [visit], error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: [myRating], error: null }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [photo], error: null }),
        }),
      })

    const { result } = renderHook(() => useFoodJournal())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const full = result.current.getVisitById("v1")
    expect(full).not.toBeNull()
    expect(full!.place_name).toBe("Test")
    expect(full!.myRating).not.toBeNull()
    expect(full!.photos).toHaveLength(1)
  })

  it("handles fetch error gracefully", async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "Network error" } }),
      }),
    })

    const { result } = renderHook(() => useFoodJournal())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe("Network error")
    expect(result.current.visits).toEqual([])
  })
})

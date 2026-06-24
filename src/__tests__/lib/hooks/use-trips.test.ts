import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Auth mock ─────────────────────────────────────────────────
const mockUser = { id: "user-1", email: "yahya@test.com" }
const mockPartner = { id: "user-2", email: "yara@test.com" }
const mockUseAuth: ReturnType<typeof vi.fn> = vi.fn(() => ({
  user: mockUser,
  partner: mockPartner,
}))
vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// ── Test data ─────────────────────────────────────────────────
const MOCK_TRIP_OWN = {
  id: "trip-1",
  created_by: "user-1",
  title: "Cambridge & London",
  destination: "England",
  start_date: "2026-06-24",
  end_date: "2026-07-04",
  cover_image: null,
  summary: null,
  kind: "hosted",
  hosted_path: "cambridge-london",
  status: "ongoing",
  created_at: "2026-06-01T00:00:00Z",
}
const MOCK_TRIP_PARTNER = {
  ...MOCK_TRIP_OWN,
  id: "trip-2",
  created_by: "user-2",
  title: "Sahel",
  kind: "native",
  hosted_path: null,
  status: "upcoming",
  created_at: "2026-05-01T00:00:00Z",
}
const MOCK_COMPANION = {
  id: "comp-1",
  trip_id: "trip-1",
  name: "Mama",
  relation: "Mother",
  avatar_url: null,
  created_at: "2026-06-01T00:00:00Z",
}

// ── Mutable query result refs ─────────────────────────────────
let tripsResult = { data: [MOCK_TRIP_OWN, MOCK_TRIP_PARTNER] as unknown[] | null, error: null as unknown }
let companionsResult = { data: [MOCK_COMPANION] as unknown[] | null, error: null as unknown }
let tripInsertResult = { data: MOCK_TRIP_OWN as unknown, error: null as unknown }
let companionInsertResult = { data: [MOCK_COMPANION] as unknown, error: null as unknown }
let companionSingleInsertResult = { data: MOCK_COMPANION as unknown, error: null as unknown }
let updateResult = { error: null as unknown }
let deleteResult = { error: null as unknown }

const tripsInsertCalls: unknown[] = []
const companionsInsertCalls: unknown[] = []
const tripsUpdateCalls: unknown[] = []

const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()
const mockChannelOn = vi.fn(function (this: unknown) { return this })

function buildChain(table: string) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  // SELECT path: trips → .select().order(); companions → .select().in().order()
  chain.select = vi.fn(() => chain)
  chain.in = vi.fn(() => chain)
  chain.order = vi.fn(() => {
    if (table === "trips") return Promise.resolve(tripsResult)
    return Promise.resolve(companionsResult)
  })
  // INSERT path differs by table + by .single() vs not.
  chain.insert = vi.fn((data: unknown) => {
    if (table === "trips") {
      tripsInsertCalls.push(data)
      return {
        select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve(tripInsertResult)) })),
      }
    }
    // trip_companions: bulk insert (.select()) or single (.select().single())
    companionsInsertCalls.push(data)
    return {
      select: vi.fn(() => {
        const r = Promise.resolve(companionInsertResult) as Promise<unknown> & {
          single?: () => Promise<unknown>
        }
        r.single = () => Promise.resolve(companionSingleInsertResult)
        return r
      }),
    }
  })
  chain.update = vi.fn((data: unknown) => {
    if (table === "trips") tripsUpdateCalls.push(data)
    return { eq: vi.fn(() => Promise.resolve(updateResult)) }
  })
  chain.delete = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve(deleteResult)) }))
  return chain
}

const mockFrom = vi.fn((table: string) => buildChain(table))
const stableSupabase = {
  from: mockFrom,
  channel: vi.fn(() => ({ on: mockChannelOn, subscribe: mockSubscribe })),
  removeChannel: mockRemoveChannel,
}
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => stableSupabase,
}))

import { useTrips } from "@/lib/hooks/use-trips"

describe("useTrips", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser, partner: mockPartner })
    tripsResult = { data: [MOCK_TRIP_OWN, MOCK_TRIP_PARTNER], error: null }
    companionsResult = { data: [MOCK_COMPANION], error: null }
    tripInsertResult = { data: MOCK_TRIP_OWN, error: null }
    companionInsertResult = { data: [MOCK_COMPANION], error: null }
    companionSingleInsertResult = { data: MOCK_COMPANION, error: null }
    updateResult = { error: null }
    deleteResult = { error: null }
    tripsInsertCalls.length = 0
    companionsInsertCalls.length = 0
    tripsUpdateCalls.length = 0
    mockChannelOn.mockImplementation(function (this: unknown) { return this })
  })

  // ── Unit ────────────────────────────────────────────────────
  describe("unit", () => {
    it("returns inert state when user is null", () => {
      mockUseAuth.mockReturnValue({ user: null, partner: null })
      const { result } = renderHook(() => useTrips())
      expect(result.current.trips).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.getTrip("trip-1")).toBeNull()
    })

    it("loads trips + joins companions on mount", async () => {
      const { result } = renderHook(() => useTrips())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.trips).toHaveLength(2)
      const t1 = result.current.trips.find((t) => t.id === "trip-1")
      expect(t1?.companions).toHaveLength(1)
      expect(t1?.companions[0].name).toBe("Mama")
      // partner trip with no companions still present, empty array
      const t2 = result.current.trips.find((t) => t.id === "trip-2")
      expect(t2?.companions).toEqual([])
    })

    it("handles an empty trip list without querying companions", async () => {
      tripsResult = { data: [], error: null }
      const { result } = renderHook(() => useTrips())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.trips).toEqual([])
    })

    it("surfaces a trips fetch error", async () => {
      tripsResult = { data: null, error: { message: "boom" } }
      const { result } = renderHook(() => useTrips())
      await waitFor(() => expect(result.current.error).toBe("boom"))
    })

    it("getTrip returns the composed trip with companions", async () => {
      const { result } = renderHook(() => useTrips())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      const trip = result.current.getTrip("trip-1")
      expect(trip?.title).toBe("Cambridge & London")
      expect(trip?.companions[0].name).toBe("Mama")
      expect(result.current.getTrip("missing")).toBeNull()
    })
  })

  // ── Interaction ─────────────────────────────────────────────
  describe("interaction", () => {
    it("createTrip inserts the trip with created_by + correct fields and returns id", async () => {
      const { result } = renderHook(() => useTrips())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      let id: string | null = null
      await act(async () => {
        id = await result.current.createTrip({
          title: "Cambridge & London",
          destination: "England",
          kind: "hosted",
          hosted_path: "cambridge-london",
          status: "ongoing",
        })
      })

      expect(id).toBe("trip-1")
      expect(tripsInsertCalls).toHaveLength(1)
      expect(tripsInsertCalls[0]).toEqual(
        expect.objectContaining({
          created_by: "user-1",
          title: "Cambridge & London",
          kind: "hosted",
          hosted_path: "cambridge-london",
          status: "ongoing",
        })
      )
    })

    it("createTrip inserts inline companions when provided", async () => {
      const { result } = renderHook(() => useTrips())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.createTrip({
          title: "Trip",
          companions: [
            { name: "Mama", relation: "Mother" },
            { name: "  ", relation: "" }, // blank → filtered out
          ],
        })
      })

      expect(companionsInsertCalls).toHaveLength(1)
      const rows = companionsInsertCalls[0] as Array<{ name: string; trip_id: string }>
      expect(rows).toHaveLength(1)
      expect(rows[0]).toEqual(
        expect.objectContaining({ name: "Mama", trip_id: "trip-1", relation: "Mother" })
      )
    })

    it("createTrip returns null and does not insert companions on trip insert failure", async () => {
      tripInsertResult = { data: null, error: { message: "denied" } }
      const { result } = renderHook(() => useTrips())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      let id: string | null = "x"
      await act(async () => {
        id = await result.current.createTrip({ title: "Trip", companions: [{ name: "Mama" }] })
      })

      expect(id).toBeNull()
      expect(companionsInsertCalls).toHaveLength(0)
      expect(result.current.error).toBe("denied")
    })

    it("updateTrip patches only provided fields (cover_image) for an owned trip", async () => {
      const { result } = renderHook(() => useTrips())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.updateTrip("trip-1", { cover_image: "https://x/cover.webp" })
      })

      expect(tripsUpdateCalls).toHaveLength(1)
      expect(tripsUpdateCalls[0]).toEqual({ cover_image: "https://x/cover.webp" })
    })

    it("deleteTrip optimistically removes the trip and its companions", async () => {
      const { result } = renderHook(() => useTrips())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.trips).toHaveLength(2)

      await act(async () => {
        await result.current.deleteTrip("trip-1")
      })

      expect(result.current.trips).toHaveLength(1)
      expect(result.current.getTrip("trip-1")).toBeNull()
    })

    it("deleteTrip rolls back on error", async () => {
      deleteResult = { error: { message: "nope" } }
      const { result } = renderHook(() => useTrips())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.deleteTrip("trip-1")
      })

      await waitFor(() => expect(result.current.error).toBe("nope"))
      expect(result.current.getTrip("trip-1")).not.toBeNull()
    })

    it("addCompanion ignores an empty name", async () => {
      const { result } = renderHook(() => useTrips())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.addCompanion("trip-1", { name: "   " })
      })

      expect(companionsInsertCalls).toHaveLength(0)
    })

    it("addCompanion inserts a single companion with trip_id + trimmed name", async () => {
      companionSingleInsertResult = {
        data: { ...MOCK_COMPANION, id: "comp-2", name: "Hani", relation: "Brother" },
        error: null,
      }
      const { result } = renderHook(() => useTrips())
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      await act(async () => {
        await result.current.addCompanion("trip-1", { name: " Hani ", relation: "Brother" })
      })

      expect(companionsInsertCalls).toHaveLength(1)
      expect(companionsInsertCalls[0]).toEqual(
        expect.objectContaining({ trip_id: "trip-1", name: "Hani", relation: "Brother" })
      )
    })

    it("removeCompanion optimistically drops the companion", async () => {
      const { result } = renderHook(() => useTrips())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() =>
        expect(result.current.getTrip("trip-1")?.companions).toHaveLength(1)
      )

      await act(async () => {
        await result.current.removeCompanion("comp-1")
      })

      expect(result.current.getTrip("trip-1")?.companions).toHaveLength(0)
    })
  })

  // ── Integration ─────────────────────────────────────────────
  describe("integration", () => {
    it("queries the trips table on mount", async () => {
      const { result } = renderHook(() => useTrips())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(mockFrom).toHaveBeenCalledWith("trips")
    })

    it("queries trip_companions for the loaded trip ids", async () => {
      const { result } = renderHook(() => useTrips())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(mockFrom).toHaveBeenCalledWith("trip_companions"))
    })

    it("subscribes to realtime and cleans up on unmount", async () => {
      const { result, unmount } = renderHook(() => useTrips())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      await waitFor(() => expect(mockSubscribe).toHaveBeenCalled())
      // INSERT/UPDATE/DELETE trips + INSERT/DELETE companions = 5 listeners
      expect(mockChannelOn).toHaveBeenCalledTimes(5)
      unmount()
      expect(mockRemoveChannel).toHaveBeenCalled()
    })
  })
})

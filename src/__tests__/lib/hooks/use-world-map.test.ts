import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

const ME = "user-1"
const PARTNER = "user-2"

const MOCK_USER = { id: ME }
const MOCK_PARTNER = {
  id: PARTNER,
  display_name: "Yara",
  email: "yara@test.com",
  avatar_url: null,
  partner_id: ME,
  role: "user",
  created_at: "",
  updated_at: "",
}

function mkVisit(p: Record<string, unknown>) {
  return {
    id: `v-${Math.random().toString(36).slice(2)}`,
    created_by: ME,
    traveler_id: ME,
    country_code: "NL",
    is_together: false,
    place: null,
    visited_year: null,
    visited_on: null,
    companions: null,
    memorable: null,
    recommendation: null,
    partner_note: null,
    trip_id: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...p,
  }
}
function mkPin(p: Record<string, unknown>) {
  return {
    id: `p-${Math.random().toString(36).slice(2)}`,
    owner_id: ME,
    country_code: "JP",
    note: null,
    created_at: "2024-01-01T00:00:00Z",
    ...p,
  }
}

// Mutable fixtures (reset per test).
let visitsData: ReturnType<typeof mkVisit>[]
let pinsData: ReturnType<typeof mkPin>[]
let upcomingData: { id: string; destination: string | null; status: string }[]

// Spies for assertions / error injection.
let insertVisitSingle: ReturnType<typeof vi.fn>
let insertPinSingle: ReturnType<typeof vi.fn>
let insertNotifSingle: ReturnType<typeof vi.fn>
let deleteEq: ReturnType<typeof vi.fn>
let updateEq: ReturnType<typeof vi.fn>
let invoke: ReturnType<typeof vi.fn>
let notifInsertSpy: ReturnType<typeof vi.fn>

const mockChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn() }
const mockRemoveChannel = vi.fn()

function buildFrom() {
  return vi.fn((table: string) => {
    if (table === "country_visits") {
      return {
        select: vi.fn().mockResolvedValue({ data: visitsData, error: null }),
        insert: vi.fn(() => ({ select: () => ({ single: insertVisitSingle }) })),
        update: vi.fn(() => ({ eq: updateEq })),
        delete: vi.fn(() => ({ eq: deleteEq })),
      }
    }
    if (table === "country_pins") {
      return {
        select: vi.fn().mockResolvedValue({ data: pinsData, error: null }),
        insert: vi.fn(() => ({ select: () => ({ single: insertPinSingle }) })),
        delete: vi.fn(() => ({ eq: deleteEq })),
      }
    }
    if (table === "trips") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: upcomingData, error: null }),
        })),
      }
    }
    if (table === "notifications") {
      return { insert: notifInsertSpy }
    }
    return { select: vi.fn().mockResolvedValue({ data: [], error: null }) }
  })
}

let mockSupabase: Record<string, unknown>
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

let mockAuthReturn: Record<string, unknown>
vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockAuthReturn,
}))

import { useWorldMap } from "@/lib/hooks/use-world-map"

beforeEach(() => {
  vi.clearAllMocks()
  visitsData = [
    mkVisit({ country_code: "NL", traveler_id: ME, is_together: false, visited_year: 2019 }),
    mkVisit({ country_code: "NL", traveler_id: ME, is_together: true, visited_year: 2024 }),
    mkVisit({ country_code: "FR", traveler_id: PARTNER, is_together: false }),
  ]
  // I pin JP; partner pins JP (mutual) + BR (not yet mutual).
  pinsData = [
    mkPin({ owner_id: ME, country_code: "JP" }),
    mkPin({ owner_id: PARTNER, country_code: "JP" }),
    mkPin({ owner_id: PARTNER, country_code: "BR" }),
  ]
  upcomingData = []

  insertVisitSingle = vi.fn().mockResolvedValue({ data: mkVisit({ country_code: "IT" }), error: null })
  insertPinSingle = vi.fn((/* */) => Promise.resolve({ data: mkPin({ country_code: "BR" }), error: null }))
  insertNotifSingle = vi.fn().mockResolvedValue({ data: { id: "notif-1" }, error: null })
  notifInsertSpy = vi.fn(() => ({ select: () => ({ single: insertNotifSingle }) }))
  deleteEq = vi.fn().mockResolvedValue({ error: null })
  updateEq = vi.fn().mockResolvedValue({ error: null })
  invoke = vi.fn().mockResolvedValue({ data: null, error: null })

  mockSupabase = {
    from: buildFrom(),
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: mockRemoveChannel,
    functions: { invoke },
  }

  mockAuthReturn = {
    user: MOCK_USER,
    partner: MOCK_PARTNER,
    profile: null,
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }
})

describe("useWorldMap — load + derive", () => {
  it("aggregates own + partner visits (Amsterdam hybrid → together)", async () => {
    const { result } = renderHook(() => useWorldMap())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.countries.get("NL")?.status).toBe("together")
    expect(result.current.countries.get("FR")?.status).toBe("partner-solo")
  })

  it("splits my pins from partner pins and finds the mutual one", async () => {
    const { result } = renderHook(() => useWorldMap())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.myPins.map((p) => p.country_code)).toEqual(["JP"])
    expect(result.current.partnerPins.map((p) => p.country_code).sort()).toEqual(["BR", "JP"])
    expect(result.current.mutualPins).toEqual(["JP"])
    expect(result.current.ourNextTrip?.countryCode).toBe("JP")
  })

  it("visitsFor returns every visit for a country", async () => {
    const { result } = renderHook(() => useWorldMap())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.visitsFor("NL")).toHaveLength(2)
  })
})

describe("useWorldMap — mutations throw", () => {
  it("addVisit THROWS when the insert errors", async () => {
    insertVisitSingle.mockResolvedValueOnce({ data: null, error: { message: "insert boom" } })
    const { result } = renderHook(() => useWorldMap())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await expect(
        result.current.addVisit({ countryCode: "IT", traveler: "me", isTogether: false })
      ).rejects.toThrow("insert boom")
    })
  })

  it("addPin THROWS on the 4th pin (DB-mirrored client guard)", async () => {
    pinsData = [
      mkPin({ owner_id: ME, country_code: "JP" }),
      mkPin({ owner_id: ME, country_code: "IT" }),
      mkPin({ owner_id: ME, country_code: "FR" }),
    ]
    const { result } = renderHook(() => useWorldMap())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await expect(result.current.addPin("BR")).rejects.toThrow(/at most 3/)
    })
  })

  it("addPin THROWS when the country is already pinned", async () => {
    const { result } = renderHook(() => useWorldMap())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await expect(result.current.addPin("JP")).rejects.toThrow(/Already pinned/)
    })
  })

  it("deleteVisit THROWS and rolls back on error", async () => {
    deleteEq.mockResolvedValueOnce({ error: { message: "del boom" } })
    const { result } = renderHook(() => useWorldMap())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const id = result.current.visitsFor("FR")[0].id
    await act(async () => {
      await expect(result.current.deleteVisit(id)).rejects.toThrow("del boom")
    })
    // rolled back — still present
    expect(result.current.visitsFor("FR")).toHaveLength(1)
  })

  it("addPartnerNote updates only partner_note", async () => {
    const { result } = renderHook(() => useWorldMap())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const id = result.current.visitsFor("NL")[0].id
    await act(async () => {
      await result.current.addPartnerNote(id, "loved the canals")
    })
    expect(updateEq).toHaveBeenCalledWith("id", id)
  })
})

describe("useWorldMap — mutual match notifies partner", () => {
  it("pinning the partner's pinned country fires a travel_pin_match notification", async () => {
    const { result } = renderHook(() => useWorldMap())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.addPin("BR") // partner already pinned BR
    })
    expect(notifInsertSpy).toHaveBeenCalledTimes(1)
    const arg = notifInsertSpy.mock.calls[0][0]
    expect(arg.type).toBe("travel_pin_match")
    expect(arg.recipient_id).toBe(PARTNER)
    expect(invoke).toHaveBeenCalledWith("send-notification", expect.anything())
  })

  it("pinning a non-mutual country does NOT notify", async () => {
    insertPinSingle.mockResolvedValueOnce({ data: mkPin({ country_code: "DE" }), error: null })
    const { result } = renderHook(() => useWorldMap())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.addPin("DE")
    })
    expect(notifInsertSpy).not.toHaveBeenCalled()
  })
})

describe("useWorldMap — signed out", () => {
  it("is inert with no user", async () => {
    mockAuthReturn = { ...mockAuthReturn, user: null, partner: null }
    const { result } = renderHook(() => useWorldMap())
    expect(result.current.countries.size).toBe(0)
    expect(result.current.myPins).toEqual([])
  })
})

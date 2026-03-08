import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { addDays, format, subDays } from "date-fns"

// --- Mock data ---
const MOCK_PROFILE = {
  id: "yahya-1",
  display_name: "Yahya",
  email: "yahya@test.com",
  avatar_url: null,
  partner_id: "yara-1",
  role: "admin",
  created_at: "",
  updated_at: "",
}

const todayStr = format(new Date(), "yyyy-MM-dd")

function makePillStartDate(daysAgo: number): string {
  return format(subDays(new Date(), daysAgo), "yyyy-MM-dd")
}

const MOCK_CONFIG = {
  id: "config-1",
  owner_id: "yahya-1",
  pill_start_date: makePillStartDate(0), // today
  active_days: 21,
  break_days: 7,
  pms_warning_days: 3,
  notes: null,
}

// --- Supabase mock ---
let configQueryResult: { data: unknown; error: { code: string; message: string } | null } = {
  data: MOCK_CONFIG,
  error: null,
}
let logsQueryResult: { data: unknown; error: unknown } = {
  data: [],
  error: null,
}

const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockInsert = vi.fn().mockResolvedValue({ error: null })

const mockFrom = vi.fn((table: string) => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.gte = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockResolvedValue(logsQueryResult)
  chain.single = vi.fn().mockResolvedValue(
    table === "cycle_config" ? configQueryResult : logsQueryResult
  )
  chain.upsert = mockUpsert
  chain.insert = mockInsert

  return chain
})

const mockSupabase = {
  from: mockFrom,
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

let mockAuthReturn = {
  user: { id: "yahya-1" } as { id: string } | null,
  profile: MOCK_PROFILE as typeof MOCK_PROFILE | null,
  partner: null,
  isLoading: false,
  profileNeedsSetup: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
}

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockAuthReturn,
}))

import { useCycle } from "@/lib/hooks/use-cycle"

describe("useCycle", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    configQueryResult = { data: MOCK_CONFIG, error: null }
    logsQueryResult = { data: [], error: null }
    mockAuthReturn = {
      user: { id: "yahya-1" },
      profile: MOCK_PROFILE as typeof MOCK_PROFILE | null,
      partner: null,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    }
  })

  it("returns null state when profile is null", () => {
    mockAuthReturn.profile = null

    const { result } = renderHook(() => useCycle())

    expect(result.current.config).toBeNull()
    expect(result.current.currentDay).toBeNull()
    expect(result.current.phase).toBeNull()
    expect(result.current.isPMSWindow).toBe(false)
    expect(result.current.isPeriodLikely).toBe(false)
  })

  it("returns null state when profile.id does not match config.owner_id", async () => {
    configQueryResult = {
      data: { ...MOCK_CONFIG, owner_id: "someone-else" },
      error: null,
    }

    const { result } = renderHook(() => useCycle())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.config).toBeNull()
    expect(result.current.cycleLogs).toEqual([])
  })

  it("correctly calculates currentDay = 1 when today equals pill_start_date", async () => {
    configQueryResult = {
      data: { ...MOCK_CONFIG, pill_start_date: makePillStartDate(0) },
      error: null,
    }

    const { result } = renderHook(() => useCycle())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.currentDay).toBe(1)
  })

  it("correctly calculates currentDay = 15 when 14 days have passed", async () => {
    configQueryResult = {
      data: { ...MOCK_CONFIG, pill_start_date: makePillStartDate(14) },
      error: null,
    }

    const { result } = renderHook(() => useCycle())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.currentDay).toBe(15)
  })

  it("correctly wraps currentDay to 1 after a full 28-day cycle (day 28 -> day 1)", async () => {
    configQueryResult = {
      data: { ...MOCK_CONFIG, pill_start_date: makePillStartDate(28) },
      error: null,
    }

    const { result } = renderHook(() => useCycle())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.currentDay).toBe(1)
  })

  it("sets phase = 'active' when currentDay is between 1 and 21", async () => {
    configQueryResult = {
      data: { ...MOCK_CONFIG, pill_start_date: makePillStartDate(10) },
      error: null,
    }

    const { result } = renderHook(() => useCycle())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.currentDay).toBe(11)
    expect(result.current.phase).toBe("active")
  })

  it("sets phase = 'break' when currentDay is between 22 and 28", async () => {
    configQueryResult = {
      data: { ...MOCK_CONFIG, pill_start_date: makePillStartDate(22) },
      error: null,
    }

    const { result } = renderHook(() => useCycle())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.currentDay).toBe(23)
    expect(result.current.phase).toBe("break")
  })

  it("sets isPMSWindow = true when currentDay is 19, 20, or 21 (pms_warning_days = 3)", async () => {
    // Day 20 = 19 days elapsed
    configQueryResult = {
      data: { ...MOCK_CONFIG, pill_start_date: makePillStartDate(19) },
      error: null,
    }

    const { result } = renderHook(() => useCycle())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.currentDay).toBe(20)
    expect(result.current.isPMSWindow).toBe(true)
  })

  it("sets isPMSWindow = false on day 18 and earlier", async () => {
    // Day 18 = 17 days elapsed
    configQueryResult = {
      data: { ...MOCK_CONFIG, pill_start_date: makePillStartDate(17) },
      error: null,
    }

    const { result } = renderHook(() => useCycle())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.currentDay).toBe(18)
    expect(result.current.isPMSWindow).toBe(false)
  })

  it("sets isPeriodLikely = true when phase is break", async () => {
    configQueryResult = {
      data: { ...MOCK_CONFIG, pill_start_date: makePillStartDate(23) },
      error: null,
    }

    const { result } = renderHook(() => useCycle())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.phase).toBe("break")
    expect(result.current.isPeriodLikely).toBe(true)
  })

  it("sets isPeriodLikely = false when phase is active", async () => {
    configQueryResult = {
      data: { ...MOCK_CONFIG, pill_start_date: makePillStartDate(5) },
      error: null,
    }

    const { result } = renderHook(() => useCycle())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.phase).toBe("active")
    expect(result.current.isPeriodLikely).toBe(false)
  })

  it("returns null state when pill_start_date is in the future", async () => {
    const futureDate = format(addDays(new Date(), 5), "yyyy-MM-dd")
    configQueryResult = {
      data: { ...MOCK_CONFIG, pill_start_date: futureDate },
      error: null,
    }

    const { result } = renderHook(() => useCycle())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.currentDay).toBeNull()
    expect(result.current.phase).toBeNull()
  })

  it("updateConfig no-op resolves without throwing when profile is null", async () => {
    mockAuthReturn.profile = null

    const { result } = renderHook(() => useCycle())

    await expect(
      act(async () => {
        await result.current.updateConfig({ pms_warning_days: 5 })
      })
    ).resolves.not.toThrow()
  })

  it("addLog no-op resolves without throwing when profile is null", async () => {
    mockAuthReturn.profile = null

    const { result } = renderHook(() => useCycle())

    await expect(
      act(async () => {
        await result.current.addLog({
          date: todayStr,
          mood: "good",
          symptoms: [],
          notes: null,
        })
      })
    ).resolves.not.toThrow()
  })
})

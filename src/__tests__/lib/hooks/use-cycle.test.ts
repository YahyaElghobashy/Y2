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
  last_pms_notified_date: null,
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
// Result of the atomic "claim this PMS window" update. data != null => won.
let claimResult: { data: unknown; error: unknown } = { data: { id: "config-1" }, error: null }
let notifInsertResult: { data: unknown; error: unknown } = { data: { id: "notif-1" }, error: null }

const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const insertCallsByTable: Record<string, unknown[]> = {}
const mockFunctionsInvoke = vi.fn().mockResolvedValue({ data: null, error: null })

const mockFrom = vi.fn((table: string) => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.gte = vi.fn().mockReturnValue(chain)
  chain.or = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockResolvedValue(logsQueryResult)
  chain.single = vi.fn(() =>
    Promise.resolve(table === "cycle_config" ? configQueryResult : notifInsertResult)
  )
  // cycle_config claim uses .maybeSingle(); the config fetch uses .single().
  chain.maybeSingle = vi.fn(() => Promise.resolve(claimResult))
  chain.upsert = mockUpsert
  chain.insert = vi.fn((payload: unknown) => {
    insertCallsByTable[table] = insertCallsByTable[table] ?? []
    insertCallsByTable[table].push(payload)
    return chain
  })
  // Awaitable so `await supabase.from(...).insert(...)` (addLog) resolves.
  ;(chain as Record<string, unknown>).then = (resolve: (v: { error: null }) => void) =>
    resolve({ error: null })

  return chain
})

const mockSupabase = {
  from: mockFrom,
  functions: { invoke: mockFunctionsInvoke },
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
    claimResult = { data: { id: "config-1" }, error: null }
    notifInsertResult = { data: { id: "notif-1" }, error: null }
    for (const k of Object.keys(insertCallsByTable)) delete insertCallsByTable[k]
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

  // ── PMS / period notification (owner-only, idempotent) ──────

  describe("pms notification", () => {
    it("fires a cycle_reminder push to Yahya (self) when inside the PMS window", async () => {
      // Day 20 (19 elapsed) with pms_warning_days = 3 → PMS window.
      configQueryResult = {
        data: { ...MOCK_CONFIG, pill_start_date: makePillStartDate(19), last_pms_notified_date: null },
        error: null,
      }

      const { result } = renderHook(() => useCycle())

      await waitFor(() => {
        expect(result.current.isPMSWindow).toBe(true)
      })

      await waitFor(() => {
        expect(insertCallsByTable["notifications"]?.length).toBeGreaterThanOrEqual(1)
      })

      const payload = insertCallsByTable["notifications"][0] as Record<string, unknown>
      expect(payload.type).toBe("cycle_reminder")
      expect(payload.sender_id).toBe("yahya-1")
      expect(payload.recipient_id).toBe("yahya-1")

      await waitFor(() => {
        expect(mockFunctionsInvoke).toHaveBeenCalledWith(
          "send-notification",
          expect.objectContaining({
            body: expect.objectContaining({ notification_id: "notif-1", recipient_id: "yahya-1" }),
          })
        )
      })
    })

    it("fires during the period (break) window", async () => {
      configQueryResult = {
        data: { ...MOCK_CONFIG, pill_start_date: makePillStartDate(23), last_pms_notified_date: null },
        error: null,
      }

      renderHook(() => useCycle())

      await waitFor(() => {
        expect(insertCallsByTable["notifications"]?.length).toBeGreaterThanOrEqual(1)
      })
      const payload = insertCallsByTable["notifications"][0] as Record<string, unknown>
      expect((payload.metadata as Record<string, unknown>).kind).toBe("period")
    })

    it("does NOT fire outside any window (active, non-PMS)", async () => {
      // Day 6 (5 elapsed) → active, well before PMS.
      configQueryResult = {
        data: { ...MOCK_CONFIG, pill_start_date: makePillStartDate(5), last_pms_notified_date: null },
        error: null,
      }

      const { result } = renderHook(() => useCycle())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(insertCallsByTable["notifications"]).toBeUndefined()
      expect(mockFunctionsInvoke).not.toHaveBeenCalled()
    })

    it("does NOT fire for Yara (non-admin) even inside the PMS window", async () => {
      mockAuthReturn.profile = { ...MOCK_PROFILE, id: "yara-1", role: "user" }
      configQueryResult = {
        data: { ...MOCK_CONFIG, pill_start_date: makePillStartDate(19), last_pms_notified_date: null },
        error: null,
      }

      renderHook(() => useCycle())

      // Give effects a tick.
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0))
      })

      expect(insertCallsByTable["notifications"]).toBeUndefined()
      expect(mockFunctionsInvoke).not.toHaveBeenCalled()
    })

    it("does NOT fire when the window was already claimed (claim returns no row)", async () => {
      claimResult = { data: null, error: null } // another session already notified
      configQueryResult = {
        data: { ...MOCK_CONFIG, pill_start_date: makePillStartDate(19), last_pms_notified_date: null },
        error: null,
      }

      const { result } = renderHook(() => useCycle())

      await waitFor(() => {
        expect(result.current.isPMSWindow).toBe(true)
      })
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0))
      })

      expect(insertCallsByTable["notifications"]).toBeUndefined()
      expect(mockFunctionsInvoke).not.toHaveBeenCalled()
    })

    it("does NOT re-fire when last_pms_notified_date already matches this window", async () => {
      // 18 elapsed → currentDay 19 = first PMS day → window start = today.
      const windowStart = format(new Date(), "yyyy-MM-dd")
      configQueryResult = {
        data: {
          ...MOCK_CONFIG,
          pill_start_date: makePillStartDate(18),
          last_pms_notified_date: windowStart,
        },
        error: null,
      }

      const { result } = renderHook(() => useCycle())

      await waitFor(() => {
        expect(result.current.isPMSWindow).toBe(true)
      })
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0))
      })

      expect(insertCallsByTable["notifications"]).toBeUndefined()
      expect(mockFunctionsInvoke).not.toHaveBeenCalled()
    })
  })
})

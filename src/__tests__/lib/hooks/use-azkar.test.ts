import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockUser = { id: "user-1", email: "test@test.com" }
const mockUseAuth = vi.fn(() => ({ user: mockUser, partner: null }))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

function createSupabaseMock() {
  let sessionResult: { data: unknown; error: unknown } = { data: null, error: null }
  let upsertResult: { data: unknown; error: unknown } = { data: null, error: null }
  const upsertCalls: unknown[] = []

  const mock = {
    setSessionResult: (r: { data: unknown; error: unknown }) => { sessionResult = r },
    setUpsertResult: (r: { data: unknown; error: unknown }) => { upsertResult = r },
    getUpsertCalls: () => upsertCalls,
    from: vi.fn(() => {
      const chain: Record<string, unknown> = {}

      chain.select = vi.fn(() => {
        const sel: Record<string, unknown> = {}
        sel.eq = vi.fn(() => {
          const eq1: Record<string, unknown> = {}
          eq1.eq = vi.fn(() => {
            const eq2: Record<string, unknown> = {}
            eq2.eq = vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve(sessionResult)),
            }))
            return eq2
          })
          return eq1
        })
        return sel
      })

      chain.upsert = vi.fn((...args: unknown[]) => {
        upsertCalls.push(args)
        return {
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve(upsertResult)),
          })),
          then: vi.fn((cb: (r: { error: unknown }) => void) => {
            cb({ error: upsertResult.error })
            return { catch: vi.fn() }
          }),
        }
      })

      return chain
    }),
  }

  return mock
}

let supabaseMock: ReturnType<typeof createSupabaseMock>

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => supabaseMock,
}))

import { useAzkar } from "@/lib/hooks/use-azkar"

describe("useAzkar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMock = createSupabaseMock()
    mockUseAuth.mockReturnValue({ user: mockUser, partner: null })
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("returns inert state when user is null", () => {
      mockUseAuth.mockReturnValue({ user: null, partner: null })
      const { result } = renderHook(() => useAzkar())

      expect(result.current.session).toBeNull()
      expect(result.current.sessionType).toBe("morning")
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.justCompleted).toBe(false)
    })

    it("starts with isLoading true", () => {
      // Never-resolving promise
      supabaseMock.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(() => new Promise(() => {})),
              })),
            })),
          })),
        })),
        upsert: vi.fn(),
      }))

      const { result } = renderHook(() => useAzkar())
      expect(result.current.isLoading).toBe(true)
    })

    it("fetches today's session on mount", async () => {
      const sessionRow = {
        id: "s-1", user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        session_type: "morning", count: 10, target: 33,
        created_at: "", updated_at: "",
      }
      supabaseMock.setSessionResult({ data: sessionRow, error: null })

      const { result } = renderHook(() => useAzkar())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.session).toEqual(sessionRow)
    })

    it("upserts new session when no data exists", async () => {
      const newSession = {
        id: "s-new", user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        session_type: "morning", count: 0, target: 33,
        created_at: "", updated_at: "",
      }
      supabaseMock.setSessionResult({ data: null, error: null })
      supabaseMock.setUpsertResult({ data: newSession, error: null })

      const { result } = renderHook(() => useAzkar())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.session).toEqual(newSession)
    })

    it("sets error on fetch failure", async () => {
      supabaseMock.setSessionResult({
        data: null,
        error: { message: "Connection lost" },
      })

      const { result } = renderHook(() => useAzkar())

      await waitFor(() => {
        expect(result.current.error).toBe("Connection lost")
      })
    })

    it("defaults sessionType to morning", () => {
      supabaseMock.setSessionResult({ data: null, error: null })
      supabaseMock.setUpsertResult({ data: { id: "s", user_id: "user-1", date: "2026-03-04", session_type: "morning", count: 0, target: 33, created_at: "", updated_at: "" }, error: null })

      const { result } = renderHook(() => useAzkar())
      expect(result.current.sessionType).toBe("morning")
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("increment optimistically increases count", async () => {
      const sessionRow = {
        id: "s-1", user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        session_type: "morning", count: 5, target: 33,
        created_at: "", updated_at: "",
      }
      supabaseMock.setSessionResult({ data: sessionRow, error: null })
      supabaseMock.setUpsertResult({ data: null, error: null })

      const { result } = renderHook(() => useAzkar())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.increment()
      })

      expect(result.current.session?.count).toBe(6)
    })

    it("increment fires justCompleted when reaching target", async () => {
      const sessionRow = {
        id: "s-1", user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        session_type: "morning", count: 32, target: 33,
        created_at: "", updated_at: "",
      }
      supabaseMock.setSessionResult({ data: sessionRow, error: null })
      supabaseMock.setUpsertResult({ data: null, error: null })

      const { result } = renderHook(() => useAzkar())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.increment()
      })

      expect(result.current.session?.count).toBe(33)
      expect(result.current.justCompleted).toBe(true)
    })

    it("reset sets count to 0", async () => {
      const sessionRow = {
        id: "s-1", user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        session_type: "morning", count: 15, target: 33,
        created_at: "", updated_at: "",
      }
      supabaseMock.setSessionResult({ data: sessionRow, error: null })
      supabaseMock.setUpsertResult({ data: null, error: null })

      const { result } = renderHook(() => useAzkar())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.session?.count).toBe(0)
      expect(result.current.justCompleted).toBe(false)
    })

    it("switchType changes sessionType", async () => {
      supabaseMock.setSessionResult({ data: null, error: null })
      supabaseMock.setUpsertResult({
        data: { id: "s", user_id: "user-1", date: "2026-03-04", session_type: "morning", count: 0, target: 33, created_at: "", updated_at: "" },
        error: null,
      })

      const { result } = renderHook(() => useAzkar())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.switchType("evening")
      })

      expect(result.current.sessionType).toBe("evening")
    })

    it("increment is no-op when user is null", () => {
      mockUseAuth.mockReturnValue({ user: null, partner: null })
      const { result } = renderHook(() => useAzkar())

      act(() => {
        result.current.increment()
      })

      expect(result.current.session).toBeNull()
    })

    it("setTarget rejects values less than 1", async () => {
      const sessionRow = {
        id: "s-1", user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        session_type: "morning", count: 0, target: 33,
        created_at: "", updated_at: "",
      }
      supabaseMock.setSessionResult({ data: sessionRow, error: null })

      const { result } = renderHook(() => useAzkar())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.setTarget(0)
      })

      expect(result.current.session?.target).toBe(33)
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("queries azkar_sessions table", async () => {
      supabaseMock.setSessionResult({ data: null, error: null })
      supabaseMock.setUpsertResult({
        data: { id: "s", user_id: "user-1", date: "2026-03-04", session_type: "morning", count: 0, target: 33, created_at: "", updated_at: "" },
        error: null,
      })

      renderHook(() => useAzkar())

      await waitFor(() => {
        expect(supabaseMock.from).toHaveBeenCalledWith("azkar_sessions")
      })
    })

    it("increment upserts with 3-column conflict", async () => {
      const sessionRow = {
        id: "s-1", user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        session_type: "morning", count: 5, target: 33,
        created_at: "", updated_at: "",
      }
      supabaseMock.setSessionResult({ data: sessionRow, error: null })
      supabaseMock.setUpsertResult({ data: null, error: null })

      const { result } = renderHook(() => useAzkar())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.increment()
      })

      const calls = supabaseMock.getUpsertCalls()
      const lastCall = calls[calls.length - 1] as [Record<string, unknown>, Record<string, string>]
      expect(lastCall[0]).toMatchObject({
        user_id: "user-1",
        session_type: "morning",
        count: 6,
      })
      expect(lastCall[1]).toEqual({
        onConflict: "user_id,date,session_type",
      })
    })
  })
})

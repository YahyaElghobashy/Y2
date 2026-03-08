import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock data ──
const MOCK_USER = { id: "user-1" }

const MOCK_PORTAL = {
  id: "portal-1",
  creator_id: "user-1",
  slug: "my-wedding-abc1",
  title: "My Wedding",
  subtitle: "Join us!",
  event_type: "wedding",
  event_date: "2026-09-15",
  event_end_date: null,
  location_name: "Cairo",
  location_lat: null,
  location_lng: null,
  theme_config: { preset: "elegant_gold", colors: {}, fonts: { heading: "Playfair Display", body: "DM Sans" }, borderRadius: "lg", spacing: "spacious" },
  cover_image_url: null,
  is_published: false,
  password_hash: null,
  template_id: null,
  meta_title: null,
  meta_description: null,
  og_image_url: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const MOCK_SUB_EVENT = {
  id: "sub-1",
  portal_id: "portal-1",
  title: "Ceremony",
  subtitle: null,
  event_date: "2026-09-15",
  start_time: "14:00",
  end_time: "16:00",
  location_name: "Grand Hall",
  location_lat: null,
  location_lng: null,
  dress_code: "Black Tie",
  icon: "💍",
  position: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

// ── Mock state ──
let portalsData: unknown[] = [MOCK_PORTAL]
let subEventsData: unknown[] = [MOCK_SUB_EVENT]
let insertResult: { data: unknown; error: unknown } = { data: MOCK_PORTAL, error: null }
let updateError: unknown = null
let deleteError: unknown = null

// ── Supabase mock ──
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
const mockSingle = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

function buildChain(data: unknown[], error: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockResolvedValue({ data, error })
  chain.single = mockSingle.mockResolvedValue(insertResult)
  chain.maybeSingle = mockMaybeSingle
  chain.insert = mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle.mockResolvedValue(insertResult) }) })
  chain.update = mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: updateError }) })
  chain.delete = mockDelete.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: deleteError }) })
  return chain
}

const mockFrom = vi.fn((table: string) => {
  if (table === "event_portals") return buildChain(portalsData)
  if (table === "portal_sub_events") return buildChain(subEventsData)
  if (table === "portal_rsvps") return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }
  if (table === "portal_analytics") return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 5, error: null }) }) }
  return buildChain([])
})

const mockSupabase = { from: mockFrom }

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => mockSupabase,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: MOCK_USER,
    profile: null,
    partner: null,
  }),
}))

// Import AFTER mocks
import { useEventPortal } from "@/lib/hooks/use-event-portal"

describe("useEventPortal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    portalsData = [MOCK_PORTAL]
    subEventsData = [MOCK_SUB_EVENT]
    insertResult = { data: MOCK_PORTAL, error: null }
    updateError = null
    deleteError = null
  })

  // ── Unit: Initial state ──

  it("returns isLoading true initially", () => {
    const { result } = renderHook(() => useEventPortal())
    // isLoading starts true
    expect(result.current.isLoading).toBe(true)
  })

  it("fetches portals on mount", async () => {
    const { result } = renderHook(() => useEventPortal())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockFrom).toHaveBeenCalledWith("event_portals")
    expect(result.current.portals).toHaveLength(1)
    expect(result.current.portals[0].slug).toBe("my-wedding-abc1")
  })

  it("fetches sub-events when portalId is provided", async () => {
    const { result } = renderHook(() => useEventPortal("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockFrom).toHaveBeenCalledWith("portal_sub_events")
    expect(result.current.subEvents).toHaveLength(1)
    expect(result.current.subEvents[0].title).toBe("Ceremony")
  })

  it("returns portal when portalId matches", async () => {
    const { result } = renderHook(() => useEventPortal("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.portal?.id).toBe("portal-1")
  })

  it("returns null portal when portalId doesn't match", async () => {
    const { result } = renderHook(() => useEventPortal("nonexistent"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.portal).toBeNull()
  })

  // ── Unit: CRUD — createPortal ──

  it("createPortal calls supabase insert with correct table", async () => {
    const { result } = renderHook(() => useEventPortal())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createPortal({
        title: "Test Event",
        event_type: "wedding",
      })
    })

    expect(mockFrom).toHaveBeenCalledWith("event_portals")
    expect(mockInsert).toHaveBeenCalled()
  })

  it("createPortal generates a slug from title", async () => {
    const { result } = renderHook(() => useEventPortal())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createPortal({ title: "My Big Day" })
    })

    // Insert should have been called with an object containing a slug
    const insertCall = mockInsert.mock.calls[0][0]
    expect(insertCall.slug).toMatch(/^my-big-day-[a-z0-9]{4}$/)
    expect(insertCall.creator_id).toBe("user-1")
    expect(insertCall.title).toBe("My Big Day")
  })

  it("createPortal returns null on insert error", async () => {
    insertResult = { data: null, error: { message: "Insert failed" } }

    const { result } = renderHook(() => useEventPortal())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let created: unknown
    await act(async () => {
      created = await result.current.createPortal({ title: "Failing" })
    })

    expect(created).toBeNull()
    expect(result.current.error).toBe("Insert failed")
  })

  // ── Unit: CRUD — updatePortal ──

  it("updatePortal calls supabase update with correct args", async () => {
    const { result } = renderHook(() => useEventPortal())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.updatePortal("portal-1", { title: "Updated Title" })
    })

    expect(mockUpdate).toHaveBeenCalledWith({ title: "Updated Title" })
  })

  it("updatePortal sets error on failure", async () => {
    updateError = { message: "Update failed" }

    const { result } = renderHook(() => useEventPortal())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.updatePortal("portal-1", { title: "X" })
    })

    expect(result.current.error).toBe("Update failed")
  })

  // ── Unit: CRUD — deletePortal ──

  it("deletePortal calls supabase delete", async () => {
    const { result } = renderHook(() => useEventPortal())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.deletePortal("portal-1")
    })

    expect(mockDelete).toHaveBeenCalled()
  })

  it("deletePortal sets error on failure", async () => {
    deleteError = { message: "Delete failed" }

    const { result } = renderHook(() => useEventPortal())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.deletePortal("portal-1")
    })

    expect(result.current.error).toBe("Delete failed")
  })

  // ── Unit: Sub-events ──

  it("addSubEvent calls insert with portal_id", async () => {
    const subInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: MOCK_SUB_EVENT, error: null }),
      }),
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === "portal_sub_events") {
        const chain = buildChain(subEventsData)
        chain.insert = subInsert
        return chain
      }
      return buildChain(portalsData)
    })

    const { result } = renderHook(() => useEventPortal("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.addSubEvent({ title: "Reception" })
    })

    expect(subInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        portal_id: "portal-1",
        title: "Reception",
      })
    )
  })

  it("deleteSubEvent calls delete", async () => {
    const subDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === "portal_sub_events") {
        const chain = buildChain(subEventsData)
        chain.delete = subDelete
        return chain
      }
      return buildChain(portalsData)
    })

    const { result } = renderHook(() => useEventPortal("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.deleteSubEvent("sub-1")
    })

    expect(subDelete).toHaveBeenCalled()
  })

  // ── Unit: togglePublish ──

  it("togglePublish flips is_published from false to true", async () => {
    const { result } = renderHook(() => useEventPortal())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.togglePublish("portal-1")
    })

    expect(mockUpdate).toHaveBeenCalledWith({ is_published: true })
  })

  // ── Unit: getShareUrl ──

  it("getShareUrl returns correct URL format", async () => {
    const { result } = renderHook(() => useEventPortal())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const url = result.current.getShareUrl("my-wedding-abc1")
    expect(url).toContain("/e/my-wedding-abc1")
  })

  // ── Unit: getStats ──

  it("getStats queries rsvps and analytics", async () => {
    const { result } = renderHook(() => useEventPortal())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let stats: unknown
    await act(async () => {
      stats = await result.current.getStats("portal-1")
    })

    expect(mockFrom).toHaveBeenCalledWith("portal_rsvps")
    expect(mockFrom).toHaveBeenCalledWith("portal_analytics")
    expect(stats).toEqual(
      expect.objectContaining({
        rsvpCount: expect.any(Number),
        viewCount: expect.any(Number),
      })
    )
  })

  // ── Edge case: error is cleared before new operations ──

  it("clears error before createPortal", async () => {
    insertResult = { data: null, error: { message: "First error" } }
    const { result } = renderHook(() => useEventPortal())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createPortal({ title: "Fail" })
    })
    expect(result.current.error).toBe("First error")

    insertResult = { data: MOCK_PORTAL, error: null }
    await act(async () => {
      await result.current.createPortal({ title: "Success" })
    })
    expect(result.current.error).toBeNull()
  })

  // ── Edge case: no portalId ──

  it("returns empty subEvents and null portal when no portalId", async () => {
    const { result } = renderHook(() => useEventPortal())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.portal).toBeNull()
    expect(result.current.subEvents).toEqual([])
  })

  it("addSubEvent returns null when no portalId is provided", async () => {
    const { result } = renderHook(() => useEventPortal())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let created: unknown
    await act(async () => {
      created = await result.current.addSubEvent({ title: "Test" })
    })

    expect(created).toBeNull()
  })
})

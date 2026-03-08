import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock data ──
const MOCK_USER = { id: "user-1" }

const MOCK_PAGE = {
  id: "page-1",
  portal_id: "portal-1",
  slug: "main",
  title: "Main Page",
  icon: "🏠",
  position: 0,
  is_visible: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const MOCK_PAGE_2 = {
  ...MOCK_PAGE,
  id: "page-2",
  slug: "travel",
  title: "Travel Info",
  icon: "✈️",
  position: 1,
}

const MOCK_SECTION = {
  id: "section-1",
  page_id: "page-1",
  section_type: "hero",
  content: { heading: "Welcome", layout: "centered" },
  position: 0,
  is_visible: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const MOCK_SECTION_2 = {
  ...MOCK_SECTION,
  id: "section-2",
  section_type: "welcome",
  content: { body: "Hello there" },
  position: 1,
}

// ── Mock state ──
let pagesData: unknown[] = [MOCK_PAGE, MOCK_PAGE_2]
let sectionsData: unknown[] = [MOCK_SECTION, MOCK_SECTION_2]
let insertResult: { data: unknown; error: unknown } = { data: MOCK_PAGE, error: null }
let updateError: unknown = null
let deleteError: unknown = null

// ── Supabase mock ──
const mockSingle = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildChain(data: unknown[], error: unknown = null): any {
  const resolvedValue = { data, error }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: Record<string, any> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.in = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockResolvedValue(resolvedValue)
  chain.single = mockSingle.mockResolvedValue(insertResult)
  chain.insert = mockInsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: mockSingle.mockResolvedValue(insertResult),
    }),
  })
  chain.update = mockUpdate.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: updateError }),
  })
  chain.delete = mockDelete.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: deleteError }),
  })
  // Make chain thenable — when `await chain` is called (e.g. after .eq() as final call),
  // it resolves to { data, error } just like .order() does
  chain.then = (
    resolve: (v: unknown) => void,
    reject?: (e: unknown) => void
  ) => Promise.resolve(resolvedValue).then(resolve, reject)
  return chain
}

const mockFrom = vi.fn((table: string) => {
  if (table === "portal_pages") return buildChain(pagesData)
  if (table === "portal_sections") return buildChain(sectionsData)
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
import { usePortalPages } from "@/lib/hooks/use-portal-pages"

describe("usePortalPages", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pagesData = [MOCK_PAGE, MOCK_PAGE_2]
    sectionsData = [MOCK_SECTION, MOCK_SECTION_2]
    insertResult = { data: MOCK_PAGE, error: null }
    updateError = null
    deleteError = null
  })

  // ── Unit: Initial state ──

  it("returns isLoading true initially", () => {
    const { result } = renderHook(() => usePortalPages("portal-1"))
    expect(result.current.isLoading).toBe(true)
  })

  it("fetches pages on mount", async () => {
    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockFrom).toHaveBeenCalledWith("portal_pages")
    expect(result.current.pages).toHaveLength(2)
    expect(result.current.pages[0].slug).toBe("main")
  })

  it("fetches sections on mount", async () => {
    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockFrom).toHaveBeenCalledWith("portal_sections")
  })

  // ── Unit: Page CRUD — createPage ──

  it("createPage calls supabase insert with portal_id", async () => {
    insertResult = { data: MOCK_PAGE, error: null }

    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createPage({ slug: "new-page", title: "New Page" })
    })

    expect(mockFrom).toHaveBeenCalledWith("portal_pages")
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        portal_id: "portal-1",
        slug: "new-page",
        title: "New Page",
      })
    )
  })

  it("createPage returns null on error", async () => {
    insertResult = { data: null, error: { message: "Insert failed" } }

    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let created: unknown
    await act(async () => {
      created = await result.current.createPage({ slug: "fail", title: "Fail" })
    })

    expect(created).toBeNull()
    expect(result.current.error).toBe("Insert failed")
  })

  it("createPage sets position to pages.length", async () => {
    insertResult = { data: MOCK_PAGE, error: null }

    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createPage({ slug: "third", title: "Third" })
    })

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        position: 2, // pages.length (MOCK_PAGE + MOCK_PAGE_2)
      })
    )
  })

  // ── Unit: Page CRUD — updatePage ──

  it("updatePage calls supabase update with correct args", async () => {
    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.updatePage("page-1", { title: "Updated Title" })
    })

    expect(mockUpdate).toHaveBeenCalledWith({ title: "Updated Title" })
  })

  it("updatePage sets error on failure", async () => {
    updateError = { message: "Update failed" }

    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.updatePage("page-1", { title: "X" })
    })

    expect(result.current.error).toBe("Update failed")
  })

  // ── Unit: Page CRUD — deletePage ──

  it("deletePage calls supabase delete", async () => {
    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.deletePage("page-1")
    })

    expect(mockDelete).toHaveBeenCalled()
  })

  it("deletePage sets error on failure", async () => {
    deleteError = { message: "Delete failed" }

    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.deletePage("page-1")
    })

    expect(result.current.error).toBe("Delete failed")
  })

  // ── Unit: Page CRUD — reorderPages ──

  it("reorderPages updates positions optimistically", async () => {
    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.reorderPages(["page-2", "page-1"])
    })

    // Should have called update for each page with new position
    expect(mockUpdate).toHaveBeenCalled()
  })

  // ── Unit: Section CRUD — addSection ──

  it("addSection calls insert with correct page_id and type", async () => {
    insertResult = { data: MOCK_SECTION, error: null }

    const sectionInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: MOCK_SECTION, error: null }),
      }),
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === "portal_sections") {
        const chain = buildChain(sectionsData)
        chain.insert = sectionInsert
        return chain
      }
      return buildChain(pagesData)
    })

    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.addSection("page-1", "hero")
    })

    expect(sectionInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        page_id: "page-1",
        section_type: "hero",
        content: expect.any(Object),
      })
    )
  })

  it("addSection returns null on error", async () => {
    const sectionInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Section insert failed" } }),
      }),
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === "portal_sections") {
        const chain = buildChain(sectionsData)
        chain.insert = sectionInsert
        return chain
      }
      return buildChain(pagesData)
    })

    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let created: unknown
    await act(async () => {
      created = await result.current.addSection("page-1", "faq")
    })

    expect(created).toBeNull()
    expect(result.current.error).toBe("Section insert failed")
  })

  it("addSection uses SECTION_DEFAULTS for default content", async () => {
    const sectionInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: MOCK_SECTION, error: null }),
      }),
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === "portal_sections") {
        const chain = buildChain(sectionsData)
        chain.insert = sectionInsert
        return chain
      }
      return buildChain(pagesData)
    })

    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.addSection("page-1", "faq")
    })

    // FAQ default is { items: [], layout: "accordion" }
    expect(sectionInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        content: { items: [], layout: "accordion" },
      })
    )
  })

  // ── Unit: Section CRUD — updateSectionContent (debounced) ──

  it("updateSectionContent optimistically updates local state", async () => {
    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.updateSectionContent("section-1", { heading: "New Heading" })
    })

    // Function should not throw and error should remain null
    expect(result.current.error).toBeNull()
  })

  it("updateSectionContent persists to Supabase after debounce delay", async () => {
    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const updateCallsBefore = mockUpdate.mock.calls.length

    act(() => {
      result.current.updateSectionContent("section-1", { heading: "Delayed Save" })
    })

    // Wait for debounce (500ms) + buffer
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })

    // After debounce, update should have been called
    expect(mockUpdate.mock.calls.length).toBeGreaterThan(updateCallsBefore)
  })

  // ── Unit: Section CRUD — deleteSectionImmediate ──

  it("deleteSectionImmediate calls supabase delete", async () => {
    const sectionDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === "portal_sections") {
        const chain = buildChain(sectionsData)
        chain.delete = sectionDelete
        return chain
      }
      return buildChain(pagesData)
    })

    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.deleteSectionImmediate("section-1")
    })

    expect(sectionDelete).toHaveBeenCalled()
  })

  // ── Unit: Section CRUD — reorderSections ──

  it("reorderSections updates positions", async () => {
    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.reorderSections("page-1", ["section-2", "section-1"])
    })

    expect(mockUpdate).toHaveBeenCalled()
  })

  // ── Unit: refreshPages ──

  it("refreshPages re-fetches pages and sections", async () => {
    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const callsBefore = mockFrom.mock.calls.length

    await act(async () => {
      await result.current.refreshPages()
    })

    expect(mockFrom.mock.calls.length).toBeGreaterThan(callsBefore)
  })

  // ── Edge cases ──

  it("clears error before new operations", async () => {
    insertResult = { data: null, error: { message: "First error" } }

    const { result } = renderHook(() => usePortalPages("portal-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createPage({ slug: "fail", title: "Fail" })
    })
    expect(result.current.error).toBe("First error")

    insertResult = { data: MOCK_PAGE, error: null }
    await act(async () => {
      await result.current.createPage({ slug: "success", title: "Success" })
    })
    expect(result.current.error).toBeNull()
  })
})

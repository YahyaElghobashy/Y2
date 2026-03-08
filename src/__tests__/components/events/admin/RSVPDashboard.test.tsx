import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { PortalRSVP } from "@/lib/types/portal.types"

// ── Mocks ──

const mockSelect = vi.fn()
const mockChannel = vi.fn()
const mockRemoveChannel = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: mockSelect,
        }),
      }),
    }),
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  }),
}))

// ── Imports ──

import { RSVPDashboard } from "@/components/events/admin/RSVPDashboard"

// ── Test Data ──

const mockRsvps: PortalRSVP[] = [
  {
    id: "rsvp-1",
    portal_id: "portal-1",
    guest_id: null,
    name: "John Doe",
    email: "john@test.com",
    phone: "+1234567890",
    attending: "yes",
    plus_ones: 2,
    meal_preference: "Chicken",
    dietary_notes: "None",
    hotel_choice: "Grand Hotel",
    message: "Looking forward to it!",
    custom_fields: {},
    sub_event_ids: [],
    submitted_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
  },
  {
    id: "rsvp-2",
    portal_id: "portal-1",
    guest_id: null,
    name: "Jane Smith",
    email: "jane@test.com",
    phone: null,
    attending: "no",
    plus_ones: 0,
    meal_preference: null,
    dietary_notes: null,
    hotel_choice: null,
    message: null,
    custom_fields: {},
    sub_event_ids: [],
    submitted_at: "2026-01-16T12:00:00Z",
    updated_at: "2026-01-16T12:00:00Z",
  },
  {
    id: "rsvp-3",
    portal_id: "portal-1",
    guest_id: null,
    name: "Alice Brown",
    email: null,
    phone: null,
    attending: "maybe",
    plus_ones: 1,
    meal_preference: "Fish",
    dietary_notes: "Gluten-free",
    hotel_choice: "Grand Hotel",
    message: null,
    custom_fields: {},
    sub_event_ids: [],
    submitted_at: "2026-01-17T08:00:00Z",
    updated_at: "2026-01-17T08:00:00Z",
  },
  {
    id: "rsvp-4",
    portal_id: "portal-1",
    guest_id: null,
    name: "Bob Wilson",
    email: "bob@test.com",
    phone: null,
    attending: "yes",
    plus_ones: 0,
    meal_preference: "Vegetarian",
    dietary_notes: null,
    hotel_choice: "Beach Resort",
    message: null,
    custom_fields: {},
    sub_event_ids: [],
    submitted_at: "2026-01-18T14:00:00Z",
    updated_at: "2026-01-18T14:00:00Z",
  },
]

// ── Tests ──

describe("RSVPDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelect.mockResolvedValue({ data: mockRsvps, error: null })
    mockChannel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })
  })

  it("renders loading state initially", () => {
    mockSelect.mockReturnValue(new Promise(() => {})) // never resolves
    render(<RSVPDashboard portalId="portal-1" />)

    expect(screen.getByTestId("rsvp-loading")).toBeInTheDocument()
  })

  it("renders dashboard with stats after loading", async () => {
    render(<RSVPDashboard portalId="portal-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("rsvp-dashboard")).toBeInTheDocument()
    })

    expect(screen.getByTestId("rsvp-stats")).toBeInTheDocument()
    expect(screen.getByTestId("stat-total")).toBeInTheDocument()
    expect(screen.getByTestId("stat-attending")).toBeInTheDocument()
    expect(screen.getByTestId("stat-declined")).toBeInTheDocument()
  })

  it("displays correct stat counts", async () => {
    render(<RSVPDashboard portalId="portal-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("rsvp-dashboard")).toBeInTheDocument()
    })

    // 4 total RSVPs
    expect(screen.getByTestId("stat-total")).toHaveTextContent("4")
    // 2 attending (John + Bob)
    expect(screen.getByTestId("stat-attending")).toHaveTextContent("2")
    // 1 declined (Jane)
    expect(screen.getByTestId("stat-declined")).toHaveTextContent("1")
    // 1 maybe (Alice)
    expect(screen.getByTestId("stat-maybe")).toHaveTextContent("1")
    // Total guests: John(1+2) + Bob(1+0) = 4
    expect(screen.getByTestId("stat-total-guests")).toHaveTextContent("4")
  })

  it("renders RSVP table with rows", async () => {
    render(<RSVPDashboard portalId="portal-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("rsvp-table")).toBeInTheDocument()
    })

    expect(screen.getByTestId("rsvp-row-rsvp-1")).toBeInTheDocument()
    expect(screen.getByTestId("rsvp-row-rsvp-2")).toBeInTheDocument()
    expect(screen.getByTestId("rsvp-row-rsvp-3")).toBeInTheDocument()
    expect(screen.getByTestId("rsvp-row-rsvp-4")).toBeInTheDocument()
  })

  it("renders status badges for each RSVP", async () => {
    render(<RSVPDashboard portalId="portal-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("rsvp-table")).toBeInTheDocument()
    })

    expect(screen.getAllByTestId("status-badge-yes")).toHaveLength(2)
    expect(screen.getAllByTestId("status-badge-no")).toHaveLength(1)
    expect(screen.getAllByTestId("status-badge-maybe")).toHaveLength(1)
  })

  it("filters RSVPs by status", async () => {
    const user = userEvent.setup()
    render(<RSVPDashboard portalId="portal-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("rsvp-table")).toBeInTheDocument()
    })

    // Filter to "Attending" only
    await user.click(screen.getByTestId("filter-yes"))

    // Only attending rows
    expect(screen.getByTestId("rsvp-row-rsvp-1")).toBeInTheDocument()
    expect(screen.getByTestId("rsvp-row-rsvp-4")).toBeInTheDocument()
    expect(screen.queryByTestId("rsvp-row-rsvp-2")).not.toBeInTheDocument()
    expect(screen.queryByTestId("rsvp-row-rsvp-3")).not.toBeInTheDocument()
  })

  it("sorts RSVPs by name", async () => {
    const user = userEvent.setup()
    render(<RSVPDashboard portalId="portal-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("rsvp-table")).toBeInTheDocument()
    })

    await user.click(screen.getByTestId("sort-name"))

    const rows = screen.getAllByTestId(/^rsvp-row-/)
    // Ascending: Alice, Bob, Jane, John
    expect(rows[0]).toHaveAttribute("data-testid", "rsvp-row-rsvp-3")
    expect(rows[1]).toHaveAttribute("data-testid", "rsvp-row-rsvp-4")
  })

  it("reverses sort direction on second click", async () => {
    const user = userEvent.setup()
    render(<RSVPDashboard portalId="portal-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("rsvp-table")).toBeInTheDocument()
    })

    // Click name sort twice for descending
    await user.click(screen.getByTestId("sort-name"))
    await user.click(screen.getByTestId("sort-name"))

    const rows = screen.getAllByTestId(/^rsvp-row-/)
    // Descending: John, Jane, Bob, Alice
    expect(rows[0]).toHaveAttribute("data-testid", "rsvp-row-rsvp-1")
  })

  it("shows expanded detail when row is clicked", async () => {
    const user = userEvent.setup()
    render(<RSVPDashboard portalId="portal-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("rsvp-table")).toBeInTheDocument()
    })

    await user.click(screen.getByTestId("rsvp-row-rsvp-1"))

    expect(screen.getByTestId("rsvp-detail")).toBeInTheDocument()
    expect(screen.getByText("Looking forward to it!")).toBeInTheDocument()
    // Email appears in both table and detail, so use getAllByText
    expect(screen.getAllByText("john@test.com").length).toBeGreaterThanOrEqual(2)
  })

  it("hides detail when same row is clicked again", async () => {
    const user = userEvent.setup()
    render(<RSVPDashboard portalId="portal-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("rsvp-table")).toBeInTheDocument()
    })

    await user.click(screen.getByTestId("rsvp-row-rsvp-1"))
    expect(screen.getByTestId("rsvp-detail")).toBeInTheDocument()

    await user.click(screen.getByTestId("rsvp-row-rsvp-1"))
    expect(screen.queryByTestId("rsvp-detail")).not.toBeInTheDocument()
  })

  it("renders hotel breakdown chart", async () => {
    render(<RSVPDashboard portalId="portal-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("hotel-breakdown")).toBeInTheDocument()
    })

    // Grand Hotel has 2 (John + Alice), Beach Resort has 1 (Bob)
    expect(screen.getByTestId("hotel-bar-Grand Hotel")).toBeInTheDocument()
    expect(screen.getByTestId("hotel-bar-Beach Resort")).toBeInTheDocument()
  })

  it("renders empty state when no RSVPs", async () => {
    mockSelect.mockResolvedValue({ data: [], error: null })
    render(<RSVPDashboard portalId="portal-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("rsvp-empty")).toBeInTheDocument()
    })

    expect(screen.getByText("No RSVPs yet")).toBeInTheDocument()
  })

  it("renders CSV export button", async () => {
    render(<RSVPDashboard portalId="portal-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("export-csv")).toBeInTheDocument()
    })

    expect(screen.getByTestId("export-csv")).toHaveTextContent("Export CSV")
  })

  it("triggers CSV download on export click", async () => {
    const user = userEvent.setup()
    render(<RSVPDashboard portalId="portal-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("export-csv")).toBeInTheDocument()
    })

    // Mock only after render is done
    const mockClick = vi.fn()
    const mockAnchor = { href: "", download: "", click: mockClick }
    const origCreateElement = document.createElement.bind(document)
    const createSpy = vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") return mockAnchor as unknown as HTMLAnchorElement
      return origCreateElement(tag)
    })
    vi.spyOn(document.body, "appendChild").mockImplementation((n) => n)
    vi.spyOn(document.body, "removeChild").mockImplementation((n) => n)
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    })

    await user.click(screen.getByTestId("export-csv"))

    expect(mockClick).toHaveBeenCalled()
    expect(mockAnchor.download).toBe("rsvps.csv")

    createSpy.mockRestore()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("sets up realtime subscription on mount", async () => {
    render(<RSVPDashboard portalId="portal-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("rsvp-dashboard")).toBeInTheDocument()
    })

    expect(mockChannel).toHaveBeenCalledWith("rsvps-portal-1")
  })

  it("renders filter buttons for all statuses", async () => {
    render(<RSVPDashboard portalId="portal-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("rsvp-filters")).toBeInTheDocument()
    })

    expect(screen.getByTestId("filter-all")).toBeInTheDocument()
    expect(screen.getByTestId("filter-yes")).toBeInTheDocument()
    expect(screen.getByTestId("filter-no")).toBeInTheDocument()
    expect(screen.getByTestId("filter-maybe")).toBeInTheDocument()
    expect(screen.getByTestId("filter-pending")).toBeInTheDocument()
  })

  it("shows all RSVPs when 'All' filter is selected after filtering", async () => {
    const user = userEvent.setup()
    render(<RSVPDashboard portalId="portal-1" />)

    await waitFor(() => {
      expect(screen.getByTestId("rsvp-table")).toBeInTheDocument()
    })

    await user.click(screen.getByTestId("filter-yes"))
    expect(screen.getAllByTestId(/^rsvp-row-/)).toHaveLength(2)

    await user.click(screen.getByTestId("filter-all"))
    expect(screen.getAllByTestId(/^rsvp-row-/)).toHaveLength(4)
  })
})

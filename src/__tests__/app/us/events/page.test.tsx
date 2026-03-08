import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { EventPortal } from "@/lib/types/portal.types"

// ── Mocks ──

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}))

const mockOrder = vi.fn()
const mockRsvpIn = vi.fn()
const mockAnalyticsIn = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: (table: string) => {
      if (table === "event_portals") {
        return {
          select: () => ({
            eq: () => ({
              order: mockOrder,
            }),
          }),
        }
      }
      if (table === "portal_rsvps") {
        return {
          select: () => ({
            in: mockRsvpIn,
          }),
        }
      }
      if (table === "portal_analytics") {
        return {
          select: () => ({
            in: mockAnalyticsIn,
          }),
        }
      }
      return { select: () => ({ eq: () => ({ order: vi.fn() }) }) }
    },
  }),
}))

// ── Imports ──

import EventsListPage from "@/app/(main)/us/events/page"

// ── Test Data ──

const mockPortals: EventPortal[] = [
  {
    id: "portal-1",
    creator_id: "user-1",
    slug: "wedding-abc1",
    title: "Our Wedding",
    subtitle: null,
    event_type: "wedding",
    event_date: "2026-06-15",
    event_end_date: null,
    location_name: "Grand Hall",
    location_lat: null,
    location_lng: null,
    theme_config: {
      colors: {
        primary: "#C4956A",
        secondary: "#8B7355",
        background: "#FAF8F5",
        surface: "#FFFFFF",
        text: "#2C2825",
        textMuted: "#6B6560",
        border: "#E8E0D8",
      },
      fonts: { heading: "Playfair Display", body: "DM Sans" },
      borderRadius: "md",
      spacing: "normal",
    },
    cover_image_url: null,
    is_published: true,
    password_hash: null,
    template_id: null,
    meta_title: null,
    meta_description: null,
    og_image_url: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
  },
  {
    id: "portal-2",
    creator_id: "user-1",
    slug: "birthday-xyz2",
    title: "Birthday Party",
    subtitle: null,
    event_type: "birthday",
    event_date: "2026-08-20",
    event_end_date: null,
    location_name: null,
    location_lat: null,
    location_lng: null,
    theme_config: {
      colors: {
        primary: "#C4956A",
        secondary: "#8B7355",
        background: "#FAF8F5",
        surface: "#FFFFFF",
        text: "#2C2825",
        textMuted: "#6B6560",
        border: "#E8E0D8",
      },
      fonts: { heading: "Playfair Display", body: "DM Sans" },
      borderRadius: "md",
      spacing: "normal",
    },
    cover_image_url: null,
    is_published: false,
    password_hash: null,
    template_id: null,
    meta_title: null,
    meta_description: null,
    og_image_url: null,
    created_at: "2026-01-10T00:00:00Z",
    updated_at: "2026-01-12T00:00:00Z",
  },
]

// ── Tests ──

describe("EventsListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOrder.mockResolvedValue({ data: mockPortals })
    mockRsvpIn.mockResolvedValue({
      data: [
        { portal_id: "portal-1" },
        { portal_id: "portal-1" },
        { portal_id: "portal-1" },
      ],
    })
    mockAnalyticsIn.mockResolvedValue({
      data: [
        { portal_id: "portal-1" },
        { portal_id: "portal-1" },
        { portal_id: "portal-2" },
      ],
    })
  })

  it("renders loading state initially", () => {
    mockOrder.mockReturnValue(new Promise(() => {}))
    render(<EventsListPage />)
    expect(screen.getByTestId("events-loading")).toBeInTheDocument()
  })

  it("renders page header with title", async () => {
    render(<EventsListPage />)
    await waitFor(() => {
      expect(screen.getByTestId("events-header")).toBeInTheDocument()
    })
    expect(screen.getByText("Event Portals")).toBeInTheDocument()
  })

  it("renders create button", async () => {
    render(<EventsListPage />)
    await waitFor(() => {
      expect(screen.getByTestId("create-portal-button")).toBeInTheDocument()
    })
    expect(screen.getByTestId("create-portal-button")).toHaveTextContent("Create")
  })

  it("navigates to new portal page on create click", async () => {
    const user = userEvent.setup()
    render(<EventsListPage />)
    await waitFor(() => {
      expect(screen.getByTestId("create-portal-button")).toBeInTheDocument()
    })
    await user.click(screen.getByTestId("create-portal-button"))
    expect(mockPush).toHaveBeenCalledWith("/us/events/new")
  })

  it("renders portal cards after loading", async () => {
    render(<EventsListPage />)
    await waitFor(() => {
      expect(screen.getByTestId("events-grid")).toBeInTheDocument()
    })
    expect(screen.getByTestId("portal-card-portal-1")).toBeInTheDocument()
    expect(screen.getByTestId("portal-card-portal-2")).toBeInTheDocument()
  })

  it("shows portal titles on cards", async () => {
    render(<EventsListPage />)
    await waitFor(() => {
      expect(screen.getByTestId("portal-title-portal-1")).toHaveTextContent("Our Wedding")
    })
    expect(screen.getByTestId("portal-title-portal-2")).toHaveTextContent("Birthday Party")
  })

  it("shows portal event types", async () => {
    render(<EventsListPage />)
    await waitFor(() => {
      expect(screen.getByTestId("portal-type-portal-1")).toHaveTextContent("Wedding")
    })
    expect(screen.getByTestId("portal-type-portal-2")).toHaveTextContent("Birthday")
  })

  it("shows published status for live portal", async () => {
    render(<EventsListPage />)
    await waitFor(() => {
      expect(screen.getByTestId("portal-status-portal-1")).toHaveTextContent("Live")
    })
  })

  it("shows draft status for unpublished portal", async () => {
    render(<EventsListPage />)
    await waitFor(() => {
      expect(screen.getByTestId("portal-status-portal-2")).toHaveTextContent("Draft")
    })
  })

  it("shows RSVP counts on cards", async () => {
    render(<EventsListPage />)
    await waitFor(() => {
      expect(screen.getByTestId("portal-rsvps-portal-1")).toHaveTextContent("3 RSVPs")
    })
    expect(screen.getByTestId("portal-rsvps-portal-2")).toHaveTextContent("0 RSVPs")
  })

  it("shows view counts on cards", async () => {
    render(<EventsListPage />)
    await waitFor(() => {
      expect(screen.getByTestId("portal-views-portal-1")).toHaveTextContent("2")
    })
    expect(screen.getByTestId("portal-views-portal-2")).toHaveTextContent("1")
  })

  it("shows event date on card", async () => {
    render(<EventsListPage />)
    await waitFor(() => {
      const dateEl = screen.getByTestId("portal-date-portal-1")
      expect(dateEl.textContent).toContain("Jun")
      expect(dateEl.textContent).toContain("2026")
    })
  })

  it("shows portal slug on card", async () => {
    render(<EventsListPage />)
    await waitFor(() => {
      expect(screen.getByTestId("portal-slug-portal-1")).toHaveTextContent("/e/wedding-abc1")
    })
  })

  it("renders empty state when no portals", async () => {
    mockOrder.mockResolvedValue({ data: [] })
    render(<EventsListPage />)
    await waitFor(() => {
      expect(screen.getByTestId("events-empty")).toBeInTheDocument()
    })
    expect(screen.getByText("No event portals yet")).toBeInTheDocument()
  })

  it("shows create button in empty state", async () => {
    mockOrder.mockResolvedValue({ data: [] })
    render(<EventsListPage />)
    await waitFor(() => {
      expect(screen.getByTestId("create-portal-empty")).toBeInTheDocument()
    })
  })

  it("navigates from empty state create button", async () => {
    mockOrder.mockResolvedValue({ data: [] })
    const user = userEvent.setup()
    render(<EventsListPage />)
    await waitFor(() => {
      expect(screen.getByTestId("create-portal-empty")).toBeInTheDocument()
    })
    await user.click(screen.getByTestId("create-portal-empty"))
    expect(mockPush).toHaveBeenCalledWith("/us/events/new")
  })

  it("cards link to portal admin dashboard", async () => {
    render(<EventsListPage />)
    await waitFor(() => {
      expect(screen.getByTestId("portal-card-portal-1")).toBeInTheDocument()
    })
    expect(screen.getByTestId("portal-card-portal-1")).toHaveAttribute(
      "href",
      "/us/events/portal-1"
    )
  })
})

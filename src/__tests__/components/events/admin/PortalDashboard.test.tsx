import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { EventPortal } from "@/lib/types/portal.types"

// ── Mocks ──

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [k: string]: unknown }) => {
      const safe: Record<string, unknown> = {}
      Object.keys(props).forEach((k) => {
        if (k === "style" || k === "className" || k.startsWith("data-") || k === "onClick") safe[k] = props[k]
      })
      return <div {...safe}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockPortalSingle = vi.fn()
const mockRsvpSelect = vi.fn()
const mockAnalyticsSelect = vi.fn()
const mockUpdateEq = vi.fn()
const mockChannel = vi.fn()
const mockRemoveChannel = vi.fn()
const mockGuestSelect = vi.fn()
const mockGuestInsert = vi.fn()
const mockGuestDelete = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: (table: string) => {
      if (table === "event_portals") {
        return {
          select: () => ({
            eq: () => ({
              single: mockPortalSingle,
            }),
          }),
          update: () => ({
            eq: mockUpdateEq,
          }),
        }
      }
      if (table === "portal_rsvps") {
        // Stats fetch uses .select().eq() (returns thenable)
        // RSVPDashboard uses .select().eq().order()
        const eqFn = vi.fn()
        eqFn.mockImplementation(() => {
          const result = mockRsvpSelect()
          // Make eq itself thenable (for stats fetch that doesn't chain .order())
          const thenable = result instanceof Promise ? result : Promise.resolve(result)
          return Object.assign(thenable, {
            order: () => mockRsvpSelect(),
            then: thenable.then.bind(thenable),
            catch: thenable.catch.bind(thenable),
          })
        })
        return {
          select: () => ({
            eq: eqFn,
          }),
        }
      }
      if (table === "portal_analytics") {
        return {
          select: () => ({
            eq: mockAnalyticsSelect,
          }),
        }
      }
      if (table === "portal_guests") {
        return {
          select: () => ({
            eq: () => ({
              order: mockGuestSelect,
            }),
          }),
          insert: mockGuestInsert,
          delete: () => ({
            eq: mockGuestDelete,
          }),
        }
      }
      return {
        select: () => ({ eq: () => ({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
      }
    },
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  }),
}))

// ── Imports ──

import { PortalDashboard } from "@/components/events/admin/PortalDashboard"

// ── Test Data ──

const mockPortal: EventPortal = {
  id: "portal-1",
  creator_id: "user-1",
  slug: "my-wedding-abc1",
  title: "My Wedding",
  subtitle: "Join us",
  event_type: "wedding",
  event_date: "2026-06-15",
  event_end_date: null,
  location_name: "Grand Hall",
  location_lat: null,
  location_lng: null,
  theme_config: {
    preset: "elegant-gold",
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
  updated_at: "2026-01-01T00:00:00Z",
}

// ── Tests ──

describe("PortalDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPortalSingle.mockResolvedValue({ data: mockPortal, error: null })
    mockRsvpSelect.mockReturnValue({
      data: [
        { attending: "yes", plus_ones: 2 },
        { attending: "yes", plus_ones: 0 },
        { attending: "no", plus_ones: 0 },
      ],
      error: null,
    })
    mockUpdateEq.mockResolvedValue({ error: null })
    mockAnalyticsSelect.mockResolvedValue({
      data: [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }],
      error: null,
    })
    // For embedded RSVPDashboard + GuestListManager
    mockChannel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })
    mockGuestSelect.mockResolvedValue({ data: [], error: null })
  })

  it("renders loading state initially", () => {
    mockPortalSingle.mockReturnValue(new Promise(() => {}))
    render(<PortalDashboard portalId="portal-1" />)
    expect(screen.getByTestId("dashboard-loading")).toBeInTheDocument()
  })

  it("renders dashboard after loading", async () => {
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("portal-dashboard")).toBeInTheDocument()
    })
  })

  it("shows portal title", async () => {
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-title")).toHaveTextContent("My Wedding")
    })
  })

  it("shows published status badge", async () => {
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-status")).toHaveTextContent("Published")
    })
  })

  it("shows draft status for unpublished portal", async () => {
    mockPortalSingle.mockResolvedValue({
      data: { ...mockPortal, is_published: false },
      error: null,
    })
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-status")).toHaveTextContent("Draft")
    })
  })

  it("displays event type", async () => {
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-type")).toHaveTextContent("wedding")
    })
  })

  it("renders stat cards with correct values", async () => {
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-stats")).toBeInTheDocument()
    })
    // 5 views
    expect(screen.getByTestId("stat-views")).toHaveTextContent("5")
    // 3 RSVPs
    expect(screen.getByTestId("stat-rsvps")).toHaveTextContent("3")
    // 2 attending
    expect(screen.getByTestId("stat-attending")).toHaveTextContent("2")
    // Total guests: (1+2) + (1+0) = 4
    expect(screen.getByTestId("stat-guests")).toHaveTextContent("4")
  })

  it("renders quick action buttons", async () => {
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-actions")).toBeInTheDocument()
    })
    expect(screen.getByTestId("action-edit")).toBeInTheDocument()
    expect(screen.getByTestId("action-share")).toBeInTheDocument()
    expect(screen.getByTestId("action-publish")).toBeInTheDocument()
  })

  it("calls onEdit when edit button is clicked", async () => {
    const onEdit = vi.fn()
    const user = userEvent.setup()
    render(<PortalDashboard portalId="portal-1" onEdit={onEdit} />)
    await waitFor(() => {
      expect(screen.getByTestId("action-edit")).toBeInTheDocument()
    })
    await user.click(screen.getByTestId("action-edit"))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it("shows 'View Live' link when published", async () => {
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("action-view")).toBeInTheDocument()
    })
    expect(screen.getByTestId("action-view")).toHaveAttribute(
      "href",
      expect.stringContaining("/e/my-wedding-abc1")
    )
  })

  it("hides 'View Live' link when draft", async () => {
    mockPortalSingle.mockResolvedValue({
      data: { ...mockPortal, is_published: false },
      error: null,
    })
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("portal-dashboard")).toBeInTheDocument()
    })
    expect(screen.queryByTestId("action-view")).not.toBeInTheDocument()
  })

  it("calls update on publish button click", async () => {
    // Render and wait for dashboard
    const user = userEvent.setup()
    const { rerender } = render(<PortalDashboard portalId="portal-1" />)
    // Wait for "Unpublish" text to confirm loaded
    await waitFor(() => {
      expect(screen.getByText("Unpublish")).toBeInTheDocument()
    })

    await user.click(screen.getByTestId("action-publish"))

    // Verify the supabase update was called
    await waitFor(() => {
      expect(mockUpdateEq).toHaveBeenCalled()
    })
  })

  it("shows Publish button for draft portal", async () => {
    mockPortalSingle.mockResolvedValue({
      data: { ...mockPortal, is_published: false },
      error: null,
    })
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("action-publish")).toHaveTextContent("Publish")
    })
  })

  it("renders tab navigation", async () => {
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-tabs")).toBeInTheDocument()
    })
    expect(screen.getByTestId("tab-overview")).toBeInTheDocument()
    expect(screen.getByTestId("tab-rsvps")).toBeInTheDocument()
    expect(screen.getByTestId("tab-guests")).toBeInTheDocument()
    expect(screen.getByTestId("tab-settings")).toBeInTheDocument()
  })

  it("shows overview tab by default", async () => {
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("tab-overview-content")).toBeInTheDocument()
    })
  })

  it("shows event date in overview", async () => {
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("overview-date")).toBeInTheDocument()
    })
    expect(screen.getByTestId("overview-date").textContent).toContain("June")
    expect(screen.getByTestId("overview-date").textContent).toContain("2026")
  })

  it("shows location in overview", async () => {
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("overview-location")).toHaveTextContent("Grand Hall")
    })
  })

  it("switches to RSVPs tab", async () => {
    const user = userEvent.setup()
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("tab-rsvps")).toBeInTheDocument()
    })
    await user.click(screen.getByTestId("tab-rsvps"))
    await waitFor(() => {
      expect(screen.getByTestId("tab-rsvps-content")).toBeInTheDocument()
    })
  })

  it("switches to guests tab", async () => {
    const user = userEvent.setup()
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("tab-guests")).toBeInTheDocument()
    })
    await user.click(screen.getByTestId("tab-guests"))
    await waitFor(() => {
      expect(screen.getByTestId("tab-guests-content")).toBeInTheDocument()
    })
  })

  it("switches to settings tab and shows settings toggle", async () => {
    const user = userEvent.setup()
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("tab-settings")).toBeInTheDocument()
    })
    await user.click(screen.getByTestId("tab-settings"))
    await waitFor(() => {
      expect(screen.getByTestId("tab-settings-content")).toBeInTheDocument()
    })
    expect(screen.getByTestId("settings-toggle")).toBeInTheDocument()
  })

  it("expands settings panel on toggle click", async () => {
    const user = userEvent.setup()
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("tab-settings")).toBeInTheDocument()
    })
    await user.click(screen.getByTestId("tab-settings"))
    await waitFor(() => {
      expect(screen.getByTestId("settings-toggle")).toBeInTheDocument()
    })

    expect(screen.queryByTestId("settings-panel")).not.toBeInTheDocument()
    await user.click(screen.getByTestId("settings-toggle"))
    expect(screen.getByTestId("settings-panel")).toBeInTheDocument()
    expect(screen.getByTestId("settings-title")).toHaveTextContent("My Wedding")
    expect(screen.getByTestId("settings-type")).toHaveTextContent("wedding")
    expect(screen.getByTestId("settings-slug")).toHaveTextContent("my-wedding-abc1")
  })

  it("opens share modal on share button click", async () => {
    const user = userEvent.setup()
    render(<PortalDashboard portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("action-share")).toBeInTheDocument()
    })

    expect(screen.queryByTestId("share-modal")).not.toBeInTheDocument()
    await user.click(screen.getByTestId("action-share"))
    expect(screen.getByTestId("share-modal")).toBeInTheDocument()
  })

  it("renders not found when portal doesn't exist", async () => {
    mockPortalSingle.mockResolvedValue({ data: null, error: null })
    render(<PortalDashboard portalId="nonexistent" />)
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-not-found")).toBeInTheDocument()
    })
  })
})

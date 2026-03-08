import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { PortalGuest } from "@/lib/types/portal.types"

// ── Mocks ──

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          order: mockSelect,
        }),
      }),
      insert: (data: unknown) => ({
        select: () => ({
          single: () => mockInsert(data),
        }),
      }),
      update: (data: unknown) => ({
        eq: (_col: string, val: string) => mockUpdate(data, val),
      }),
      delete: () => ({
        eq: (_col: string, val: string) => mockDelete(val),
      }),
    }),
  }),
}))

// ── Imports ──

import { GuestListManager } from "@/components/events/admin/GuestListManager"

// ── Test Data ──

const mockGuests: PortalGuest[] = [
  {
    id: "guest-1",
    portal_id: "portal-1",
    name: "Alice Brown",
    email: "alice@test.com",
    phone: "+1111111111",
    guest_group: "family",
    invite_sent: false,
    invite_sent_at: null,
    invite_opened: false,
    rsvp_linked: true,
    notes: "Bride's sister",
    plus_ones_allowed: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "guest-2",
    portal_id: "portal-1",
    name: "Bob Wilson",
    email: "bob@test.com",
    phone: null,
    guest_group: "friends",
    invite_sent: true,
    invite_sent_at: "2026-01-10T00:00:00Z",
    invite_opened: false,
    rsvp_linked: false,
    notes: null,
    plus_ones_allowed: 0,
    created_at: "2026-01-02T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
  },
  {
    id: "guest-3",
    portal_id: "portal-1",
    name: "Charlie Davis",
    email: null,
    phone: "+3333333333",
    guest_group: "work",
    invite_sent: false,
    invite_sent_at: null,
    invite_opened: false,
    rsvp_linked: false,
    notes: null,
    plus_ones_allowed: 2,
    created_at: "2026-01-03T00:00:00Z",
    updated_at: "2026-01-03T00:00:00Z",
  },
]

// ── Tests ──

describe("GuestListManager", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelect.mockResolvedValue({ data: mockGuests, error: null })
    mockInsert.mockResolvedValue({ data: null, error: null })
    mockUpdate.mockResolvedValue({ error: null })
    mockDelete.mockResolvedValue({ error: null })
  })

  it("renders loading state initially", () => {
    mockSelect.mockReturnValue(new Promise(() => {}))
    render(<GuestListManager portalId="portal-1" />)
    expect(screen.getByTestId("guest-loading")).toBeInTheDocument()
  })

  it("renders guest list after loading", async () => {
    render(<GuestListManager portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("guest-list-manager")).toBeInTheDocument()
    })
    expect(screen.getByTestId("guest-list")).toBeInTheDocument()
    expect(screen.getByTestId("guest-row-guest-1")).toBeInTheDocument()
    expect(screen.getByTestId("guest-row-guest-2")).toBeInTheDocument()
    expect(screen.getByTestId("guest-row-guest-3")).toBeInTheDocument()
  })

  it("displays guest count in header", async () => {
    render(<GuestListManager portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByText("Guest List (3)")).toBeInTheDocument()
    })
  })

  it("displays group badges for guests", async () => {
    render(<GuestListManager portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("guest-group-badge-guest-1")).toHaveTextContent("Family")
      expect(screen.getByTestId("guest-group-badge-guest-2")).toHaveTextContent("Friends")
      expect(screen.getByTestId("guest-group-badge-guest-3")).toHaveTextContent("Work")
    })
  })

  it("shows RSVP linked badge when applicable", async () => {
    render(<GuestListManager portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("guest-rsvp-linked-guest-1")).toBeInTheDocument()
      expect(screen.queryByTestId("guest-rsvp-linked-guest-2")).not.toBeInTheDocument()
    })
  })

  it("filters guests by search text", async () => {
    const user = userEvent.setup()
    render(<GuestListManager portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("guest-list")).toBeInTheDocument()
    })

    await user.type(screen.getByTestId("guest-search"), "alice")

    expect(screen.getByTestId("guest-row-guest-1")).toBeInTheDocument()
    expect(screen.queryByTestId("guest-row-guest-2")).not.toBeInTheDocument()
    expect(screen.queryByTestId("guest-row-guest-3")).not.toBeInTheDocument()
  })

  it("filters guests by group", async () => {
    const user = userEvent.setup()
    render(<GuestListManager portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("group-filters")).toBeInTheDocument()
    })

    await user.click(screen.getByTestId("group-filter-family"))

    expect(screen.getByTestId("guest-row-guest-1")).toBeInTheDocument()
    expect(screen.queryByTestId("guest-row-guest-2")).not.toBeInTheDocument()
  })

  it("shows group counts in filter pills", async () => {
    render(<GuestListManager portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("group-filter-all")).toHaveTextContent("All (3)")
      expect(screen.getByTestId("group-filter-family")).toHaveTextContent("Family (1)")
      expect(screen.getByTestId("group-filter-friends")).toHaveTextContent("Friends (1)")
    })
  })

  it("shows add guest form when button is clicked", async () => {
    const user = userEvent.setup()
    render(<GuestListManager portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("add-guest-btn")).toBeInTheDocument()
    })

    await user.click(screen.getByTestId("add-guest-btn"))

    expect(screen.getByTestId("guest-form")).toBeInTheDocument()
    expect(screen.getByTestId("guest-name-input")).toBeInTheDocument()
    expect(screen.getByTestId("guest-email-input")).toBeInTheDocument()
  })

  it("submits add guest form with correct data", async () => {
    const newGuest = {
      ...mockGuests[0],
      id: "guest-new",
      name: "New Guest",
      email: "new@test.com",
    }
    mockInsert.mockResolvedValue({ data: newGuest, error: null })

    const user = userEvent.setup()
    render(<GuestListManager portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("add-guest-btn")).toBeInTheDocument()
    })

    await user.click(screen.getByTestId("add-guest-btn"))
    await user.type(screen.getByTestId("guest-name-input"), "New Guest")
    await user.type(screen.getByTestId("guest-email-input"), "new@test.com")
    await user.click(screen.getByTestId("guest-form-submit"))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          portal_id: "portal-1",
          name: "New Guest",
          email: "new@test.com",
        })
      )
    })
  })

  it("hides form on cancel", async () => {
    const user = userEvent.setup()
    render(<GuestListManager portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("add-guest-btn")).toBeInTheDocument()
    })

    await user.click(screen.getByTestId("add-guest-btn"))
    expect(screen.getByTestId("guest-form")).toBeInTheDocument()

    await user.click(screen.getByTestId("guest-form-cancel"))
    expect(screen.queryByTestId("guest-form")).not.toBeInTheDocument()
  })

  it("shows edit form when edit button is clicked", async () => {
    const user = userEvent.setup()
    render(<GuestListManager portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("guest-row-guest-1")).toBeInTheDocument()
    })

    await user.click(screen.getByTestId("guest-edit-guest-1"))

    const nameInput = screen.getByTestId("guest-name-input") as HTMLInputElement
    expect(nameInput.value).toBe("Alice Brown")
  })

  it("calls delete on guest when delete button is clicked", async () => {
    const user = userEvent.setup()
    render(<GuestListManager portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("guest-row-guest-2")).toBeInTheDocument()
    })

    await user.click(screen.getByTestId("guest-delete-guest-2"))

    expect(mockDelete).toHaveBeenCalledWith("guest-2")
  })

  it("shows CSV import area when import button is clicked", async () => {
    const user = userEvent.setup()
    render(<GuestListManager portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("import-csv-btn")).toBeInTheDocument()
    })

    await user.click(screen.getByTestId("import-csv-btn"))

    expect(screen.getByTestId("csv-import")).toBeInTheDocument()
    expect(screen.getByTestId("csv-textarea")).toBeInTheDocument()
  })

  it("renders empty state when no guests", async () => {
    mockSelect.mockResolvedValue({ data: [], error: null })
    render(<GuestListManager portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("guest-empty")).toBeInTheDocument()
    })
    expect(screen.getByText("No guests added yet")).toBeInTheDocument()
  })

  it("shows share button for each guest", async () => {
    render(<GuestListManager portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("guest-share-guest-1")).toBeInTheDocument()
      expect(screen.getByTestId("guest-share-guest-2")).toBeInTheDocument()
    })
  })

  it("disables submit when guest name is empty", async () => {
    const user = userEvent.setup()
    render(<GuestListManager portalId="portal-1" />)
    await waitFor(() => {
      expect(screen.getByTestId("add-guest-btn")).toBeInTheDocument()
    })

    await user.click(screen.getByTestId("add-guest-btn"))

    expect(screen.getByTestId("guest-form-submit")).toBeDisabled()
  })
})

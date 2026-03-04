import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// ── Mocks ──

const mockDisconnect = vi.fn().mockResolvedValue({ error: null })
const mockGetAuthUrl = vi.fn().mockReturnValue("https://accounts.google.com/test-auth")

vi.mock("@/lib/google-calendar", () => ({
  getGoogleAuthUrl: () => mockGetAuthUrl(),
  disconnectGoogleCalendar: (...args: unknown[]) => mockDisconnect(...args),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ from: vi.fn() }),
}))

const mockRefreshProfile = vi.fn()

let mockAuthReturn = {
  user: { id: "user-1", email: "test@test.com" } as { id: string; email: string } | null,
  profile: {
    id: "user-1",
    display_name: "Yahya",
    email: "test@test.com",
    avatar_url: null,
    partner_id: "user-2",
    role: "admin",
    invite_code: null,
    pairing_status: "paired",
    paired_at: null,
    google_calendar_refresh_token: null as string | null,
    google_calendar_connected_at: null as string | null,
    created_at: "",
    updated_at: "",
  },
  partner: null,
  isLoading: false,
  profileNeedsSetup: false,
  signOut: vi.fn(),
  refreshProfile: mockRefreshProfile,
}

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockAuthReturn,
}))

import { GoogleCalendarConnect } from "@/components/calendar/GoogleCalendarConnect"

describe("GoogleCalendarConnect", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthReturn = {
      ...mockAuthReturn,
      user: { id: "user-1", email: "test@test.com" },
      profile: {
        ...mockAuthReturn.profile,
        google_calendar_refresh_token: null,
        google_calendar_connected_at: null,
      },
    }
  })

  // ── Unit Tests ──

  it("renders connect button when not connected", () => {
    render(<GoogleCalendarConnect />)
    expect(screen.getByTestId("gcal-connect-btn")).toBeInTheDocument()
    expect(screen.getByText("Connect")).toBeInTheDocument()
    expect(screen.getByText("Sync events to Google")).toBeInTheDocument()
  })

  it("renders disconnect button when connected", () => {
    mockAuthReturn = {
      ...mockAuthReturn,
      profile: {
        ...mockAuthReturn.profile,
        google_calendar_refresh_token: "refresh-token",
        google_calendar_connected_at: "2026-03-01T00:00:00Z",
      },
    }
    render(<GoogleCalendarConnect />)
    expect(screen.getByTestId("gcal-disconnect-btn")).toBeInTheDocument()
    expect(screen.getByText("Disconnect")).toBeInTheDocument()
    expect(screen.getByText("Connected")).toBeInTheDocument()
  })

  it("shows Google Calendar label", () => {
    render(<GoogleCalendarConnect />)
    expect(screen.getByText("Google Calendar")).toBeInTheDocument()
  })

  it("returns null when no user", () => {
    mockAuthReturn = { ...mockAuthReturn, user: null }
    const { container } = render(<GoogleCalendarConnect />)
    expect(container.innerHTML).toBe("")
  })

  it("returns null when no profile", () => {
    mockAuthReturn = { ...mockAuthReturn, profile: null as never }
    const { container } = render(<GoogleCalendarConnect />)
    expect(container.innerHTML).toBe("")
  })

  // ── Interaction Tests ──

  it("clicking connect redirects to Google auth URL", () => {
    // Mock window.location
    const originalLocation = window.location
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...originalLocation, href: "" },
    })

    render(<GoogleCalendarConnect />)
    fireEvent.click(screen.getByTestId("gcal-connect-btn"))

    expect(window.location.href).toBe("https://accounts.google.com/test-auth")

    // Restore
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    })
  })

  it("clicking disconnect calls disconnectGoogleCalendar", async () => {
    mockAuthReturn = {
      ...mockAuthReturn,
      profile: {
        ...mockAuthReturn.profile,
        google_calendar_refresh_token: "refresh-token",
        google_calendar_connected_at: "2026-03-01T00:00:00Z",
      },
    }
    render(<GoogleCalendarConnect />)
    fireEvent.click(screen.getByTestId("gcal-disconnect-btn"))

    await waitFor(() => {
      expect(mockDisconnect).toHaveBeenCalled()
    })
  })

  it("disconnect calls refreshProfile after completion", async () => {
    mockAuthReturn = {
      ...mockAuthReturn,
      profile: {
        ...mockAuthReturn.profile,
        google_calendar_refresh_token: "refresh-token",
        google_calendar_connected_at: "2026-03-01T00:00:00Z",
      },
    }
    render(<GoogleCalendarConnect />)
    fireEvent.click(screen.getByTestId("gcal-disconnect-btn"))

    await waitFor(() => {
      expect(mockRefreshProfile).toHaveBeenCalled()
    })
  })

  // ── Integration Tests ──

  it("disconnect button is disabled while disconnecting", async () => {
    mockDisconnect.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))
    mockAuthReturn = {
      ...mockAuthReturn,
      profile: {
        ...mockAuthReturn.profile,
        google_calendar_refresh_token: "refresh-token",
        google_calendar_connected_at: "2026-03-01T00:00:00Z",
      },
    }
    render(<GoogleCalendarConnect />)
    const btn = screen.getByTestId("gcal-disconnect-btn")
    fireEvent.click(btn)

    // Button should be disabled during disconnect
    expect(btn).toBeDisabled()

    await waitFor(() => {
      expect(mockDisconnect).toHaveBeenCalled()
    })
  })

  it("has data-testid on container", () => {
    render(<GoogleCalendarConnect />)
    expect(screen.getByTestId("google-calendar-connect")).toBeInTheDocument()
  })
})

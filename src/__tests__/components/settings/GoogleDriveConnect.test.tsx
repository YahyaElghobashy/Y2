import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// --- Auth mock ---
const mockRefreshProfile = vi.fn()

let mockProfile: Record<string, unknown> = {
  id: "user-1",
  display_name: "Yahya",
  email: "test@test.com",
  google_drive_connected_at: null,
  google_drive_refresh_token: null,
}

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "test@test.com" },
    profile: mockProfile,
    partner: null,
    isLoading: false,
    signOut: vi.fn(),
    refreshProfile: mockRefreshProfile,
  }),
}))

// --- Supabase mock ---
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
})

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: vi.fn(() => ({
      update: mockUpdate,
    })),
  }),
}))

// --- Google Calendar mock ---
vi.mock("@/lib/google-calendar", () => ({
  getGoogleAuthUrl: () => "https://accounts.google.com/o/oauth2/v2/auth?test=1",
}))

// --- Google Drive mock ---
const mockDisconnectGoogleDrive = vi.fn().mockResolvedValue({ error: null })

vi.mock("@/lib/google-drive", () => ({
  disconnectGoogleDrive: (...args: unknown[]) => mockDisconnectGoogleDrive(...args),
}))

import { GoogleDriveConnect } from "@/components/settings/GoogleDriveConnect"

describe("GoogleDriveConnect", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProfile = {
      id: "user-1",
      display_name: "Yahya",
      email: "test@test.com",
      google_drive_connected_at: null,
      google_drive_refresh_token: null,
    }
  })

  it("renders with Connect button when not connected", () => {
    render(<GoogleDriveConnect />)
    expect(screen.getByText("Google Drive")).toBeInTheDocument()
    expect(screen.getByText("Back up photos to Google Drive")).toBeInTheDocument()
    expect(screen.getByTestId("gdrive-connect-btn")).toHaveTextContent("Connect")
  })

  it("renders with Disconnect button when connected", () => {
    mockProfile.google_drive_connected_at = "2025-01-01T00:00:00Z"
    mockProfile.google_drive_refresh_token = "token-123"
    render(<GoogleDriveConnect />)
    expect(screen.getByText("Connected")).toBeInTheDocument()
    expect(screen.getByTestId("gdrive-disconnect-btn")).toBeInTheDocument()
  })

  it("navigates to Google auth URL on Connect click", async () => {
    const user = userEvent.setup()

    // Mock window.location.href assignment
    const locationMock = { href: "" }
    Object.defineProperty(window, "location", {
      value: locationMock,
      writable: true,
      configurable: true,
    })

    render(<GoogleDriveConnect />)
    await user.click(screen.getByTestId("gdrive-connect-btn"))

    expect(locationMock.href).toBe("https://accounts.google.com/o/oauth2/v2/auth?test=1")
  })

  it("calls disconnectGoogleDrive and refreshProfile on Disconnect click", async () => {
    const user = userEvent.setup()
    mockProfile.google_drive_connected_at = "2025-01-01T00:00:00Z"

    render(<GoogleDriveConnect />)
    await user.click(screen.getByTestId("gdrive-disconnect-btn"))

    expect(mockDisconnectGoogleDrive).toHaveBeenCalledOnce()
    expect(mockRefreshProfile).toHaveBeenCalledOnce()
  })

  it("disables Disconnect button while disconnecting", async () => {
    const user = userEvent.setup()
    mockProfile.google_drive_connected_at = "2025-01-01T00:00:00Z"

    // Make disconnect hang
    mockDisconnectGoogleDrive.mockReturnValue(new Promise(() => {}))

    render(<GoogleDriveConnect />)
    await user.click(screen.getByTestId("gdrive-disconnect-btn"))

    expect(screen.getByTestId("gdrive-disconnect-btn")).toBeDisabled()
  })

  it("returns null when user or profile is null", () => {
    mockProfile = null as unknown as Record<string, unknown>
    const { container } = render(<GoogleDriveConnect />)
    expect(container.innerHTML).toBe("")
  })
})

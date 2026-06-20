import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

// ── Hoisted mocks ─────────────────────────────────────────
const mockReplace = vi.fn()
let mockPathname = "/"

const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  usePathname: () => mockPathname,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth }))

vi.mock("@/lib/hooks/use-new-coupon-detection", () => ({
  useNewCouponDetection: () => ({
    newCoupon: null,
    showAnimation: false,
    onSaveForLater: vi.fn(),
  }),
}))

// Child components mocked to simple markers so we test only the layout's gating.
vi.mock("@/components/shared/AppShell", () => ({
  AppShell: ({ children }: React.PropsWithChildren) => <div data-testid="app-shell">{children}</div>,
}))
vi.mock("@/components/shared/ProfileSetupOverlay", () => ({
  ProfileSetupOverlay: () => <div data-testid="profile-overlay" />,
}))
vi.mock("@/components/shared/InstallPrompt", () => ({
  InstallPrompt: () => <div data-testid="install-prompt" />,
}))
vi.mock("@/components/pairing/PairingNudge", () => ({
  PairingNudge: () => <div data-testid="pairing-nudge" />,
}))
vi.mock("@/components/coupons/CouponReceiveAnimation", () => ({
  CouponReceiveAnimation: () => null,
}))
vi.mock("@/components/shared/DailyBonusToast", () => ({
  DailyBonusToast: () => <div data-testid="daily-bonus-toast" />,
}))

import AppLayout from "@/app/(main)/layout"

const USER = { id: "user-1", email: "test@test.com" }

function setAuth(over: Record<string, unknown>) {
  useAuth.mockReturnValue({
    user: USER,
    profile: null,
    partner: null,
    isLoading: false,
    profileNeedsSetup: false,
    refreshProfile: vi.fn(),
    signOut: vi.fn(),
    ...over,
  } as ReturnType<typeof useAuth>)
}

function profile(over: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    display_name: "Test User",
    pairing_status: "unpaired",
    invite_code: "ABC123",
    onboarding_completed_at: "2026-01-01T00:00:00Z",
    ...over,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockPathname = "/"
  window.history.replaceState({}, "", "/")
})

describe("AppLayout — client auth guard", () => {
  it("redirects to /login when auth resolves with no user", () => {
    setAuth({ user: null, profile: null })
    render(<AppLayout><div /></AppLayout>)
    expect(mockReplace).toHaveBeenCalledWith("/login")
  })

  it("preserves the intended path as redirectTo for a deep route", () => {
    mockPathname = "/treasury"
    setAuth({ user: null, profile: null })
    render(<AppLayout><div /></AppLayout>)
    expect(mockReplace).toHaveBeenCalledWith("/login?redirectTo=%2Ftreasury")
  })

  it("does NOT redirect to /login while auth is still loading", () => {
    setAuth({ user: null, profile: null, isLoading: true })
    render(<AppLayout><div /></AppLayout>)
    expect(mockReplace).not.toHaveBeenCalledWith("/login")
  })

  it("does NOT redirect to /login when a user is present", () => {
    setAuth({ profile: profile() })
    render(<AppLayout><div /></AppLayout>)
    expect(mockReplace).not.toHaveBeenCalled()
  })
})

describe("AppLayout — onboarding guard", () => {
  it("redirects incomplete-onboarding users to /onboarding", () => {
    setAuth({ profile: profile({ onboarding_completed_at: null }) })
    render(<AppLayout><div /></AppLayout>)
    expect(mockReplace).toHaveBeenCalledWith("/onboarding")
  })

  it("forwards a ?code= deep link into onboarding", () => {
    window.history.replaceState({}, "", "/?code=ZZ9XQ2")
    setAuth({ profile: profile({ onboarding_completed_at: null }) })
    render(<AppLayout><div /></AppLayout>)
    expect(mockReplace).toHaveBeenCalledWith("/onboarding?code=ZZ9XQ2")
  })

  it("does NOT redirect once onboarding is complete", () => {
    setAuth({ profile: profile() })
    render(<AppLayout><div /></AppLayout>)
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("does NOT redirect while already on /onboarding", () => {
    mockPathname = "/onboarding"
    setAuth({ profile: profile({ onboarding_completed_at: null }) })
    render(<AppLayout><div /></AppLayout>)
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("does NOT redirect away from /pair[/code] deep links (pairing is never gated)", () => {
    mockPathname = "/pair/ABC123"
    setAuth({ profile: profile({ onboarding_completed_at: null }) })
    render(<AppLayout><div /></AppLayout>)
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("does NOT redirect while auth is still loading", () => {
    setAuth({ profile: null, isLoading: true })
    render(<AppLayout><div /></AppLayout>)
    expect(mockReplace).not.toHaveBeenCalled()
  })
})

describe("AppLayout — ProfileSetupOverlay (fallback only)", () => {
  it("renders the overlay only when onboarding is complete AND the name is missing", () => {
    setAuth({ profile: profile(), profileNeedsSetup: true })
    render(<AppLayout><div /></AppLayout>)
    expect(screen.getByTestId("profile-overlay")).toBeInTheDocument()
  })

  it("does NOT render the overlay before onboarding completes (ProfileStep owns it → redirect instead)", () => {
    setAuth({ profile: profile({ onboarding_completed_at: null }), profileNeedsSetup: true })
    render(<AppLayout><div /></AppLayout>)
    expect(screen.queryByTestId("profile-overlay")).not.toBeInTheDocument()
    expect(mockReplace).toHaveBeenCalledWith("/onboarding")
  })

  it("does NOT render the overlay when the name is already set", () => {
    setAuth({ profile: profile(), profileNeedsSetup: false })
    render(<AppLayout><div /></AppLayout>)
    expect(screen.queryByTestId("profile-overlay")).not.toBeInTheDocument()
  })
})

describe("AppLayout — PairingNudge (encourage, never gate)", () => {
  it("renders the nudge for an onboarded, named, unpaired user", () => {
    setAuth({ profile: profile({ pairing_status: "unpaired" }), profileNeedsSetup: false })
    render(<AppLayout><div /></AppLayout>)
    expect(screen.getByTestId("pairing-nudge")).toBeInTheDocument()
  })

  it("hides the nudge when already paired", () => {
    setAuth({ profile: profile({ pairing_status: "paired" }), profileNeedsSetup: false })
    render(<AppLayout><div /></AppLayout>)
    expect(screen.queryByTestId("pairing-nudge")).not.toBeInTheDocument()
  })

  it("hides the nudge while on a /pair route", () => {
    mockPathname = "/pair"
    setAuth({ profile: profile({ pairing_status: "unpaired" }), profileNeedsSetup: false })
    render(<AppLayout><div /></AppLayout>)
    expect(screen.queryByTestId("pairing-nudge")).not.toBeInTheDocument()
  })

  it("hides the nudge when the profile-setup overlay is up", () => {
    setAuth({ profile: profile({ pairing_status: "unpaired" }), profileNeedsSetup: true })
    render(<AppLayout><div /></AppLayout>)
    expect(screen.queryByTestId("pairing-nudge")).not.toBeInTheDocument()
    expect(screen.getByTestId("profile-overlay")).toBeInTheDocument()
  })

  it("hides the nudge during onboarding", () => {
    mockPathname = "/onboarding"
    setAuth({ profile: profile({ pairing_status: "unpaired" }), profileNeedsSetup: false })
    render(<AppLayout><div /></AppLayout>)
    expect(screen.queryByTestId("pairing-nudge")).not.toBeInTheDocument()
  })
})

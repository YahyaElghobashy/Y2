import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockSignOut = vi.fn()
const mockRefreshProfile = vi.fn()

const mockProfile = {
  id: "user-1",
  display_name: "Yahya",
  email: "yahya@test.com",
  avatar_url: null as string | null,
  partner_id: null,
  role: "user",
  created_at: "",
  updated_at: "",
}

let mockUseAuth = {
  user: { id: "user-1" },
  profile: mockProfile as typeof mockProfile | null,
  partner: null,
  isLoading: false,
  profileNeedsSetup: false,
  signOut: mockSignOut,
  refreshProfile: mockRefreshProfile,
}

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth,
}))

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: {
    href: string
    children: React.ReactNode
    className?: string
    [key: string]: unknown
  }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock supabase for ProfileEditForm
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    storage: { from: vi.fn(() => ({ upload: vi.fn(), getPublicUrl: vi.fn() })) },
    from: vi.fn(() => ({ update: vi.fn(() => ({ eq: vi.fn() })) })),
  }),
}))

import SettingsPage from "@/app/(main)/settings/page"

describe("Settings Page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth = {
      user: { id: "user-1" },
      profile: mockProfile,
      partner: null,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: mockSignOut,
      refreshProfile: mockRefreshProfile,
    }
  })

  it("renders with PageHeader showing 'Settings'", () => {
    render(<SettingsPage />)
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  it("shows profile name from useAuth", () => {
    render(<SettingsPage />)
    expect(screen.getByText("Yahya")).toBeInTheDocument()
  })

  it("shows profile email from useAuth", () => {
    render(<SettingsPage />)
    expect(screen.getByText("yahya@test.com")).toBeInTheDocument()
  })

  it("shows loading skeleton when profile is null", () => {
    mockUseAuth.profile = null
    const { container } = render(<SettingsPage />)
    // LoadingSkeleton renders divs with animate-pulse
    const pulseElements = container.querySelectorAll(".animate-pulse")
    expect(pulseElements.length).toBeGreaterThan(0)
  })

  it("all section headers render", () => {
    render(<SettingsPage />)
    expect(screen.getByText("Account")).toBeInTheDocument()
    expect(screen.getByText("Appearance")).toBeInTheDocument()
    expect(screen.getByText("About")).toBeInTheDocument()
  })

  it("Log Out button opens confirmation dialog", async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    await user.click(screen.getByText("Log Out"))

    expect(screen.getByText("Log out?")).toBeInTheDocument()
    expect(screen.getByText("You'll need to sign in again to access your account.")).toBeInTheDocument()
  })

  it("'Made with love' row shows 'for Yara'", () => {
    render(<SettingsPage />)
    expect(screen.getByText("for Yara")).toBeInTheDocument()
  })
})

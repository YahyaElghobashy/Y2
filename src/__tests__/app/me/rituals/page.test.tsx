import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────

const mockLogRitual = vi.fn()
const mockCreateRitual = vi.fn().mockResolvedValue("r-new")
const mockIsLogged = vi.fn(() => false)
const mockPartnerLogged = vi.fn(() => false)

const mockUseRituals: ReturnType<typeof vi.fn> = vi.fn(() => ({
  rituals: [
    { id: "r1", user_id: "u1", title: "Walk", description: null, icon: "🚶", cadence: "daily", is_shared: false, coyyns_reward: 0, created_at: "", updated_at: "" },
    { id: "r2", user_id: "u1", title: "Read", description: null, icon: "📖", cadence: "weekly", is_shared: true, coyyns_reward: 5, created_at: "", updated_at: "" },
  ],
  isLoading: false,
  error: null,
  logRitual: mockLogRitual,
  isLoggedThisPeriod: mockIsLogged,
  partnerLoggedThisPeriod: mockPartnerLogged,
  createRitual: mockCreateRitual,
  deleteRitual: vi.fn(),
  uploadRitualPhoto: vi.fn(),
  todayRituals: [],
  logs: [],
}))

vi.mock("@/lib/hooks/use-rituals", () => ({
  useRituals: () => mockUseRituals(),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({ partner: { id: "p1", display_name: "Yara" } }),
}))

vi.mock("@/components/rituals/MonthlyLetterComposer", () => ({
  MonthlyLetterComposer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="letter-composer">Letter Composer</div> : null,
}))

vi.mock("@/components/rituals/LetterCard", () => ({
  LetterCard: ({ content }: { content: string }) => (
    <div data-testid="letter-card">{content}</div>
  ),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      ({ children, ...rest }: { children?: React.ReactNode; [k: string]: unknown }, ref: React.Ref<HTMLDivElement>) => (
        <div ref={ref} {...rest}>{children}</div>
      )
    ),
    button: React.forwardRef(
      ({ children, ...rest }: { children?: React.ReactNode; [k: string]: unknown }, ref: React.Ref<HTMLButtonElement>) => (
        <button ref={ref} {...rest}>{children}</button>
      )
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/animations", () => ({
  StaggerList: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  FadeIn: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}))

vi.mock("@/components/shared/PageHeader", () => ({
  PageHeader: ({ title, rightAction }: { title: string; rightAction?: React.ReactNode }) => (
    <div data-testid="page-header">
      <span>{title}</span>
      {rightAction}
    </div>
  ),
}))

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

import RitualsPage from "@/app/(main)/me/rituals/page"

describe("RitualsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsLogged.mockReturnValue(false)
    mockPartnerLogged.mockReturnValue(false)
    mockUseRituals.mockReturnValue({
      rituals: [
        { id: "r1", user_id: "u1", title: "Walk", description: null, icon: "🚶", cadence: "daily", is_shared: false, coyyns_reward: 0, created_at: "", updated_at: "" },
        { id: "r2", user_id: "u1", title: "Read", description: null, icon: "📖", cadence: "weekly", is_shared: true, coyyns_reward: 5, created_at: "", updated_at: "" },
      ],
      isLoading: false,
      error: null,
      logRitual: mockLogRitual,
      isLoggedThisPeriod: mockIsLogged,
      partnerLoggedThisPeriod: mockPartnerLogged,
      createRitual: mockCreateRitual,
      deleteRitual: vi.fn(),
      uploadRitualPhoto: vi.fn(),
      todayRituals: [],
      logs: [],
    })
  })

  describe("unit", () => {
    it("renders page container", () => {
      render(<RitualsPage />)
      expect(screen.getByTestId("rituals-page")).toBeInTheDocument()
    })

    it("shows loading skeleton", () => {
      mockUseRituals.mockReturnValue({
        rituals: [],
        isLoading: true,
        error: null,
        logRitual: vi.fn(),
        isLoggedThisPeriod: vi.fn(),
        partnerLoggedThisPeriod: vi.fn(),
        createRitual: vi.fn(),
        deleteRitual: vi.fn(),
        uploadRitualPhoto: vi.fn(),
        todayRituals: [],
        logs: [],
      })
      render(<RitualsPage />)
      expect(screen.getByTestId("rituals-loading")).toBeInTheDocument()
    })

    it("shows error message", () => {
      mockUseRituals.mockReturnValue({
        rituals: [],
        isLoading: false,
        error: "Something failed",
        logRitual: vi.fn(),
        isLoggedThisPeriod: vi.fn(),
        partnerLoggedThisPeriod: vi.fn(),
        createRitual: vi.fn(),
        deleteRitual: vi.fn(),
        uploadRitualPhoto: vi.fn(),
        todayRituals: [],
        logs: [],
      })
      render(<RitualsPage />)
      expect(screen.getByTestId("rituals-error")).toHaveTextContent("Something failed")
    })

    it("shows empty state when no rituals", () => {
      mockUseRituals.mockReturnValue({
        rituals: [],
        isLoading: false,
        error: null,
        logRitual: vi.fn(),
        isLoggedThisPeriod: vi.fn(),
        partnerLoggedThisPeriod: vi.fn(),
        createRitual: vi.fn(),
        deleteRitual: vi.fn(),
        uploadRitualPhoto: vi.fn(),
        todayRituals: [],
        logs: [],
      })
      render(<RitualsPage />)
      expect(screen.getByText("No rituals yet")).toBeInTheDocument()
    })

    it("groups rituals by cadence", () => {
      render(<RitualsPage />)
      expect(screen.getByTestId("cadence-group-daily")).toBeInTheDocument()
      expect(screen.getByTestId("cadence-group-weekly")).toBeInTheDocument()
    })

    it("renders ritual cards", () => {
      render(<RitualsPage />)
      expect(screen.getByTestId("ritual-card-r1")).toBeInTheDocument()
      expect(screen.getByTestId("ritual-card-r2")).toBeInTheDocument()
    })
  })

  describe("interaction", () => {
    it("opens create form on plus button", async () => {
      const user = userEvent.setup()
      render(<RitualsPage />)

      await user.click(screen.getByTestId("add-ritual-button"))
      expect(screen.getByTestId("ritual-form")).toBeInTheDocument()
    })

    it("logs ritual on card click", async () => {
      const user = userEvent.setup()
      render(<RitualsPage />)

      await user.click(screen.getByTestId("ritual-card-r1"))
      expect(mockLogRitual).toHaveBeenCalledWith("r1")
    })
  })

  describe("integration", () => {
    it("uses useRituals hook", () => {
      render(<RitualsPage />)
      expect(mockUseRituals).toHaveBeenCalled()
    })

    it("renders page header with title", () => {
      render(<RitualsPage />)
      expect(screen.getByText("Rituals")).toBeInTheDocument()
    })

    it("renders add ritual button", () => {
      render(<RitualsPage />)
      expect(screen.getByTestId("add-ritual-button")).toBeInTheDocument()
    })
  })
})

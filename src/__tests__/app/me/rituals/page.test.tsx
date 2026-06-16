import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Hook mocks (controlled domain data) ───────────────────────

const mockLogRitual = vi.fn()
const mockCreateRitual = vi.fn().mockResolvedValue("r-new")
const mockUploadPhoto = vi.fn().mockResolvedValue(null)
const mockIsLogged = vi.fn((_id: string) => false)
const mockPartnerLogged = vi.fn((_id: string) => false)
const mockGetStreak = vi.fn((_id: string) => 0)

type RitualRow = {
  id: string
  user_id: string
  title: string
  description: string | null
  icon: string
  cadence: string
  is_shared: boolean
  coyyns_reward: number
  created_at: string
  updated_at: string
}

const RITUALS: RitualRow[] = [
  { id: "r1", user_id: "u1", title: "Walk", description: null, icon: "🚶", cadence: "daily", is_shared: false, coyyns_reward: 0, created_at: "", updated_at: "" },
  { id: "r2", user_id: "u1", title: "Read", description: null, icon: "📖", cadence: "weekly", is_shared: true, coyyns_reward: 5, created_at: "", updated_at: "" },
]

function buildRitualsReturn(overrides: Record<string, unknown> = {}) {
  return {
    rituals: RITUALS,
    isLoading: false,
    error: null as string | null,
    logRitual: mockLogRitual,
    isLoggedThisPeriod: mockIsLogged,
    partnerLoggedThisPeriod: mockPartnerLogged,
    getStreakForRitual: mockGetStreak,
    createRitual: mockCreateRitual,
    uploadRitualPhoto: mockUploadPhoto,
    deleteRitual: vi.fn(),
    todayRituals: [],
    logs: [],
    ...overrides,
  }
}

const mockUseRituals = vi.fn(() => buildRitualsReturn())

vi.mock("@/lib/hooks/use-rituals", () => ({
  useRituals: () => mockUseRituals(),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "u1" },
    profile: { id: "u1", display_name: "Yahya" },
    partner: { id: "p1", display_name: "Yara" },
    isLoading: false,
  }),
}))

// ── Presentational / animation mocks ──────────────────────────

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      ({ children, whileTap, whileHover, ...rest }: { children?: React.ReactNode; [k: string]: unknown }, ref: React.Ref<HTMLDivElement>) => (
        <div ref={ref} {...rest}>{children}</div>
      )
    ),
    button: React.forwardRef(
      ({ children, whileTap, whileHover, ...rest }: { children?: React.ReactNode; [k: string]: unknown }, ref: React.Ref<HTMLButtonElement>) => (
        <button ref={ref} {...rest}>{children}</button>
      )
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-transition">{children}</div>
  ),
}))

vi.mock("@/components/shared/PageHeader", () => ({
  PageHeader: ({ title, backHref }: { title: string; backHref?: string }) => (
    <div data-testid="page-header" data-title={title} data-back={backHref}>{title}</div>
  ),
}))

vi.mock("@/components/shared/LoadingSkeleton", () => ({
  LoadingSkeleton: ({ count }: { count?: number }) => (
    <div data-testid="rituals-loading" data-count={count}>loading</div>
  ),
}))

// The create form + letter composer are real flows; mock them as thin
// open/closed surfaces so we can assert the page opens the right one.
vi.mock("@/components/rituals/CreateRitualForm", () => ({
  CreateRitualForm: ({ open }: { open: boolean }) =>
    open ? <div data-testid="ritual-form">Create Ritual Form</div> : null,
}))

vi.mock("@/components/rituals/MonthlyLetterComposer", () => ({
  MonthlyLetterComposer: ({ open, partnerName }: { open: boolean; partnerName: string }) =>
    open ? <div data-testid="letter-composer">Letter for {partnerName}</div> : null,
}))

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

import RitualsPage from "@/app/(main)/me/rituals/page"

beforeEach(() => {
  vi.clearAllMocks()
  mockIsLogged.mockReturnValue(false)
  mockPartnerLogged.mockReturnValue(false)
  mockGetStreak.mockReturnValue(0)
  mockCreateRitual.mockResolvedValue("r-new")
  mockUseRituals.mockReturnValue(buildRitualsReturn())
})

describe("RitualsPage", () => {
  // ── Unit: derived state renders correctly from mocked data ──
  describe("unit", () => {
    it("renders loading skeleton (3 cards) while the hook is loading", () => {
      mockUseRituals.mockReturnValue(buildRitualsReturn({ isLoading: true, rituals: [] }))
      render(<RitualsPage />)
      const skeleton = screen.getByTestId("rituals-loading")
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveAttribute("data-count", "3")
    })

    it("renders the error message from the hook", () => {
      mockUseRituals.mockReturnValue(buildRitualsReturn({ error: "Something failed", rituals: [] }))
      render(<RitualsPage />)
      expect(screen.getByTestId("rituals-error")).toHaveTextContent("Something failed")
    })

    it("renders the Rituals heading and each ritual title", () => {
      render(<RitualsPage />)
      expect(screen.getByRole("heading", { name: "Rituals", level: 1 })).toBeInTheDocument()
      expect(screen.getByText("Walk")).toBeInTheDocument()
      expect(screen.getByText("Read")).toBeInTheDocument()
    })

    it("groups rituals into cadence sections ordered daily → weekly", () => {
      render(<RitualsPage />)
      const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)
      // CADENCE_LABEL maps daily→Daily, weekly→Weekly; only non-empty buckets show.
      expect(headings).toEqual(["Daily", "Weekly"])
    })

    it("addresses the real partner in the letter CTA (from useAuth)", () => {
      render(<RitualsPage />)
      expect(screen.getByText("Write Yara a letter")).toBeInTheDocument()
    })

    it("renders the streak value returned by getStreakForRitual", () => {
      mockGetStreak.mockImplementation((id: string) => (id === "r1" ? 23 : 4))
      render(<RitualsPage />)
      expect(screen.getByText("🔥 23")).toBeInTheDocument()
      expect(screen.getByText("🔥 4")).toBeInTheDocument()
    })

    it("shows partner pending status for a shared ritual when partner has not logged", () => {
      mockPartnerLogged.mockReturnValue(false)
      render(<RitualsPage />)
      // r2 (Read) is shared → partner status surfaces
      expect(screen.getByText("Yara pending")).toBeInTheDocument()
      expect(screen.queryByText("Yara done")).not.toBeInTheDocument()
    })

    it("shows partner done status for a shared ritual when partner has logged", () => {
      mockPartnerLogged.mockImplementation((id: string) => id === "r2")
      render(<RitualsPage />)
      expect(screen.getByText("Yara done")).toBeInTheDocument()
    })

    it("marks a logged ritual's toggle as pressed and disabled", () => {
      mockIsLogged.mockImplementation((id: string) => id === "r1")
      render(<RitualsPage />)
      const walkRow = screen.getByText("Walk").closest("div[class*='items-center']") as HTMLElement
      const toggle = within(walkRow).getByRole("button", { pressed: true })
      expect(toggle).toBeDisabled()
    })
  })

  // ── Interaction: user flows ──────────────────────────────────
  describe("interaction", () => {
    it("opens the create form when the create FAB is clicked", async () => {
      const user = userEvent.setup()
      render(<RitualsPage />)
      expect(screen.queryByTestId("ritual-form")).not.toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Create ritual" }))
      expect(screen.getByTestId("ritual-form")).toBeInTheDocument()
    })

    it("opens the monthly letter composer when the letter CTA is clicked", async () => {
      const user = userEvent.setup()
      render(<RitualsPage />)
      expect(screen.queryByTestId("letter-composer")).not.toBeInTheDocument()
      await user.click(screen.getByText("Write Yara a letter"))
      const composer = screen.getByTestId("letter-composer")
      expect(composer).toBeInTheDocument()
      // partnerName is threaded through to the composer
      expect(composer).toHaveTextContent("Letter for Yara")
    })
  })

  // ── Integration: mocked hook receives the correct calls ──────
  describe("integration", () => {
    it("consumes the useRituals hook", () => {
      render(<RitualsPage />)
      expect(mockUseRituals).toHaveBeenCalled()
    })

    it("calls logRitual with the ritual id when an unlogged toggle is clicked", async () => {
      const user = userEvent.setup()
      render(<RitualsPage />)
      const walkRow = screen.getByText("Walk").closest("div[class*='items-center']") as HTMLElement
      await user.click(within(walkRow).getByRole("button"))
      expect(mockLogRitual).toHaveBeenCalledTimes(1)
      expect(mockLogRitual).toHaveBeenCalledWith("r1")
    })

    it("does not call logRitual again for an already-logged ritual (one-way logging)", async () => {
      const user = userEvent.setup()
      mockIsLogged.mockImplementation((id: string) => id === "r1")
      render(<RitualsPage />)
      const walkRow = screen.getByText("Walk").closest("div[class*='items-center']") as HTMLElement
      const toggle = within(walkRow).getByRole("button")
      await user.click(toggle)
      expect(mockLogRitual).not.toHaveBeenCalled()
    })

    it("queries streak / logged / partner state for each non-letter ritual", () => {
      render(<RitualsPage />)
      expect(mockGetStreak).toHaveBeenCalledWith("r1")
      expect(mockGetStreak).toHaveBeenCalledWith("r2")
      expect(mockIsLogged).toHaveBeenCalledWith("r1")
      expect(mockIsLogged).toHaveBeenCalledWith("r2")
      // partner status only queried for the shared ritual (r2)
      expect(mockPartnerLogged).toHaveBeenCalledWith("r2")
    })

    it("excludes the Monthly Letter ritual from the cadence groups (surfaced via CTA only)", () => {
      mockUseRituals.mockReturnValue(
        buildRitualsReturn({
          rituals: [
            ...RITUALS,
            { id: "rL", user_id: "u1", title: "Monthly Letter", description: null, icon: "💌", cadence: "monthly", is_shared: true, coyyns_reward: 10, created_at: "", updated_at: "" },
          ],
        })
      )
      render(<RitualsPage />)
      // The letter ritual is not rendered as a tappable row…
      expect(screen.queryByText("Monthly Letter")).not.toBeInTheDocument()
      // …and no Monthly cadence section appears for it.
      const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)
      expect(headings).not.toContain("Monthly")
    })
  })
})

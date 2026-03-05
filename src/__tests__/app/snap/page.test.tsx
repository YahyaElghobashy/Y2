import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Snap } from "@/lib/types/snap.types"

// ── Mocks (must be before imports) ────────────────────────────

const mockReactToSnap = vi.fn()
const mockLoadMore = vi.fn()

const mockUseSnap = vi.fn(() => ({
  snapFeed: [] as Snap[],
  isLoading: false,
  error: null as string | null,
  reactToSnap: mockReactToSnap,
  loadMore: mockLoadMore,
  hasMore: false,
}))

vi.mock("@/lib/hooks/use-snap", () => ({
  useSnap: () => mockUseSnap(),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "u1" },
    partner: { id: "p1", display_name: "Yara", avatar_url: null },
    profile: { display_name: "Yahya", avatar_url: null },
  })),
}))

// ── Framer Motion mock ────────────────────────────────────────

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      (
        {
          children,
          initial,
          animate,
          transition,
          whileTap,
          whileHover,
          variants,
          ...rest
        }: {
          children?: React.ReactNode
          initial?: unknown
          animate?: unknown
          transition?: unknown
          whileTap?: unknown
          whileHover?: unknown
          variants?: unknown
          [key: string]: unknown
        },
        ref: React.Ref<HTMLDivElement>
      ) => (
        <div ref={ref} {...rest}>
          {children}
        </div>
      )
    ),
    button: React.forwardRef(
      (
        {
          children,
          initial,
          animate,
          transition,
          whileTap,
          whileHover,
          ...rest
        }: {
          children?: React.ReactNode
          initial?: unknown
          animate?: unknown
          transition?: unknown
          whileTap?: unknown
          whileHover?: unknown
          [key: string]: unknown
        },
        ref: React.Ref<HTMLButtonElement>
      ) => (
        <button ref={ref} {...rest}>
          {children}
        </button>
      )
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ── Component mocks ───────────────────────────────────────────

vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-transition">{children}</div>
  ),
  FadeIn: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/shared/PageHeader", () => ({
  PageHeader: ({ title, rightAction }: any) => (
    <div data-testid="page-header">
      <span>{title}</span>
      {rightAction}
    </div>
  ),
}))

vi.mock("@/components/snap/SnapCard", () => ({
  SnapCard: ({ snap, authorName, isOwn }: any) => (
    <div
      data-testid="snap-card"
      data-snap-id={snap.id}
      data-author={authorName}
      data-is-own={String(isOwn)}
    />
  ),
}))

vi.mock("@/components/shared/EmptyState", () => ({
  EmptyState: ({ title, subtitle, actionHref }: any) => (
    <div data-testid="empty-state">
      <span>{title}</span>
      <span>{subtitle}</span>
      {actionHref && <a href={actionHref}>action</a>}
    </div>
  ),
}))

vi.mock("@/components/shared/LoadingSkeleton", () => ({
  LoadingSkeleton: ({ variant }: any) => (
    <div data-testid="loading-skeleton" data-variant={variant} />
  ),
}))

// ── Mock IntersectionObserver ─────────────────────────────────

const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

class MockIntersectionObserver {
  callback: IntersectionObserverCallback
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }
  observe = mockObserve
  disconnect = mockDisconnect
  unobserve = vi.fn()
}

Object.defineProperty(window, "IntersectionObserver", {
  value: MockIntersectionObserver,
  writable: true,
  configurable: true,
})

// ── Import after mocks ────────────────────────────────────────

import SnapFeedPage from "@/app/(main)/snap/page"

// ── Test data builders ────────────────────────────────────────

function makeSnap(overrides: Partial<Snap> = {}): Snap {
  return {
    id: "snap-1",
    user_id: "u1",
    snap_date: "2026-03-05",
    photo_url: "https://example.com/photo.jpg",
    caption: "Test caption",
    reaction_emoji: null,
    window_opened_at: "2026-03-05T10:00:00Z",
    created_at: "2026-03-05T10:02:00Z",
    ...overrides,
  }
}

describe("SnapFeedPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSnap.mockReturnValue({
      snapFeed: [],
      isLoading: false,
      error: null,
      reactToSnap: mockReactToSnap,
      loadMore: mockLoadMore,
      hasMore: false,
    })
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("shows empty state when no snaps", () => {
      render(<SnapFeedPage />)

      expect(screen.getByTestId("snap-empty-state")).toBeInTheDocument()
      expect(screen.getByText("No snaps yet")).toBeInTheDocument()
    })

    it("shows loading skeleton when isLoading", () => {
      mockUseSnap.mockReturnValue({
        snapFeed: [],
        isLoading: true,
        error: null,
        reactToSnap: mockReactToSnap,
        loadMore: mockLoadMore,
        hasMore: false,
      })

      render(<SnapFeedPage />)

      expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument()
      expect(screen.queryByTestId("snap-empty-state")).not.toBeInTheDocument()
    })

    it("shows page header with 'Snaps' title", () => {
      render(<SnapFeedPage />)

      const header = screen.getByTestId("page-header")
      expect(header).toBeInTheDocument()
      expect(header).toHaveTextContent("Snaps")
    })

    it("camera icon link to /snap/capture exists", () => {
      render(<SnapFeedPage />)

      const link = screen.getByLabelText("Take a snap")
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute("href", "/snap/capture")
    })

    it("shows error message when error exists", () => {
      mockUseSnap.mockReturnValue({
        snapFeed: [],
        isLoading: false,
        error: "Network error",
        reactToSnap: mockReactToSnap,
        loadMore: mockLoadMore,
        hasMore: false,
      })

      render(<SnapFeedPage />)

      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument()
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("groups snaps by date correctly", () => {
      const snap1 = makeSnap({ id: "s1", user_id: "u1", snap_date: "2026-03-05" })
      const snap2 = makeSnap({ id: "s2", user_id: "p1", snap_date: "2026-03-05" })
      const snap3 = makeSnap({ id: "s3", user_id: "u1", snap_date: "2026-03-04" })

      mockUseSnap.mockReturnValue({
        snapFeed: [snap1, snap2, snap3],
        isLoading: false,
        error: null,
        reactToSnap: mockReactToSnap,
        loadMore: mockLoadMore,
        hasMore: false,
      })

      render(<SnapFeedPage />)

      const dateGroups = screen.getAllByTestId("snap-date-group")
      expect(dateGroups).toHaveLength(2)
    })

    it("side-by-side layout when both user and partner snapped same day", () => {
      const userSnap = makeSnap({ id: "s1", user_id: "u1", snap_date: "2026-03-05" })
      const partnerSnap = makeSnap({ id: "s2", user_id: "p1", snap_date: "2026-03-05" })

      mockUseSnap.mockReturnValue({
        snapFeed: [userSnap, partnerSnap],
        isLoading: false,
        error: null,
        reactToSnap: mockReactToSnap,
        loadMore: mockLoadMore,
        hasMore: false,
      })

      render(<SnapFeedPage />)

      const snapCards = screen.getAllByTestId("snap-card")
      expect(snapCards).toHaveLength(2)

      // Both should be in the same date group
      const dateGroups = screen.getAllByTestId("snap-date-group")
      expect(dateGroups).toHaveLength(1)

      // Check both author names
      const ownCard = snapCards.find((c) => c.getAttribute("data-is-own") === "true")
      const partnerCard = snapCards.find((c) => c.getAttribute("data-is-own") === "false")
      expect(ownCard).toBeDefined()
      expect(partnerCard).toBeDefined()
      expect(ownCard!.getAttribute("data-author")).toBe("Yahya")
      expect(partnerCard!.getAttribute("data-author")).toBe("Yara")
    })

    it("single card layout when only one snapped", () => {
      const userSnap = makeSnap({ id: "s1", user_id: "u1", snap_date: "2026-03-05" })

      mockUseSnap.mockReturnValue({
        snapFeed: [userSnap],
        isLoading: false,
        error: null,
        reactToSnap: mockReactToSnap,
        loadMore: mockLoadMore,
        hasMore: false,
      })

      render(<SnapFeedPage />)

      const snapCards = screen.getAllByTestId("snap-card")
      expect(snapCards).toHaveLength(1)
      expect(snapCards[0]).toHaveAttribute("data-author", "Yahya")
    })

    it("shows date headers with correct formatting", () => {
      // Compute today and yesterday in Cairo timezone to match component logic
      const todayStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date())

      const d = new Date()
      d.setDate(d.getDate() - 1)
      const yesterdayStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d)

      const snap1 = makeSnap({ id: "s1", user_id: "u1", snap_date: todayStr })
      const snap2 = makeSnap({ id: "s2", user_id: "u1", snap_date: yesterdayStr })
      const snap3 = makeSnap({ id: "s3", user_id: "u1", snap_date: "2026-01-15" })

      mockUseSnap.mockReturnValue({
        snapFeed: [snap1, snap2, snap3],
        isLoading: false,
        error: null,
        reactToSnap: mockReactToSnap,
        loadMore: mockLoadMore,
        hasMore: false,
      })

      render(<SnapFeedPage />)

      expect(screen.getByText("Today")).toBeInTheDocument()
      expect(screen.getByText("Yesterday")).toBeInTheDocument()
      expect(screen.getByText("Jan 15")).toBeInTheDocument()
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("renders snap-feed container when snaps exist", () => {
      const snap = makeSnap({ id: "s1", user_id: "u1", snap_date: "2026-03-05" })

      mockUseSnap.mockReturnValue({
        snapFeed: [snap],
        isLoading: false,
        error: null,
        reactToSnap: mockReactToSnap,
        loadMore: mockLoadMore,
        hasMore: false,
      })

      render(<SnapFeedPage />)

      expect(screen.getByTestId("snap-feed")).toBeInTheDocument()
    })

    it("renders sentinel div for infinite scroll", () => {
      const snap = makeSnap({ id: "s1", user_id: "u1", snap_date: "2026-03-05" })

      mockUseSnap.mockReturnValue({
        snapFeed: [snap],
        isLoading: false,
        error: null,
        reactToSnap: mockReactToSnap,
        loadMore: mockLoadMore,
        hasMore: true,
      })

      render(<SnapFeedPage />)

      expect(screen.getByTestId("snap-sentinel")).toBeInTheDocument()
    })

    it("sets up IntersectionObserver on sentinel", () => {
      const snap = makeSnap({ id: "s1", user_id: "u1", snap_date: "2026-03-05" })

      mockUseSnap.mockReturnValue({
        snapFeed: [snap],
        isLoading: false,
        error: null,
        reactToSnap: mockReactToSnap,
        loadMore: mockLoadMore,
        hasMore: true,
      })

      render(<SnapFeedPage />)

      expect(mockObserve).toHaveBeenCalled()
    })

    it("empty state links to /snap/capture", () => {
      render(<SnapFeedPage />)

      const link = screen.getByTestId("snap-empty-state").querySelector("a")
      expect(link).toHaveAttribute("href", "/snap/capture")
    })

    it("partner snap card gets isOwn=false", () => {
      const partnerSnap = makeSnap({ id: "s1", user_id: "p1", snap_date: "2026-03-05" })

      mockUseSnap.mockReturnValue({
        snapFeed: [partnerSnap],
        isLoading: false,
        error: null,
        reactToSnap: mockReactToSnap,
        loadMore: mockLoadMore,
        hasMore: false,
      })

      render(<SnapFeedPage />)

      const card = screen.getByTestId("snap-card")
      expect(card).toHaveAttribute("data-is-own", "false")
    })

    it("user snap card gets isOwn=true", () => {
      const userSnap = makeSnap({ id: "s1", user_id: "u1", snap_date: "2026-03-05" })

      mockUseSnap.mockReturnValue({
        snapFeed: [userSnap],
        isLoading: false,
        error: null,
        reactToSnap: mockReactToSnap,
        loadMore: mockLoadMore,
        hasMore: false,
      })

      render(<SnapFeedPage />)

      const card = screen.getByTestId("snap-card")
      expect(card).toHaveAttribute("data-is-own", "true")
    })
  })
})

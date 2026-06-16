import React from "react"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Snap } from "@/lib/types/snap.types"

// ─────────────────────────────────────────────────────────────
// The page was redesigned: it now renders the presentational
// `SnapView` (which mounts the real `SnapReaction` picker on the
// partner's polaroid) fed by `useSnap` + `useAuth`. The old test
// asserted removed markup (snap-card / snap-empty-state /
// snap-date-group / snap-feed testids + a "No snaps yet"
// EmptyState). Those are GONE — see the note at the bottom of
// this file for what was deleted and why.
//
// We let the REAL SnapView + SnapReaction render so we assert
// against the real DOM (polaroid "who" labels, the reaction
// picker buttons, the camera link). Only the framing wrappers
// (PageTransition / PageHeader / LoadingSkeleton) are mocked.
// ─────────────────────────────────────────────────────────────

// ── Hook mocks ────────────────────────────────────────────────

const mockReactToSnap = vi.fn()
const mockLoadMore = vi.fn()

type SnapHookState = {
  snapFeed: Snap[]
  isLoading: boolean
  error: string | null
  reactToSnap: typeof mockReactToSnap
  loadMore: typeof mockLoadMore
  hasMore: boolean
}

function defaultSnapState(overrides: Partial<SnapHookState> = {}): SnapHookState {
  return {
    snapFeed: [],
    isLoading: false,
    error: null,
    reactToSnap: mockReactToSnap,
    loadMore: mockLoadMore,
    hasMore: false,
    ...overrides,
  }
}

const mockUseSnap = vi.fn<[], SnapHookState>(() => defaultSnapState())

vi.mock("@/lib/hooks/use-snap", () => ({
  useSnap: () => mockUseSnap(),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "u1" },
    partner: { id: "p1", display_name: "Yara", avatar_url: null },
    profile: { id: "u1", display_name: "Yahya", avatar_url: null },
  })),
}))

// ── next/link → plain anchor ──────────────────────────────────

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}))

// ── Framer Motion mock (repo Proxy/forwardRef pattern) ────────

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      (
        {
          children,
          initial,
          animate,
          exit,
          transition,
          whileTap,
          whileHover,
          variants,
          layout,
          ...rest
        }: {
          children?: React.ReactNode
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
          exit,
          transition,
          whileTap,
          whileHover,
          variants,
          layout,
          ...rest
        }: {
          children?: React.ReactNode
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

// ── Framing wrappers (not under test) ─────────────────────────

vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-transition">{children}</div>
  ),
  FadeIn: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/shared/PageHeader", () => ({
  PageHeader: ({ title }: any) => (
    <div data-testid="page-header">
      <span>{title}</span>
    </div>
  ),
}))

vi.mock("@/components/shared/LoadingSkeleton", () => ({
  LoadingSkeleton: ({ variant, count }: any) => (
    <div data-testid="loading-skeleton" data-variant={variant} data-count={count} />
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
  } as Snap
}

/** Build today/yesterday in Cairo TZ so they match the page's labelling. */
function cairoDate(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

describe("SnapFeedPage (redesigned → SnapView)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSnap.mockReturnValue(defaultSnapState())
  })

  // ── Unit: derived render from mocked hook state ─────────────

  describe("unit", () => {
    it("renders the Snaps header (English + Arabic) when there is no data", () => {
      render(<SnapFeedPage />)

      // Real SnapView header, not the loading/error PageHeader.
      expect(screen.queryByTestId("page-header")).not.toBeInTheDocument()
      expect(screen.getByRole("heading", { name: "Snaps" })).toBeInTheDocument()
      expect(screen.getByText("لقطات")).toBeInTheDocument()
    })

    it("renders no polaroids and no day labels when the feed is empty", () => {
      render(<SnapFeedPage />)

      // No "who" caption text → no polaroids rendered.
      expect(screen.queryByText("Yahya")).not.toBeInTheDocument()
      expect(screen.queryByText("Yara")).not.toBeInTheDocument()
      expect(screen.queryByTestId("snap-reaction")).not.toBeInTheDocument()
    })

    it("shows the loading skeleton (card variant) while isLoading, hiding the feed", () => {
      mockUseSnap.mockReturnValue(defaultSnapState({ isLoading: true }))

      render(<SnapFeedPage />)

      const skeleton = screen.getByTestId("loading-skeleton")
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveAttribute("data-variant", "card")
      // SnapView (and its header heading) must not render in the loading branch.
      expect(screen.queryByRole("heading", { name: "Snaps" })).not.toBeInTheDocument()
      // Loading branch still uses the framing PageHeader titled "Snaps".
      expect(screen.getByTestId("page-header")).toHaveTextContent("Snaps")
    })

    it("shows the error message and hides the feed when error is set", () => {
      mockUseSnap.mockReturnValue(defaultSnapState({ error: "Network error" }))

      render(<SnapFeedPage />)

      expect(
        screen.getByText("Something went wrong. Please try again.")
      ).toBeInTheDocument()
      expect(screen.queryByRole("heading", { name: "Snaps" })).not.toBeInTheDocument()
      expect(screen.queryByTestId("snap-reaction")).not.toBeInTheDocument()
    })

    it("derives the day label as 'Today' / 'Yesterday' / 'Mon D' from snap_date", () => {
      mockUseSnap.mockReturnValue(
        defaultSnapState({
          snapFeed: [
            makeSnap({ id: "s1", user_id: "u1", snap_date: cairoDate(0) }),
            makeSnap({ id: "s2", user_id: "u1", snap_date: cairoDate(-1) }),
            makeSnap({ id: "s3", user_id: "u1", snap_date: "2026-01-15" }),
          ],
        })
      )

      render(<SnapFeedPage />)

      expect(screen.getByText("Today")).toBeInTheDocument()
      expect(screen.getByText("Yesterday")).toBeInTheDocument()
      expect(screen.getByText("Jan 15")).toBeInTheDocument()
    })

    it("uses profile.display_name for my polaroid and partner.display_name for theirs", () => {
      mockUseSnap.mockReturnValue(
        defaultSnapState({
          snapFeed: [
            makeSnap({ id: "mine", user_id: "u1", snap_date: "2026-03-05" }),
            makeSnap({ id: "theirs", user_id: "p1", snap_date: "2026-03-05" }),
          ],
        })
      )

      render(<SnapFeedPage />)

      expect(screen.getByText("Yahya")).toBeInTheDocument()
      expect(screen.getByText("Yara")).toBeInTheDocument()
    })

    it("renders the partner's saved reaction emoji on their polaroid", () => {
      mockUseSnap.mockReturnValue(
        defaultSnapState({
          snapFeed: [
            makeSnap({
              id: "theirs",
              user_id: "p1",
              snap_date: "2026-03-05",
              reaction_emoji: "🔥",
            }),
          ],
        })
      )

      render(<SnapFeedPage />)

      // The fire emoji appears as the saved reaction overlay (also a
      // highlighted picker button → at least one occurrence).
      expect(screen.getAllByText("🔥").length).toBeGreaterThan(0)
    })
  })

  // ── Interaction: user flows in the rendered view ────────────

  describe("interaction", () => {
    it("shows a reaction picker on the partner's polaroid but NOT on my own", () => {
      mockUseSnap.mockReturnValue(
        defaultSnapState({
          snapFeed: [
            makeSnap({ id: "mine", user_id: "u1", snap_date: "2026-03-05" }),
            makeSnap({ id: "theirs", user_id: "p1", snap_date: "2026-03-05" }),
          ],
        })
      )

      render(<SnapFeedPage />)

      // canReact is true only for theirs → exactly one reaction picker.
      const pickers = screen.getAllByTestId("snap-reaction")
      expect(pickers).toHaveLength(1)
    })

    it("renders one picker button per reaction emoji on the partner's snap", () => {
      mockUseSnap.mockReturnValue(
        defaultSnapState({
          snapFeed: [makeSnap({ id: "theirs", user_id: "p1", snap_date: "2026-03-05" })],
        })
      )

      render(<SnapFeedPage />)

      // 5 reaction emojis → 5 buttons.
      expect(screen.getByLabelText("React with ❤️")).toBeInTheDocument()
      expect(screen.getByLabelText("React with 😂")).toBeInTheDocument()
      expect(screen.getByLabelText("React with 😍")).toBeInTheDocument()
      expect(screen.getByLabelText("React with 🔥")).toBeInTheDocument()
      expect(screen.getByLabelText("React with 🥺")).toBeInTheDocument()
    })

    it("clicking a reaction on the partner's snap calls reactToSnap(snapId, emoji)", () => {
      mockUseSnap.mockReturnValue(
        defaultSnapState({
          snapFeed: [
            makeSnap({ id: "partner-snap", user_id: "p1", snap_date: "2026-03-05" }),
          ],
        })
      )

      render(<SnapFeedPage />)

      fireEvent.click(screen.getByLabelText("React with ❤️"))

      expect(mockReactToSnap).toHaveBeenCalledTimes(1)
      expect(mockReactToSnap).toHaveBeenCalledWith("partner-snap", "❤️")
    })

    it("clicking the already-selected reaction toggles it off → reactToSnap(snapId, null)", () => {
      mockUseSnap.mockReturnValue(
        defaultSnapState({
          snapFeed: [
            makeSnap({
              id: "partner-snap",
              user_id: "p1",
              snap_date: "2026-03-05",
              reaction_emoji: "🔥",
            }),
          ],
        })
      )

      render(<SnapFeedPage />)

      fireEvent.click(screen.getByLabelText("React with 🔥"))

      expect(mockReactToSnap).toHaveBeenCalledWith("partner-snap", null)
    })
  })

  // ── Integration: layout, navigation, infinite scroll ────────

  describe("integration", () => {
    it("renders both polaroids side-by-side when both snapped the same day", () => {
      mockUseSnap.mockReturnValue(
        defaultSnapState({
          snapFeed: [
            makeSnap({ id: "mine", user_id: "u1", snap_date: "2026-03-05" }),
            makeSnap({ id: "theirs", user_id: "p1", snap_date: "2026-03-05" }),
          ],
        })
      )

      render(<SnapFeedPage />)

      // One day group (one label), two "who" captions.
      expect(screen.getAllByText(/Yahya|Yara/)).toHaveLength(2)
      expect(screen.getByText("Yahya")).toBeInTheDocument()
      expect(screen.getByText("Yara")).toBeInTheDocument()
    })

    it("collapses to a single polaroid when only one person snapped that day", () => {
      mockUseSnap.mockReturnValue(
        defaultSnapState({
          snapFeed: [makeSnap({ id: "mine", user_id: "u1", snap_date: "2026-03-05" })],
        })
      )

      render(<SnapFeedPage />)

      expect(screen.getByText("Yahya")).toBeInTheDocument()
      expect(screen.queryByText("Yara")).not.toBeInTheDocument()
      // My own snap → no reaction picker.
      expect(screen.queryByTestId("snap-reaction")).not.toBeInTheDocument()
    })

    it("groups snaps into one day-card per unique snap_date", () => {
      mockUseSnap.mockReturnValue(
        defaultSnapState({
          snapFeed: [
            makeSnap({ id: "s1", user_id: "u1", snap_date: "2026-03-05" }),
            makeSnap({ id: "s2", user_id: "p1", snap_date: "2026-03-05" }),
            makeSnap({ id: "s3", user_id: "u1", snap_date: "2026-03-04" }),
          ],
        })
      )

      render(<SnapFeedPage />)

      // 2 distinct dates → 2 labels ("Mar 5", "Mar 4").
      expect(screen.getByText("Mar 5")).toBeInTheDocument()
      expect(screen.getByText("Mar 4")).toBeInTheDocument()
    })

    it("exposes the camera link to /snap/capture in the header", () => {
      render(<SnapFeedPage />)

      const link = screen.getByLabelText("Take a snap")
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute("href", "/snap/capture")
    })

    it("renders the infinite-scroll sentinel and wires up IntersectionObserver", () => {
      mockUseSnap.mockReturnValue(
        defaultSnapState({
          snapFeed: [makeSnap({ id: "s1", user_id: "u1", snap_date: "2026-03-05" })],
          hasMore: true,
        })
      )

      render(<SnapFeedPage />)

      expect(screen.getByTestId("snap-sentinel")).toBeInTheDocument()
      expect(mockObserve).toHaveBeenCalled()
    })

    it("triggers loadMore via the IntersectionObserver callback when hasMore is true", () => {
      mockUseSnap.mockReturnValue(
        defaultSnapState({
          snapFeed: [makeSnap({ id: "s1", user_id: "u1", snap_date: "2026-03-05" })],
          hasMore: true,
        })
      )

      // Capture the most-recently constructed observer instance. Must be a
      // real class — the page calls `new IntersectionObserver(...)`.
      let captured: CapturingObserver | null = null
      class CapturingObserver extends MockIntersectionObserver {
        constructor(cb: IntersectionObserverCallback) {
          super(cb)
          captured = this
        }
      }
      Object.defineProperty(window, "IntersectionObserver", {
        value: CapturingObserver,
        writable: true,
        configurable: true,
      })

      render(<SnapFeedPage />)

      expect(captured).not.toBeNull()
      // Simulate the sentinel scrolling into view.
      captured!.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        captured! as unknown as IntersectionObserver
      )

      expect(mockLoadMore).toHaveBeenCalledTimes(1)
    })

    it("does NOT call loadMore when hasMore is false even if the sentinel intersects", () => {
      mockUseSnap.mockReturnValue(
        defaultSnapState({
          snapFeed: [makeSnap({ id: "s1", user_id: "u1", snap_date: "2026-03-05" })],
          hasMore: false,
        })
      )

      let captured: CapturingObserver | null = null
      class CapturingObserver extends MockIntersectionObserver {
        constructor(cb: IntersectionObserverCallback) {
          super(cb)
          captured = this
        }
      }
      Object.defineProperty(window, "IntersectionObserver", {
        value: CapturingObserver,
        writable: true,
        configurable: true,
      })

      render(<SnapFeedPage />)

      captured!.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        captured! as unknown as IntersectionObserver
      )

      expect(mockLoadMore).not.toHaveBeenCalled()
    })
  })
})

// ─────────────────────────────────────────────────────────────
// DELETED from the old suite (features genuinely removed by the
// redesign — not faked):
//   • "shows empty state when no snaps" / snap-empty-state testid /
//     "No snaps yet" text / EmptyState component — the redesigned
//     SnapView has no EmptyState; an empty feed renders just the
//     header over an empty grid. Replaced by the "no polaroids /
//     no pickers when empty" unit test.
//   • snap-card testid assertions (SnapCard is no longer used by the
//     page) — replaced by asserting the real polaroid "who" labels.
//   • snap-date-group testid (count of date groups) — replaced by
//     asserting the real day labels ("Mar 5"/"Mar 4"/"Today"…).
//   • snap-feed container testid — the page renders SnapView directly;
//     replaced by asserting the rendered Snaps heading + polaroids.
//   • data-is-own=true/false on mocked SnapCards — replaced by the
//     real behavioural signal: the partner's polaroid gets a reaction
//     picker (canReact), mine does not.
//   • empty-state "action link to /snap/capture" — the only capture
//     link now lives in the header (covered by the camera-link test).
// ─────────────────────────────────────────────────────────────

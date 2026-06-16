import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────
//
// The page was redesigned to render the presentational <WatchView> (status
// pill-tabs + poster cards) fed by useWatchLog + useAuth, with a RatingSheet
// opened via onRate and the existing AddWatchModal behind the FAB. These tests
// assert that wiring against what WatchView / RatingSheet actually render —
// NOT the old status-tab / type-chip / stats-bar testids, which no longer
// exist in the redesign.

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...filterProps(props)}>{children}</div>
    ),
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button {...filterProps(props)}>{children}</button>
    ),
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <p {...filterProps(props)}>{children}</p>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

function filterProps(props: Record<string, unknown>) {
  const filtered: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(props)) {
    if (
      !k.startsWith("while") &&
      !k.startsWith("initial") &&
      !k.startsWith("animate") &&
      !k.startsWith("exit") &&
      !k.startsWith("transition") &&
      !k.startsWith("layout") &&
      k !== "mode"
    ) {
      filtered[k] = v
    }
  }
  return filtered
}

// ── Domain data ───────────────────────────────────────────────

type Item = {
  id: string
  added_by: string
  title: string
  item_type: string
  poster_url: string | null
  poster_media_id: string | null
  year: number | null
  tmdb_id: number | null
  status: "watchlist" | "watching" | "watched"
  watched_date: string | null
  both_rated: boolean
  created_at: string
  updated_at: string
}

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: "item-1",
    added_by: "user-1",
    title: "Inception",
    item_type: "movie",
    poster_url: null,
    poster_media_id: null,
    year: 2010,
    tmdb_id: 27205,
    status: "watchlist",
    watched_date: null,
    both_rated: false,
    created_at: "2026-03-05T00:00:00Z",
    updated_at: "2026-03-05T00:00:00Z",
    ...overrides,
  }
}

const watchlistItem = makeItem({ id: "item-1", title: "Inception", item_type: "movie", year: 2010, status: "watchlist" })
const watchedItem = makeItem({
  id: "item-2",
  title: "Your Name",
  item_type: "anime",
  year: 2016,
  status: "watched",
  watched_date: "2026-02-20",
  both_rated: true,
})

// ── useWatchLog mock ──────────────────────────────────────────

const submitRating = vi.fn(async () => {})
const addItem = vi.fn(async () => {})
const searchTMDB = vi.fn(async () => [])

const mockHookReturn = {
  watchlist: [watchlistItem] as Item[],
  watching: [] as Item[],
  watched: [watchedItem] as Item[],
  ratings: [] as unknown[],
  isLoading: false,
  error: null as string | null,
  addItem,
  updateStatus: vi.fn(),
  removeItem: vi.fn(),
  submitRating,
  myRating: vi.fn((_id: string) => null as { score: number } | null),
  partnerRating: vi.fn((_id: string) => null as { score: number } | null),
  searchTMDB,
  stats: { totalWatched: 1, avgScore: 9, byType: {}, agreeRate: 100 },
}

vi.mock("@/lib/hooks/use-watch-log", () => ({
  useWatchLog: () => mockHookReturn,
}))

// useAuth — the page now reads `partner.display_name`. A real authed pair.
vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    profile: { id: "user-1", display_name: "Yahya", partner_id: "user-2" },
    partner: { id: "user-2", display_name: "Yara", partner_id: "user-1" },
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}))

import WatchLogPage from "@/app/(main)/us/watch/page"

describe("WatchLogPage (redesigned WatchView)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHookReturn.watchlist = [watchlistItem]
    mockHookReturn.watching = []
    mockHookReturn.watched = [watchedItem]
    mockHookReturn.isLoading = false
    mockHookReturn.error = null
    mockHookReturn.myRating.mockReturnValue(null)
    mockHookReturn.partnerRating.mockReturnValue(null)
  })

  // ── UNIT: derived rendering from mocked hook data ───────────

  it("renders the redesigned Watch header", () => {
    render(<WatchLogPage />)
    expect(screen.getByRole("heading", { name: "Watch" })).toBeInTheDocument()
  })

  it("renders loading skeleton (not the view) when isLoading", () => {
    mockHookReturn.isLoading = true
    render(<WatchLogPage />)
    // PageTransition → LoadingSkeleton; the Watch heading must NOT be present.
    expect(screen.queryByRole("heading", { name: "Watch" })).not.toBeInTheDocument()
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("renders the error message (not the view) when error is set", () => {
    mockHookReturn.error = "Something went wrong"
    render(<WatchLogPage />)
    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Watch" })).not.toBeInTheDocument()
  })

  it("derives the stats line (watched count / avg / agree) from both ratings", () => {
    // Both partners rated item-2 within 1 point → counts as watched, avg 9.5, 100% agree.
    mockHookReturn.myRating.mockImplementation((id: string) => (id === "item-2" ? { score: 9 } : null))
    mockHookReturn.partnerRating.mockImplementation((id: string) => (id === "item-2" ? { score: 10 } : null))
    render(<WatchLogPage />)
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("9.5")).toBeInTheDocument()
    expect(screen.getByText("100%")).toBeInTheDocument()
  })

  it("shows '0 watched / — avg / 0% agree' when no watched title has both ratings", () => {
    // watched item exists but ratings are null → not counted toward avg/agree.
    render(<WatchLogPage />)
    expect(screen.getByText("0")).toBeInTheDocument()
    expect(screen.getByText("—")).toBeInTheDocument()
    expect(screen.getByText("0%")).toBeInTheDocument()
  })

  it("renders the three status pill-tabs", () => {
    render(<WatchLogPage />)
    expect(screen.getByRole("button", { name: "Watchlist" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Watching" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Watched" })).toBeInTheDocument()
  })

  it("uses the partner display_name from useAuth on watched rating rows", () => {
    mockHookReturn.myRating.mockImplementation((id: string) => (id === "item-2" ? { score: 9 } : null))
    mockHookReturn.partnerRating.mockImplementation((id: string) => (id === "item-2" ? { score: 10 } : null))
    render(<WatchLogPage />)
    fireEvent.click(screen.getByRole("button", { name: "Watched" }))
    // The partner column is labelled with the authed partner's name, not a hardcoded one.
    expect(screen.getByText("Yara")).toBeInTheDocument()
  })

  // ── INTERACTION: tab switching shows the right items ────────

  it("shows watchlist items by default and hides watched ones", () => {
    render(<WatchLogPage />)
    expect(screen.getByText("Inception")).toBeInTheDocument()
    expect(screen.queryByText("Your Name")).not.toBeInTheDocument()
  })

  it("switches to the Watched tab and shows watched items", () => {
    render(<WatchLogPage />)
    fireEvent.click(screen.getByRole("button", { name: "Watched" }))
    expect(screen.getByText("Your Name")).toBeInTheDocument()
    expect(screen.queryByText("Inception")).not.toBeInTheDocument()
  })

  it("renders an empty list when the active tab has no items", () => {
    render(<WatchLogPage />)
    fireEvent.click(screen.getByRole("button", { name: "Watching" }))
    // Nothing from any list is shown on the empty 'watching' tab.
    expect(screen.queryByText("Inception")).not.toBeInTheDocument()
    expect(screen.queryByText("Your Name")).not.toBeInTheDocument()
  })

  it("shows a Rate affordance on a watched card the user has not rated yet", () => {
    // partner has rated but I have not → needsMine → "Rate" badge.
    mockHookReturn.myRating.mockReturnValue(null)
    render(<WatchLogPage />)
    fireEvent.click(screen.getByRole("button", { name: "Watched" }))
    expect(screen.getByText("Rate")).toBeInTheDocument()
  })

  // ── INTERACTION: Add FAB → AddWatchModal ───────────────────

  it("opens the AddWatchModal when the FAB is tapped", () => {
    render(<WatchLogPage />)
    expect(screen.queryByTestId("add-watch-modal")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Add title" }))
    expect(screen.getByTestId("add-watch-modal")).toBeInTheDocument()
  })

  // ── INTERACTION + INTEGRATION: rating flow → submitRating ──

  it("opens the RatingSheet when a watched card is tapped", () => {
    render(<WatchLogPage />)
    fireEvent.click(screen.getByRole("button", { name: "Watched" }))
    // Tap the poster card (its title text is inside the clickable card).
    fireEvent.click(screen.getByText("Your Name"))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    // RatingSheet header + the title it was opened for.
    expect(screen.getByText("How was it?")).toBeInTheDocument()
    expect(screen.getAllByText("Your Name").length).toBeGreaterThan(0)
  })

  it("submits the chosen score and reaction via submitRating(itemId, score, reaction)", async () => {
    render(<WatchLogPage />)
    fireEvent.click(screen.getByRole("button", { name: "Watched" }))
    fireEvent.click(screen.getByText("Your Name"))

    const sheet = screen.getByRole("dialog")
    // Pick a score (1–10 picker buttons are labelled "Rate N out of 10").
    fireEvent.click(within(sheet).getByRole("button", { name: "Rate 8 out of 10" }))
    // Optional reaction.
    fireEvent.change(within(sheet).getByPlaceholderText(/word about it/i), {
      target: { value: "Great!" },
    })
    // Confirm.
    fireEvent.click(within(sheet).getByRole("button", { name: /Save rating/i }))

    await waitFor(() => {
      expect(submitRating).toHaveBeenCalledWith("item-2", 8, "Great!")
    })
  })

  it("omits the reaction (undefined) when the field is left blank", async () => {
    render(<WatchLogPage />)
    fireEvent.click(screen.getByRole("button", { name: "Watched" }))
    fireEvent.click(screen.getByText("Your Name"))

    const sheet = screen.getByRole("dialog")
    fireEvent.click(within(sheet).getByRole("button", { name: "Rate 6 out of 10" }))
    fireEvent.click(within(sheet).getByRole("button", { name: /Save rating/i }))

    await waitFor(() => {
      expect(submitRating).toHaveBeenCalledWith("item-2", 6, undefined)
    })
  })

  it("seeds the RatingSheet with the user's existing score on re-rate", () => {
    // I already rated item-2 a 7 → sheet should open pre-selected on 7.
    mockHookReturn.myRating.mockImplementation((id: string) => (id === "item-2" ? { score: 7 } : null))
    render(<WatchLogPage />)
    fireEvent.click(screen.getByRole("button", { name: "Watched" }))
    fireEvent.click(screen.getByText("Your Name"))

    const sheet = screen.getByRole("dialog")
    expect(within(sheet).getByRole("button", { name: "Rate 7 out of 10" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
  })

  // ── INTEGRATION: Add flow → addItem ────────────────────────

  it("calls addItem with the manual title when adding through the modal", async () => {
    render(<WatchLogPage />)
    fireEvent.click(screen.getByRole("button", { name: "Add title" }))
    fireEvent.click(screen.getByTestId("manual-add-toggle"))
    fireEvent.change(screen.getByTestId("manual-title-input"), {
      target: { value: "New Movie" },
    })
    fireEvent.click(screen.getByTestId("manual-add-btn"))

    await waitFor(() => {
      expect(addItem).toHaveBeenCalledWith(
        expect.objectContaining({ title: "New Movie", item_type: "movie" }),
      )
    })
  })

  // ── INTERACTION + INTEGRATION: track flow → updateStatus ───

  it("advances a watchlist item to watching via updateStatus when Start is tapped", () => {
    render(<WatchLogPage />)
    // Default tab is Watchlist; item-1 (Inception) shows a Start action.
    fireEvent.click(screen.getByRole("button", { name: "Start" }))
    expect(mockHookReturn.updateStatus).toHaveBeenCalledWith("item-1", "watching")
  })

  it("advances a watching item to watched via updateStatus when Finished is tapped", () => {
    mockHookReturn.watching = [makeItem({ id: "item-3", title: "The Bear", item_type: "series", status: "watching" })]
    render(<WatchLogPage />)
    fireEvent.click(screen.getByRole("button", { name: "Watching" }))
    fireEvent.click(screen.getByRole("button", { name: "Finished" }))
    expect(mockHookReturn.updateStatus).toHaveBeenCalledWith("item-3", "watched")
  })
})

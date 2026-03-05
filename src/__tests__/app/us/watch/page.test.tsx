import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────

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

const mockWatchlist = [
  {
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
  },
]
const mockWatched = [
  {
    id: "item-2",
    added_by: "user-1",
    title: "Your Name",
    item_type: "anime",
    poster_url: null,
    poster_media_id: null,
    year: 2016,
    tmdb_id: 372058,
    status: "watched",
    watched_date: "2026-02-20",
    both_rated: true,
    created_at: "2026-02-15T00:00:00Z",
    updated_at: "2026-02-20T00:00:00Z",
  },
]

const mockHookReturn = {
  watchlist: mockWatchlist,
  watching: [],
  watched: mockWatched,
  ratings: [],
  isLoading: false,
  error: null,
  addItem: vi.fn(),
  updateStatus: vi.fn(),
  removeItem: vi.fn(),
  submitRating: vi.fn(),
  myRating: vi.fn(() => null),
  partnerRating: vi.fn(() => null),
  searchTMDB: vi.fn(async () => []),
  stats: { totalWatched: 1, avgScore: 9, byType: { movie: 0, series: 0, anime: 1, documentary: 0, short: 0, other: 0 }, agreeRate: 100 },
}

vi.mock("@/lib/hooks/use-watch-log", () => ({
  useWatchLog: () => mockHookReturn,
}))

vi.mock("@/components/shared/EmptyState", () => ({
  EmptyState: ({ title }: { title: string }) => (
    <div data-testid="empty-state">{title}</div>
  ),
}))

import WatchLogPage from "@/app/(main)/us/watch/page"

describe("WatchLogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHookReturn.watchlist = mockWatchlist
    mockHookReturn.watching = []
    mockHookReturn.watched = mockWatched
    mockHookReturn.isLoading = false
    mockHookReturn.error = null
    mockHookReturn.stats = { totalWatched: 1, avgScore: 9, byType: { movie: 0, series: 0, anime: 1, documentary: 0, short: 0, other: 0 }, agreeRate: 100 }
    mockHookReturn.myRating.mockReturnValue(null)
    mockHookReturn.partnerRating.mockReturnValue(null)
  })

  // ── UNIT: Rendering ─────────────────────────────────────────

  it("renders the watch log page", () => {
    render(<WatchLogPage />)
    expect(screen.getByTestId("watch-log-page")).toBeInTheDocument()
  })

  it("shows loading skeletons when isLoading", () => {
    mockHookReturn.isLoading = true
    render(<WatchLogPage />)
    expect(screen.getByTestId("watch-loading")).toBeInTheDocument()
  })

  it("shows error message when error exists", () => {
    mockHookReturn.error = "Something went wrong"
    render(<WatchLogPage />)
    expect(screen.getByTestId("watch-error")).toHaveTextContent("Something went wrong")
  })

  it("renders stats bar with correct values", () => {
    render(<WatchLogPage />)
    const statsBar = screen.getByTestId("stats-bar")
    expect(statsBar).toHaveTextContent("1 watched")
    expect(statsBar).toHaveTextContent("Avg 9/10")
    expect(statsBar).toHaveTextContent("100% agree")
  })

  it("hides stats bar when no watched items", () => {
    mockHookReturn.stats = { totalWatched: 0, avgScore: 0, byType: { movie: 0, series: 0, anime: 0, documentary: 0, short: 0, other: 0 }, agreeRate: 0 }
    render(<WatchLogPage />)
    expect(screen.queryByTestId("stats-bar")).not.toBeInTheDocument()
  })

  it("renders three status tabs", () => {
    render(<WatchLogPage />)
    expect(screen.getByTestId("tab-watchlist")).toBeInTheDocument()
    expect(screen.getByTestId("tab-watching")).toBeInTheDocument()
    expect(screen.getByTestId("tab-watched")).toBeInTheDocument()
  })

  it("renders type filter chips", () => {
    render(<WatchLogPage />)
    expect(screen.getByTestId("filter-all")).toBeInTheDocument()
    expect(screen.getByTestId("filter-movie")).toBeInTheDocument()
    expect(screen.getByTestId("filter-series")).toBeInTheDocument()
    expect(screen.getByTestId("filter-anime")).toBeInTheDocument()
  })

  // ── INTERACTION: Tab switching ────────────────────────────

  it("shows watchlist items by default", () => {
    render(<WatchLogPage />)
    expect(screen.getByTestId("watch-card-item-1")).toBeInTheDocument()
    expect(screen.queryByTestId("watch-card-item-2")).not.toBeInTheDocument()
  })

  it("switches to watched tab and shows watched items", () => {
    render(<WatchLogPage />)
    fireEvent.click(screen.getByTestId("tab-watched"))
    expect(screen.getByTestId("watch-card-item-2")).toBeInTheDocument()
    expect(screen.queryByTestId("watch-card-item-1")).not.toBeInTheDocument()
  })

  it("shows empty state when tab has no items", () => {
    render(<WatchLogPage />)
    fireEvent.click(screen.getByTestId("tab-watching"))
    expect(screen.getByTestId("empty-state")).toBeInTheDocument()
  })

  // ── INTERACTION: Type filtering ───────────────────────────

  it("filters by type when chip is clicked", () => {
    render(<WatchLogPage />)
    fireEvent.click(screen.getByTestId("tab-watched"))
    // item-2 is anime
    fireEvent.click(screen.getByTestId("filter-movie"))
    expect(screen.queryByTestId("watch-card-item-2")).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("filter-anime"))
    expect(screen.getByTestId("watch-card-item-2")).toBeInTheDocument()
  })

  // ── INTERACTION: Add FAB ──────────────────────────────────

  it("opens add modal when FAB is clicked", () => {
    render(<WatchLogPage />)
    fireEvent.click(screen.getByTestId("add-watch-fab"))
    expect(screen.getByTestId("add-watch-modal")).toBeInTheDocument()
  })

  // ── INTERACTION: Rating flow ──────────────────────────────

  it("opens rating sheet when rate button is clicked on watched item", () => {
    mockHookReturn.watchlist = []
    mockHookReturn.watched = [{
      ...mockWatched[0],
      both_rated: false,
    }]
    mockHookReturn.myRating.mockReturnValue(null)

    render(<WatchLogPage />)
    fireEvent.click(screen.getByTestId("tab-watched"))
    fireEvent.click(screen.getByTestId("rate-btn"))

    expect(screen.getByTestId("rating-sheet")).toBeInTheDocument()
    expect(screen.getByTestId("rating-slider")).toBeInTheDocument()
    expect(screen.getByTestId("rating-reaction")).toBeInTheDocument()
  })

  it("submits rating with score and reaction", async () => {
    mockHookReturn.watchlist = []
    mockHookReturn.watched = [{
      ...mockWatched[0],
      both_rated: false,
    }]
    mockHookReturn.myRating.mockReturnValue(null)

    render(<WatchLogPage />)
    fireEvent.click(screen.getByTestId("tab-watched"))
    fireEvent.click(screen.getByTestId("rate-btn"))

    fireEvent.change(screen.getByTestId("rating-slider"), { target: { value: "8" } })
    fireEvent.change(screen.getByTestId("rating-reaction"), { target: { value: "Great!" } })
    fireEvent.click(screen.getByTestId("submit-rating-btn"))

    await waitFor(() => {
      expect(mockHookReturn.submitRating).toHaveBeenCalledWith("item-2", 8, "Great!")
    })
  })

  // ── INTEGRATION: Hook calls ───────────────────────────────

  it("calls updateStatus when start watching button is clicked", () => {
    render(<WatchLogPage />)
    fireEvent.click(screen.getByTestId("start-watching-btn"))
    expect(mockHookReturn.updateStatus).toHaveBeenCalledWith("item-1", "watching")
  })

  it("calls removeItem when remove button is clicked", () => {
    render(<WatchLogPage />)
    fireEvent.click(screen.getByTestId("remove-btn"))
    expect(mockHookReturn.removeItem).toHaveBeenCalledWith("item-1")
  })

  it("calls addItem via AddWatchModal", () => {
    render(<WatchLogPage />)
    fireEvent.click(screen.getByTestId("add-watch-fab"))
    fireEvent.click(screen.getByTestId("manual-add-toggle"))
    fireEvent.change(screen.getByTestId("manual-title-input"), { target: { value: "New Movie" } })
    fireEvent.click(screen.getByTestId("manual-add-btn"))

    expect(mockHookReturn.addItem).toHaveBeenCalled()
  })
})

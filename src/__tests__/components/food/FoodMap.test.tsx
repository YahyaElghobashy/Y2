import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"

// ── Hoist mocks ──────────────────────────────────────────────
// The redesign replaced the old map/list page with a presentational <TableView>
// fed by the page from useFoodJournal. The page maps FoodVisit rows → TableView
// Visit shape: { id, place, cuisine (label), score (round of my rating), date, visitNo }.
const mockUseFoodJournal = vi.hoisted(() =>
  vi.fn(() => ({
    visits: [],
    isLoading: false,
    error: null,
    getMyRating: vi.fn(() => null),
    getPartnerRating: vi.fn(() => null),
    getPhotos: vi.fn(() => []),
    getPreferenceDot: vi.fn(() => null),
    getVisitById: vi.fn(() => null),
    filterByCuisine: vi.fn(() => []),
    addVisit: vi.fn(),
    updateVisit: vi.fn(),
    toggleBookmark: vi.fn(),
    addRating: vi.fn(),
    addPhotos: vi.fn(),
    removePhoto: vi.fn(),
    stats: {
      totalVisits: 0,
      uniquePlaces: 0,
      avgOverall: 0,
      topCuisine: null,
      returnSpots: 0,
      bookmarkedCount: 0,
    },
  }))
)

const mockPush = vi.hoisted(() => vi.fn())

vi.mock("@/lib/hooks/use-food-journal", () => ({
  useFoodJournal: mockUseFoodJournal,
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/our-table",
}))

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const clean = { ...props }
      for (const k of ["initial", "animate", "exit", "transition", "whileTap", "whileHover", "layoutId", "custom", "style"]) delete clean[k]
      return <div {...(clean as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const clean = { ...props }
      for (const k of ["initial", "animate", "exit", "transition", "whileTap", "whileHover", "layoutId", "custom"]) delete clean[k]
      return <button {...(clean as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

vi.mock("@/components/shared/EmptyState", () => ({
  EmptyState: ({ title, subtitle, actionLabel, actionHref }: {
    icon: React.ReactNode
    title: string
    subtitle?: string
    actionLabel?: string
    actionHref?: string
  }) => (
    <div data-testid="empty-state">
      <p>{title}</p>
      {subtitle && <p>{subtitle}</p>}
      {actionHref && <a href={actionHref}>{actionLabel}</a>}
    </div>
  ),
}))

vi.mock("@/components/animations/PageTransition", () => ({
  PageTransition: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className}>{children}</div>
  ),
}))

// ── Import after mocks ──────────────────────────────────────
import OurTablePage from "@/app/(main)/our-table/page"

// ── Test data ───────────────────────────────────────────────
// FoodVisit-shaped rows. The page derives the TableView Visit from these.
const makeVisit = (overrides: Record<string, unknown> = {}) => ({
  id: "v1",
  user_id: "u1",
  place_name: "Pizza Palace",
  place_id: "node/12345",
  lat: 30.05,
  lng: 31.24,
  cuisine_type: "italian",
  visit_date: "2026-03-01",
  visit_time: "19:00:00",
  visit_number: 1,
  is_bookmarked: false,
  notes: null,
  created_at: "2026-03-01T19:00:00Z",
  updated_at: "2026-03-01T19:00:00Z",
  ...overrides,
})

// Convenience: build the full hook return with sensible defaults so each test
// only states the bits it cares about.
const hookReturn = (overrides: Record<string, unknown> = {}) => ({
  visits: [],
  isLoading: false,
  error: null,
  getMyRating: vi.fn(() => null),
  getPartnerRating: vi.fn(() => null),
  getPhotos: vi.fn(() => []),
  getPreferenceDot: vi.fn(() => null),
  getVisitById: vi.fn(() => null),
  filterByCuisine: vi.fn(() => []),
  addVisit: vi.fn(),
  updateVisit: vi.fn(),
  toggleBookmark: vi.fn(),
  addRating: vi.fn(),
  addPhotos: vi.fn(),
  removePhoto: vi.fn(),
  stats: { totalVisits: 0, uniquePlaces: 0, avgOverall: 0, topCuisine: null, returnSpots: 0, bookmarkedCount: 0 },
  ...overrides,
})

describe("OurTablePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit: derived values render ─────────────────────────────

  it("shows loading skeleton while loading", () => {
    mockUseFoodJournal.mockReturnValue(hookReturn({ isLoading: true }))

    const { container } = render(<OurTablePage />)
    // Redesign: LoadingSkeleton renders pulsing placeholders (animate-pulse),
    // not the visit list. (The old `.animate-skeleton-warm` class no longer exists.)
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0)
    expect(screen.queryByText("Our Table")).not.toBeInTheDocument()
  })

  it("shows empty state with CTA to /our-table/new when no visits", () => {
    mockUseFoodJournal.mockReturnValue(hookReturn({ visits: [] }))

    render(<OurTablePage />)

    expect(screen.getByTestId("empty-state")).toBeInTheDocument()
    expect(screen.getByText("No visits yet")).toBeInTheDocument()
    expect(screen.getByText("Add First Visit")).toHaveAttribute("href", "/our-table/new")
  })

  it("renders the Our Table header when visits exist", () => {
    mockUseFoodJournal.mockReturnValue(hookReturn({ visits: [makeVisit()] }))

    render(<OurTablePage />)

    expect(screen.getByRole("heading", { name: "Our Table" })).toBeInTheDocument()
    // Arabic kicker
    expect(screen.getByText("طاولتنا")).toBeInTheDocument()
  })

  it("renders a visit card with place, cuisine label, visit ordinal and score (list is the default view)", () => {
    mockUseFoodJournal.mockReturnValue(
      hookReturn({
        visits: [makeVisit({ id: "v1", place_name: "Pizza Palace", cuisine_type: "italian" })],
        // page uses Math.round(getMyRating(id)?.overall_average ?? 0) as the headline score
        getMyRating: vi.fn(() => ({ overall_average: 8.4 })),
      })
    )

    render(<OurTablePage />)

    expect(screen.getByText("Pizza Palace")).toBeInTheDocument()
    // cuisine_type "italian" → CUISINE_LABELS → "Italian"; visitNo 1 → "1st visit"
    expect(screen.getByText(/Italian · 1st visit ·/)).toBeInTheDocument()
    // Math.round(8.4) === 8 → rendered headline score
    expect(screen.getByText("8")).toBeInTheDocument()
  })

  it("renders the stats line: places · cuisines · avg score", () => {
    mockUseFoodJournal.mockReturnValue(
      hookReturn({
        visits: [
          makeVisit({ id: "v1", cuisine_type: "italian" }),
          makeVisit({ id: "v2", cuisine_type: "egyptian", place_name: "Koshary King" }),
        ],
        getMyRating: vi.fn(() => ({ overall_average: 8 })),
      })
    )

    render(<OurTablePage />)

    // The stats line is rendered as one span with bold <b> tokens:
    //   "<b>2</b> places · <b>2</b> cuisines · <b>8.0</b> avg"
    // 2 places, 2 distinct cuisines, avg score (8 + 8) / 2 = 8.0
    const statsLine = screen.getByText(/places ·/).closest("span") as HTMLElement
    expect(statsLine).toBeTruthy()
    const stats = statsLine.textContent ?? ""
    expect(stats).toContain("2 places")
    expect(stats).toContain("2 cuisines")
    expect(stats).toContain("8.0 avg")
  })

  it("renders one cuisine filter pill per distinct cuisine plus an 'All' pill", () => {
    mockUseFoodJournal.mockReturnValue(
      hookReturn({
        visits: [
          makeVisit({ id: "v1", cuisine_type: "italian", place_name: "Pizza Palace" }),
          makeVisit({ id: "v2", cuisine_type: "egyptian", place_name: "Koshary King" }),
        ],
      })
    )

    render(<OurTablePage />)

    // Cuisine labels in the data are already humanized by the page ("Italian", "Egyptian")
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Italian" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Egyptian" })).toBeInTheDocument()
  })

  // ── Interaction: clicks do the right thing ──────────────────

  it("filters the list down to the selected cuisine", () => {
    mockUseFoodJournal.mockReturnValue(
      hookReturn({
        visits: [
          makeVisit({ id: "v1", cuisine_type: "italian", place_name: "Pizza Palace" }),
          makeVisit({ id: "v2", cuisine_type: "egyptian", place_name: "Koshary King" }),
        ],
      })
    )

    render(<OurTablePage />)

    // Both visible under default "All"
    expect(screen.getByText("Pizza Palace")).toBeInTheDocument()
    expect(screen.getByText("Koshary King")).toBeInTheDocument()

    // Filter to Italian — only Pizza Palace remains
    fireEvent.click(screen.getByRole("button", { name: "Italian" }))
    expect(screen.getByText("Pizza Palace")).toBeInTheDocument()
    expect(screen.queryByText("Koshary King")).not.toBeInTheDocument()

    // Back to All — both return
    fireEvent.click(screen.getByRole("button", { name: "All" }))
    expect(screen.getByText("Koshary King")).toBeInTheDocument()
  })

  it("switches to the map view and back", () => {
    mockUseFoodJournal.mockReturnValue(hookReturn({ visits: [makeVisit({ place_name: "Pizza Palace" })] }))

    const { container } = render(<OurTablePage />)

    // Default list view shows the card
    expect(screen.getByText("Pizza Palace")).toBeInTheDocument()

    // Toggle group holds the [list, map] icon buttons (no testids in the redesign)
    const toggleGroup = container.querySelector(".pill-tab-group") as HTMLElement
    expect(toggleGroup).toBeTruthy()
    const [listBtn, mapBtn] = within(toggleGroup).getAllByRole("button")

    // Map view replaces the list with the map placeholder
    fireEvent.click(mapBtn)
    expect(screen.getByText("your map of places, pinned")).toBeInTheDocument()
    expect(screen.queryByText("Pizza Palace")).not.toBeInTheDocument()

    // Back to list
    fireEvent.click(listBtn)
    expect(screen.getByText("Pizza Palace")).toBeInTheDocument()
    expect(screen.queryByText("your map of places, pinned")).not.toBeInTheDocument()
  })

  // ── Integration: callbacks / router receive the right calls ─

  it("routes to /our-table/new when the add (FAB) button is tapped", () => {
    mockUseFoodJournal.mockReturnValue(hookReturn({ visits: [makeVisit()] }))

    render(<OurTablePage />)

    const fab = screen.getByRole("button", { name: "Log a visit" })
    fireEvent.click(fab)

    expect(mockPush).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith("/our-table/new")
  })

  it("reads visit data from the useFoodJournal hook", () => {
    mockUseFoodJournal.mockReturnValue(hookReturn({ visits: [makeVisit()] }))

    render(<OurTablePage />)

    expect(mockUseFoodJournal).toHaveBeenCalled()
  })
})

// ── Component-level tests for the standalone food-journal pieces ──
// These render the components directly and still match the current markup,
// so they are left intact per the redesign brief.

describe("VisitListItem", () => {
  it("renders place name, cuisine pill, date, and score", async () => {
    const { VisitListItem } = await import("@/components/food/VisitListItem")

    render(
      <VisitListItem
        id="v1"
        placeName="Test Restaurant"
        cuisineType="japanese"
        visitDate="2026-03-01"
        overallScore={8.2}
        visitNumber={1}
      />
    )

    expect(screen.getByText("Test Restaurant")).toBeInTheDocument()
    expect(screen.getByTestId("cuisine-pill-v1")).toHaveTextContent("Japanese")
    expect(screen.getByTestId("score-badge-v1")).toHaveTextContent("8.2")
    expect(screen.getByText("Mar 1")).toBeInTheDocument()
  })

  it("shows visit count badge for return visits", async () => {
    const { VisitListItem } = await import("@/components/food/VisitListItem")

    render(
      <VisitListItem
        id="v1"
        placeName="Returned Spot"
        cuisineType="burger"
        visitDate="2026-03-01"
        overallScore={7.0}
        visitNumber={3}
      />
    )

    // Visit badge shows "3"
    expect(screen.getByTestId("visit-count-badge-v1")).toHaveTextContent("3")
  })

  it("hides score badge when overallScore is null", async () => {
    const { VisitListItem } = await import("@/components/food/VisitListItem")

    render(
      <VisitListItem
        id="v1"
        placeName="Unrated"
        cuisineType="cafe"
        visitDate="2026-03-01"
        overallScore={null}
        visitNumber={1}
      />
    )

    expect(screen.queryByTestId("score-badge-v1")).not.toBeInTheDocument()
  })

  it("links to the visit detail page", async () => {
    const { VisitListItem } = await import("@/components/food/VisitListItem")

    render(
      <VisitListItem
        id="visit-abc"
        placeName="Linked Spot"
        cuisineType="seafood"
        visitDate="2026-03-01"
        overallScore={6.5}
        visitNumber={1}
      />
    )

    const link = screen.getByTestId("visit-item-visit-abc").closest("a")
    expect(link).toHaveAttribute("href", "/our-table/visit-abc")
  })
})

describe("MapPinCard", () => {
  it("renders card with visit info and dismisses on close", async () => {
    const { MapPinCard } = await import("@/components/food/MapPinCard")
    const onDismiss = vi.fn()

    render(
      <MapPinCard
        visitId="v1"
        placeName="Map Test Place"
        cuisineType="seafood"
        overallScore={9.0}
        visitDate="2026-03-01"
        visitNumber={2}
        onDismiss={onDismiss}
        isOpen={true}
      />
    )

    expect(screen.getByTestId("pin-card-v1")).toBeInTheDocument()
    expect(screen.getByText("Map Test Place")).toBeInTheDocument()
    expect(screen.getByText("9.0")).toBeInTheDocument()
    expect(screen.getByTestId("pin-card-link")).toHaveAttribute("href", "/our-table/v1")

    fireEvent.click(screen.getByTestId("pin-card-close"))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it("dismisses on backdrop click", async () => {
    const { MapPinCard } = await import("@/components/food/MapPinCard")
    const onDismiss = vi.fn()

    render(
      <MapPinCard
        visitId="v1"
        placeName="Test"
        cuisineType="cafe"
        overallScore={null}
        visitDate="2026-03-01"
        visitNumber={1}
        onDismiss={onDismiss}
        isOpen={true}
      />
    )

    fireEvent.click(screen.getByTestId("pin-card-backdrop"))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it("does not render when isOpen is false", async () => {
    const { MapPinCard } = await import("@/components/food/MapPinCard")

    render(
      <MapPinCard
        visitId="v1"
        placeName="Hidden"
        cuisineType="cafe"
        overallScore={null}
        visitDate="2026-03-01"
        visitNumber={1}
        onDismiss={vi.fn()}
        isOpen={false}
      />
    )

    expect(screen.queryByTestId("pin-card-v1")).not.toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

// ── Hoist mocks ──────────────────────────────────────────────
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

vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>) => {
    // Return the MapSkeleton for dynamic import (can't actually load Leaflet in tests)
    const DynamicComponent = (props: Record<string, unknown>) => (
      <div data-testid="food-map" {...props}>Map Component</div>
    )
    DynamicComponent.displayName = "DynamicFoodMap"
    return DynamicComponent
  },
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
      for (const k of ["initial", "animate", "exit", "transition", "whileTap", "whileHover"]) delete clean[k]
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

describe("OurTablePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit Tests ──────────────────────────────────────────────

  it("shows loading skeleton while loading", () => {
    mockUseFoodJournal.mockReturnValue({
      visits: [],
      isLoading: true,
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
    })

    const { container } = render(<OurTablePage />)
    const skeletons = container.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("shows empty state when no visits", () => {
    mockUseFoodJournal.mockReturnValue({
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
    })

    render(<OurTablePage />)

    expect(screen.getByTestId("empty-state")).toBeInTheDocument()
    expect(screen.getByText("No visits yet")).toBeInTheDocument()
    expect(screen.getByText("Add First Visit")).toHaveAttribute("href", "/our-table/new")
  })

  it("renders map/list toggle buttons", () => {
    mockUseFoodJournal.mockReturnValue({
      visits: [makeVisit()],
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
      stats: { totalVisits: 1, uniquePlaces: 1, avgOverall: 0, topCuisine: null, returnSpots: 0, bookmarkedCount: 0 },
    })

    render(<OurTablePage />)

    expect(screen.getByTestId("toggle-map")).toBeInTheDocument()
    expect(screen.getByTestId("toggle-list")).toBeInTheDocument()
  })

  it("shows FAB linking to /our-table/new", () => {
    mockUseFoodJournal.mockReturnValue({
      visits: [makeVisit()],
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
      stats: { totalVisits: 1, uniquePlaces: 1, avgOverall: 0, topCuisine: null, returnSpots: 0, bookmarkedCount: 0 },
    })

    render(<OurTablePage />)

    const fab = screen.getByTestId("add-visit-fab")
    expect(fab).toHaveAttribute("href", "/our-table/new")
  })

  it("renders filter pills (8+, Returned, cuisine types)", () => {
    mockUseFoodJournal.mockReturnValue({
      visits: [makeVisit()],
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
      stats: { totalVisits: 1, uniquePlaces: 1, avgOverall: 0, topCuisine: null, returnSpots: 0, bookmarkedCount: 0 },
    })

    render(<OurTablePage />)

    expect(screen.getByTestId("filter-high-score")).toBeInTheDocument()
    expect(screen.getByTestId("filter-return")).toBeInTheDocument()
    expect(screen.getByTestId("filter-cuisine-italian")).toBeInTheDocument()
    expect(screen.getByTestId("filter-cuisine-egyptian")).toBeInTheDocument()
  })

  it("displays visit count", () => {
    mockUseFoodJournal.mockReturnValue({
      visits: [makeVisit(), makeVisit({ id: "v2", place_name: "Burger Joint" })],
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
      stats: { totalVisits: 2, uniquePlaces: 2, avgOverall: 0, topCuisine: null, returnSpots: 0, bookmarkedCount: 0 },
    })

    render(<OurTablePage />)

    expect(screen.getByTestId("visit-count")).toHaveTextContent("2 visits")
  })

  // ── Interaction Tests ─────────────────────────────────────

  it("switches to list view when list toggle clicked", () => {
    mockUseFoodJournal.mockReturnValue({
      visits: [makeVisit()],
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
      stats: { totalVisits: 1, uniquePlaces: 1, avgOverall: 0, topCuisine: null, returnSpots: 0, bookmarkedCount: 0 },
    })

    render(<OurTablePage />)

    fireEvent.click(screen.getByTestId("toggle-list"))

    // Should show the visit list item
    expect(screen.getByTestId("visit-item-v1")).toBeInTheDocument()
  })

  it("shows visit list items with correct data in list view", () => {
    mockUseFoodJournal.mockReturnValue({
      visits: [makeVisit()],
      isLoading: false,
      error: null,
      getMyRating: vi.fn(() => ({ overall_average: 7.5 })),
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
      stats: { totalVisits: 1, uniquePlaces: 1, avgOverall: 7.5, topCuisine: "italian", returnSpots: 0, bookmarkedCount: 0 },
    })

    render(<OurTablePage />)
    fireEvent.click(screen.getByTestId("toggle-list"))

    expect(screen.getByText("Pizza Palace")).toBeInTheDocument()
    expect(screen.getByTestId("cuisine-pill-v1")).toHaveTextContent("Italian")
    expect(screen.getByTestId("score-badge-v1")).toHaveTextContent("7.5")
  })

  it("cuisine filter toggles and filters visits", () => {
    mockUseFoodJournal.mockReturnValue({
      visits: [
        makeVisit({ id: "v1", cuisine_type: "italian", place_name: "Pizza Palace" }),
        makeVisit({ id: "v2", cuisine_type: "egyptian", place_name: "Koshary King" }),
      ],
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
      stats: { totalVisits: 2, uniquePlaces: 2, avgOverall: 0, topCuisine: null, returnSpots: 0, bookmarkedCount: 0 },
    })

    render(<OurTablePage />)
    fireEvent.click(screen.getByTestId("toggle-list"))

    // Both visits visible initially
    expect(screen.getByTestId("visit-item-v1")).toBeInTheDocument()
    expect(screen.getByTestId("visit-item-v2")).toBeInTheDocument()

    // Filter by Italian
    fireEvent.click(screen.getByTestId("filter-cuisine-italian"))

    expect(screen.getByTestId("visit-item-v1")).toBeInTheDocument()
    expect(screen.queryByTestId("visit-item-v2")).not.toBeInTheDocument()

    // Un-filter
    fireEvent.click(screen.getByTestId("filter-cuisine-italian"))
    expect(screen.getByTestId("visit-item-v2")).toBeInTheDocument()
  })

  it("high score filter shows only 8+ visits", () => {
    const getMyRating = vi.fn((visitId: string) =>
      visitId === "v1"
        ? { overall_average: 8.5 }
        : { overall_average: 6.0 }
    )

    mockUseFoodJournal.mockReturnValue({
      visits: [
        makeVisit({ id: "v1", place_name: "Great Place" }),
        makeVisit({ id: "v2", place_name: "OK Place" }),
      ],
      isLoading: false,
      error: null,
      getMyRating,
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
      stats: { totalVisits: 2, uniquePlaces: 2, avgOverall: 7.25, topCuisine: null, returnSpots: 0, bookmarkedCount: 0 },
    })

    render(<OurTablePage />)
    fireEvent.click(screen.getByTestId("toggle-list"))
    fireEvent.click(screen.getByTestId("filter-high-score"))

    expect(screen.getByTestId("visit-item-v1")).toBeInTheDocument()
    expect(screen.queryByTestId("visit-item-v2")).not.toBeInTheDocument()
  })

  it("return filter shows only return visits", () => {
    mockUseFoodJournal.mockReturnValue({
      visits: [
        makeVisit({ id: "v1", place_name: "Pizza Palace", place_id: "node/111", visit_date: "2026-02-01" }),
        makeVisit({ id: "v2", place_name: "Pizza Palace", place_id: "node/111", visit_date: "2026-03-01" }),
        makeVisit({ id: "v3", place_name: "Unique Spot", place_id: "node/999", visit_date: "2026-03-02" }),
      ],
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
      stats: { totalVisits: 3, uniquePlaces: 2, avgOverall: 0, topCuisine: null, returnSpots: 1, bookmarkedCount: 0 },
    })

    render(<OurTablePage />)
    fireEvent.click(screen.getByTestId("toggle-list"))
    fireEvent.click(screen.getByTestId("filter-return"))

    // v2 is the second visit to Pizza Palace (visit_number > 1)
    expect(screen.getByTestId("visit-item-v2")).toBeInTheDocument()
    // v1 is the first visit — won't show (visitNumber=1)
    expect(screen.queryByTestId("visit-item-v1")).not.toBeInTheDocument()
    // v3 is unique, should be hidden
    expect(screen.queryByTestId("visit-item-v3")).not.toBeInTheDocument()
  })

  it("shows 'No visits match your filters' when filters exclude all", () => {
    mockUseFoodJournal.mockReturnValue({
      visits: [makeVisit({ cuisine_type: "italian" })],
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
      stats: { totalVisits: 1, uniquePlaces: 1, avgOverall: 0, topCuisine: null, returnSpots: 0, bookmarkedCount: 0 },
    })

    render(<OurTablePage />)
    fireEvent.click(screen.getByTestId("toggle-list"))

    // Filter by egyptian — no italian visit matches
    fireEvent.click(screen.getByTestId("filter-cuisine-egyptian"))

    expect(screen.getByText("No visits match your filters")).toBeInTheDocument()
  })

  // ── Integration Tests ─────────────────────────────────────

  it("calls useFoodJournal hook", () => {
    render(<OurTablePage />)
    expect(mockUseFoodJournal).toHaveBeenCalled()
  })

  it("shows map component in default map view", () => {
    mockUseFoodJournal.mockReturnValue({
      visits: [makeVisit()],
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
      stats: { totalVisits: 1, uniquePlaces: 1, avgOverall: 0, topCuisine: null, returnSpots: 0, bookmarkedCount: 0 },
    })

    render(<OurTablePage />)

    expect(screen.getByTestId("food-map")).toBeInTheDocument()
  })

  it("visit count updates with filters applied", () => {
    mockUseFoodJournal.mockReturnValue({
      visits: [
        makeVisit({ id: "v1", cuisine_type: "italian" }),
        makeVisit({ id: "v2", cuisine_type: "egyptian" }),
        makeVisit({ id: "v3", cuisine_type: "italian" }),
      ],
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
      stats: { totalVisits: 3, uniquePlaces: 3, avgOverall: 0, topCuisine: null, returnSpots: 0, bookmarkedCount: 0 },
    })

    render(<OurTablePage />)

    expect(screen.getByTestId("visit-count")).toHaveTextContent("3 visits")

    fireEvent.click(screen.getByTestId("filter-cuisine-italian"))

    expect(screen.getByTestId("visit-count")).toHaveTextContent("2 visits")
  })

  it("list items link to correct visit detail page", () => {
    mockUseFoodJournal.mockReturnValue({
      visits: [makeVisit({ id: "visit-abc" })],
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
      stats: { totalVisits: 1, uniquePlaces: 1, avgOverall: 0, topCuisine: null, returnSpots: 0, bookmarkedCount: 0 },
    })

    render(<OurTablePage />)
    fireEvent.click(screen.getByTestId("toggle-list"))

    const visitLink = screen.getByTestId("visit-item-visit-abc").closest("a")
    expect(visitLink).toHaveAttribute("href", "/our-table/visit-abc")
  })

  it("singular 'visit' text for 1 visit", () => {
    mockUseFoodJournal.mockReturnValue({
      visits: [makeVisit()],
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
      stats: { totalVisits: 1, uniquePlaces: 1, avgOverall: 0, topCuisine: null, returnSpots: 0, bookmarkedCount: 0 },
    })

    render(<OurTablePage />)

    expect(screen.getByTestId("visit-count")).toHaveTextContent("1 visit")
    expect(screen.getByTestId("visit-count").textContent).not.toContain("visits")
  })
})

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

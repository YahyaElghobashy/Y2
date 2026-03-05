import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import type { FoodRating, FoodPhoto, FoodVisit } from "@/lib/types/food-journal.types"

// ── Hoist mocks ──────────────────────────────────────────────
const mockPush = vi.hoisted(() => vi.fn())
const mockVisitId = vi.hoisted(() => ({ visitId: "v1" }))

const mockUseFoodJournal = vi.hoisted(() =>
  vi.fn(() => ({
    visits: [] as FoodVisit[],
    isLoading: false,
    error: null,
    getVisitById: vi.fn(() => null),
    getMyRating: vi.fn(() => null),
    getPartnerRating: vi.fn(() => null),
    getPhotos: vi.fn(() => []),
    getPreferenceDot: vi.fn(() => null),
    updateVisit: vi.fn(),
    addVisit: vi.fn(),
    toggleBookmark: vi.fn(),
    addRating: vi.fn(),
    addPhotos: vi.fn(),
    removePhoto: vi.fn(),
    filterByCuisine: vi.fn(() => []),
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

vi.mock("next/navigation", () => ({
  useParams: () => mockVisitId,
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/our-table/v1",
}))

vi.mock("@/lib/hooks/use-food-journal", () => ({
  useFoodJournal: mockUseFoodJournal,
}))

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock("next/dynamic", () => ({
  default: () => {
    const Stub = () => <div data-testid="mini-map-stub">MiniMap</div>
    Stub.displayName = "MiniMapStub"
    return Stub
  },
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const clean = { ...props }
      for (const k of ["initial", "animate", "exit", "transition", "whileTap", "whileHover", "custom", "layoutId"]) delete clean[k]
      return <div {...(clean as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const clean = { ...props }
      for (const k of ["initial", "animate", "exit", "transition", "whileTap", "whileHover", "custom"]) delete clean[k]
      return <button {...(clean as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

vi.mock("@/components/shared/PageHeader", () => ({
  PageHeader: ({ title, backHref }: { title: string; backHref: string }) => (
    <div data-testid="page-header" data-back={backHref}>{title}</div>
  ),
}))

vi.mock("@/components/animations/PageTransition", () => ({
  PageTransition: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className}>{children}</div>
  ),
}))

vi.mock("@/components/shared/EmptyState", () => ({
  EmptyState: ({ title, actionHref }: { icon: React.ReactNode; title: string; subtitle?: string; actionLabel?: string; actionHref?: string }) => (
    <div data-testid="empty-state">
      <p>{title}</p>
      {actionHref && <a href={actionHref}>Go back</a>}
    </div>
  ),
}))

vi.mock("@/components/food/PreferenceDot", () => ({
  PreferenceDot: ({ color }: { color: string }) => (
    <span data-testid="preference-dot" data-color={color} />
  ),
}))

vi.mock("@/components/food/RatingReveal", () => ({
  RatingReveal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="rating-reveal">
      <button data-testid="close-reveal" onClick={onClose}>Close</button>
    </div>
  ),
}))

// ── Import after mocks ──────────────────────────────────────
import VisitDetailPage from "@/app/(main)/our-table/[visitId]/page"

// ── Test data helpers ───────────────────────────────────────
const makeVisit = (overrides: Partial<FoodVisit> = {}): FoodVisit =>
  ({
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
    notes: "Great pizza",
    created_at: "2026-03-01T19:00:00Z",
    updated_at: "2026-03-01T19:00:00Z",
    ...overrides,
  }) as FoodVisit

const makeRating = (overrides: Partial<FoodRating> = {}): FoodRating =>
  ({
    id: "r1",
    visit_id: "v1",
    user_id: "u1",
    location_score: 7,
    parking_score: 6,
    service_score: 8,
    food_quality: 9,
    quantity_score: 7,
    price_score: 6,
    cuisine_score: 8,
    bathroom_score: 5,
    vibe_score: 8,
    overall_average: 7.1,
    both_reviewed: true,
    created_at: "2026-03-01T19:00:00Z",
    ...overrides,
  }) as FoodRating

const makePhoto = (overrides: Partial<FoodPhoto> = {}): FoodPhoto =>
  ({
    id: "p1",
    visit_id: "v1",
    user_id: "u1",
    photo_type: "food_plate",
    storage_path: "/photos/food1.jpg",
    media_file_id: null,
    display_order: 0,
    created_at: "2026-03-01T19:00:00Z",
    ...overrides,
  }) as FoodPhoto

function setupMock(overrides: {
  visit?: FoodVisit | null
  visits?: FoodVisit[]
  myRating?: FoodRating | null
  partnerRating?: FoodRating | null
  photos?: FoodPhoto[]
  isLoading?: boolean
  preferenceDot?: string | null
  updateVisit?: ReturnType<typeof vi.fn>
} = {}) {
  const {
    visit = makeVisit(),
    visits = visit ? [visit] : [],
    myRating = null,
    partnerRating = null,
    photos = [],
    isLoading = false,
    preferenceDot = null,
    updateVisit = vi.fn(),
  } = overrides

  mockUseFoodJournal.mockReturnValue({
    visits,
    isLoading,
    error: null,
    getVisitById: vi.fn(() => (visit ? { ...visit, myRating, partnerRating, photos } : null)),
    getMyRating: vi.fn(() => myRating),
    getPartnerRating: vi.fn(() => partnerRating),
    getPhotos: vi.fn(() => photos),
    getPreferenceDot: vi.fn(() => preferenceDot),
    updateVisit,
    addVisit: vi.fn(),
    toggleBookmark: vi.fn(),
    addRating: vi.fn(),
    addPhotos: vi.fn(),
    removePhoto: vi.fn(),
    filterByCuisine: vi.fn(() => []),
    stats: {
      totalVisits: visits.length,
      uniquePlaces: new Set(visits.map((v) => v.place_name)).size,
      avgOverall: 0,
      topCuisine: null,
      returnSpots: 0,
      bookmarkedCount: 0,
    },
  })
}

describe("VisitDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit Tests ──────────────────────────────────────────────

  it("shows loading skeleton while loading", () => {
    setupMock({ isLoading: true })
    render(<VisitDetailPage />)
    expect(screen.getByTestId("visit-detail-skeleton")).toBeInTheDocument()
  })

  it("shows 404 empty state when visit not found", () => {
    setupMock({ visit: null, visits: [] })
    render(<VisitDetailPage />)
    expect(screen.getByTestId("empty-state")).toBeInTheDocument()
    expect(screen.getByText("Visit not found")).toBeInTheDocument()
  })

  it("renders page header with restaurant name", () => {
    setupMock()
    render(<VisitDetailPage />)
    expect(screen.getByTestId("page-header")).toHaveTextContent("Pizza Palace")
    expect(screen.getByTestId("page-header")).toHaveAttribute("data-back", "/our-table")
  })

  it("renders cuisine label and date", () => {
    setupMock()
    render(<VisitDetailPage />)
    expect(screen.getByTestId("cuisine-label")).toHaveTextContent("Italian")
  })

  it("shows share button", () => {
    setupMock()
    render(<VisitDetailPage />)
    expect(screen.getByTestId("share-btn")).toBeInTheDocument()
  })

  it("shows rate CTA when no rating exists", () => {
    setupMock({ myRating: null })
    render(<VisitDetailPage />)
    expect(screen.getByTestId("rate-cta")).toBeInTheDocument()
    expect(screen.getByTestId("rate-cta")).toHaveTextContent("Rate this visit!")
  })

  it("hides rate CTA when rating exists", () => {
    setupMock({ myRating: makeRating() })
    render(<VisitDetailPage />)
    expect(screen.queryByTestId("rate-cta")).not.toBeInTheDocument()
  })

  it("renders rating bars when rating exists", () => {
    setupMock({ myRating: makeRating() })
    render(<VisitDetailPage />)
    expect(screen.getByTestId("rating-section")).toBeInTheDocument()
    expect(screen.getByTestId("rating-bar-location_score")).toBeInTheDocument()
    expect(screen.getByTestId("rating-bar-food_quality")).toBeInTheDocument()
  })

  it("renders overall score badge", () => {
    setupMock({ myRating: makeRating({ overall_average: 7.1 }) })
    render(<VisitDetailPage />)
    expect(screen.getByTestId("overall-badge")).toHaveTextContent("7.1")
  })

  it("renders notes section with initial value", () => {
    setupMock()
    render(<VisitDetailPage />)
    expect(screen.getByTestId("notes-section")).toBeInTheDocument()
    expect(screen.getByTestId("notes-input")).toHaveValue("Great pizza")
  })

  it("renders mini-map when coordinates exist", () => {
    setupMock()
    render(<VisitDetailPage />)
    expect(screen.getByTestId("mini-map")).toBeInTheDocument()
  })

  // ── Photo Gallery Tests ─────────────────────────────────────

  it("renders photo gallery with photos", () => {
    setupMock({
      photos: [
        makePhoto({ id: "p1", photo_type: "food_plate" }),
        makePhoto({ id: "p2", photo_type: "partner_eating", storage_path: "/photos/partner.jpg" }),
      ],
    })
    render(<VisitDetailPage />)
    expect(screen.getByTestId("photo-gallery")).toBeInTheDocument()
  })

  it("navigates photos with next/prev buttons", () => {
    setupMock({
      photos: [
        makePhoto({ id: "p1", photo_type: "food_plate", storage_path: "/photos/food.jpg" }),
        makePhoto({ id: "p2", photo_type: "ambiance", storage_path: "/photos/ambiance.jpg" }),
      ],
    })
    render(<VisitDetailPage />)

    // Initially on first photo — no prev button
    expect(screen.queryByTestId("photo-prev")).not.toBeInTheDocument()
    expect(screen.getByTestId("photo-next")).toBeInTheDocument()

    // Click next
    fireEvent.click(screen.getByTestId("photo-next"))

    // Now on second photo — no next button
    expect(screen.getByTestId("photo-prev")).toBeInTheDocument()
    expect(screen.queryByTestId("photo-next")).not.toBeInTheDocument()
  })

  it("hides photo gallery when no photos", () => {
    setupMock({ photos: [] })
    render(<VisitDetailPage />)
    expect(screen.queryByTestId("photo-gallery")).not.toBeInTheDocument()
  })

  // ── Interaction Tests ─────────────────────────────────────

  it("rate CTA navigates to rating flow", () => {
    setupMock({ myRating: null })
    render(<VisitDetailPage />)

    fireEvent.click(screen.getByTestId("rate-cta"))
    expect(mockPush).toHaveBeenCalledWith("/our-table/new?step=3&visitId=v1")
  })

  it("notes auto-save on blur", () => {
    const updateVisit = vi.fn()
    setupMock({ updateVisit })
    render(<VisitDetailPage />)

    const input = screen.getByTestId("notes-input")
    fireEvent.change(input, { target: { value: "Updated notes" } })
    fireEvent.blur(input)

    expect(updateVisit).toHaveBeenCalledWith("v1", { notes: "Updated notes" })
  })

  it("notes does NOT save when unchanged", () => {
    const updateVisit = vi.fn()
    setupMock({ updateVisit })
    render(<VisitDetailPage />)

    // Blur without changing — should not call updateVisit
    fireEvent.blur(screen.getByTestId("notes-input"))
    expect(updateVisit).not.toHaveBeenCalled()
  })

  it("replay reveal button opens RatingReveal overlay", () => {
    setupMock({
      myRating: makeRating({ both_reviewed: true }),
      partnerRating: makeRating({ id: "r2", user_id: "u2" }),
    })
    render(<VisitDetailPage />)

    expect(screen.queryByTestId("rating-reveal")).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId("replay-reveal-btn"))
    expect(screen.getByTestId("rating-reveal")).toBeInTheDocument()
  })

  it("closing RatingReveal hides the overlay", () => {
    setupMock({
      myRating: makeRating({ both_reviewed: true }),
      partnerRating: makeRating({ id: "r2", user_id: "u2" }),
    })
    render(<VisitDetailPage />)

    fireEvent.click(screen.getByTestId("replay-reveal-btn"))
    expect(screen.getByTestId("rating-reveal")).toBeInTheDocument()

    fireEvent.click(screen.getByTestId("close-reveal"))
    expect(screen.queryByTestId("rating-reveal")).not.toBeInTheDocument()
  })

  it("share button generates canvas and triggers share/download", async () => {
    const mockToBlob = vi.fn((callback: (blob: Blob | null) => void) => {
      callback(new Blob(["test"], { type: "image/png" }))
    })
    const mockGetContext = vi.fn(() => ({
      fillStyle: "",
      font: "",
      textAlign: "",
      fillRect: vi.fn(),
      fillText: vi.fn(),
    }))
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") {
        return { width: 0, height: 0, getContext: mockGetContext, toBlob: mockToBlob } as unknown as HTMLCanvasElement
      }
      if (tag === "a") {
        return { href: "", download: "", click: vi.fn() } as unknown as HTMLAnchorElement
      }
      return originalCreateElement(tag)
    })

    setupMock({ myRating: makeRating() })
    render(<VisitDetailPage />)

    fireEvent.click(screen.getByTestId("share-btn"))

    expect(mockGetContext).toHaveBeenCalledWith("2d")
    expect(mockToBlob).toHaveBeenCalled()

    vi.restoreAllMocks()
  })

  // ── Integration Tests ─────────────────────────────────────

  it("calls useFoodJournal and getVisitById with correct ID", () => {
    setupMock()
    render(<VisitDetailPage />)

    const hookReturn = mockUseFoodJournal.mock.results[0]?.value
    expect(hookReturn.getVisitById).toHaveBeenCalledWith("v1")
  })

  it("renders return history for repeat visits", () => {
    const visits = [
      makeVisit({ id: "v1", place_id: "node/111", visit_date: "2026-02-01" }),
      makeVisit({ id: "v2", place_id: "node/111", visit_date: "2026-03-01" }),
    ]

    mockUseFoodJournal.mockReturnValue({
      visits,
      isLoading: false,
      error: null,
      getVisitById: vi.fn(() => ({
        ...visits[0],
        myRating: makeRating(),
        partnerRating: null,
        photos: [],
      })),
      getMyRating: vi.fn((id: string) =>
        id === "v1" ? makeRating({ overall_average: 7.0 }) : makeRating({ overall_average: 8.0 })
      ),
      getPartnerRating: vi.fn(() => null),
      getPhotos: vi.fn(() => []),
      getPreferenceDot: vi.fn(() => null),
      updateVisit: vi.fn(),
      addVisit: vi.fn(),
      toggleBookmark: vi.fn(),
      addRating: vi.fn(),
      addPhotos: vi.fn(),
      removePhoto: vi.fn(),
      filterByCuisine: vi.fn(() => []),
      stats: { totalVisits: 2, uniquePlaces: 1, avgOverall: 7.5, topCuisine: null, returnSpots: 1, bookmarkedCount: 0 },
    })

    render(<VisitDetailPage />)

    expect(screen.getByTestId("return-history")).toBeInTheDocument()
    expect(screen.getByTestId("history-item-v1")).toBeInTheDocument()
    expect(screen.getByTestId("history-item-v2")).toBeInTheDocument()
  })

  it("shows preference dots when both reviewed", () => {
    setupMock({
      myRating: makeRating({ both_reviewed: true }),
      partnerRating: makeRating({ id: "r2", user_id: "u2" }),
      preferenceDot: "me",
    })
    render(<VisitDetailPage />)

    const dots = screen.getAllByTestId("preference-dot")
    expect(dots.length).toBeGreaterThan(0)
    expect(dots[0]).toHaveAttribute("data-color", "me")
  })

  it("hides replay reveal button when not both reviewed", () => {
    setupMock({ myRating: makeRating({ both_reviewed: false }) })
    render(<VisitDetailPage />)

    expect(screen.queryByTestId("replay-reveal-btn")).not.toBeInTheDocument()
  })
})

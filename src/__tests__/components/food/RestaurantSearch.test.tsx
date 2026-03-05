import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { RestaurantSearch, type NominatimResult } from "@/components/food/RestaurantSearch"

// ── Mock framer-motion ──────────────────────────────────────
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const clean = { ...props }
      delete clean.initial
      delete clean.animate
      delete clean.exit
      delete clean.transition
      delete clean.whileTap
      return <div {...(clean as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const clean = { ...props }
      delete clean.initial
      delete clean.animate
      delete clean.exit
      delete clean.transition
      delete clean.whileTap
      return <button {...(clean as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// ── Mock fetch ──────────────────────────────────────────────
const mockFetch = vi.fn()
global.fetch = mockFetch

const SAMPLE_RESULTS: NominatimResult[] = [
  {
    place_id: 1001,
    osm_id: 5001,
    osm_type: "node",
    display_name: "Kazoku, Maadi, Cairo, Egypt",
    lat: "30.0444",
    lon: "31.2357",
    name: "Kazoku",
    address: { road: "Street 9", city: "Cairo", country: "Egypt" },
  },
  {
    place_id: 1002,
    osm_id: 5002,
    osm_type: "way",
    display_name: "Tabali, Zamalek, Cairo, Egypt",
    lat: "30.06",
    lon: "31.22",
    name: "Tabali",
    address: { road: "26th July", city: "Cairo", country: "Egypt" },
  },
]

describe("RestaurantSearch", () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => SAMPLE_RESULTS,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Unit Tests ──────────────────────────────────────────────

  it("renders search mode by default with search input", () => {
    render(<RestaurantSearch onSelect={mockOnSelect} />)

    expect(screen.getByTestId("restaurant-search")).toBeInTheDocument()
    expect(screen.getByTestId("search-input")).toBeInTheDocument()
    expect(screen.getByTestId("search-mode-btn")).toBeInTheDocument()
    expect(screen.getByTestId("manual-mode-btn")).toBeInTheDocument()
  })

  it("switches to manual mode when manual button clicked", () => {
    render(<RestaurantSearch onSelect={mockOnSelect} />)

    fireEvent.click(screen.getByTestId("manual-mode-btn"))

    expect(screen.getByTestId("manual-input-section")).toBeInTheDocument()
    expect(screen.getByTestId("manual-name-input")).toBeInTheDocument()
    expect(screen.queryByTestId("search-input")).not.toBeInTheDocument()
  })

  it("switches back to search mode from manual", () => {
    render(<RestaurantSearch onSelect={mockOnSelect} />)

    fireEvent.click(screen.getByTestId("manual-mode-btn"))
    expect(screen.getByTestId("manual-input-section")).toBeInTheDocument()

    fireEvent.click(screen.getByTestId("search-mode-btn"))
    expect(screen.getByTestId("search-input")).toBeInTheDocument()
    expect(screen.queryByTestId("manual-input-section")).not.toBeInTheDocument()
  })

  it("does not search when query is less than 2 characters", async () => {
    render(<RestaurantSearch onSelect={mockOnSelect} />)

    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "a" },
    })

    await act(async () => {
      vi.advanceTimersByTime(600)
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("disables manual confirm button when name is empty", () => {
    render(<RestaurantSearch onSelect={mockOnSelect} />)
    fireEvent.click(screen.getByTestId("manual-mode-btn"))

    const confirmBtn = screen.getByTestId("manual-confirm-btn")
    expect(confirmBtn).toBeDisabled()
  })

  // ── Interaction Tests ─────────────────────────────────────

  it("searches Nominatim after 500ms debounce", async () => {
    render(<RestaurantSearch onSelect={mockOnSelect} />)

    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "Kazoku" },
    })

    // Should not fire immediately
    expect(mockFetch).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  it("displays search results and selects one", async () => {
    render(<RestaurantSearch onSelect={mockOnSelect} />)

    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "Kazoku" },
    })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(screen.getByTestId("search-results")).toBeInTheDocument()
    })

    // Click on first result
    fireEvent.click(screen.getByTestId("result-1001"))

    expect(mockOnSelect).toHaveBeenCalledWith({
      placeName: "Kazoku",
      placeId: "node/5001",
      lat: 30.0444,
      lng: 31.2357,
    })
  })

  it("calls onSelect with manual name and user coords", () => {
    render(
      <RestaurantSearch
        onSelect={mockOnSelect}
        userLat={30.05}
        userLng={31.23}
      />
    )

    fireEvent.click(screen.getByTestId("manual-mode-btn"))

    fireEvent.change(screen.getByTestId("manual-name-input"), {
      target: { value: "New Place" },
    })

    fireEvent.click(screen.getByTestId("manual-confirm-btn"))

    expect(mockOnSelect).toHaveBeenCalledWith({
      placeName: "New Place",
      placeId: null,
      lat: 30.05,
      lng: 31.23,
    })
  })

  it("does not call onSelect for empty manual name", () => {
    render(<RestaurantSearch onSelect={mockOnSelect} />)

    fireEvent.click(screen.getByTestId("manual-mode-btn"))
    fireEvent.click(screen.getByTestId("manual-confirm-btn"))

    expect(mockOnSelect).not.toHaveBeenCalled()
  })

  it("shows no-results message when search returns empty", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<RestaurantSearch onSelect={mockOnSelect} />)

    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "xyznonexistent" },
    })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(screen.getByTestId("no-results")).toBeInTheDocument()
    })
  })

  // ── Integration Tests ─────────────────────────────────────

  it("passes user coordinates as viewbox to Nominatim", async () => {
    render(
      <RestaurantSearch
        onSelect={mockOnSelect}
        userLat={30.05}
        userLng={31.23}
      />
    )

    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "cafe" },
    })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    const calledUrl = (mockFetch as Mock).mock.calls[0][0] as string
    expect(calledUrl).toContain("nominatim.openstreetmap.org/search")
    expect(calledUrl).toContain("viewbox=")
    expect(calledUrl).toContain("addressdetails=1")
    expect(calledUrl).toContain("limit=5")
  })

  it("includes correct User-Agent header in Nominatim request", async () => {
    render(<RestaurantSearch onSelect={mockOnSelect} />)

    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "pizza" },
    })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    const fetchOptions = (mockFetch as Mock).mock.calls[0][1] as RequestInit
    expect(fetchOptions.headers).toEqual(
      expect.objectContaining({ "User-Agent": "Y2-FoodJournal/1.0" })
    )
  })

  it("handles fetch error gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"))

    render(<RestaurantSearch onSelect={mockOnSelect} />)

    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "sushi" },
    })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      // Should show no results without crashing
      expect(screen.getByTestId("no-results")).toBeInTheDocument()
    })
  })

  it("handles non-ok response gracefully", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    render(<RestaurantSearch onSelect={mockOnSelect} />)

    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "burger" },
    })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(screen.getByTestId("no-results")).toBeInTheDocument()
    })
  })

  it("formats placeId as osm_type/osm_id on selection", async () => {
    render(<RestaurantSearch onSelect={mockOnSelect} />)

    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "Tabali" },
    })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(screen.getByTestId("search-results")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId("result-1002"))

    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        placeId: "way/5002",
        placeName: "Tabali",
      })
    )
  })
})

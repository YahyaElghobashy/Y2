import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// ── Mocks ──

// Mock react-leaflet (no real DOM canvas in jsdom)
const mockFitBounds = vi.fn()
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children, ...props }: { children?: React.ReactNode; [k: string]: unknown }) => (
    <div data-testid="leaflet-map" {...(props.className ? { className: props.className as string } : {})}>
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  CircleMarker: ({
    children,
    eventHandlers,
    ...props
  }: {
    children?: React.ReactNode
    eventHandlers?: Record<string, () => void>
    [k: string]: unknown
  }) => (
    <div
      data-testid={`circle-marker-${props["data-pin-id"] ?? ""}`}
      onClick={eventHandlers?.click}
    >
      {children}
    </div>
  ),
  Popup: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: () => ({
    fitBounds: mockFitBounds,
  }),
}))

vi.mock("leaflet/dist/leaflet.css", () => ({}))

// ── Imports ──

import { PortalMap } from "@/components/events/shared/PortalMap"
import type { PortalMapPin } from "@/lib/types/portal.types"

// ── Test Data ──

const mockPins: PortalMapPin[] = [
  {
    id: "pin-1",
    portal_id: "portal-1",
    label: "Grand Venue",
    lat: 30.0444,
    lng: 31.2357,
    category: "venue",
    description: "Main ceremony location",
    url: "https://maps.google.com/venue",
    icon: null,
    position: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "pin-2",
    portal_id: "portal-1",
    label: "Hotel Cairo",
    lat: 30.05,
    lng: 31.24,
    category: "hotel",
    description: "Recommended hotel",
    url: null,
    icon: null,
    position: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "pin-3",
    portal_id: "portal-1",
    label: "Sushi Place",
    lat: 30.06,
    lng: 31.25,
    category: "restaurant",
    description: null,
    url: null,
    icon: null,
    position: 2,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
]

// ── Tests ──

describe("PortalMap", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders map with pins", () => {
    render(<PortalMap pins={mockPins} />)

    expect(screen.getByTestId("portal-map")).toBeInTheDocument()
    expect(screen.getByTestId("leaflet-map")).toBeInTheDocument()
    expect(screen.getByTestId("tile-layer")).toBeInTheDocument()
  })

  it("renders empty state when no pins", () => {
    render(<PortalMap pins={[]} />)

    expect(screen.getByTestId("map-empty")).toBeInTheDocument()
    expect(screen.getByText("No locations added yet")).toBeInTheDocument()
  })

  it("renders pin labels in popup", () => {
    render(<PortalMap pins={mockPins} />)

    expect(screen.getByText("Grand Venue")).toBeInTheDocument()
    expect(screen.getByText("Hotel Cairo")).toBeInTheDocument()
    expect(screen.getByText("Sushi Place")).toBeInTheDocument()
  })

  it("renders pin descriptions", () => {
    render(<PortalMap pins={mockPins} />)

    expect(screen.getByText("Main ceremony location")).toBeInTheDocument()
    expect(screen.getByText("Recommended hotel")).toBeInTheDocument()
  })

  it("renders directions link for pins with URL", () => {
    render(<PortalMap pins={mockPins} />)

    const directionLinks = screen.getAllByText("Directions")
    expect(directionLinks).toHaveLength(1)
    expect(directionLinks[0]).toHaveAttribute("href", "https://maps.google.com/venue")
    expect(directionLinks[0]).toHaveAttribute("target", "_blank")
  })

  it("renders sidebar when showSidebar is true", () => {
    render(<PortalMap pins={mockPins} showSidebar />)

    expect(screen.getByTestId("map-sidebar")).toBeInTheDocument()
    expect(screen.getByTestId("map-sidebar-item-pin-1")).toBeInTheDocument()
    expect(screen.getByTestId("map-sidebar-item-pin-2")).toBeInTheDocument()
  })

  it("does not render sidebar by default", () => {
    render(<PortalMap pins={mockPins} />)

    expect(screen.queryByTestId("map-sidebar")).not.toBeInTheDocument()
  })

  it("fires onPinSelect callback when sidebar item is clicked", async () => {
    const onPinSelect = vi.fn()
    const user = userEvent.setup()

    render(<PortalMap pins={mockPins} showSidebar onPinSelect={onPinSelect} />)

    await user.click(screen.getByTestId("map-sidebar-item-pin-2"))

    expect(onPinSelect).toHaveBeenCalledWith(mockPins[1])
  })

  it("applies portal styles when portalStyle is true", () => {
    render(<PortalMap pins={[]} portalStyle />)

    const empty = screen.getByTestId("map-empty")
    expect(empty.style.borderColor).toBe("var(--portal-border)")
    expect(empty.style.backgroundColor).toBe("var(--portal-surface)")
  })

  it("filters pins by activeCategory", () => {
    render(<PortalMap pins={mockPins} activeCategory="hotel" showSidebar />)

    // Only hotel pin should appear in sidebar
    expect(screen.getByTestId("map-sidebar-item-pin-2")).toBeInTheDocument()
    expect(screen.queryByTestId("map-sidebar-item-pin-1")).not.toBeInTheDocument()
    expect(screen.queryByTestId("map-sidebar-item-pin-3")).not.toBeInTheDocument()
  })

  it("renders category emoji icons in sidebar", () => {
    render(<PortalMap pins={mockPins} showSidebar />)

    // Emojis appear in both popup and sidebar, so use getAllByText
    expect(screen.getAllByText("📍").length).toBeGreaterThanOrEqual(1) // venue
    expect(screen.getAllByText("🏨").length).toBeGreaterThanOrEqual(1) // hotel
    expect(screen.getAllByText("🍽️").length).toBeGreaterThanOrEqual(1) // restaurant
  })

  it("applies custom height", () => {
    render(<PortalMap pins={mockPins} height="30rem" />)

    expect(screen.getByTestId("portal-map").style.height).toBe("30rem")
  })
})

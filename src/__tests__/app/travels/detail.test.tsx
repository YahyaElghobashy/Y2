import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Navigation ──
const mockPush = vi.fn()
const mockParams = { tripId: "trip-1" }
vi.mock("next/navigation", () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push: mockPush }),
}))

// ── Auth ──
const mockUseAuth = vi.fn()
vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

// ── useTrips ──
const getTrip = vi.fn()
const deleteTrip = vi.fn()
const mockUseTrips = vi.fn()
vi.mock("@/lib/hooks/use-trips", () => ({
  useTrips: () => mockUseTrips(),
}))

vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FadeIn: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}))
vi.mock("@/components/shared/LoadingSkeleton", () => ({
  LoadingSkeleton: () => <div data-testid="skeleton" />,
}))

// Stub TripDetailView to surface delete affordance presence + trigger.
vi.mock("@/components/travels/TripDetailView", () => ({
  TripDetailView: ({ trip, onDelete }: { trip: { title: string }; onDelete?: () => void }) => (
    <div>
      <span data-testid="title">{trip.title}</span>
      {onDelete ? (
        <button data-testid="delete" onClick={onDelete}>
          delete
        </button>
      ) : (
        <span data-testid="no-delete" />
      )}
    </div>
  ),
}))

const OWNED_TRIP = { id: "trip-1", created_by: "user-1", title: "Cambridge & London" }
const PARTNER_TRIP = { id: "trip-1", created_by: "user-2", title: "Partner Trip" }

import TripDetailPage from "@/app/(main)/travels/[tripId]/page"

describe("TripDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: { id: "user-1" } })
    deleteTrip.mockResolvedValue(undefined)
    getTrip.mockReturnValue(OWNED_TRIP)
    mockUseTrips.mockReturnValue({ getTrip, deleteTrip, isLoading: false })
  })

  // ── Unit / states ──
  it("shows a skeleton while loading and the trip not yet resolved", () => {
    getTrip.mockReturnValue(null)
    mockUseTrips.mockReturnValue({ getTrip, deleteTrip, isLoading: true })
    render(<TripDetailPage />)
    expect(screen.getByTestId("skeleton")).toBeTruthy()
  })

  it("shows a not-found state when the trip is absent and load is done", () => {
    getTrip.mockReturnValue(null)
    mockUseTrips.mockReturnValue({ getTrip, deleteTrip, isLoading: false })
    render(<TripDetailPage />)
    expect(screen.getByText("Travel not found")).toBeTruthy()
  })

  it("routes back to /travels from the not-found action", () => {
    getTrip.mockReturnValue(null)
    mockUseTrips.mockReturnValue({ getTrip, deleteTrip, isLoading: false })
    render(<TripDetailPage />)
    fireEvent.click(screen.getByText("Back to travels"))
    expect(mockPush).toHaveBeenCalledWith("/travels")
  })

  // ── Owner vs partner ──
  it("renders the trip and exposes delete for the owner", () => {
    render(<TripDetailPage />)
    expect(screen.getByTestId("title").textContent).toBe("Cambridge & London")
    expect(screen.getByTestId("delete")).toBeTruthy()
  })

  it("hides delete for the partner's trip", () => {
    getTrip.mockReturnValue(PARTNER_TRIP)
    render(<TripDetailPage />)
    expect(screen.queryByTestId("delete")).toBeNull()
    expect(screen.getByTestId("no-delete")).toBeTruthy()
  })

  // ── Interaction ──
  it("deletes the trip and routes back to /travels", async () => {
    render(<TripDetailPage />)
    fireEvent.click(screen.getByTestId("delete"))
    await waitFor(() => expect(deleteTrip).toHaveBeenCalledWith("trip-1"))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/travels"))
  })
})

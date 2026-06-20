import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ──────────────────────────────────────────────
const mockAddVisit = vi.fn()
const mockAddRating = vi.fn()
const mockPush = vi.fn()
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()

vi.mock("@/lib/hooks/use-food-journal", () => ({
  useFoodJournal: () => ({ addVisit: mockAddVisit, addRating: mockAddRating }),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("sonner", () => ({
  toast: { success: (m: string) => mockToastSuccess(m), error: (m: string) => mockToastError(m) },
}))

// Stub the restaurant search so a click selects a place.
vi.mock("@/components/food/RestaurantSearch", () => ({
  RestaurantSearch: ({ onSelect }: { onSelect: (d: unknown) => void }) => (
    <button
      data-testid="pick-place"
      onClick={() => onSelect({ placeName: "Test Diner", placeId: "p-1", lat: 1.1, lng: 2.2 })}
    >
      pick
    </button>
  ),
}))

// Stub the rating slider so a click submits a fixed score.
vi.mock("@/components/food/RatingSlider", () => ({
  RatingSlider: ({ onNext }: { onNext: (s: number) => void }) => (
    <button data-testid="submit-rating" onClick={() => onNext(8)}>submit</button>
  ),
}))

import NewVisitPage from "@/app/(main)/our-table/new/page"

async function reachRatingStep() {
  render(<NewVisitPage />)
  fireEvent.click(screen.getByTestId("pick-place"))     // step 1: select restaurant
  fireEvent.click(screen.getByTestId("next-btn"))       // → step 2
  fireEvent.click(screen.getByTestId("skip-to-step-3")) // → step 3
}

describe("NewVisitPage — persists the visit + rating", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAddVisit.mockResolvedValue("visit-99")
    mockAddRating.mockResolvedValue(undefined)
  })

  it("calls addVisit with the form data, then addRating with the visit id + scores, then navigates", async () => {
    await reachRatingStep()
    fireEvent.click(screen.getByTestId("submit-rating"))

    await waitFor(() => expect(mockAddVisit).toHaveBeenCalledTimes(1))
    expect(mockAddVisit).toHaveBeenCalledWith(
      expect.objectContaining({
        place_name: "Test Diner",
        place_id: "p-1",
        lat: 1.1,
        lng: 2.2,
        cuisine_type: "arabic",
      })
    )

    await waitFor(() => expect(mockAddRating).toHaveBeenCalledTimes(1))
    expect(mockAddRating).toHaveBeenCalledWith(
      expect.objectContaining({ visit_id: "visit-99", food_quality: 8, vibe_score: 8 })
    )

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/our-table"))
    expect(mockToastSuccess).toHaveBeenCalled()
  })

  it("does NOT navigate or rate when addVisit fails", async () => {
    mockAddVisit.mockResolvedValueOnce(null)
    await reachRatingStep()
    fireEvent.click(screen.getByTestId("submit-rating"))

    await waitFor(() => expect(mockAddVisit).toHaveBeenCalled())
    expect(mockAddRating).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
    expect(mockToastError).toHaveBeenCalled()
  })

  it("still saves the visit (navigates) but warns when the rating fails", async () => {
    mockAddRating.mockRejectedValueOnce(new Error("rating boom"))
    await reachRatingStep()
    fireEvent.click(screen.getByTestId("submit-rating"))

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/our-table"))
    expect(mockToastError).toHaveBeenCalled()
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })
})

import { render, screen, fireEvent, within } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Replace the dynamically-imported SVG map with a controllable stub so the View
// test can drive hover/select deterministically (no async dynamic import).
vi.mock("next/dynamic", () => ({
  default: () =>
    function MockMap(props: { onHover?: (i: string | null) => void; onSelect?: (i: string) => void }) {
      return (
        <div data-testid="mock-map">
          <button onMouseEnter={() => props.onHover?.("NL")} onClick={() => props.onSelect?.("NL")}>
            NL
          </button>
        </div>
      )
    },
}))

import { WorldMapView, WORLD_MAP_MOCK } from "@/components/travels/WorldMapView"

describe("WorldMapView", () => {
  beforeEach(() => vi.clearAllMocks())

  it("shows the Our Next Adventure highlight from a mutual pin", () => {
    render(<WorldMapView {...WORLD_MAP_MOCK} />)
    expect(screen.getByText(/Our Next Adventure/i)).toBeInTheDocument()
    expect(screen.getByText("Japan")).toBeInTheDocument()
  })

  it("hovering a country shows the tooltip", () => {
    render(<WorldMapView {...WORLD_MAP_MOCK} />)
    fireEvent.mouseEnter(screen.getByText("NL"))
    const tip = screen.getByRole("tooltip")
    expect(within(tip).getByText("Netherlands")).toBeInTheDocument()
  })

  it("clicking a country opens the detail sheet with its visits", () => {
    render(<WorldMapView {...WORLD_MAP_MOCK} />)
    fireEvent.click(screen.getByText("NL"))
    const sheet = screen.getByTestId("country-detail-sheet")
    // together memorable + the partner's note both show
    expect(within(sheet).getByText(/floating market/i)).toBeInTheDocument()
    expect(within(sheet).getByText(/houseboat breakfast/i)).toBeInTheDocument()
    // and the solo 2019 recommendation
    expect(within(sheet).getByText(/Rent bikes/i)).toBeInTheDocument()
  })

  it("the pin toggle calls onTogglePin with current state", () => {
    const onTogglePin = vi.fn().mockResolvedValue(undefined)
    render(<WorldMapView {...WORLD_MAP_MOCK} onTogglePin={onTogglePin} />)
    fireEvent.click(screen.getByText("NL"))
    const sheet = screen.getByTestId("country-detail-sheet")
    fireEvent.click(within(sheet).getByRole("button", { name: /Pin as a dream/i }))
    expect(onTogglePin).toHaveBeenCalledWith("NL", false)
  })

  it("disables the pin button once 3 are pinned", () => {
    render(
      <WorldMapView
        {...WORLD_MAP_MOCK}
        myPins={[
          { id: "1", owner_id: "mock-me", country_code: "JP", note: null, created_at: "" },
          { id: "2", owner_id: "mock-me", country_code: "BR", note: null, created_at: "" },
          { id: "3", owner_id: "mock-me", country_code: "FR", note: null, created_at: "" },
        ]}
      />
    )
    fireEvent.click(screen.getByText("NL"))
    const sheet = screen.getByTestId("country-detail-sheet")
    expect(within(sheet).getByRole("button", { name: /Pin as a dream/i })).toBeDisabled()
  })

  it("opens the log-visit form from the header CTA", () => {
    render(<WorldMapView {...WORLD_MAP_MOCK} />)
    fireEvent.click(screen.getByRole("button", { name: /Log a visit/i }))
    expect(screen.getByTestId("log-visit-form")).toBeInTheDocument()
  })
})

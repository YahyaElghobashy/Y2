import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { WorldMap } from "@/components/travels/WorldMap"
import { aggregateCountries } from "@/lib/travels/country-status"
import type { CountryVisit, PinLayer } from "@/lib/types/world-map.types"

const ME = "me"
const PARTNER = "partner"

function visit(p: Partial<CountryVisit>): CountryVisit {
  return {
    id: `v-${Math.random()}`, created_by: ME, traveler_id: ME, country_code: "NL",
    is_together: false, place: null, visited_year: null, visited_on: null,
    companions: null, memorable: null, recommendation: null, partner_note: null,
    trip_id: null, created_at: "", updated_at: "", ...p,
  }
}

const countries = aggregateCountries(
  [
    visit({ country_code: "NL", is_together: true, visited_year: 2024 }),
    visit({ country_code: "EG", traveler_id: ME }),
  ],
  ME,
  PARTNER
)
const pins: PinLayer = { me: ["JP"], partner: [], mutual: [] }

describe("WorldMap", () => {
  it("renders an accessible map with many country paths", () => {
    render(<WorldMap countries={countries} pins={pins} />)
    const svg = screen.getByRole("img", { name: /countries we've visited/i })
    expect(svg).toBeInTheDocument()
    // 110m world-atlas has ~177 country geometries.
    const paths = svg.querySelectorAll("path.wm-country")
    expect(paths.length).toBeGreaterThan(150)
  })

  it("fills a visited country with its status gradient", () => {
    render(<WorldMap countries={countries} pins={pins} />)
    const nl = screen.getByRole("button", { name: /Netherlands/ })
    expect(nl.getAttribute("fill")).toBe("url(#wm-grad-together)")
  })

  it("fires onHover on mouse enter / leave", () => {
    const onHover = vi.fn()
    render(<WorldMap countries={countries} pins={pins} onHover={onHover} />)
    const nl = screen.getByRole("button", { name: /Netherlands/ })
    fireEvent.mouseEnter(nl)
    expect(onHover).toHaveBeenCalledWith("NL")
    fireEvent.mouseLeave(nl)
    expect(onHover).toHaveBeenCalledWith(null)
  })

  it("fires onSelect on click and on keyboard Enter", () => {
    const onSelect = vi.fn()
    render(<WorldMap countries={countries} pins={pins} onSelect={onSelect} />)
    const eg = screen.getByRole("button", { name: /Egypt/ })
    fireEvent.click(eg)
    expect(onSelect).toHaveBeenCalledWith("EG")
    fireEvent.keyDown(eg, { key: "Enter" })
    expect(onSelect).toHaveBeenCalledTimes(2)
  })

  it("renders a pin marker for an aspirational country", () => {
    const { container } = render(<WorldMap countries={countries} pins={pins} />)
    expect(container.querySelectorAll("g.wm-pin").length).toBe(1)
  })
})

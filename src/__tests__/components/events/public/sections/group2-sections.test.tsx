import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// ── Mocks ──

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [k: string]: unknown }) => {
      const safe: Record<string, unknown> = {}
      Object.keys(props).forEach((k) => {
        if (k === "style" || k === "className" || k.startsWith("data-")) safe[k] = props[k]
      })
      return <div {...safe}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ── Imports ──

import { MapSection } from "@/components/events/public/sections/MapSection"
import { TransportSection } from "@/components/events/public/sections/TransportSection"
import { HotelsSection } from "@/components/events/public/sections/HotelsSection"
import { RestaurantsSection } from "@/components/events/public/sections/RestaurantsSection"
import { ActivitiesSection } from "@/components/events/public/sections/ActivitiesSection"
import { BeautySection } from "@/components/events/public/sections/BeautySection"
import { TravelTipsSection } from "@/components/events/public/sections/TravelTipsSection"
import { GuidesHubSection } from "@/components/events/public/sections/GuidesHubSection"

function makeSection(type: string, content: Record<string, unknown> = {}) {
  return {
    id: `section-${type}`,
    page_id: "page-1",
    section_type: type as "map",
    content,
    position: 0,
    is_visible: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  }
}

describe("MapSection", () => {
  it("renders heading and placeholder", () => {
    render(<MapSection section={makeSection("map", { heading: "Venue Location" })} />)
    expect(screen.getByTestId("map-section")).toBeInTheDocument()
    expect(screen.getByText("Venue Location")).toBeInTheDocument()
    expect(screen.getByTestId("map-placeholder")).toBeInTheDocument()
  })
})

describe("TransportSection", () => {
  it("renders transport items", () => {
    render(
      <TransportSection
        section={makeSection("transport", {
          heading: "Getting There",
          sections: [
            { mode: "car", title: "By Car", description: "Take highway 101" },
            { mode: "flight", title: "By Air", description: "Fly into LAX" },
          ],
        })}
      />
    )
    expect(screen.getByTestId("transport-section")).toBeInTheDocument()
    expect(screen.getByText("Getting There")).toBeInTheDocument()
    expect(screen.getByTestId("transport-item-0")).toBeInTheDocument()
    expect(screen.getByTestId("transport-item-1")).toBeInTheDocument()
  })

  it("renders external links", () => {
    render(
      <TransportSection
        section={makeSection("transport", {
          sections: [
            {
              mode: "flight",
              title: "By Air",
              description: "Fly in",
              links: [{ label: "Book Flight", url: "https://airline.com" }],
            },
          ],
        })}
      />
    )
    const link = screen.getByText("Book Flight")
    expect(link).toHaveAttribute("href", "https://airline.com")
    expect(link).toHaveAttribute("target", "_blank")
  })

  it("returns null when no sections", () => {
    const { container } = render(
      <TransportSection section={makeSection("transport", { sections: [] })} />
    )
    expect(container.innerHTML).toBe("")
  })
})

describe("HotelsSection", () => {
  it("renders hotel cards with recommended badge", () => {
    render(
      <HotelsSection
        section={makeSection("hotels", {
          heading: "Where to Stay",
          hotels: [
            { name: "Grand Hotel", price_range: "$$$", distance_from_venue: "0.5 km", is_recommended: true },
          ],
        })}
      />
    )
    expect(screen.getByTestId("hotels-section")).toBeInTheDocument()
    expect(screen.getByText("Grand Hotel")).toBeInTheDocument()
    expect(screen.getByText("Recommended")).toBeInTheDocument()
    expect(screen.getByText("0.5 km")).toBeInTheDocument()
  })

  it("renders booking links", () => {
    render(
      <HotelsSection
        section={makeSection("hotels", {
          hotels: [{ name: "Hotel A", booking_url: "https://book.com" }],
        })}
      />
    )
    expect(screen.getByText("Book Now")).toHaveAttribute("href", "https://book.com")
  })

  it("returns null when no hotels", () => {
    const { container } = render(
      <HotelsSection section={makeSection("hotels", { hotels: [] })} />
    )
    expect(container.innerHTML).toBe("")
  })
})

describe("RestaurantsSection", () => {
  it("renders restaurant cards with cuisine and price", () => {
    render(
      <RestaurantsSection
        section={makeSection("restaurants", {
          heading: "Dining",
          restaurants: [
            { name: "Sushi Place", cuisine: "Japanese", price_range: "$$", is_recommended: true },
          ],
        })}
      />
    )
    expect(screen.getByTestId("restaurants-section")).toBeInTheDocument()
    expect(screen.getByText("Sushi Place")).toBeInTheDocument()
    expect(screen.getByText("Japanese · $$")).toBeInTheDocument()
    expect(screen.getByText("Recommended")).toBeInTheDocument()
  })

  it("returns null when empty", () => {
    const { container } = render(
      <RestaurantsSection section={makeSection("restaurants", { restaurants: [] })} />
    )
    expect(container.innerHTML).toBe("")
  })
})

describe("ActivitiesSection", () => {
  it("renders activity cards with duration and price", () => {
    render(
      <ActivitiesSection
        section={makeSection("activities", {
          heading: "Things to Do",
          activities: [{ name: "City Tour", duration: "3 hours", price: "$50" }],
        })}
      />
    )
    expect(screen.getByTestId("activities-section")).toBeInTheDocument()
    expect(screen.getByText("City Tour")).toBeInTheDocument()
    expect(screen.getByText("3 hours")).toBeInTheDocument()
    expect(screen.getByText("$50")).toBeInTheDocument()
  })

  it("renders external links", () => {
    render(
      <ActivitiesSection
        section={makeSection("activities", {
          activities: [{ name: "Tour", url: "https://tour.com" }],
        })}
      />
    )
    expect(screen.getByText("Learn More")).toHaveAttribute("href", "https://tour.com")
  })
})

describe("BeautySection", () => {
  it("renders beauty service cards", () => {
    render(
      <BeautySection
        section={makeSection("beauty", {
          heading: "Beauty Services",
          services: [
            { name: "Glamour Salon", type: "salon", phone: "+1234567890", is_recommended: true },
          ],
        })}
      />
    )
    expect(screen.getByTestId("beauty-section")).toBeInTheDocument()
    expect(screen.getByText("Glamour Salon")).toBeInTheDocument()
    expect(screen.getByText("Salon")).toBeInTheDocument()
    expect(screen.getByText("+1234567890")).toBeInTheDocument()
  })

  it("returns null when empty", () => {
    const { container } = render(
      <BeautySection section={makeSection("beauty", { services: [] })} />
    )
    expect(container.innerHTML).toBe("")
  })
})

describe("TravelTipsSection", () => {
  it("renders tip cards with category icons", () => {
    render(
      <TravelTipsSection
        section={makeSection("travel_tips", {
          heading: "Travel Tips",
          tips: [
            { title: "Visa Info", body: "Apply early", category: "visa" },
            { title: "Weather", body: "Pack light", category: "weather" },
          ],
        })}
      />
    )
    expect(screen.getByTestId("travel-tips-section")).toBeInTheDocument()
    expect(screen.getByText("Travel Tips")).toBeInTheDocument()
    expect(screen.getByText("🛂")).toBeInTheDocument()
    expect(screen.getByText("🌤️")).toBeInTheDocument()
  })

  it("returns null when empty", () => {
    const { container } = render(
      <TravelTipsSection section={makeSection("travel_tips", { tips: [] })} />
    )
    expect(container.innerHTML).toBe("")
  })
})

describe("GuidesHubSection", () => {
  it("renders guide cards with links", () => {
    render(
      <GuidesHubSection
        section={makeSection("guides_hub", {
          heading: "Guides",
          description: "Helpful resources",
          guides: [
            { title: "City Guide", description: "Explore the city", url: "https://guide.com" },
          ],
        })}
      />
    )
    expect(screen.getByTestId("guides-hub-section")).toBeInTheDocument()
    expect(screen.getByText("Guides")).toBeInTheDocument()
    const card = screen.getByTestId("guide-card-0")
    expect(card).toHaveAttribute("href", "https://guide.com")
  })

  it("returns null when empty", () => {
    const { container } = render(
      <GuidesHubSection section={makeSection("guides_hub", { guides: [] })} />
    )
    expect(container.innerHTML).toBe("")
  })
})

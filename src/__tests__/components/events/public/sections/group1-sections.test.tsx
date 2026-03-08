import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
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

vi.mock("next/navigation", () => ({
  usePathname: () => "/e/test-portal/home",
  useRouter: () => ({ refresh: vi.fn() }),
}))

vi.mock("@/components/events/public/PortalDataProvider", () => ({
  usePortalData: () => ({
    portal: { id: "portal-1", title: "Test", slug: "test-portal" },
    pages: [],
  }),
}))

// ── Imports ──

import { HeroSection } from "@/components/events/public/sections/HeroSection"
import { WelcomeSection } from "@/components/events/public/sections/WelcomeSection"
import { TimelineSection } from "@/components/events/public/sections/TimelineSection"
import { CountdownSection } from "@/components/events/public/sections/CountdownSection"
import { CalendarSection } from "@/components/events/public/sections/CalendarSection"
import { DressCodeSection } from "@/components/events/public/sections/DressCodeSection"
import { EventCardsSection } from "@/components/events/public/sections/EventCardsSection"
import { GallerySection } from "@/components/events/public/sections/GallerySection"

// ── Test Helpers ──

function makeSection(type: string, content: Record<string, unknown> = {}) {
  return {
    id: `section-${type}`,
    page_id: "page-1",
    section_type: type as "hero",
    content,
    position: 0,
    is_visible: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  }
}

// ── Tests ──

describe("HeroSection", () => {
  it("renders heading and subheading", () => {
    render(
      <HeroSection
        section={makeSection("hero", {
          heading: "Our Wedding Day",
          subheading: "June 15, 2026",
          layout: "centered",
        })}
      />
    )
    expect(screen.getByTestId("hero-section")).toBeInTheDocument()
    expect(screen.getByText("Our Wedding Day")).toBeInTheDocument()
    expect(screen.getByText("June 15, 2026")).toBeInTheDocument()
  })

  it("renders CTA button when text and link provided", () => {
    render(
      <HeroSection
        section={makeSection("hero", {
          heading: "Welcome",
          cta_text: "RSVP Now",
          cta_link: "#rsvp",
        })}
      />
    )
    const cta = screen.getByTestId("hero-cta")
    expect(cta).toHaveTextContent("RSVP Now")
    expect(cta).toHaveAttribute("href", "#rsvp")
  })

  it("renders date display", () => {
    render(
      <HeroSection
        section={makeSection("hero", {
          heading: "Test",
          date_display: "June 15, 2026",
        })}
      />
    )
    expect(screen.getByText("June 15, 2026")).toBeInTheDocument()
  })
})

describe("WelcomeSection", () => {
  it("renders heading and body text", () => {
    render(
      <WelcomeSection
        section={makeSection("welcome", {
          heading: "Welcome Dear Guests",
          body: "We are thrilled to invite you",
        })}
      />
    )
    expect(screen.getByTestId("welcome-section")).toBeInTheDocument()
    expect(screen.getByText("Welcome Dear Guests")).toBeInTheDocument()
    expect(screen.getByText("We are thrilled to invite you")).toBeInTheDocument()
  })

  it("renders signatures", () => {
    render(
      <WelcomeSection
        section={makeSection("welcome", {
          body: "Hello",
          signatures: ["Yahya & Yara"],
        })}
      />
    )
    expect(screen.getByText("Yahya & Yara")).toBeInTheDocument()
  })

  it("renders image when provided", () => {
    render(
      <WelcomeSection
        section={makeSection("welcome", {
          body: "Hello",
          image_url: "https://example.com/photo.jpg",
        })}
      />
    )
    const img = screen.getByRole("img")
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg")
  })
})

describe("TimelineSection", () => {
  it("renders timeline items", () => {
    render(
      <TimelineSection
        section={makeSection("timeline", {
          heading: "Schedule",
          items: [
            { title: "Ceremony", time: "3:00 PM", description: "Main hall" },
            { title: "Reception", time: "5:00 PM" },
          ],
          orientation: "vertical",
        })}
      />
    )
    expect(screen.getByTestId("timeline-section")).toBeInTheDocument()
    expect(screen.getByText("Schedule")).toBeInTheDocument()
    expect(screen.getByTestId("timeline-item-0")).toBeInTheDocument()
    expect(screen.getByTestId("timeline-item-1")).toBeInTheDocument()
  })

  it("returns null when no items", () => {
    const { container } = render(
      <TimelineSection section={makeSection("timeline", { items: [] })} />
    )
    expect(container.innerHTML).toBe("")
  })

  it("renders with icons", () => {
    render(
      <TimelineSection
        section={makeSection("timeline", {
          items: [{ title: "Start", icon: "🎉" }],
          orientation: "vertical",
        })}
      />
    )
    expect(screen.getByText("🎉")).toBeInTheDocument()
  })
})

describe("CountdownSection", () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it("renders countdown with future date", () => {
    const futureDate = new Date(Date.now() + 86400000 * 10).toISOString()
    render(
      <CountdownSection
        section={makeSection("countdown", {
          target_date: futureDate,
          heading: "Counting Down",
        })}
      />
    )
    expect(screen.getByTestId("countdown-section")).toBeInTheDocument()
    expect(screen.getByText("Counting Down")).toBeInTheDocument()
    expect(screen.getByText("Days")).toBeInTheDocument()
  })

  it("shows completed text when date has passed", () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    render(
      <CountdownSection
        section={makeSection("countdown", {
          target_date: pastDate,
          completed_text: "We did it!",
        })}
      />
    )
    expect(screen.getByTestId("countdown-completed")).toHaveTextContent("We did it!")
  })

  it("returns null when no target date", () => {
    const { container } = render(
      <CountdownSection section={makeSection("countdown", {})} />
    )
    expect(container.innerHTML).toBe("")
  })
})

describe("CalendarSection", () => {
  it("renders heading and add to calendar button", () => {
    render(
      <CalendarSection
        section={makeSection("calendar", {
          heading: "Save the Date",
          show_add_to_calendar: true,
        })}
      />
    )
    expect(screen.getByTestId("calendar-section")).toBeInTheDocument()
    expect(screen.getByText("Save the Date")).toBeInTheDocument()
    expect(screen.getByTestId("add-to-calendar-btn")).toBeInTheDocument()
  })

  it("hides add to calendar button when disabled", () => {
    render(
      <CalendarSection
        section={makeSection("calendar", { show_add_to_calendar: false })}
      />
    )
    expect(screen.queryByTestId("add-to-calendar-btn")).not.toBeInTheDocument()
  })
})

describe("DressCodeSection", () => {
  it("renders dress code cards", () => {
    render(
      <DressCodeSection
        section={makeSection("dress_code", {
          heading: "What to Wear",
          dress_codes: [
            { event_title: "Ceremony", code: "Black Tie", description: "Formal attire" },
          ],
        })}
      />
    )
    expect(screen.getByTestId("dress-code-section")).toBeInTheDocument()
    expect(screen.getByText("What to Wear")).toBeInTheDocument()
    expect(screen.getByText("Black Tie")).toBeInTheDocument()
  })

  it("renders color palette swatches", () => {
    render(
      <DressCodeSection
        section={makeSection("dress_code", {
          dress_codes: [
            { event_title: "Party", code: "Pastel", color_palette: ["#FFB6C1", "#ADD8E6"] },
          ],
        })}
      />
    )
    const card = screen.getByTestId("dress-code-card-0")
    const swatches = card.querySelectorAll("[style*='background-color']")
    expect(swatches.length).toBe(2)
  })

  it("returns null when no dress codes", () => {
    const { container } = render(
      <DressCodeSection section={makeSection("dress_code", { dress_codes: [] })} />
    )
    expect(container.innerHTML).toBe("")
  })
})

describe("EventCardsSection", () => {
  it("renders with heading", () => {
    render(
      <EventCardsSection section={makeSection("event_cards", { heading: "Our Events" })} />
    )
    expect(screen.getByTestId("event-cards-section")).toBeInTheDocument()
    expect(screen.getByText("Our Events")).toBeInTheDocument()
  })

  it("shows placeholder", () => {
    render(<EventCardsSection section={makeSection("event_cards", {})} />)
    expect(screen.getByTestId("event-cards-placeholder")).toBeInTheDocument()
  })
})

describe("GallerySection", () => {
  it("renders with heading and placeholder", () => {
    render(
      <GallerySection section={makeSection("gallery", { heading: "Our Photos" })} />
    )
    expect(screen.getByTestId("gallery-section")).toBeInTheDocument()
    expect(screen.getByText("Our Photos")).toBeInTheDocument()
    expect(screen.getByTestId("gallery-placeholder")).toBeInTheDocument()
  })
})

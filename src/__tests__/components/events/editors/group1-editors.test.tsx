import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { HeroEditor } from "@/components/events/editors/HeroEditor"
import { WelcomeEditor } from "@/components/events/editors/WelcomeEditor"
import { EventCardsEditor } from "@/components/events/editors/EventCardsEditor"
import { TimelineEditor } from "@/components/events/editors/TimelineEditor"
import { CountdownEditor } from "@/components/events/editors/CountdownEditor"
import { CalendarEditor } from "@/components/events/editors/CalendarEditor"
import { DressCodeEditor } from "@/components/events/editors/DressCodeEditor"

describe("Group 1 Section Editors (TE06)", () => {
  let mockOnContentChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnContentChange = vi.fn()
  })

  // ── HeroEditor ──

  describe("HeroEditor", () => {
    it("renders with default content", () => {
      render(<HeroEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("hero-editor")).toBeInTheDocument()
      expect(screen.getByTestId("hero-heading")).toHaveValue("")
      expect(screen.getByTestId("hero-layout")).toHaveValue("centered")
    })

    it("renders with provided content", () => {
      render(
        <HeroEditor
          content={{ heading: "Our Wedding", subheading: "June 2026", layout: "split" }}
          onContentChange={mockOnContentChange}
        />
      )
      expect(screen.getByTestId("hero-heading")).toHaveValue("Our Wedding")
      expect(screen.getByTestId("hero-subheading")).toHaveValue("June 2026")
      expect(screen.getByTestId("hero-layout")).toHaveValue("split")
    })

    it("calls onContentChange when heading changes", async () => {
      const user = userEvent.setup()
      render(<HeroEditor content={{ heading: "" }} onContentChange={mockOnContentChange} />)

      await user.type(screen.getByTestId("hero-heading"), "A")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ heading: "A" })
      )
    })

    it("calls onContentChange when layout changes", async () => {
      const user = userEvent.setup()
      render(<HeroEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.selectOptions(screen.getByTestId("hero-layout"), "left")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ layout: "left" })
      )
    })

    it("shows overlay opacity when background image is set", () => {
      render(
        <HeroEditor
          content={{ background_image_url: "https://img.com/bg.jpg" }}
          onContentChange={mockOnContentChange}
        />
      )
      expect(screen.getByTestId("hero-overlay-opacity")).toBeInTheDocument()
    })

    it("hides overlay opacity when no background image", () => {
      render(<HeroEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.queryByTestId("hero-overlay-opacity")).not.toBeInTheDocument()
    })

    it("shows CTA link field when CTA text is set", () => {
      render(
        <HeroEditor content={{ cta_text: "RSVP" }} onContentChange={mockOnContentChange} />
      )
      expect(screen.getByTestId("hero-cta-link")).toBeInTheDocument()
    })
  })

  // ── WelcomeEditor ──

  describe("WelcomeEditor", () => {
    it("renders with default content", () => {
      render(<WelcomeEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("welcome-editor")).toBeInTheDocument()
    })

    it("calls onContentChange when body changes", async () => {
      const user = userEvent.setup()
      render(<WelcomeEditor content={{ body: "" }} onContentChange={mockOnContentChange} />)

      await user.type(screen.getByTestId("welcome-body"), "H")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ body: "H" })
      )
    })

    it("can add a signature", async () => {
      const user = userEvent.setup()
      render(
        <WelcomeEditor content={{ signatures: [] }} onContentChange={mockOnContentChange} />
      )

      await user.click(screen.getByTestId("welcome-add-signature"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ signatures: [""] })
      )
    })

    it("can remove a signature", async () => {
      const user = userEvent.setup()
      render(
        <WelcomeEditor
          content={{ signatures: ["Love, Sarah"] }}
          onContentChange={mockOnContentChange}
        />
      )

      await user.click(screen.getByTestId("welcome-remove-signature-0"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ signatures: [] })
      )
    })

    it("shows image position when image URL is set", () => {
      render(
        <WelcomeEditor
          content={{ image_url: "https://img.com/photo.jpg" }}
          onContentChange={mockOnContentChange}
        />
      )
      expect(screen.getByTestId("welcome-image-position")).toBeInTheDocument()
    })
  })

  // ── EventCardsEditor ──

  describe("EventCardsEditor", () => {
    it("renders with defaults", () => {
      render(<EventCardsEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("event-cards-editor")).toBeInTheDocument()
      expect(screen.getByTestId("event-cards-layout")).toHaveValue("grid")
    })

    it("calls onContentChange on layout change", async () => {
      const user = userEvent.setup()
      render(<EventCardsEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.selectOptions(screen.getByTestId("event-cards-layout"), "list")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ layout: "list" })
      )
    })
  })

  // ── TimelineEditor ──

  describe("TimelineEditor", () => {
    it("renders with default content", () => {
      render(<TimelineEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("timeline-editor")).toBeInTheDocument()
    })

    it("can add a timeline item", async () => {
      const user = userEvent.setup()
      render(<TimelineEditor content={{ items: [] }} onContentChange={mockOnContentChange} />)

      await user.click(screen.getByTestId("timeline-add-item"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [expect.objectContaining({ title: "", time: "" })],
        })
      )
    })

    it("can remove a timeline item", async () => {
      const user = userEvent.setup()
      const items = [{ time: "2:00 PM", title: "Ceremony", description: "", icon: "" }]
      render(
        <TimelineEditor content={{ items }} onContentChange={mockOnContentChange} />
      )

      await user.click(screen.getByTestId("timeline-remove-0"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ items: [] })
      )
    })

    it("can update a timeline item title", async () => {
      const user = userEvent.setup()
      const items = [{ time: "", title: "", description: "", icon: "" }]
      render(
        <TimelineEditor content={{ items }} onContentChange={mockOnContentChange} />
      )

      await user.type(screen.getByTestId("timeline-title-0"), "R")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [expect.objectContaining({ title: "R" })],
        })
      )
    })

    it("can change orientation", async () => {
      const user = userEvent.setup()
      render(<TimelineEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.selectOptions(screen.getByTestId("timeline-orientation"), "horizontal")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ orientation: "horizontal" })
      )
    })
  })

  // ── CountdownEditor ──

  describe("CountdownEditor", () => {
    it("renders with default content", () => {
      render(<CountdownEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("countdown-editor")).toBeInTheDocument()
    })

    it("renders all display unit toggles", () => {
      render(<CountdownEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("countdown-show-days")).toBeInTheDocument()
      expect(screen.getByTestId("countdown-show-hours")).toBeInTheDocument()
      expect(screen.getByTestId("countdown-show-minutes")).toBeInTheDocument()
      expect(screen.getByTestId("countdown-show-seconds")).toBeInTheDocument()
    })

    it("calls onContentChange on heading change", async () => {
      const user = userEvent.setup()
      render(<CountdownEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.type(screen.getByTestId("countdown-heading"), "T")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ heading: "T" })
      )
    })
  })

  // ── CalendarEditor ──

  describe("CalendarEditor", () => {
    it("renders with default content", () => {
      render(<CalendarEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("calendar-editor")).toBeInTheDocument()
    })

    it("calls onContentChange on heading change", async () => {
      const user = userEvent.setup()
      render(<CalendarEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.type(screen.getByTestId("calendar-heading"), "S")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ heading: "S" })
      )
    })
  })

  // ── DressCodeEditor ──

  describe("DressCodeEditor", () => {
    it("renders with default content", () => {
      render(<DressCodeEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("dress-code-editor")).toBeInTheDocument()
    })

    it("can add a dress code item", async () => {
      const user = userEvent.setup()
      render(
        <DressCodeEditor content={{ dress_codes: [] }} onContentChange={mockOnContentChange} />
      )

      await user.click(screen.getByTestId("dress-code-add"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dress_codes: [expect.objectContaining({ event_title: "", code: "" })],
        })
      )
    })

    it("can remove a dress code item", async () => {
      const user = userEvent.setup()
      const dressCodes = [
        { event_title: "Ceremony", code: "Black Tie", description: "", color_palette: [], image_url: "" },
      ]
      render(
        <DressCodeEditor content={{ dress_codes: dressCodes }} onContentChange={mockOnContentChange} />
      )

      await user.click(screen.getByTestId("dress-code-remove-0"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ dress_codes: [] })
      )
    })

    it("can update a dress code field", async () => {
      const user = userEvent.setup()
      const dressCodes = [
        { event_title: "", code: "", description: "", color_palette: [], image_url: "" },
      ]
      render(
        <DressCodeEditor content={{ dress_codes: dressCodes }} onContentChange={mockOnContentChange} />
      )

      await user.type(screen.getByTestId("dress-code-code-0"), "F")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          dress_codes: [expect.objectContaining({ code: "F" })],
        })
      )
    })
  })
})

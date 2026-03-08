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

import { RSVPFormEditor } from "@/components/events/editors/RSVPFormEditor"
import { GiftRegistryEditor } from "@/components/events/editors/GiftRegistryEditor"
import { CTAEditor } from "@/components/events/editors/CTAEditor"
import { FAQEditor } from "@/components/events/editors/FAQEditor"
import { TextEditor } from "@/components/events/editors/TextEditor"
import { QuoteEditor } from "@/components/events/editors/QuoteEditor"
import { DividerEditor } from "@/components/events/editors/DividerEditor"
import { CustomHTMLEditor } from "@/components/events/editors/CustomHTMLEditor"
import { GalleryEditor } from "@/components/events/editors/GalleryEditor"
import { SECTION_EDITOR_REGISTRY, getSectionEditor } from "@/components/events/editors"

describe("Group 3 Section Editors (TE08)", () => {
  let mockOnContentChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnContentChange = vi.fn()
  })

  // ── RSVPFormEditor ──

  describe("RSVPFormEditor", () => {
    it("renders with default content", () => {
      render(<RSVPFormEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("rsvp-form-editor")).toBeInTheDocument()
    })

    it("calls onContentChange on heading change", async () => {
      const user = userEvent.setup()
      render(<RSVPFormEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.type(screen.getByTestId("rsvp-heading"), "R")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ heading: "R" })
      )
    })

    it("renders form option toggles", () => {
      render(<RSVPFormEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("rsvp-show-message")).toBeInTheDocument()
      expect(screen.getByTestId("rsvp-show-plus-ones")).toBeInTheDocument()
      expect(screen.getByTestId("rsvp-show-meal")).toBeInTheDocument()
      expect(screen.getByTestId("rsvp-show-dietary")).toBeInTheDocument()
      expect(screen.getByTestId("rsvp-show-hotel")).toBeInTheDocument()
      expect(screen.getByTestId("rsvp-show-sub-events")).toBeInTheDocument()
    })

    it("shows meal options when meal preference enabled", () => {
      render(
        <RSVPFormEditor
          content={{ show_meal_preference: true, meal_options: ["Veg", "Non-Veg"] }}
          onContentChange={mockOnContentChange}
        />
      )
      expect(screen.getByTestId("rsvp-meal-option-0")).toHaveValue("Veg")
      expect(screen.getByTestId("rsvp-meal-option-1")).toHaveValue("Non-Veg")
    })

    it("can add a meal option", async () => {
      const user = userEvent.setup()
      render(
        <RSVPFormEditor
          content={{ show_meal_preference: true, meal_options: [] }}
          onContentChange={mockOnContentChange}
        />
      )

      await user.click(screen.getByTestId("rsvp-add-meal-option"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ meal_options: [""] })
      )
    })

    it("can remove a meal option", async () => {
      const user = userEvent.setup()
      render(
        <RSVPFormEditor
          content={{ show_meal_preference: true, meal_options: ["Veg"] }}
          onContentChange={mockOnContentChange}
        />
      )

      await user.click(screen.getByTestId("rsvp-remove-meal-0"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ meal_options: [] })
      )
    })

    it("shows max plus ones when plus ones enabled", () => {
      render(
        <RSVPFormEditor
          content={{ show_plus_ones: true }}
          onContentChange={mockOnContentChange}
        />
      )
      expect(screen.getByTestId("rsvp-max-plus-ones")).toBeInTheDocument()
    })

    it("shows hotel options when hotel choice enabled", () => {
      render(
        <RSVPFormEditor
          content={{ show_hotel_choice: true, hotel_options: ["Grand Hotel"] }}
          onContentChange={mockOnContentChange}
        />
      )
      expect(screen.getByTestId("rsvp-hotel-option-0")).toHaveValue("Grand Hotel")
    })
  })

  // ── GiftRegistryEditor ──

  describe("GiftRegistryEditor", () => {
    it("renders with default content", () => {
      render(<GiftRegistryEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("gift-registry-editor")).toBeInTheDocument()
    })

    it("shows external registries when enabled", () => {
      render(
        <GiftRegistryEditor
          content={{ show_external_registries: true, external_registries: [{ name: "Amazon", url: "https://amazon.com", image_url: "" }] }}
          onContentChange={mockOnContentChange}
        />
      )
      expect(screen.getByTestId("gift-registry-name-0")).toHaveValue("Amazon")
    })

    it("can add an external registry", async () => {
      const user = userEvent.setup()
      render(
        <GiftRegistryEditor
          content={{ show_external_registries: true, external_registries: [] }}
          onContentChange={mockOnContentChange}
        />
      )

      await user.click(screen.getByTestId("gift-registry-add"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          external_registries: [expect.objectContaining({ name: "", url: "" })],
        })
      )
    })

    it("can remove an external registry", async () => {
      const user = userEvent.setup()
      render(
        <GiftRegistryEditor
          content={{ show_external_registries: true, external_registries: [{ name: "A", url: "B", image_url: "" }] }}
          onContentChange={mockOnContentChange}
        />
      )

      await user.click(screen.getByTestId("gift-registry-remove-0"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ external_registries: [] })
      )
    })
  })

  // ── CTAEditor ──

  describe("CTAEditor", () => {
    it("renders with default content", () => {
      render(<CTAEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("cta-editor")).toBeInTheDocument()
    })

    it("calls onContentChange on heading change", async () => {
      const user = userEvent.setup()
      render(<CTAEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.type(screen.getByTestId("cta-heading"), "R")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ heading: "R" })
      )
    })

    it("can change button style", async () => {
      const user = userEvent.setup()
      render(<CTAEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.selectOptions(screen.getByTestId("cta-button-style"), "outline")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ button_style: "outline" })
      )
    })

    it("renders all required fields", () => {
      render(
        <CTAEditor
          content={{ heading: "Go", button_text: "Click", button_url: "#rsvp", button_style: "ghost" }}
          onContentChange={mockOnContentChange}
        />
      )
      expect(screen.getByTestId("cta-heading")).toHaveValue("Go")
      expect(screen.getByTestId("cta-button-text")).toHaveValue("Click")
      expect(screen.getByTestId("cta-button-url")).toHaveValue("#rsvp")
      expect(screen.getByTestId("cta-button-style")).toHaveValue("ghost")
    })
  })

  // ── FAQEditor ──

  describe("FAQEditor", () => {
    it("renders with default content", () => {
      render(<FAQEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("faq-editor")).toBeInTheDocument()
    })

    it("can add a FAQ item", async () => {
      const user = userEvent.setup()
      render(<FAQEditor content={{ items: [] }} onContentChange={mockOnContentChange} />)

      await user.click(screen.getByTestId("faq-add"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [expect.objectContaining({ question: "", answer: "" })],
        })
      )
    })

    it("can remove a FAQ item", async () => {
      const user = userEvent.setup()
      const items = [{ question: "Q?", answer: "A." }]
      render(<FAQEditor content={{ items }} onContentChange={mockOnContentChange} />)

      await user.click(screen.getByTestId("faq-remove-0"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ items: [] })
      )
    })

    it("can update a FAQ question", async () => {
      const user = userEvent.setup()
      const items = [{ question: "", answer: "" }]
      render(<FAQEditor content={{ items }} onContentChange={mockOnContentChange} />)

      await user.type(screen.getByTestId("faq-question-0"), "W")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [expect.objectContaining({ question: "W" })],
        })
      )
    })

    it("can change layout", async () => {
      const user = userEvent.setup()
      render(<FAQEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.selectOptions(screen.getByTestId("faq-layout"), "list")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ layout: "list" })
      )
    })
  })

  // ── TextEditor ──

  describe("TextEditor", () => {
    it("renders with default content", () => {
      render(<TextEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("text-editor")).toBeInTheDocument()
      expect(screen.getByTestId("text-alignment")).toHaveValue("left")
    })

    it("calls onContentChange on body change", async () => {
      const user = userEvent.setup()
      render(<TextEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.type(screen.getByTestId("text-body"), "H")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ body: "H" })
      )
    })

    it("can change alignment", async () => {
      const user = userEvent.setup()
      render(<TextEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.selectOptions(screen.getByTestId("text-alignment"), "center")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ alignment: "center" })
      )
    })
  })

  // ── QuoteEditor ──

  describe("QuoteEditor", () => {
    it("renders with default content", () => {
      render(<QuoteEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("quote-editor")).toBeInTheDocument()
      expect(screen.getByTestId("quote-style")).toHaveValue("simple")
    })

    it("calls onContentChange on text change", async () => {
      const user = userEvent.setup()
      render(<QuoteEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.type(screen.getByTestId("quote-text"), "L")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ text: "L" })
      )
    })

    it("can change quote style", async () => {
      const user = userEvent.setup()
      render(<QuoteEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.selectOptions(screen.getByTestId("quote-style"), "decorative")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ style: "decorative" })
      )
    })
  })

  // ── DividerEditor ──

  describe("DividerEditor", () => {
    it("renders with default content", () => {
      render(<DividerEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("divider-editor")).toBeInTheDocument()
      expect(screen.getByTestId("divider-style")).toHaveValue("line")
      expect(screen.getByTestId("divider-spacing")).toHaveValue("md")
    })

    it("can change style", async () => {
      const user = userEvent.setup()
      render(<DividerEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.selectOptions(screen.getByTestId("divider-style"), "dots")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ style: "dots" })
      )
    })

    it("can change spacing", async () => {
      const user = userEvent.setup()
      render(<DividerEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.selectOptions(screen.getByTestId("divider-spacing"), "lg")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ spacing: "lg" })
      )
    })
  })

  // ── CustomHTMLEditor ──

  describe("CustomHTMLEditor", () => {
    it("renders with default content", () => {
      render(<CustomHTMLEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("custom-html-editor")).toBeInTheDocument()
    })

    it("calls onContentChange on HTML change", async () => {
      const user = userEvent.setup()
      render(<CustomHTMLEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.type(screen.getByTestId("custom-html-html"), "<")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ html: "<" })
      )
    })

    it("renders CSS field", () => {
      render(
        <CustomHTMLEditor
          content={{ css: ".test { color: red; }" }}
          onContentChange={mockOnContentChange}
        />
      )
      expect(screen.getByTestId("custom-html-css")).toHaveValue(".test { color: red; }")
    })

    it("renders sandbox toggle", () => {
      render(<CustomHTMLEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("custom-html-sandbox")).toBeInTheDocument()
    })
  })

  // ── GalleryEditor ──

  describe("GalleryEditor", () => {
    it("renders with default content", () => {
      render(<GalleryEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("gallery-editor")).toBeInTheDocument()
      expect(screen.getByTestId("gallery-layout")).toHaveValue("grid")
    })

    it("can change layout", async () => {
      const user = userEvent.setup()
      render(<GalleryEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.selectOptions(screen.getByTestId("gallery-layout"), "masonry")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ layout: "masonry" })
      )
    })

    it("shows columns slider for non-carousel layouts", () => {
      render(<GalleryEditor content={{ layout: "grid" }} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("gallery-columns")).toBeInTheDocument()
    })

    it("hides columns slider for carousel layout", () => {
      render(<GalleryEditor content={{ layout: "carousel" }} onContentChange={mockOnContentChange} />)
      expect(screen.queryByTestId("gallery-columns")).not.toBeInTheDocument()
    })
  })

  // ── Registry ──

  describe("Section Editor Registry", () => {
    it("has editors for all 24 section types", () => {
      expect(Object.keys(SECTION_EDITOR_REGISTRY)).toHaveLength(24)
    })

    it("getSectionEditor returns correct editor for known type", () => {
      const editor = getSectionEditor("hero")
      expect(editor).toBe(SECTION_EDITOR_REGISTRY.hero)
    })

    it("getSectionEditor returns null for unknown type", () => {
      const editor = getSectionEditor("nonexistent" as never)
      expect(editor).toBeNull()
    })

    it("all registry entries are valid components", () => {
      for (const [type, Editor] of Object.entries(SECTION_EDITOR_REGISTRY)) {
        expect(typeof Editor).toBe("function")
        // Quick smoke test: render each editor
        const { container } = render(
          <Editor content={{}} onContentChange={mockOnContentChange} />
        )
        expect(container.firstChild).toBeTruthy()
      }
    })
  })
})

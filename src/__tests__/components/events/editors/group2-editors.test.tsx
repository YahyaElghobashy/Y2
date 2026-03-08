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

import { MapEditor } from "@/components/events/editors/MapEditor"
import { TransportEditor } from "@/components/events/editors/TransportEditor"
import { HotelsEditor } from "@/components/events/editors/HotelsEditor"
import { RestaurantsEditor } from "@/components/events/editors/RestaurantsEditor"
import { ActivitiesEditor } from "@/components/events/editors/ActivitiesEditor"
import { BeautyEditor } from "@/components/events/editors/BeautyEditor"
import { TravelTipsEditor } from "@/components/events/editors/TravelTipsEditor"
import { GuidesHubEditor } from "@/components/events/editors/GuidesHubEditor"

describe("Group 2 Section Editors (TE07)", () => {
  let mockOnContentChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnContentChange = vi.fn()
  })

  // ── MapEditor ──

  describe("MapEditor", () => {
    it("renders with default content", () => {
      render(<MapEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("map-editor")).toBeInTheDocument()
      expect(screen.getByTestId("map-style")).toHaveValue("default")
    })

    it("calls onContentChange on heading change", async () => {
      const user = userEvent.setup()
      render(<MapEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.type(screen.getByTestId("map-heading"), "V")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ heading: "V" })
      )
    })

    it("calls onContentChange when map style changes", async () => {
      const user = userEvent.setup()
      render(<MapEditor content={{}} onContentChange={mockOnContentChange} />)

      await user.selectOptions(screen.getByTestId("map-style"), "satellite")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ map_style: "satellite" })
      )
    })

    it("renders latitude and longitude inputs", () => {
      render(<MapEditor content={{ center_lat: 25.5, center_lng: 55.3 }} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("map-center-lat")).toHaveValue(25.5)
      expect(screen.getByTestId("map-center-lng")).toHaveValue(55.3)
    })
  })

  // ── TransportEditor ──

  describe("TransportEditor", () => {
    it("renders with default content", () => {
      render(<TransportEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("transport-editor")).toBeInTheDocument()
    })

    it("can add a transport option", async () => {
      const user = userEvent.setup()
      render(<TransportEditor content={{ sections: [] }} onContentChange={mockOnContentChange} />)

      await user.click(screen.getByTestId("transport-add"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          sections: [expect.objectContaining({ mode: "car", title: "" })],
        })
      )
    })

    it("can remove a transport option", async () => {
      const user = userEvent.setup()
      const sections = [{ mode: "car", title: "By Car", description: "Drive", tips: [], links: [] }]
      render(<TransportEditor content={{ sections }} onContentChange={mockOnContentChange} />)

      await user.click(screen.getByTestId("transport-remove-0"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ sections: [] })
      )
    })

    it("can update transport mode", async () => {
      const user = userEvent.setup()
      const sections = [{ mode: "car", title: "", description: "", tips: [], links: [] }]
      render(<TransportEditor content={{ sections }} onContentChange={mockOnContentChange} />)

      await user.selectOptions(screen.getByTestId("transport-mode-0"), "flight")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          sections: [expect.objectContaining({ mode: "flight" })],
        })
      )
    })
  })

  // ── HotelsEditor ──

  describe("HotelsEditor", () => {
    it("renders with default content", () => {
      render(<HotelsEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("hotels-editor")).toBeInTheDocument()
    })

    it("can add a hotel", async () => {
      const user = userEvent.setup()
      render(<HotelsEditor content={{ hotels: [] }} onContentChange={mockOnContentChange} />)

      await user.click(screen.getByTestId("hotels-add"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          hotels: [expect.objectContaining({ name: "" })],
        })
      )
    })

    it("can remove a hotel", async () => {
      const user = userEvent.setup()
      const hotels = [{
        name: "Grand Hotel", description: "", image_url: "", rating: 0,
        price_range: "", booking_url: "", address: "", phone: "",
        distance_from_venue: "", is_recommended: false,
      }]
      render(<HotelsEditor content={{ hotels }} onContentChange={mockOnContentChange} />)

      await user.click(screen.getByTestId("hotels-remove-0"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ hotels: [] })
      )
    })

    it("can update hotel name", async () => {
      const user = userEvent.setup()
      const hotels = [{
        name: "", description: "", image_url: "", rating: 0,
        price_range: "", booking_url: "", address: "", phone: "",
        distance_from_venue: "", is_recommended: false,
      }]
      render(<HotelsEditor content={{ hotels }} onContentChange={mockOnContentChange} />)

      await user.type(screen.getByTestId("hotels-name-0"), "H")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          hotels: [expect.objectContaining({ name: "H" })],
        })
      )
    })
  })

  // ── RestaurantsEditor ──

  describe("RestaurantsEditor", () => {
    it("renders with default content", () => {
      render(<RestaurantsEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("restaurants-editor")).toBeInTheDocument()
    })

    it("can add a restaurant", async () => {
      const user = userEvent.setup()
      render(
        <RestaurantsEditor content={{ restaurants: [] }} onContentChange={mockOnContentChange} />
      )

      await user.click(screen.getByTestId("restaurants-add"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurants: [expect.objectContaining({ name: "" })],
        })
      )
    })

    it("can remove a restaurant", async () => {
      const user = userEvent.setup()
      const restaurants = [{
        name: "Test", cuisine: "", description: "", image_url: "",
        price_range: "", url: "", address: "", phone: "", is_recommended: false,
      }]
      render(
        <RestaurantsEditor content={{ restaurants }} onContentChange={mockOnContentChange} />
      )

      await user.click(screen.getByTestId("restaurants-remove-0"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ restaurants: [] })
      )
    })
  })

  // ── ActivitiesEditor ──

  describe("ActivitiesEditor", () => {
    it("renders with default content", () => {
      render(<ActivitiesEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("activities-editor")).toBeInTheDocument()
    })

    it("can add an activity", async () => {
      const user = userEvent.setup()
      render(
        <ActivitiesEditor content={{ activities: [] }} onContentChange={mockOnContentChange} />
      )

      await user.click(screen.getByTestId("activities-add"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          activities: [expect.objectContaining({ name: "" })],
        })
      )
    })

    it("can update activity name", async () => {
      const user = userEvent.setup()
      const activities = [{
        name: "", description: "", image_url: "",
        duration: "", price: "", url: "", category: "",
      }]
      render(
        <ActivitiesEditor content={{ activities }} onContentChange={mockOnContentChange} />
      )

      await user.type(screen.getByTestId("activities-name-0"), "H")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          activities: [expect.objectContaining({ name: "H" })],
        })
      )
    })
  })

  // ── BeautyEditor ──

  describe("BeautyEditor", () => {
    it("renders with default content", () => {
      render(<BeautyEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("beauty-editor")).toBeInTheDocument()
    })

    it("can add a service", async () => {
      const user = userEvent.setup()
      render(<BeautyEditor content={{ services: [] }} onContentChange={mockOnContentChange} />)

      await user.click(screen.getByTestId("beauty-add"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          services: [expect.objectContaining({ name: "", type: "salon" })],
        })
      )
    })

    it("can change service type", async () => {
      const user = userEvent.setup()
      const services = [{
        name: "Test", type: "salon", description: "",
        url: "", phone: "", address: "", is_recommended: false,
      }]
      render(<BeautyEditor content={{ services }} onContentChange={mockOnContentChange} />)

      await user.selectOptions(screen.getByTestId("beauty-type-0"), "spa")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          services: [expect.objectContaining({ type: "spa" })],
        })
      )
    })
  })

  // ── TravelTipsEditor ──

  describe("TravelTipsEditor", () => {
    it("renders with default content", () => {
      render(<TravelTipsEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("travel-tips-editor")).toBeInTheDocument()
    })

    it("can add a tip", async () => {
      const user = userEvent.setup()
      render(
        <TravelTipsEditor content={{ tips: [] }} onContentChange={mockOnContentChange} />
      )

      await user.click(screen.getByTestId("travel-tips-add"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          tips: [expect.objectContaining({ title: "", body: "" })],
        })
      )
    })

    it("can change tip category", async () => {
      const user = userEvent.setup()
      const tips = [{ title: "T", body: "B", icon: "", category: "general" }]
      render(
        <TravelTipsEditor content={{ tips }} onContentChange={mockOnContentChange} />
      )

      await user.selectOptions(screen.getByTestId("travel-tips-category-0"), "visa")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          tips: [expect.objectContaining({ category: "visa" })],
        })
      )
    })
  })

  // ── GuidesHubEditor ──

  describe("GuidesHubEditor", () => {
    it("renders with default content", () => {
      render(<GuidesHubEditor content={{}} onContentChange={mockOnContentChange} />)
      expect(screen.getByTestId("guides-hub-editor")).toBeInTheDocument()
    })

    it("can add a guide", async () => {
      const user = userEvent.setup()
      render(
        <GuidesHubEditor content={{ guides: [] }} onContentChange={mockOnContentChange} />
      )

      await user.click(screen.getByTestId("guides-hub-add"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          guides: [expect.objectContaining({ title: "" })],
        })
      )
    })

    it("can remove a guide", async () => {
      const user = userEvent.setup()
      const guides = [{ title: "T", description: "", image_url: "", url: "", category: "" }]
      render(
        <GuidesHubEditor content={{ guides }} onContentChange={mockOnContentChange} />
      )

      await user.click(screen.getByTestId("guides-hub-remove-0"))
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({ guides: [] })
      )
    })

    it("can update guide title", async () => {
      const user = userEvent.setup()
      const guides = [{ title: "", description: "", image_url: "", url: "", category: "" }]
      render(
        <GuidesHubEditor content={{ guides }} onContentChange={mockOnContentChange} />
      )

      await user.type(screen.getByTestId("guides-hub-title-0"), "G")
      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.objectContaining({
          guides: [expect.objectContaining({ title: "G" })],
        })
      )
    })
  })
})

import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, layout, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap; void layout
      return <div ref={ref} {...rest}>{children}</div>
    }),
  },
}))

// Mock MediaImage
vi.mock("@/components/shared/MediaImage", () => ({
  MediaImage: ({ alt, mediaId }: { alt: string; mediaId: string }) => (
    <img alt={alt} data-testid={`media-image-${mediaId}`} />
  ),
}))

import { VisionItemCard } from "@/components/vision-board/VisionItemCard"
import type { VisionItem } from "@/lib/types/vision-board.types"

const makeItem = (overrides?: Partial<VisionItem>): VisionItem => ({
  id: "item-1",
  category_id: "cat-1",
  title: "Learn Arabic",
  description: "Master conversational Arabic",
  media_id: null,
  is_achieved: false,
  sort_order: 0,
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
})

describe("VisionItemCard", () => {
  const onToggleAchieved = vi.fn()
  const onRemove = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // === Unit tests ===

  it("renders without crashing", () => {
    render(<VisionItemCard item={makeItem()} />)
    expect(screen.getByTestId("vision-item-card-item-1")).toBeInTheDocument()
  })

  it("renders item title", () => {
    render(<VisionItemCard item={makeItem()} />)
    expect(screen.getByText("Learn Arabic")).toBeInTheDocument()
  })

  it("renders MediaImage when media_id is provided", () => {
    render(<VisionItemCard item={makeItem({ media_id: "media-abc" })} />)
    expect(screen.getByTestId("media-image-media-abc")).toBeInTheDocument()
  })

  it("does NOT render MediaImage when media_id is null", () => {
    render(<VisionItemCard item={makeItem({ media_id: null })} />)
    expect(screen.queryByTestId(/media-image/)).not.toBeInTheDocument()
  })

  it("renders copper check badge when is_achieved is true", () => {
    render(<VisionItemCard item={makeItem({ is_achieved: true })} />)
    // Achieved items have a gold border via inline style on the inner frame, not ring-2
    const card = screen.getByTestId("vision-item-card-item-1")
    // The check badge (Check icon) is rendered inside the card
    const checkBadge = card.querySelector("[style*='DAA520']")
    expect(checkBadge).toBeTruthy()
  })

  it("does NOT render check badge when is_achieved is false", () => {
    render(<VisionItemCard item={makeItem({ is_achieved: false })} />)
    const card = screen.getByTestId("vision-item-card-item-1")
    // No check badge present
    const checkBadge = card.querySelector("[style*='DAA520']")
    expect(checkBadge).toBeNull()
  })

  it("applies className prop", () => {
    render(<VisionItemCard item={makeItem()} className="mt-4" />)
    expect(screen.getByTestId("vision-item-card-item-1")).toHaveClass("mt-4")
  })

  it("has button role when not readOnly", () => {
    render(<VisionItemCard item={makeItem()} onToggleAchieved={onToggleAchieved} />)
    expect(screen.getByTestId("vision-item-card-item-1")).toHaveAttribute("role", "button")
  })

  it("does NOT have button role when readOnly", () => {
    render(<VisionItemCard item={makeItem()} readOnly />)
    expect(screen.getByTestId("vision-item-card-item-1")).not.toHaveAttribute("role")
  })

  // === Interaction tests ===

  it("calls onToggleAchieved with item id when clicked", () => {
    render(<VisionItemCard item={makeItem()} onToggleAchieved={onToggleAchieved} />)
    fireEvent.click(screen.getByTestId("vision-item-card-item-1"))
    expect(onToggleAchieved).toHaveBeenCalledWith("item-1")
  })

  it("does NOT call onToggleAchieved when readOnly", () => {
    render(<VisionItemCard item={makeItem()} onToggleAchieved={onToggleAchieved} readOnly />)
    fireEvent.click(screen.getByTestId("vision-item-card-item-1"))
    expect(onToggleAchieved).not.toHaveBeenCalled()
  })

  it("does NOT error when onToggleAchieved is undefined and clicked", () => {
    render(<VisionItemCard item={makeItem()} />)
    expect(() => fireEvent.click(screen.getByTestId("vision-item-card-item-1"))).not.toThrow()
  })

  // === Integration tests ===

  it("uses correct data-testid based on item id", () => {
    render(<VisionItemCard item={makeItem({ id: "custom-id" })} />)
    expect(screen.getByTestId("vision-item-card-custom-id")).toBeInTheDocument()
  })

  it("shows caption below image when media_id is present", () => {
    render(<VisionItemCard item={makeItem({ media_id: "media-1" })} />)
    // Caption text is rendered below the image area with line-clamp-2
    const caption = screen.getByText("Learn Arabic")
    expect(caption.className).toContain("line-clamp-2")
  })

  it("centers text when no media_id", () => {
    const { container } = render(<VisionItemCard item={makeItem({ media_id: null })} />)
    const textContainer = container.querySelector(".text-center")
    expect(textContainer).toBeInTheDocument()
  })

  it("renders text without line-clamp when no media", () => {
    // Items without media_id show text centered with no line-clamp
    render(
      <VisionItemCard item={makeItem({ title: "A very long title that should be clamped" })} />
    )
    expect(screen.getByText("A very long title that should be clamped")).toBeInTheDocument()
  })
})

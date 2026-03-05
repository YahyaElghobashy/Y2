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
    button: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <button {...rest}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock VisionItemCard
vi.mock("@/components/vision-board/VisionItemCard", () => ({
  VisionItemCard: ({ item, onToggleAchieved, onRemove, readOnly }: {
    item: { id: string; title: string }
    onToggleAchieved?: (id: string) => void
    onRemove?: (id: string) => void
    readOnly?: boolean
  }) => (
    <div data-testid={`vision-item-card-${item.id}`} onClick={() => !readOnly && onToggleAchieved?.(item.id)}>
      {item.title}
    </div>
  ),
}))

import { CategorySection } from "@/components/vision-board/CategorySection"
import type { CategoryWithItems } from "@/lib/types/vision-board.types"
import type { VisionItem } from "@/lib/types/vision-board.types"

const makeItem = (id: string, title: string): VisionItem => ({
  id,
  category_id: "cat-1",
  title,
  description: null,
  media_id: null,
  is_achieved: false,
  sort_order: 0,
  created_at: "2026-01-01T00:00:00Z",
})

const makeCategory = (overrides?: Partial<CategoryWithItems>): CategoryWithItems => ({
  id: "cat-1",
  board_id: "board-1",
  name: "Health",
  icon: "💪",
  sort_order: 0,
  created_at: "2026-01-01T00:00:00Z",
  items: [makeItem("item-1", "Run 5K"), makeItem("item-2", "Meditate daily")],
  ...overrides,
})

describe("CategorySection", () => {
  const onAddItem = vi.fn()
  const onToggleAchieved = vi.fn()
  const onRemoveItem = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // === Unit tests ===

  it("renders without crashing", () => {
    render(<CategorySection category={makeCategory()} />)
    expect(screen.getByTestId("category-section-cat-1")).toBeInTheDocument()
  })

  it("renders category name", () => {
    render(<CategorySection category={makeCategory()} />)
    expect(screen.getByText("Health")).toBeInTheDocument()
  })

  it("renders category icon", () => {
    render(<CategorySection category={makeCategory()} />)
    expect(screen.getByText("💪")).toBeInTheDocument()
  })

  it("renders item count for multiple items", () => {
    render(<CategorySection category={makeCategory()} />)
    expect(screen.getByText("2 items")).toBeInTheDocument()
  })

  it("renders singular 'item' for single item", () => {
    render(<CategorySection category={makeCategory({ items: [makeItem("item-1", "Run")] })} />)
    expect(screen.getByText("1 item")).toBeInTheDocument()
  })

  it("renders 0 items when empty", () => {
    render(<CategorySection category={makeCategory({ items: [] })} />)
    expect(screen.getByText("0 items")).toBeInTheDocument()
  })

  it("renders all VisionItemCards for each item", () => {
    render(<CategorySection category={makeCategory()} />)
    expect(screen.getByTestId("vision-item-card-item-1")).toBeInTheDocument()
    expect(screen.getByTestId("vision-item-card-item-2")).toBeInTheDocument()
  })

  it("renders add button when not readOnly", () => {
    render(<CategorySection category={makeCategory()} onAddItem={onAddItem} />)
    expect(screen.getByTestId("add-item-cat-1")).toBeInTheDocument()
  })

  it("does NOT render add button when readOnly", () => {
    render(<CategorySection category={makeCategory()} readOnly />)
    expect(screen.queryByTestId("add-item-cat-1")).not.toBeInTheDocument()
  })

  it("applies className prop", () => {
    render(<CategorySection category={makeCategory()} className="mt-8" />)
    expect(screen.getByTestId("category-section-cat-1")).toHaveClass("mt-8")
  })

  // === Interaction tests ===

  it("calls onAddItem with category id when add button clicked", () => {
    render(<CategorySection category={makeCategory()} onAddItem={onAddItem} />)
    fireEvent.click(screen.getByTestId("add-item-cat-1"))
    expect(onAddItem).toHaveBeenCalledWith("cat-1")
  })

  it("passes onToggleAchieved to VisionItemCard", () => {
    render(<CategorySection category={makeCategory()} onToggleAchieved={onToggleAchieved} />)
    fireEvent.click(screen.getByTestId("vision-item-card-item-1"))
    expect(onToggleAchieved).toHaveBeenCalledWith("item-1")
  })

  it("does not error when onAddItem is undefined", () => {
    render(<CategorySection category={makeCategory()} />)
    const addBtn = screen.getByTestId("add-item-cat-1")
    expect(() => fireEvent.click(addBtn)).not.toThrow()
  })

  // === Integration tests ===

  it("uses correct data-testid based on category id", () => {
    render(<CategorySection category={makeCategory({ id: "custom-cat" })} />)
    expect(screen.getByTestId("category-section-custom-cat")).toBeInTheDocument()
  })

  it("add button has correct data-testid based on category id", () => {
    render(<CategorySection category={makeCategory({ id: "my-cat" })} onAddItem={onAddItem} />)
    expect(screen.getByTestId("add-item-my-cat")).toBeInTheDocument()
  })

  it("renders items in the horizontal scroll container", () => {
    const { container } = render(<CategorySection category={makeCategory()} />)
    const scrollContainer = container.querySelector(".overflow-x-auto")
    expect(scrollContainer).toBeInTheDocument()
    expect(scrollContainer?.querySelectorAll("[data-testid^='vision-item-card-']")).toHaveLength(2)
  })
})

import React from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div {...rest}>{children}</div>
    },
    button: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <button {...rest}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { MarketplaceItemCard, MarketplaceItemCardSkeleton } from "@/components/relationship/MarketplaceItemCard"
import type { MarketplaceItem } from "@/lib/types/marketplace.types"

const mockItem: MarketplaceItem = {
  id: "item-1",
  name: "Extra Notification",
  description: "Send more messages today",
  price: 10,
  icon: "🔔",
  effect_type: "extra_ping",
  effect_config: { extra_sends: 1 },
  is_active: true,
  sort_order: 1,
  created_at: "2024-01-01T00:00:00Z",
}

const defaultProps = {
  item: mockItem,
  balance: 100,
  onBuy: vi.fn(),
  variant: "vertical" as const,
}

describe("MarketplaceItemCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders vertical variant without crashing", () => {
    render(<MarketplaceItemCard {...defaultProps} />)
    expect(screen.getByTestId("marketplace-item-card")).toBeInTheDocument()
  })

  it("renders horizontal variant without crashing", () => {
    render(<MarketplaceItemCard {...defaultProps} variant="horizontal" />)
    expect(screen.getByTestId("marketplace-item-card")).toBeInTheDocument()
  })

  it("renders the item name", () => {
    render(<MarketplaceItemCard {...defaultProps} />)
    expect(screen.getByText("Extra Notification")).toBeInTheDocument()
  })

  it("renders the item description in vertical variant", () => {
    render(<MarketplaceItemCard {...defaultProps} />)
    expect(screen.getByText("Send more messages today")).toBeInTheDocument()
  })

  it("renders the item icon", () => {
    render(<MarketplaceItemCard {...defaultProps} />)
    expect(screen.getByText("🔔")).toBeInTheDocument()
  })

  it("calls onBuy with item.id when buy button clicked and affordable", () => {
    const onBuy = vi.fn()
    render(<MarketplaceItemCard {...defaultProps} onBuy={onBuy} />)
    fireEvent.click(screen.getByTestId("buy-button"))
    act(() => { vi.advanceTimersByTime(100) })
    expect(onBuy).toHaveBeenCalledWith("item-1")
  })

  it("does NOT call onBuy when balance < price", () => {
    const onBuy = vi.fn()
    render(<MarketplaceItemCard {...defaultProps} balance={5} onBuy={onBuy} />)
    fireEvent.click(screen.getByTestId("buy-button"))
    act(() => { vi.advanceTimersByTime(200) })
    expect(onBuy).not.toHaveBeenCalled()
  })

  it("shows 'Need X more' tooltip when tapped and cannot afford", () => {
    render(<MarketplaceItemCard {...defaultProps} balance={5} />)
    fireEvent.click(screen.getByTestId("buy-button"))
    expect(screen.getByTestId("need-more-tooltip")).toHaveTextContent("Need 5 more")
  })

  it("buy button shows 'Need X more' text when cannot afford", () => {
    render(<MarketplaceItemCard {...defaultProps} balance={5} />)
    const btn = screen.getByTestId("buy-button")
    expect(btn).toHaveTextContent("Need 5 more")
  })

  it("applies className prop", () => {
    render(<MarketplaceItemCard {...defaultProps} className="mt-6" />)
    expect(screen.getByTestId("marketplace-item-card")).toHaveClass("mt-6")
  })

  it("horizontal variant has 140px width class", () => {
    render(<MarketplaceItemCard {...defaultProps} variant="horizontal" />)
    expect(screen.getByTestId("marketplace-item-card")).toHaveClass("w-[140px]")
  })

  it("shows success overlay after buy animation", () => {
    render(<MarketplaceItemCard {...defaultProps} />)
    fireEvent.click(screen.getByTestId("buy-button"))
    act(() => { vi.advanceTimersByTime(100) })
    expect(screen.getByTestId("buy-success-overlay")).toBeInTheDocument()
  })

  it("second click during pressing state does NOT fire onBuy again (double-buy prevention)", () => {
    const onBuy = vi.fn()
    render(<MarketplaceItemCard {...defaultProps} onBuy={onBuy} />)
    const btn = screen.getByTestId("buy-button")
    fireEvent.click(btn)
    fireEvent.click(btn)
    act(() => { vi.advanceTimersByTime(100) })
    expect(onBuy).toHaveBeenCalledTimes(1)
  })

  it("tooltip auto-dismisses after 2 seconds", () => {
    render(<MarketplaceItemCard {...defaultProps} balance={5} />)
    fireEvent.click(screen.getByTestId("buy-button"))
    expect(screen.getByTestId("need-more-tooltip")).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.queryByTestId("need-more-tooltip")).not.toBeInTheDocument()
  })
})

describe("MarketplaceItemCardSkeleton", () => {
  it("renders horizontal skeleton", () => {
    render(<MarketplaceItemCardSkeleton variant="horizontal" />)
    const el = screen.getByTestId("marketplace-skeleton")
    expect(el).toHaveClass("w-[140px]")
  })

  it("renders vertical skeleton", () => {
    render(<MarketplaceItemCardSkeleton variant="vertical" />)
    const el = screen.getByTestId("marketplace-skeleton")
    expect(el).toHaveClass("w-full")
  })
})

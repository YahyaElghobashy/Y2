import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div {...rest}>{children}</div>
    },
  },
}))

import { MarketplaceItemCard } from "@/components/relationship/MarketplaceItemCard"

const defaultProps = {
  icon: "🔔",
  title: "Extra Notification",
  description: "Send more messages today",
  price: 25 as number | null,
}

describe("MarketplaceItemCard", () => {
  it("renders without crashing", () => {
    render(<MarketplaceItemCard {...defaultProps} />)
  })

  it("renders the title text", () => {
    render(<MarketplaceItemCard {...defaultProps} />)
    expect(screen.getByText("Extra Notification")).toBeInTheDocument()
  })

  it("renders the description text", () => {
    render(<MarketplaceItemCard {...defaultProps} />)
    expect(screen.getByText("Send more messages today")).toBeInTheDocument()
  })

  it("renders the icon emoji", () => {
    render(<MarketplaceItemCard {...defaultProps} />)
    expect(screen.getByText("🔔")).toBeInTheDocument()
  })

  it("renders the price in the price pill", () => {
    render(<MarketplaceItemCard {...defaultProps} />)
    expect(screen.getByTestId("price-pill")).toHaveTextContent("25")
  })

  it('renders "???" when price is null (coming soon)', () => {
    render(<MarketplaceItemCard {...defaultProps} price={null} available={false} />)
    expect(screen.getByTestId("price-pill")).toHaveTextContent("???")
  })

  it("applies opacity-70 when not affordable", () => {
    const { container } = render(
      <MarketplaceItemCard {...defaultProps} affordable={false} />
    )
    expect(container.firstChild).toHaveClass("opacity-70")
  })

  it("applies opacity-60 when not available (coming soon)", () => {
    const { container } = render(
      <MarketplaceItemCard {...defaultProps} available={false} />
    )
    expect(container.firstChild).toHaveClass("opacity-60")
  })

  it("calls onPurchase when clicked and affordable", () => {
    const handlePurchase = vi.fn()
    render(
      <MarketplaceItemCard {...defaultProps} onPurchase={handlePurchase} />
    )
    fireEvent.click(screen.getByTestId("marketplace-item-card"))
    expect(handlePurchase).toHaveBeenCalledOnce()
  })

  it("does NOT call onPurchase when not affordable", () => {
    const handlePurchase = vi.fn()
    render(
      <MarketplaceItemCard
        {...defaultProps}
        affordable={false}
        onPurchase={handlePurchase}
      />
    )
    fireEvent.click(screen.getByTestId("marketplace-item-card"))
    expect(handlePurchase).not.toHaveBeenCalled()
  })

  it("does NOT call onPurchase when not available", () => {
    const handlePurchase = vi.fn()
    render(
      <MarketplaceItemCard
        {...defaultProps}
        available={false}
        onPurchase={handlePurchase}
      />
    )
    fireEvent.click(screen.getByTestId("marketplace-item-card"))
    expect(handlePurchase).not.toHaveBeenCalled()
  })

  it("accepts className prop", () => {
    const { container } = render(
      <MarketplaceItemCard {...defaultProps} className="mt-6" />
    )
    expect(container.firstChild).toHaveClass("mt-6")
  })
})

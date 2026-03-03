import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

import { SendLimitIndicator } from "@/components/relationship/SendLimitIndicator"

describe("SendLimitIndicator", () => {
  it("renders with 2 sends remaining in success color", () => {
    render(<SendLimitIndicator remainingSends={2} />)
    expect(screen.getByTestId("send-limit-text")).toHaveTextContent("2 sends left")
  })

  it("renders with 1 send remaining", () => {
    render(<SendLimitIndicator remainingSends={1} />)
    expect(screen.getByTestId("send-limit-text")).toHaveTextContent("1 send left")
  })

  it("renders with 0 sends remaining", () => {
    render(<SendLimitIndicator remainingSends={0} />)
    expect(screen.getByTestId("send-limit-text")).toHaveTextContent("0 sends left")
  })

  it("shows buy more link when 0 sends and onBuyMore provided", () => {
    const onBuyMore = vi.fn()
    render(<SendLimitIndicator remainingSends={0} onBuyMore={onBuyMore} />)
    const buyBtn = screen.getByTestId("send-buy-more")
    expect(buyBtn).toBeInTheDocument()
    fireEvent.click(buyBtn)
    expect(onBuyMore).toHaveBeenCalledTimes(1)
  })

  it("does not show buy more when sends available", () => {
    render(<SendLimitIndicator remainingSends={1} onBuyMore={vi.fn()} />)
    expect(screen.queryByTestId("send-buy-more")).not.toBeInTheDocument()
  })

  it("renders two dot elements", () => {
    render(<SendLimitIndicator remainingSends={2} />)
    expect(screen.getByTestId("send-dot-0")).toBeInTheDocument()
    expect(screen.getByTestId("send-dot-1")).toBeInTheDocument()
  })

  it("accounts for bonus sends in total count", () => {
    render(<SendLimitIndicator remainingSends={0} bonusSends={3} />)
    expect(screen.getByTestId("send-limit-text")).toHaveTextContent("3 sends left")
  })
})

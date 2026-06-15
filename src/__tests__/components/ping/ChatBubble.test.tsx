import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// framer-motion stub — strip animation props, render a plain div
vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>>(
      ({ children, initial, animate, exit, transition, ...props }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown> & { children?: React.ReactNode }, ref: React.Ref<HTMLDivElement>) => {
        void initial; void animate; void exit; void transition
        return <div ref={ref} {...props}>{children}</div>
      }
    ),
  },
}))

import { ChatBubble } from "@/components/ping/ChatBubble"

describe("ChatBubble", () => {
  it("renders message and timestamp", () => {
    render(<ChatBubble message="Hello" timestamp="2m ago" direction="sent" />)
    expect(screen.getByText("Hello")).toBeInTheDocument()
    expect(screen.getByText("2m ago")).toBeInTheDocument()
  })

  it("renders emoji when provided", () => {
    render(<ChatBubble message="Hi" timestamp="now" direction="received" emoji="❤️" />)
    expect(screen.getByText("❤️")).toBeInTheDocument()
  })

  it("aligns sent bubbles to the end", () => {
    render(<ChatBubble message="mine" timestamp="now" direction="sent" />)
    expect(screen.getByText("mine").closest("[class*='chat-bubble-sent']")).toBeTruthy()
  })

  it("aligns received bubbles to the start", () => {
    render(<ChatBubble message="theirs" timestamp="now" direction="received" />)
    expect(screen.getByText("theirs").closest("[class*='chat-bubble-received']")).toBeTruthy()
  })

  // ── Delivery state ──

  it("shows a 'sent' delivery indicator on sent bubbles", () => {
    render(<ChatBubble message="m" timestamp="now" direction="sent" status="sent" />)
    const i = screen.getByTestId("delivery-status-sent")
    expect(i).toBeInTheDocument()
    expect(i).toHaveAttribute("aria-label", "Sent")
  })

  it("shows a 'delivered' delivery indicator on sent bubbles", () => {
    render(<ChatBubble message="m" timestamp="now" direction="sent" status="delivered" />)
    const i = screen.getByTestId("delivery-status-delivered")
    expect(i).toBeInTheDocument()
    expect(i).toHaveAttribute("aria-label", "Delivered")
  })

  it("shows a 'failed' delivery indicator on sent bubbles", () => {
    render(<ChatBubble message="m" timestamp="now" direction="sent" status="failed" />)
    const i = screen.getByTestId("delivery-status-failed")
    expect(i).toBeInTheDocument()
    expect(i).toHaveAttribute("aria-label", "Failed to deliver")
  })

  it("never shows a delivery indicator on received bubbles", () => {
    render(<ChatBubble message="m" timestamp="now" direction="received" status="delivered" />)
    expect(screen.queryByTestId("delivery-status-delivered")).not.toBeInTheDocument()
  })

  it("shows no delivery indicator when status is omitted", () => {
    render(<ChatBubble message="m" timestamp="now" direction="sent" />)
    expect(screen.queryByTestId("delivery-status-sent")).not.toBeInTheDocument()
    expect(screen.queryByTestId("delivery-status-delivered")).not.toBeInTheDocument()
  })
})

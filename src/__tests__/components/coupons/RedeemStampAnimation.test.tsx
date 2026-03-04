import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

let mockReducedMotion = false

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(({ children, onAnimationComplete, ...props }: { children?: React.ReactNode; onAnimationComplete?: () => void; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, ...rest } = props
      void initial; void animate; void exit; void transition
      // Simulate animation completion
      if (onAnimationComplete) {
        setTimeout(onAnimationComplete, 0)
      }
      return <div ref={ref} {...rest}>{children}</div>
    }),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => mockReducedMotion,
}))

import { RedeemStampAnimation } from "@/components/coupons/RedeemStampAnimation"

describe("RedeemStampAnimation", () => {
  it("does not render when visible is false", () => {
    render(<RedeemStampAnimation visible={false} />)
    expect(screen.queryByTestId("redeem-stamp")).not.toBeInTheDocument()
  })

  it("renders REDEEMED text when visible", () => {
    render(<RedeemStampAnimation visible={true} />)
    expect(screen.getByTestId("redeem-stamp")).toBeInTheDocument()
    expect(screen.getByText("REDEEMED")).toBeInTheDocument()
  })

  it("has role=status for accessibility", () => {
    render(<RedeemStampAnimation visible={true} />)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("calls onComplete after animation", async () => {
    const onComplete = vi.fn()
    render(<RedeemStampAnimation visible={true} onComplete={onComplete} />)
    // Wait for the simulated animation + 200ms timeout
    await vi.waitFor(() => {
      expect(onComplete).toHaveBeenCalled()
    }, { timeout: 1000 })
  })

  it("works with reduced motion preference", () => {
    mockReducedMotion = true
    render(<RedeemStampAnimation visible={true} />)
    expect(screen.getByText("REDEEMED")).toBeInTheDocument()
    mockReducedMotion = false
  })
})

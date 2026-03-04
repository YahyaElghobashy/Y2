import React from "react"
import { render, screen, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

let mockReducedMotion = false

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      (
        {
          children,
          onAnimationComplete,
          initial,
          animate,
          exit,
          transition,
          whileTap,
          ...rest
        }: {
          children?: React.ReactNode
          onAnimationComplete?: () => void
          initial?: unknown
          animate?: unknown
          exit?: unknown
          transition?: unknown
          whileTap?: unknown
          [key: string]: unknown
        },
        ref: React.Ref<HTMLDivElement>
      ) => {
        void initial
        void animate
        void exit
        void transition
        void whileTap
        if (onAnimationComplete) setTimeout(onAnimationComplete, 0)
        return (
          <div ref={ref} {...rest}>
            {children}
          </div>
        )
      }
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useReducedMotion: () => mockReducedMotion,
}))

import { RedeemStampAnimation } from "@/components/coupons/RedeemStampAnimation"

describe("RedeemStampAnimation", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockReducedMotion = false
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
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

    it("has correct aria-label", () => {
      render(<RedeemStampAnimation visible={true} />)
      expect(screen.getByLabelText("Coupon redeemed")).toBeInTheDocument()
    })

    it("renders stamp container with animation elements", () => {
      render(<RedeemStampAnimation visible={true} />)
      expect(screen.getByTestId("stamp-container")).toBeInTheDocument()
    })

    it("renders 8 ink splatter dots", () => {
      render(<RedeemStampAnimation visible={true} />)
      const dots = screen.getAllByTestId("ink-dot")
      expect(dots).toHaveLength(8)
    })

    it("ink dots use copper-red color (#B85C4A)", () => {
      render(<RedeemStampAnimation visible={true} />)
      const dots = screen.getAllByTestId("ink-dot")
      dots.forEach((dot) => {
        expect(dot.style.backgroundColor).toBe("rgb(184, 92, 74)")
      })
    })

    it("applies custom className", () => {
      render(<RedeemStampAnimation visible={true} className="my-test" />)
      const stamp = screen.getByTestId("redeem-stamp")
      expect(stamp.className).toContain("my-test")
    })

    it("uses redeemed-text data-testid on the text element", () => {
      render(<RedeemStampAnimation visible={true} />)
      expect(screen.getByTestId("redeemed-text")).toHaveTextContent("REDEEMED")
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("calls onComplete after ~1500ms animation", () => {
      const onComplete = vi.fn()
      render(<RedeemStampAnimation visible={true} onComplete={onComplete} />)

      expect(onComplete).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(1500)
      })

      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it("does not call onComplete before animation finishes", () => {
      const onComplete = vi.fn()
      render(<RedeemStampAnimation visible={true} onComplete={onComplete} />)

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(onComplete).not.toHaveBeenCalled()
    })

    it("calls onComplete quickly with reduced motion", () => {
      mockReducedMotion = true
      const onComplete = vi.fn()
      render(<RedeemStampAnimation visible={true} onComplete={onComplete} />)

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it("works without onComplete callback", () => {
      expect(() => {
        render(<RedeemStampAnimation visible={true} />)
        act(() => {
          vi.advanceTimersByTime(1500)
        })
      }).not.toThrow()
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("cleans up timer on unmount", () => {
      const onComplete = vi.fn()
      const { unmount } = render(
        <RedeemStampAnimation visible={true} onComplete={onComplete} />
      )

      unmount()

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(onComplete).not.toHaveBeenCalled()
    })

    it("shows reduced motion layout (no stamp-container, no ink dots)", () => {
      mockReducedMotion = true
      render(<RedeemStampAnimation visible={true} />)

      expect(screen.getByText("REDEEMED")).toBeInTheDocument()
      expect(screen.queryByTestId("stamp-container")).not.toBeInTheDocument()
      expect(screen.queryByTestId("ink-dot")).not.toBeInTheDocument()
    })

    it("transitions from visible to hidden", () => {
      const { rerender } = render(
        <RedeemStampAnimation visible={true} />
      )
      expect(screen.getByTestId("redeem-stamp")).toBeInTheDocument()

      rerender(<RedeemStampAnimation visible={false} />)
      expect(screen.queryByTestId("redeem-stamp")).not.toBeInTheDocument()
    })

    it("can be re-triggered (multi-cycle)", () => {
      const onComplete = vi.fn()
      const { rerender } = render(
        <RedeemStampAnimation visible={true} onComplete={onComplete} />
      )

      act(() => {
        vi.advanceTimersByTime(1500)
      })
      expect(onComplete).toHaveBeenCalledTimes(1)

      // Hide then show again
      rerender(<RedeemStampAnimation visible={false} onComplete={onComplete} />)
      rerender(<RedeemStampAnimation visible={true} onComplete={onComplete} />)

      act(() => {
        vi.advanceTimersByTime(1500)
      })
      expect(onComplete).toHaveBeenCalledTimes(2)
    })
  })
})

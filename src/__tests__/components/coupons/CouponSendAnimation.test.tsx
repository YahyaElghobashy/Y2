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
        if (onAnimationComplete) {
          setTimeout(onAnimationComplete, 0)
        }
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

import { CouponSendAnimation } from "@/components/coupons/CouponSendAnimation"

describe("CouponSendAnimation", () => {
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
      const onComplete = vi.fn()
      render(<CouponSendAnimation visible={false} onComplete={onComplete} />)
      expect(screen.queryByTestId("send-animation")).not.toBeInTheDocument()
    })

    it("renders overlay when visible is true", () => {
      const onComplete = vi.fn()
      render(<CouponSendAnimation visible={true} onComplete={onComplete} />)
      expect(screen.getByTestId("send-animation")).toBeInTheDocument()
    })

    it("renders airplane element during animation", () => {
      const onComplete = vi.fn()
      render(<CouponSendAnimation visible={true} onComplete={onComplete} />)
      expect(screen.getByTestId("airplane-element")).toBeInTheDocument()
    })

    it("renders 12 particles", () => {
      const onComplete = vi.fn()
      render(<CouponSendAnimation visible={true} onComplete={onComplete} />)
      const particles = screen.getAllByTestId("particle")
      expect(particles).toHaveLength(12)
    })

    it("renders 'Sent!' confirmation text", () => {
      const onComplete = vi.fn()
      render(<CouponSendAnimation visible={true} onComplete={onComplete} />)
      expect(screen.getByTestId("sent-confirm")).toBeInTheDocument()
      expect(screen.getByText("Sent!")).toBeInTheDocument()
    })

    it("has role=status for accessibility", () => {
      const onComplete = vi.fn()
      render(<CouponSendAnimation visible={true} onComplete={onComplete} />)
      expect(screen.getByRole("status")).toBeInTheDocument()
    })

    it("has correct aria-label", () => {
      const onComplete = vi.fn()
      render(<CouponSendAnimation visible={true} onComplete={onComplete} />)
      expect(screen.getByLabelText("Coupon sent")).toBeInTheDocument()
    })

    it("applies custom className", () => {
      const onComplete = vi.fn()
      render(
        <CouponSendAnimation
          visible={true}
          onComplete={onComplete}
          className="my-custom"
        />
      )
      const overlay = screen.getByTestId("send-animation")
      expect(overlay.className).toContain("my-custom")
    })

    it("particles use alternating copper and gold colors", () => {
      const onComplete = vi.fn()
      render(<CouponSendAnimation visible={true} onComplete={onComplete} />)
      const particles = screen.getAllByTestId("particle")
      // Even particles: copper (var(--accent-primary)), Odd: gold (#DAA520)
      expect(particles[0].style.backgroundColor).toBe("var(--accent-primary)")
      expect(particles[1].style.backgroundColor).toBe("rgb(218, 165, 32)")
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("calls onComplete after animation delay (~2000ms)", () => {
      const onComplete = vi.fn()
      render(<CouponSendAnimation visible={true} onComplete={onComplete} />)

      expect(onComplete).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it("does not call onComplete before animation finishes", () => {
      const onComplete = vi.fn()
      render(<CouponSendAnimation visible={true} onComplete={onComplete} />)

      act(() => {
        vi.advanceTimersByTime(1500)
      })

      expect(onComplete).not.toHaveBeenCalled()
    })

    it("calls onComplete quickly with reduced motion", () => {
      mockReducedMotion = true
      const onComplete = vi.fn()
      render(<CouponSendAnimation visible={true} onComplete={onComplete} />)

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(onComplete).toHaveBeenCalledTimes(1)
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("shows instant Sent! text with reduced motion (no airplane, no particles)", () => {
      mockReducedMotion = true
      const onComplete = vi.fn()
      render(<CouponSendAnimation visible={true} onComplete={onComplete} />)

      expect(screen.getByText("Sent!")).toBeInTheDocument()
      expect(screen.queryByTestId("airplane-element")).not.toBeInTheDocument()
      expect(screen.queryByTestId("particle")).not.toBeInTheDocument()
    })

    it("cleans up timer on unmount", () => {
      const onComplete = vi.fn()
      const { unmount } = render(
        <CouponSendAnimation visible={true} onComplete={onComplete} />
      )

      unmount()

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      // onComplete should NOT be called after unmount
      expect(onComplete).not.toHaveBeenCalled()
    })

    it("transitions from visible to hidden cleanly", () => {
      const onComplete = vi.fn()
      const { rerender } = render(
        <CouponSendAnimation visible={true} onComplete={onComplete} />
      )
      expect(screen.getByTestId("send-animation")).toBeInTheDocument()

      rerender(
        <CouponSendAnimation visible={false} onComplete={onComplete} />
      )
      expect(screen.queryByTestId("send-animation")).not.toBeInTheDocument()
    })

    it("renders fixed overlay with z-50 positioning", () => {
      const onComplete = vi.fn()
      render(<CouponSendAnimation visible={true} onComplete={onComplete} />)
      const overlay = screen.getByTestId("send-animation")
      expect(overlay.className).toContain("fixed")
      expect(overlay.className).toContain("z-50")
    })
  })
})

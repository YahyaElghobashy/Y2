import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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
    h3: React.forwardRef(
      (
        {
          children,
          initial,
          animate,
          transition,
          ...rest
        }: {
          children?: React.ReactNode
          initial?: unknown
          animate?: unknown
          transition?: unknown
          [key: string]: unknown
        },
        ref: React.Ref<HTMLHeadingElement>
      ) => {
        void initial
        void animate
        void transition
        return (
          <h3 ref={ref} {...rest}>
            {children}
          </h3>
        )
      }
    ),
    p: React.forwardRef(
      (
        {
          children,
          initial,
          animate,
          transition,
          ...rest
        }: {
          children?: React.ReactNode
          initial?: unknown
          animate?: unknown
          transition?: unknown
          [key: string]: unknown
        },
        ref: React.Ref<HTMLParagraphElement>
      ) => {
        void initial
        void animate
        void transition
        return (
          <p ref={ref} {...rest}>
            {children}
          </p>
        )
      }
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useReducedMotion: () => mockReducedMotion,
}))

import { CouponReceiveAnimation } from "@/components/coupons/CouponReceiveAnimation"

const defaultProps = {
  visible: true,
  couponTitle: "Free Coffee Date",
  couponId: "coupon-123",
  onOpen: vi.fn(),
  onDismiss: vi.fn(),
}

describe("CouponReceiveAnimation", () => {
  beforeEach(() => {
    mockReducedMotion = false
    defaultProps.onOpen = vi.fn()
    defaultProps.onDismiss = vi.fn()
    document.body.style.overflow = ""
  })

  afterEach(() => {
    document.body.style.overflow = ""
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("does not render when visible is false", () => {
      render(<CouponReceiveAnimation {...defaultProps} visible={false} />)
      expect(
        screen.queryByTestId("receive-animation")
      ).not.toBeInTheDocument()
    })

    it("renders overlay when visible is true", () => {
      render(<CouponReceiveAnimation {...defaultProps} />)
      expect(screen.getByTestId("receive-animation")).toBeInTheDocument()
    })

    it("displays coupon title", () => {
      render(<CouponReceiveAnimation {...defaultProps} />)
      expect(screen.getByTestId("coupon-title")).toHaveTextContent(
        "Free Coffee Date"
      )
    })

    it("renders letter envelope element", () => {
      render(<CouponReceiveAnimation {...defaultProps} />)
      expect(screen.getByTestId("letter-envelope")).toBeInTheDocument()
    })

    it("renders Open button", () => {
      render(<CouponReceiveAnimation {...defaultProps} />)
      expect(screen.getByTestId("open-button")).toBeInTheDocument()
      expect(screen.getByText("Open")).toBeInTheDocument()
    })

    it("renders Save for Later button", () => {
      render(<CouponReceiveAnimation {...defaultProps} />)
      expect(screen.getByTestId("dismiss-button")).toBeInTheDocument()
      expect(screen.getByText("Save for Later")).toBeInTheDocument()
    })

    it("has role=dialog for accessibility", () => {
      render(<CouponReceiveAnimation {...defaultProps} />)
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })

    it("has aria-modal=true", () => {
      render(<CouponReceiveAnimation {...defaultProps} />)
      expect(screen.getByRole("dialog")).toHaveAttribute(
        "aria-modal",
        "true"
      )
    })

    it("has correct aria-label", () => {
      render(<CouponReceiveAnimation {...defaultProps} />)
      expect(screen.getByLabelText("Coupon received")).toBeInTheDocument()
    })

    it("shows 'You received a new coupon!' subtitle", () => {
      render(<CouponReceiveAnimation {...defaultProps} />)
      expect(
        screen.getByText("You received a new coupon!")
      ).toBeInTheDocument()
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("calls onOpen with couponId when Open is clicked", async () => {
      const user = userEvent.setup()
      render(<CouponReceiveAnimation {...defaultProps} />)

      await user.click(screen.getByTestId("open-button"))

      expect(defaultProps.onOpen).toHaveBeenCalledTimes(1)
      expect(defaultProps.onOpen).toHaveBeenCalledWith("coupon-123")
    })

    it("calls onDismiss when Save for Later is clicked", async () => {
      const user = userEvent.setup()
      render(<CouponReceiveAnimation {...defaultProps} />)

      await user.click(screen.getByTestId("dismiss-button"))

      expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1)
    })

    it("calls onDismiss when backdrop is clicked", async () => {
      const user = userEvent.setup()
      render(<CouponReceiveAnimation {...defaultProps} />)

      await user.click(screen.getByTestId("backdrop"))

      expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1)
    })

    it("passes different couponId to onOpen", async () => {
      const user = userEvent.setup()
      const onOpen = vi.fn()
      render(
        <CouponReceiveAnimation
          {...defaultProps}
          couponId="coupon-xyz"
          onOpen={onOpen}
        />
      )

      await user.click(screen.getByTestId("open-button"))

      expect(onOpen).toHaveBeenCalledWith("coupon-xyz")
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("locks body scroll when visible", () => {
      render(<CouponReceiveAnimation {...defaultProps} />)
      expect(document.body.style.overflow).toBe("hidden")
    })

    it("unlocks body scroll on unmount", () => {
      const { unmount } = render(
        <CouponReceiveAnimation {...defaultProps} />
      )
      expect(document.body.style.overflow).toBe("hidden")

      unmount()
      expect(document.body.style.overflow).toBe("")
    })

    it("unlocks body scroll when visibility changes to false", () => {
      const { rerender } = render(
        <CouponReceiveAnimation {...defaultProps} />
      )
      expect(document.body.style.overflow).toBe("hidden")

      rerender(
        <CouponReceiveAnimation {...defaultProps} visible={false} />
      )
      expect(document.body.style.overflow).toBe("")
    })

    it("renders with reduced motion without errors", () => {
      mockReducedMotion = true
      render(<CouponReceiveAnimation {...defaultProps} />)
      expect(screen.getByText("Free Coffee Date")).toBeInTheDocument()
      expect(screen.getByText("Open")).toBeInTheDocument()
      expect(screen.getByText("Save for Later")).toBeInTheDocument()
    })

    it("renders fixed overlay with z-50 positioning", () => {
      render(<CouponReceiveAnimation {...defaultProps} />)
      const overlay = screen.getByTestId("receive-animation")
      expect(overlay.className).toContain("fixed")
      expect(overlay.className).toContain("z-50")
    })

    it("renders with custom className", () => {
      render(
        <CouponReceiveAnimation
          {...defaultProps}
          className="custom-test"
        />
      )
      const overlay = screen.getByTestId("receive-animation")
      expect(overlay.className).toContain("custom-test")
    })
  })
})

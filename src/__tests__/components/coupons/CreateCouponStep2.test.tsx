import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock framer-motion (same pattern as project convention)
vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
        ref: React.Ref<HTMLDivElement>
      ) => {
        const { initial, animate, exit, transition, variants, whileHover, whileTap, ...rest } = props
        void initial; void animate; void exit; void transition; void variants; void whileHover; void whileTap
        return <div ref={ref} {...rest}>{children}</div>
      }
    ),
    button: React.forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
        ref: React.Ref<HTMLButtonElement>
      ) => {
        const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
        void initial; void animate; void exit; void transition; void whileHover; void whileTap
        return <button ref={ref} {...rest}>{children}</button>
      }
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { CreateCouponStep2 } from "@/components/coupons/CreateCouponStep2"
import type { Step2Data } from "@/components/coupons/CreateCouponStep2"

describe("CreateCouponStep2", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let onNext: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let onBack: any

  beforeEach(() => {
    vi.clearAllMocks()
    onNext = vi.fn()
    onBack = vi.fn()
  })

  // ─── UNIT TESTS ───────────────────────────────────────────────────────

  describe("Unit", () => {
    it("onNext receives correct { hasExpiry: false, expiryDate: undefined, isSurprise: false } by default", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      await user.click(screen.getByTestId("next-button"))

      expect(onNext).toHaveBeenCalledTimes(1)
      const payload: Step2Data = onNext.mock.calls[0][0]
      expect(payload).toEqual({
        hasExpiry: false,
        expiryDate: undefined,
        isSurprise: false,
      })
    })

    it("onNext sends expiryDate only when hasExpiry is true", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      // Enable expiry
      await user.click(screen.getByTestId("expiry-toggle"))

      // Set date
      const dateInput = screen.getByTestId("expiry-date")
      await user.clear(dateInput)
      await user.type(dateInput, "2026-12-25")

      await user.click(screen.getByTestId("next-button"))

      expect(onNext).toHaveBeenCalledWith({
        hasExpiry: true,
        expiryDate: "2026-12-25",
        isSurprise: false,
      })
    })

    it("onNext sends expiryDate as undefined when hasExpiry is toggled off after being on", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      // Enable expiry
      await user.click(screen.getByTestId("expiry-toggle"))
      const dateInput = screen.getByTestId("expiry-date")
      await user.clear(dateInput)
      await user.type(dateInput, "2026-12-25")

      // Disable expiry
      await user.click(screen.getByTestId("expiry-toggle"))

      await user.click(screen.getByTestId("next-button"))

      expect(onNext).toHaveBeenCalledWith({
        hasExpiry: false,
        expiryDate: undefined,
        isSurprise: false,
      })
    })

    it("onNext sends isSurprise: true when surprise toggle is on", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      await user.click(screen.getByTestId("surprise-toggle"))
      await user.click(screen.getByTestId("next-button"))

      expect(onNext.mock.calls[0][0].isSurprise).toBe(true)
    })

    it("onBack is called when back button clicked", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      await user.click(screen.getByTestId("back-button"))

      expect(onBack).toHaveBeenCalledTimes(1)
      expect(onNext).not.toHaveBeenCalled()
    })

    it("populates default values from data prop: hasExpiry=true, expiryDate, isSurprise=true", () => {
      render(
        <CreateCouponStep2
          data={{
            hasExpiry: true,
            expiryDate: "2026-06-15",
            isSurprise: true,
          }}
          onNext={onNext}
          onBack={onBack}
        />
      )

      // Expiry toggle should be on
      expect(screen.getByTestId("expiry-toggle")).toHaveAttribute("aria-checked", "true")

      // Date input should be visible and populated
      const dateInput = screen.getByTestId("expiry-date")
      expect(dateInput).toBeInTheDocument()
      expect(dateInput).toHaveValue("2026-06-15")

      // Surprise toggle should be on
      expect(screen.getByTestId("surprise-toggle")).toHaveAttribute("aria-checked", "true")
    })

    it("populates default values from data prop: hasExpiry=false, isSurprise=false", () => {
      render(
        <CreateCouponStep2
          data={{ hasExpiry: false, isSurprise: false }}
          onNext={onNext}
          onBack={onBack}
        />
      )

      expect(screen.getByTestId("expiry-toggle")).toHaveAttribute("aria-checked", "false")
      expect(screen.queryByTestId("expiry-date")).not.toBeInTheDocument()
      expect(screen.getByTestId("surprise-toggle")).toHaveAttribute("aria-checked", "false")
    })

    it("partial data prop — only isSurprise provided, others default", () => {
      render(
        <CreateCouponStep2
          data={{ isSurprise: true }}
          onNext={onNext}
          onBack={onBack}
        />
      )

      // hasExpiry defaults to false
      expect(screen.getByTestId("expiry-toggle")).toHaveAttribute("aria-checked", "false")
      // isSurprise is true from data
      expect(screen.getByTestId("surprise-toggle")).toHaveAttribute("aria-checked", "true")
    })
  })

  // ─── INTERACTION TESTS ────────────────────────────────────────────────

  describe("Interaction", () => {
    it("toggling expiry on shows date picker, toggling off hides it", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      // Date picker should not be visible initially
      expect(screen.queryByTestId("expiry-date")).not.toBeInTheDocument()

      // Toggle expiry on
      await user.click(screen.getByTestId("expiry-toggle"))
      expect(screen.getByTestId("expiry-date")).toBeInTheDocument()

      // Toggle expiry off
      await user.click(screen.getByTestId("expiry-toggle"))
      expect(screen.queryByTestId("expiry-date")).not.toBeInTheDocument()
    })

    it("toggling surprise on and off updates aria-checked", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      const surpriseToggle = screen.getByTestId("surprise-toggle")
      expect(surpriseToggle).toHaveAttribute("aria-checked", "false")

      await user.click(surpriseToggle)
      expect(surpriseToggle).toHaveAttribute("aria-checked", "true")

      await user.click(surpriseToggle)
      expect(surpriseToggle).toHaveAttribute("aria-checked", "false")
    })

    it("clicking back does not call onNext", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      await user.click(screen.getByTestId("back-button"))

      expect(onBack).toHaveBeenCalledTimes(1)
      expect(onNext).not.toHaveBeenCalled()
    })

    it("clicking next does not call onBack", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      await user.click(screen.getByTestId("next-button"))

      expect(onNext).toHaveBeenCalledTimes(1)
      expect(onBack).not.toHaveBeenCalled()
    })

    it("full flow: enable expiry -> set date -> enable surprise -> click next", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      // Enable expiry
      await user.click(screen.getByTestId("expiry-toggle"))

      // Set date
      const dateInput = screen.getByTestId("expiry-date")
      await user.clear(dateInput)
      await user.type(dateInput, "2026-07-04")

      // Enable surprise
      await user.click(screen.getByTestId("surprise-toggle"))

      // Submit
      await user.click(screen.getByTestId("next-button"))

      expect(onNext).toHaveBeenCalledWith({
        hasExpiry: true,
        expiryDate: "2026-07-04",
        isSurprise: true,
      })
    })

    it("renders heading text 'Any rules?'", () => {
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)
      expect(screen.getByText("Any rules?")).toBeInTheDocument()
    })

    it("renders toggle labels and descriptions", () => {
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      expect(screen.getByText("Set an expiry date")).toBeInTheDocument()
      expect(screen.getByText("Coupon expires after this date")).toBeInTheDocument()
      expect(screen.getByText("Make it a surprise")).toBeInTheDocument()
      expect(screen.getByText("Hidden until you reveal it")).toBeInTheDocument()
    })

    it("both toggles function independently", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      const expiryToggle = screen.getByTestId("expiry-toggle")
      const surpriseToggle = screen.getByTestId("surprise-toggle")

      // Toggle expiry on
      await user.click(expiryToggle)
      expect(expiryToggle).toHaveAttribute("aria-checked", "true")
      expect(surpriseToggle).toHaveAttribute("aria-checked", "false")

      // Toggle surprise on
      await user.click(surpriseToggle)
      expect(expiryToggle).toHaveAttribute("aria-checked", "true")
      expect(surpriseToggle).toHaveAttribute("aria-checked", "true")

      // Toggle expiry off
      await user.click(expiryToggle)
      expect(expiryToggle).toHaveAttribute("aria-checked", "false")
      expect(surpriseToggle).toHaveAttribute("aria-checked", "true")
    })

    it("data prop with pre-set date can be submitted without change", async () => {
      const user = userEvent.setup()
      render(
        <CreateCouponStep2
          data={{ hasExpiry: true, expiryDate: "2026-09-01", isSurprise: false }}
          onNext={onNext}
          onBack={onBack}
        />
      )

      await user.click(screen.getByTestId("next-button"))

      expect(onNext).toHaveBeenCalledWith({
        hasExpiry: true,
        expiryDate: "2026-09-01",
        isSurprise: false,
      })
    })
  })

  // ─── INTEGRATION TESTS (date validation) ──────────────────────────────

  describe("Integration: Date validation", () => {
    it("date input has min attribute set to tomorrow", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      // Need to show the date input first
      await user.click(screen.getByTestId("expiry-toggle"))

      const dateInput = screen.getByTestId("expiry-date")

      // Calculate expected min date (tomorrow)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const expectedMin = tomorrow.toISOString().split("T")[0]

      expect(dateInput).toHaveAttribute("min", expectedMin)
    })

    it("date input type is 'date' for native browser date picker", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      await user.click(screen.getByTestId("expiry-toggle"))

      const dateInput = screen.getByTestId("expiry-date")
      expect(dateInput).toHaveAttribute("type", "date")
    })

    it("expiryDate value from user input is passed through to onNext", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      await user.click(screen.getByTestId("expiry-toggle"))

      const dateInput = screen.getByTestId("expiry-date")
      await user.clear(dateInput)
      await user.type(dateInput, "2027-01-15")

      await user.click(screen.getByTestId("next-button"))

      expect(onNext).toHaveBeenCalledWith({
        hasExpiry: true,
        expiryDate: "2027-01-15",
        isSurprise: false,
      })
    })

    it("empty expiry date is sent as empty string when hasExpiry is true but no date typed", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      await user.click(screen.getByTestId("expiry-toggle"))
      // Don't enter a date
      await user.click(screen.getByTestId("next-button"))

      expect(onNext).toHaveBeenCalledWith({
        hasExpiry: true,
        expiryDate: "",
        isSurprise: false,
      })
    })

    it("toggle buttons use role='switch' for accessibility", () => {
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      const expiryToggle = screen.getByTestId("expiry-toggle")
      const surpriseToggle = screen.getByTestId("surprise-toggle")

      expect(expiryToggle).toHaveAttribute("role", "switch")
      expect(surpriseToggle).toHaveAttribute("role", "switch")
    })

    it("date input disappears cleanly when hasExpiry is toggled off mid-flow", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep2 onNext={onNext} onBack={onBack} />)

      // Enable expiry and set date
      await user.click(screen.getByTestId("expiry-toggle"))
      const dateInput = screen.getByTestId("expiry-date")
      await user.clear(dateInput)
      await user.type(dateInput, "2026-11-11")

      // Disable expiry
      await user.click(screen.getByTestId("expiry-toggle"))
      expect(screen.queryByTestId("expiry-date")).not.toBeInTheDocument()

      // Submit
      await user.click(screen.getByTestId("next-button"))

      // expiryDate should be undefined since hasExpiry is false
      expect(onNext.mock.calls[0][0].expiryDate).toBeUndefined()
      expect(onNext.mock.calls[0][0].hasExpiry).toBe(false)
    })
  })
})

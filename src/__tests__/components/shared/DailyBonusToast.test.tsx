import React from "react"
import { render, screen, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
let mockDailyBonusReturn = {
  claimed: false,
  justClaimed: false,
}

vi.mock("@/lib/hooks/use-daily-bonus", () => ({
  useDailyBonus: () => mockDailyBonusReturn,
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div ref={ref} {...rest}>{children}</div>
    }),
    span: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLSpanElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <span ref={ref} {...rest}>{children}</span>
    }),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { DailyBonusToast } from "@/components/shared/DailyBonusToast"

describe("DailyBonusToast", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDailyBonusReturn = { claimed: false, justClaimed: false }
  })

  it("does not show when justClaimed is false", () => {
    render(<DailyBonusToast />)
    expect(screen.queryByTestId("daily-bonus-toast")).not.toBeInTheDocument()
  })

  it("shows toast when justClaimed is true", async () => {
    mockDailyBonusReturn = { claimed: true, justClaimed: true }
    render(<DailyBonusToast />)

    await waitFor(() => {
      expect(screen.getByTestId("daily-bonus-toast")).toBeInTheDocument()
    })
  })

  it("displays bonus text", async () => {
    mockDailyBonusReturn = { claimed: true, justClaimed: true }
    render(<DailyBonusToast />)

    await waitFor(() => {
      expect(screen.getByText("+5 Daily bonus!")).toBeInTheDocument()
    })
  })

  it("displays coin icon", async () => {
    mockDailyBonusReturn = { claimed: true, justClaimed: true }
    render(<DailyBonusToast />)

    await waitFor(() => {
      expect(screen.getByTestId("daily-bonus-coin")).toBeInTheDocument()
    })
  })

  it("auto-dismisses after 3 seconds", async () => {
    vi.useFakeTimers()
    mockDailyBonusReturn = { claimed: true, justClaimed: true }

    await act(async () => {
      render(<DailyBonusToast />)
    })

    expect(screen.getByTestId("daily-bonus-toast")).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.queryByTestId("daily-bonus-toast")).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it("does not show when only claimed (not justClaimed)", () => {
    mockDailyBonusReturn = { claimed: true, justClaimed: false }
    render(<DailyBonusToast />)
    expect(screen.queryByTestId("daily-bonus-toast")).not.toBeInTheDocument()
  })
})

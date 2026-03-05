import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// ── Types ────────────────────────────────────────────────────
type MockProfile = { paired_at: string | null; display_name: string } | null
type MockAuthReturn = {
  profile: MockProfile
  user: { id: string } | null
}

// ── Hoisted mocks ────────────────────────────────────────────
const { useAuth, mockAnimate } = vi.hoisted(() => {
  return {
    useAuth: vi.fn((): MockAuthReturn => ({
      profile: { paired_at: "2025-01-01T00:00:00Z", display_name: "Yahya" },
      user: { id: "u1" },
    })),
    mockAnimate: vi.fn((() => ({ stop: vi.fn() })) as (...args: unknown[]) => { stop: () => void }),
  }
})

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth,
}))

// ── Mock framer-motion ───────────────────────────────────────
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: {
      children?: React.ReactNode
      [key: string]: unknown
    }) => {
      const {
        initial,
        animate: _animate,
        exit,
        transition,
        whileHover,
        whileTap,
        ...rest
      } = props
      void initial
      void _animate
      void exit
      void transition
      void whileHover
      void whileTap
      return <div {...rest}>{children}</div>
    },
    span: ({
      children,
      ...props
    }: {
      children?: React.ReactNode
      [key: string]: unknown
    }) => {
      const {
        initial,
        animate: _animate,
        exit,
        transition,
        whileHover,
        whileTap,
        ...rest
      } = props
      void initial
      void _animate
      void exit
      void transition
      void whileHover
      void whileTap
      return <span {...rest}>{children}</span>
    },
    p: ({
      children,
      ...props
    }: {
      children?: React.ReactNode
      [key: string]: unknown
    }) => {
      const {
        initial,
        animate: _animate,
        exit,
        transition,
        whileHover,
        whileTap,
        ...rest
      } = props
      void initial
      void _animate
      void exit
      void transition
      void whileHover
      void whileTap
      return <p {...rest}>{children}</p>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
  useTransform: (_val: unknown, fn: (v: number) => number) => ({
    get: () => fn(0),
    on: vi.fn(() => vi.fn()),
  }),
  animate: mockAnimate,
}))

import { DaysTogetherCounter } from "@/components/shared/DaysTogetherCounter"

describe("DaysTogetherCounter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: paired_at = 2025-01-01, "now" = 2026-03-05
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-05T12:00:00Z"))
    // Reset sessionStorage
    sessionStorage.clear()

    useAuth.mockReturnValue({
      profile: { paired_at: "2025-01-01T00:00:00Z", display_name: "Yahya" },
      user: { id: "u1" },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Unit Tests ────────────────────────────────────────────
  describe("unit", () => {
    it("returns null when paired_at is null", () => {
      useAuth.mockReturnValue({
        profile: { paired_at: null, display_name: "Yahya" },
        user: { id: "u1" },
      })
      const { container } = render(<DaysTogetherCounter />)
      expect(container.innerHTML).toBe("")
    })

    it("returns null when profile is null", () => {
      useAuth.mockReturnValue({
        profile: null,
        user: { id: "u1" },
      })
      const { container } = render(<DaysTogetherCounter />)
      expect(container.innerHTML).toBe("")
    })

    it("calculates correct day count", () => {
      // 2025-01-01 to 2026-03-05 = 428 days
      render(<DaysTogetherCounter />)
      const dayCount = screen.getByTestId("day-count")
      expect(dayCount.textContent).toBe("428")
    })

    it("shows Day 0 when paired today", () => {
      useAuth.mockReturnValue({
        profile: {
          paired_at: "2026-03-05T00:00:00Z",
          display_name: "Yahya",
        },
        user: { id: "u1" },
      })
      render(<DaysTogetherCounter />)
      const dayCount = screen.getByTestId("day-count")
      expect(dayCount.textContent).toBe("0")
    })

    it("shows Day 1 when paired yesterday", () => {
      useAuth.mockReturnValue({
        profile: {
          paired_at: "2026-03-04T00:00:00Z",
          display_name: "Yahya",
        },
        user: { id: "u1" },
      })
      render(<DaysTogetherCounter />)
      const dayCount = screen.getByTestId("day-count")
      expect(dayCount.textContent).toBe("1")
    })

    it('full variant shows "Day N together on Hayah" text', () => {
      render(<DaysTogetherCounter variant="full" />)
      const label = screen.getByTestId("days-label")
      expect(label.textContent).toContain("together on Hayah")
      expect(label.textContent).toContain("Day")
    })

    it("full variant has card styling (rounded-2xl, border)", () => {
      render(<DaysTogetherCounter variant="full" />)
      const el = screen.getByTestId("days-together-counter")
      expect(el.className).toContain("rounded-2xl")
      expect(el.className).toContain("border")
    })

    it("compact variant shows number + heart icon", () => {
      render(<DaysTogetherCounter variant="compact" />)
      expect(screen.getByTestId("day-count")).toBeInTheDocument()
      expect(screen.getByTestId("heart-icon")).toBeInTheDocument()
    })

    it('compact variant does NOT show "together on Hayah" text', () => {
      render(<DaysTogetherCounter variant="compact" />)
      expect(screen.queryByTestId("days-label")).not.toBeInTheDocument()
      expect(screen.queryByText(/together on Hayah/)).not.toBeInTheDocument()
    })

    it("number uses tabular-nums styling", () => {
      render(<DaysTogetherCounter />)
      const dayCount = screen.getByTestId("day-count")
      expect(dayCount.className).toContain("tabular-nums")
    })
  })

  // ── Interaction Tests ─────────────────────────────────────
  describe("interaction", () => {
    it("countUp animation fires on first render", () => {
      render(<DaysTogetherCounter />)
      expect(mockAnimate).toHaveBeenCalled()
      const call = mockAnimate.mock.calls[0] as unknown[]
      expect(call[1]).toBe(428)
    })

    it("custom className is applied", () => {
      render(<DaysTogetherCounter className="my-custom-class" />)
      const el = screen.getByTestId("days-together-counter")
      expect(el.className).toContain("my-custom-class")
    })
  })

  // ── Integration Tests ─────────────────────────────────────
  describe("integration", () => {
    it("uses useAuth hook to get profile data", () => {
      render(<DaysTogetherCounter />)
      expect(useAuth).toHaveBeenCalled()
    })
  })
})

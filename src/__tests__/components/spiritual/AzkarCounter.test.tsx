import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockIncrement = vi.fn()
const mockReset = vi.fn()
const mockSwitchType = vi.fn()
const mockSetTarget = vi.fn()

const mockUseAzkar: any = vi.fn(() => ({
  session: {
    id: "s-1",
    user_id: "user-1",
    date: "2026-03-04",
    session_type: "morning",
    count: 10,
    target: 33,
    created_at: "",
    updated_at: "",
  },
  sessionType: "morning" as const,
  increment: mockIncrement,
  reset: mockReset,
  setTarget: mockSetTarget,
  switchType: mockSwitchType,
  isLoading: false,
  error: null,
  justCompleted: false,
}))

vi.mock("@/lib/hooks/use-azkar", () => ({
  useAzkar: () => mockUseAzkar(),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      (
        { children, initial, animate, transition, whileTap, layoutId, exit, ...rest }: {
          children?: React.ReactNode; initial?: unknown; animate?: unknown; transition?: unknown;
          whileTap?: unknown; layoutId?: string; exit?: unknown; [key: string]: unknown
        },
        ref: React.Ref<HTMLDivElement>
      ) => {
        void initial; void animate; void transition; void whileTap; void layoutId; void exit
        return <div ref={ref} {...rest}>{children}</div>
      }
    ),
    button: React.forwardRef(
      (
        { children, initial, animate, transition, whileTap, ...rest }: {
          children?: React.ReactNode; initial?: unknown; animate?: unknown; transition?: unknown;
          whileTap?: unknown; [key: string]: unknown
        },
        ref: React.Ref<HTMLButtonElement>
      ) => {
        void initial; void animate; void transition; void whileTap
        return <button ref={ref} {...rest}>{children}</button>
      }
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { AzkarCounter } from "@/components/spiritual/AzkarCounter"

describe("AzkarCounter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAzkar.mockReturnValue({
      session: {
        id: "s-1", user_id: "user-1", date: "2026-03-04",
        session_type: "morning", count: 10, target: 33,
        created_at: "", updated_at: "",
      },
      sessionType: "morning" as const,
      increment: mockIncrement,
      reset: mockReset,
      setTarget: mockSetTarget,
      switchType: mockSwitchType,
      isLoading: false,
      error: null,
      justCompleted: false,
    })
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("renders azkar counter container", () => {
      render(<AzkarCounter />)
      expect(screen.getByTestId("azkar-counter")).toBeInTheDocument()
    })

    it("shows loading state", () => {
      mockUseAzkar.mockReturnValue({
        session: null, sessionType: "morning" as const,
        increment: vi.fn(), reset: vi.fn(), setTarget: vi.fn(),
        switchType: vi.fn(), isLoading: true, error: null, justCompleted: false,
      })
      render(<AzkarCounter />)
      expect(screen.getByTestId("azkar-counter-loading")).toBeInTheDocument()
    })

    it("displays count", () => {
      render(<AzkarCounter />)
      expect(screen.getByTestId("count-display")).toHaveTextContent("10")
    })

    it("displays target", () => {
      render(<AzkarCounter />)
      expect(screen.getByText("/ 33")).toBeInTheDocument()
    })

    it("renders session toggle", () => {
      render(<AzkarCounter />)
      expect(screen.getByTestId("session-toggle")).toBeInTheDocument()
      expect(screen.getByTestId("toggle-morning")).toBeInTheDocument()
      expect(screen.getByTestId("toggle-evening")).toBeInTheDocument()
    })

    it("marks active toggle with data-active", () => {
      render(<AzkarCounter />)
      expect(screen.getByTestId("toggle-morning")).toHaveAttribute("data-active", "true")
      expect(screen.getByTestId("toggle-evening")).toHaveAttribute("data-active", "false")
    })

    it("renders tap area", () => {
      render(<AzkarCounter />)
      expect(screen.getByTestId("tap-area")).toBeInTheDocument()
    })

    it("renders reset button", () => {
      render(<AzkarCounter />)
      expect(screen.getByTestId("reset-button")).toBeInTheDocument()
      expect(screen.getByText("Reset")).toBeInTheDocument()
    })

    it("has heading text", () => {
      render(<AzkarCounter />)
      expect(screen.getByText("Azkar")).toBeInTheDocument()
    })

    it("shows error message", () => {
      mockUseAzkar.mockReturnValue({
        session: null, sessionType: "morning" as const,
        increment: vi.fn(), reset: vi.fn(), setTarget: vi.fn(),
        switchType: vi.fn(), isLoading: false, error: "Network error", justCompleted: false,
      })
      render(<AzkarCounter />)
      expect(screen.getByTestId("azkar-error")).toHaveTextContent("Network error")
    })

    it("shows completion ripple when justCompleted", () => {
      mockUseAzkar.mockReturnValue({
        session: {
          id: "s-1", user_id: "user-1", date: "2026-03-04",
          session_type: "morning", count: 33, target: 33,
          created_at: "", updated_at: "",
        },
        sessionType: "morning" as const,
        increment: mockIncrement, reset: mockReset, setTarget: mockSetTarget,
        switchType: mockSwitchType, isLoading: false, error: null,
        justCompleted: true,
      })
      render(<AzkarCounter />)
      expect(screen.getByTestId("completion-ripple")).toBeInTheDocument()
    })

    it("hides completion ripple when not completed", () => {
      render(<AzkarCounter />)
      expect(screen.queryByTestId("completion-ripple")).not.toBeInTheDocument()
    })

    it("tap area has descriptive aria-label", () => {
      render(<AzkarCounter />)
      expect(screen.getByTestId("tap-area")).toHaveAttribute(
        "aria-label",
        "Count: 10 of 33. Tap to increment."
      )
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("calls increment on tap area click", async () => {
      const user = userEvent.setup()
      render(<AzkarCounter />)

      await user.click(screen.getByTestId("tap-area"))
      expect(mockIncrement).toHaveBeenCalledTimes(1)
    })

    it("calls reset on reset button click", async () => {
      const user = userEvent.setup()
      render(<AzkarCounter />)

      await user.click(screen.getByTestId("reset-button"))
      expect(mockReset).toHaveBeenCalledTimes(1)
    })

    it("calls switchType when evening toggle clicked", async () => {
      const user = userEvent.setup()
      render(<AzkarCounter />)

      await user.click(screen.getByTestId("toggle-evening"))
      expect(mockSwitchType).toHaveBeenCalledWith("evening")
    })

    it("calls switchType when morning toggle clicked", async () => {
      const user = userEvent.setup()
      render(<AzkarCounter />)

      await user.click(screen.getByTestId("toggle-morning"))
      expect(mockSwitchType).toHaveBeenCalledWith("morning")
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("displays data from useAzkar hook", () => {
      render(<AzkarCounter />)
      expect(screen.getByTestId("count-display")).toHaveTextContent("10")
    })

    it("applies custom className", () => {
      render(<AzkarCounter className="custom-class" />)
      expect(screen.getByTestId("azkar-counter").className).toContain("custom-class")
    })

    it("handles zero count gracefully", () => {
      mockUseAzkar.mockReturnValue({
        session: {
          id: "s-1", user_id: "user-1", date: "2026-03-04",
          session_type: "morning", count: 0, target: 33,
          created_at: "", updated_at: "",
        },
        sessionType: "morning" as const,
        increment: mockIncrement, reset: mockReset, setTarget: mockSetTarget,
        switchType: mockSwitchType, isLoading: false, error: null, justCompleted: false,
      })
      render(<AzkarCounter />)
      expect(screen.getByTestId("count-display")).toHaveTextContent("0")
    })
  })
})

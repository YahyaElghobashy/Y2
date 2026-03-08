import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock framer-motion ──────────────────────────────────────────
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, transition, whileTap, style, ...rest } = props as Record<string, unknown>
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)} style={style as React.CSSProperties}>{children}</div>
    },
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, transition, whileTap, ...rest } = props as Record<string, unknown>
      return <span {...(rest as React.HTMLAttributes<HTMLSpanElement>)}>{children}</span>
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, transition, whileTap, ...rest } = props as Record<string, unknown>
      return <button {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
    },
    h2: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, transition, ...rest } = props as Record<string, unknown>
      return <h2 {...(rest as React.HTMLAttributes<HTMLHeadingElement>)}>{children}</h2>
    },
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, transition, ...rest } = props as Record<string, unknown>
      return <p {...(rest as React.HTMLAttributes<HTMLParagraphElement>)}>{children}</p>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// ── Mock CATEGORY_META from game.types ──────────────────────────
vi.mock("@/lib/types/game.types", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/lib/types/game.types")
  return {
    ...actual,
    CATEGORY_META: {
      communication: { emoji: "💬", label: "Communication", color: "#6B9EC4" },
      intimacy: { emoji: "💕", label: "Intimacy", color: "#C27070" },
      finances: { emoji: "💰", label: "Finances", color: "#7CB67C" },
      faith: { emoji: "🤲", label: "Faith", color: "#D4A04A" },
      family: { emoji: "👨‍👩‍👧", label: "Family", color: "#B87333" },
      lifestyle: { emoji: "🏡", label: "Lifestyle", color: "#8B7EC8" },
      dreams: { emoji: "✨", label: "Dreams", color: "#C4956A" },
      conflict: { emoji: "🤝", label: "Conflict", color: "#C27070" },
      vulnerability: { emoji: "🫶", label: "Vulnerability", color: "#D4A04A" },
      love: { emoji: "❤️", label: "Love", color: "#C27070" },
      travel: { emoji: "✈️", label: "Travel", color: "#6B9EC4" },
      home: { emoji: "🏠", label: "Home", color: "#7CB67C" },
    },
  }
})

import { DareCard } from "@/components/game/DareCard"
import type { GameDareRow, SessionCustomContentRow } from "@/lib/types/game.types"

// ── Test fixtures ───────────────────────────────────────────────

const MOCK_DARE: GameDareRow = {
  id: "d-1",
  text: "Give your partner a 30-second massage",
  text_ar: null,
  category: "intimacy",
  heat_level: 1,
  coyyns_reward: 15,
  coyyns_penalty: 10,
  is_system: true,
  contributed_by: null,
  use_count: 0,
  is_active: true,
  created_at: "2026-03-01T00:00:00Z",
}

const defaultProps = {
  dare: MOCK_DARE,
  customContent: null as SessionCustomContentRow | null,
  isPartnerAuthored: false,
  authorName: null as string | null,
  isRevealed: false,
  onFlip: vi.fn(),
  onComplete: vi.fn(),
  onSkip: vi.fn(),
  isCompleted: false,
  isSkipped: false,
}

describe("DareCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── UNIT: Face-down states ──────────────────────────────────────

  it("renders 'Dare — Tap to reveal' when not revealed and not partner-authored", () => {
    render(<DareCard {...defaultProps} />)

    expect(screen.getByText("Dare — Tap to reveal")).toBeInTheDocument()
  })

  it("renders 'Dare from your partner' when isPartnerAuthored and not revealed", () => {
    render(<DareCard {...defaultProps} isPartnerAuthored={true} />)

    expect(screen.getByText("Dare from your partner")).toBeInTheDocument()
  })

  // ── UNIT: Face-up (revealed) states ─────────────────────────────

  it("shows dare text when revealed", () => {
    render(<DareCard {...defaultProps} isRevealed={true} />)

    expect(screen.getByText("Give your partner a 30-second massage")).toBeInTheDocument()
  })

  it("shows heat level label when revealed", () => {
    render(<DareCard {...defaultProps} isRevealed={true} />)

    // heat_level 1 → "Mild 🔥"
    expect(screen.getByText(/Mild 🔥/)).toBeInTheDocument()
  })

  it("shows CoYYns reward and penalty when revealed", () => {
    render(<DareCard {...defaultProps} isRevealed={true} />)

    expect(screen.getByText(/\+15 🪙/)).toBeInTheDocument()
    expect(screen.getByText(/-10 🪙/)).toBeInTheDocument()
  })

  it("shows Complete and Skip buttons when revealed and not done", () => {
    render(<DareCard {...defaultProps} isRevealed={true} />)

    expect(screen.getByRole("button", { name: /Complete ✅/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Skip ❌/ })).toBeInTheDocument()
  })

  // ── INTERACTION: Action button callbacks ────────────────────────

  it("calls onComplete when Complete button clicked", () => {
    const onComplete = vi.fn()
    render(<DareCard {...defaultProps} isRevealed={true} onComplete={onComplete} />)

    fireEvent.click(screen.getByText(/Complete ✅/))

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("calls onSkip when Skip button clicked", () => {
    const onSkip = vi.fn()
    render(<DareCard {...defaultProps} isRevealed={true} onSkip={onSkip} />)

    fireEvent.click(screen.getByText(/Skip ❌/))

    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  // ── UNIT: Completed / Skipped states ────────────────────────────

  it("shows 'Completed! +15 🪙' when isCompleted is true", () => {
    render(<DareCard {...defaultProps} isRevealed={true} isCompleted={true} />)

    expect(screen.getByText(/Completed! \+15 🪙/)).toBeInTheDocument()
  })

  it("shows 'Skipped' text when isSkipped is true", () => {
    render(<DareCard {...defaultProps} isRevealed={true} isSkipped={true} />)

    expect(screen.getByText(/Skipped/)).toBeInTheDocument()
  })

  it("hides Complete/Skip buttons when isDone (isCompleted or isSkipped)", () => {
    const { rerender } = render(
      <DareCard {...defaultProps} isRevealed={true} isCompleted={true} />
    )

    expect(screen.queryByText(/Complete ✅/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Skip ❌/)).not.toBeInTheDocument()

    rerender(<DareCard {...defaultProps} isRevealed={true} isSkipped={true} />)

    expect(screen.queryByText(/Complete ✅/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Skip ❌/)).not.toBeInTheDocument()
  })
})

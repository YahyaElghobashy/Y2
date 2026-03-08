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

import { GameCard } from "@/components/game/GameCard"
import type { QuestionBankRow, SessionCustomContentRow } from "@/lib/types/game.types"

// ── Test fixtures ───────────────────────────────────────────────

const MOCK_QUESTION: QuestionBankRow = {
  id: "q-1",
  text: "What is your biggest dream together?",
  text_ar: null,
  category: "dreams",
  difficulty: "medium",
  answer_type: "open",
  answer_options: null,
  suitable_modes: ["deep_talk"],
  heat_level: 1,
  is_system: true,
  contributed_by: null,
  use_count: 0,
  is_active: true,
  created_at: "2026-03-01T00:00:00Z",
}

const MOCK_CUSTOM_CONTENT: SessionCustomContentRow = {
  id: "cc-1",
  session_id: "sess-1",
  author_id: "user-a",
  target_partner_id: "user-b",
  content_type: "question",
  text: "Custom question from partner",
  heat_level: 1,
  coyyns_reward: 10,
  coyyns_penalty: 5,
  is_revealed: false,
  round_id: null,
  created_at: "2026-03-01T00:00:00Z",
}

const defaultProps = {
  question: MOCK_QUESTION,
  customContent: null as SessionCustomContentRow | null,
  isPartnerAuthored: false,
  authorName: null as string | null,
  isRevealed: false,
  onFlip: vi.fn(),
}

describe("GameCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── UNIT: Face-down states ──────────────────────────────────────

  it("renders 'Tap to reveal' when not revealed", () => {
    render(<GameCard {...defaultProps} />)

    expect(screen.getByText("Tap to reveal")).toBeInTheDocument()
  })

  it("renders 'From your partner' when isPartnerAuthored is true and not revealed", () => {
    render(<GameCard {...defaultProps} isPartnerAuthored={true} />)

    expect(screen.getByText("From your partner")).toBeInTheDocument()
  })

  // ── UNIT: Face-up (revealed) states ─────────────────────────────

  it("shows question text when revealed", () => {
    render(<GameCard {...defaultProps} isRevealed={true} />)

    expect(screen.getByText("What is your biggest dream together?")).toBeInTheDocument()
  })

  it("shows category badge when revealed with a question that has category", () => {
    render(<GameCard {...defaultProps} isRevealed={true} />)

    // category is "dreams" → emoji ✨ + label "Dreams"
    expect(screen.getByText(/✨/)).toBeInTheDocument()
    expect(screen.getByText(/Dreams/)).toBeInTheDocument()
  })

  it("shows 'Written by [authorName]' badge when revealed and isPartnerAuthored", () => {
    render(
      <GameCard
        {...defaultProps}
        isRevealed={true}
        isPartnerAuthored={true}
        authorName="Yara"
      />
    )

    expect(screen.getByText(/Written by Yara/)).toBeInTheDocument()
  })

  it("shows difficulty when revealed", () => {
    render(<GameCard {...defaultProps} isRevealed={true} />)

    // difficulty is "medium" → "🌤️ Medium"
    expect(screen.getByText(/Medium/)).toBeInTheDocument()
  })

  // ── INTERACTION: onFlip callback ────────────────────────────────

  it("calls onFlip when face-down card is clicked", () => {
    const onFlip = vi.fn()
    render(<GameCard {...defaultProps} onFlip={onFlip} />)

    // Click the face-down side (contains "Tap to reveal")
    const faceDown = screen.getByText("Tap to reveal").closest("div[class]")!
    fireEvent.click(faceDown)

    expect(onFlip).toHaveBeenCalledTimes(1)
  })

  it("does NOT call onFlip when revealed card is clicked", () => {
    const onFlip = vi.fn()
    render(<GameCard {...defaultProps} isRevealed={true} onFlip={onFlip} />)

    // The face-down div should not have onClick when revealed
    const faceDown = screen.getByText("Tap to reveal").closest("div[class]")!
    fireEvent.click(faceDown)

    expect(onFlip).not.toHaveBeenCalled()
  })

  // ── UNIT: customContent override ────────────────────────────────

  it("uses customContent text when provided instead of question text", () => {
    render(
      <GameCard
        {...defaultProps}
        customContent={MOCK_CUSTOM_CONTENT}
        isRevealed={true}
      />
    )

    expect(screen.getByText("Custom question from partner")).toBeInTheDocument()
    expect(screen.queryByText("What is your biggest dream together?")).not.toBeInTheDocument()
  })
})

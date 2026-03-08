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

import { TruthCard } from "@/components/game/TruthCard"
import type { QuestionBankRow, SessionCustomContentRow } from "@/lib/types/game.types"

// ── Test fixtures ───────────────────────────────────────────────

const MOCK_QUESTION: QuestionBankRow = {
  id: "q-1",
  text: "What is your biggest fear about the future?",
  text_ar: null,
  category: "vulnerability",
  difficulty: "deep",
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

const defaultProps = {
  question: MOCK_QUESTION,
  customContent: null as SessionCustomContentRow | null,
  isPartnerAuthored: false,
  authorName: null as string | null,
  onNext: vi.fn(),
  onSaveResponse: vi.fn(),
}

describe("TruthCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── UNIT: Renders question content ──────────────────────────────

  it("renders question text", () => {
    render(<TruthCard {...defaultProps} />)

    expect(screen.getByText("What is your biggest fear about the future?")).toBeInTheDocument()
  })

  it("shows category badge with emoji and label", () => {
    render(<TruthCard {...defaultProps} />)

    // category is "vulnerability" → emoji 🫶 + label "Vulnerability"
    expect(screen.getByText(/🫶/)).toBeInTheDocument()
    expect(screen.getByText(/Vulnerability/)).toBeInTheDocument()
  })

  it("shows difficulty badge", () => {
    render(<TruthCard {...defaultProps} />)

    // difficulty is "deep" → emoji 🌊 + label "Deep"
    expect(screen.getByText(/🌊/)).toBeInTheDocument()
    expect(screen.getByText(/Deep/)).toBeInTheDocument()
  })

  it("shows partner-authored badge with author name", () => {
    render(
      <TruthCard
        {...defaultProps}
        isPartnerAuthored={true}
        authorName="Yara"
      />
    )

    expect(screen.getByText(/Written by Yara/)).toBeInTheDocument()
  })

  it("shows 'Truth is free — no CoYYns at stake'", () => {
    render(<TruthCard {...defaultProps} />)

    expect(screen.getByText("Truth is free — no CoYYns at stake")).toBeInTheDocument()
  })

  // ── UNIT: Response toggle section ───────────────────────────────

  it("shows 'Want to share your answer?' toggle", () => {
    render(<TruthCard {...defaultProps} />)

    expect(screen.getByText(/Want to share your answer/)).toBeInTheDocument()
  })

  it("shows textarea when toggle clicked", () => {
    render(<TruthCard {...defaultProps} />)

    // Click the toggle button
    fireEvent.click(screen.getByText(/Want to share your answer/))

    // Textarea should now be visible
    expect(screen.getByPlaceholderText("Type your honest answer...")).toBeInTheDocument()
  })

  // ── INTERACTION: Next and save response ─────────────────────────

  it("calls onNext when Next button clicked", () => {
    const onNext = vi.fn()
    render(<TruthCard {...defaultProps} onNext={onNext} />)

    fireEvent.click(screen.getByText(/Next/))

    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it("calls onSaveResponse with text when text entered and Next clicked", () => {
    const onNext = vi.fn()
    const onSaveResponse = vi.fn()
    render(
      <TruthCard {...defaultProps} onNext={onNext} onSaveResponse={onSaveResponse} />
    )

    // Open the response section
    fireEvent.click(screen.getByText(/Want to share your answer/))

    // Type in the textarea
    const textarea = screen.getByPlaceholderText("Type your honest answer...")
    fireEvent.change(textarea, { target: { value: "I fear losing connection" } })

    // Click Next
    fireEvent.click(screen.getByText(/Next/))

    expect(onSaveResponse).toHaveBeenCalledWith("I fear losing connection")
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it("does NOT call onSaveResponse when text is empty", () => {
    const onNext = vi.fn()
    const onSaveResponse = vi.fn()
    render(
      <TruthCard {...defaultProps} onNext={onNext} onSaveResponse={onSaveResponse} />
    )

    // Click Next without entering any text
    fireEvent.click(screen.getByText(/Next/))

    expect(onSaveResponse).not.toHaveBeenCalled()
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})

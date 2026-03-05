import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DailyPromptCard } from "@/components/prompts/DailyPromptCard"
import type { CouplePrompt, PromptAnswer } from "@/lib/types/prompts.types"

// ── Mock framer-motion ──────────────────────────────────────────
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, transition, whileTap, ...domProps } = props as Record<string, unknown>
      return <div {...(domProps as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, transition, whileTap, ...domProps } = props as Record<string, unknown>
      return <button {...(domProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// ── Test Data ─────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0]

const mockPrompt: CouplePrompt = {
  id: "prompt-1",
  prompt_date: TODAY,
  prompt_text: "What makes you feel most loved?",
  prompt_category: "deep",
  both_answered: false,
  created_at: `${TODAY}T00:00:00Z`,
}

const mockMyAnswer: PromptAnswer = {
  id: "ans-1",
  prompt_id: "prompt-1",
  user_id: "user-1",
  answer_text: "When you write me little notes",
  submitted_at: `${TODAY}T10:00:00Z`,
}

const mockPartnerAnswer: PromptAnswer = {
  id: "ans-2",
  prompt_id: "prompt-1",
  user_id: "user-2",
  answer_text: "Quality time together",
  submitted_at: `${TODAY}T11:00:00Z`,
}

describe("DailyPromptCard", () => {
  // ── UNIT: Unanswered state ──────────────────────────────────

  it("renders unanswered state with textarea and submit button", () => {
    render(
      <DailyPromptCard
        prompt={mockPrompt}
        myAnswer={null}
        partnerAnswer={null}
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByTestId("daily-prompt-card")).toHaveAttribute("data-state", "unanswered")
    expect(screen.getByText("What makes you feel most loved?")).toBeInTheDocument()
    expect(screen.getByTestId("prompt-answer-input")).toBeInTheDocument()
    expect(screen.getByTestId("submit-answer-btn")).toBeInTheDocument()
  })

  it("shows Today's Prompt label", () => {
    render(
      <DailyPromptCard
        prompt={mockPrompt}
        myAnswer={null}
        partnerAnswer={null}
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByText("Today's Prompt")).toBeInTheDocument()
  })

  it("submit button is disabled when textarea is empty", () => {
    render(
      <DailyPromptCard
        prompt={mockPrompt}
        myAnswer={null}
        partnerAnswer={null}
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByTestId("submit-answer-btn")).toBeDisabled()
  })

  // ── UNIT: I-answered state ──────────────────────────────────

  it("renders i-answered state showing my answer and waiting message", () => {
    render(
      <DailyPromptCard
        prompt={mockPrompt}
        myAnswer={mockMyAnswer}
        partnerAnswer={null}
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByTestId("daily-prompt-card")).toHaveAttribute("data-state", "i-answered")
    expect(screen.getByText("When you write me little notes")).toBeInTheDocument()
    expect(screen.getByText("Waiting for partner's answer...")).toBeInTheDocument()
  })

  it("does not show textarea or submit in i-answered state", () => {
    render(
      <DailyPromptCard
        prompt={mockPrompt}
        myAnswer={mockMyAnswer}
        partnerAnswer={null}
        onSubmit={vi.fn()}
      />
    )

    expect(screen.queryByTestId("prompt-answer-input")).not.toBeInTheDocument()
    expect(screen.queryByTestId("submit-answer-btn")).not.toBeInTheDocument()
  })

  // ── UNIT: Both-answered state ───────────────────────────────

  it("renders both-answered state with reveal component", () => {
    const bothAnsweredPrompt = { ...mockPrompt, both_answered: true }
    render(
      <DailyPromptCard
        prompt={bothAnsweredPrompt}
        myAnswer={mockMyAnswer}
        partnerAnswer={mockPartnerAnswer}
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByTestId("daily-prompt-card")).toHaveAttribute("data-state", "both-answered")
    expect(screen.getByTestId("prompt-answer-reveal")).toBeInTheDocument()
  })

  // ── INTERACTION: Submit flow ────────────────────────────────

  it("calls onSubmit with trimmed text when submit button is clicked", () => {
    const onSubmit = vi.fn()
    render(
      <DailyPromptCard
        prompt={mockPrompt}
        myAnswer={null}
        partnerAnswer={null}
        onSubmit={onSubmit}
      />
    )

    const textarea = screen.getByTestId("prompt-answer-input")
    fireEvent.change(textarea, { target: { value: "  My thoughtful answer  " } })
    fireEvent.click(screen.getByTestId("submit-answer-btn"))

    expect(onSubmit).toHaveBeenCalledWith("My thoughtful answer")
  })

  it("clears textarea after submission", () => {
    const onSubmit = vi.fn()
    render(
      <DailyPromptCard
        prompt={mockPrompt}
        myAnswer={null}
        partnerAnswer={null}
        onSubmit={onSubmit}
      />
    )

    const textarea = screen.getByTestId("prompt-answer-input") as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: "My answer" } })
    fireEvent.click(screen.getByTestId("submit-answer-btn"))

    expect(textarea.value).toBe("")
  })

  it("does not call onSubmit with whitespace-only text", () => {
    const onSubmit = vi.fn()
    render(
      <DailyPromptCard
        prompt={mockPrompt}
        myAnswer={null}
        partnerAnswer={null}
        onSubmit={onSubmit}
      />
    )

    const textarea = screen.getByTestId("prompt-answer-input")
    fireEvent.change(textarea, { target: { value: "   " } })
    fireEvent.click(screen.getByTestId("submit-answer-btn"))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("limits textarea input to 2000 characters", () => {
    render(
      <DailyPromptCard
        prompt={mockPrompt}
        myAnswer={null}
        partnerAnswer={null}
        onSubmit={vi.fn()}
      />
    )

    const textarea = screen.getByTestId("prompt-answer-input") as HTMLTextAreaElement
    expect(textarea).toHaveAttribute("maxLength", "2000")
  })

  // ── INTEGRATION: Prompt text displayed in all states ────────

  it("displays prompt text in all three states", () => {
    const { rerender } = render(
      <DailyPromptCard
        prompt={mockPrompt}
        myAnswer={null}
        partnerAnswer={null}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByText("What makes you feel most loved?")).toBeInTheDocument()

    rerender(
      <DailyPromptCard
        prompt={mockPrompt}
        myAnswer={mockMyAnswer}
        partnerAnswer={null}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByText("What makes you feel most loved?")).toBeInTheDocument()

    rerender(
      <DailyPromptCard
        prompt={{ ...mockPrompt, both_answered: true }}
        myAnswer={mockMyAnswer}
        partnerAnswer={mockPartnerAnswer}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.getByText("What makes you feel most loved?")).toBeInTheDocument()
  })
})

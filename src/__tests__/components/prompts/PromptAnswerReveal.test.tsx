import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { PromptAnswerReveal } from "@/components/prompts/PromptAnswerReveal"
import type { PromptAnswer } from "@/lib/types/prompts.types"

// ── Mock framer-motion ──────────────────────────────────────────
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, transition, whileTap, ...domProps } = props as Record<string, unknown>
      return <div {...(domProps as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// ── Test Data ─────────────────────────────────────────────────

const mockMyAnswer: PromptAnswer = {
  id: "ans-1",
  prompt_id: "prompt-1",
  user_id: "user-1",
  answer_text: "When you make me tea in the morning",
  submitted_at: "2026-03-05T10:00:00Z",
}

const mockPartnerAnswer: PromptAnswer = {
  id: "ans-2",
  prompt_id: "prompt-1",
  user_id: "user-2",
  answer_text: "Long walks after Isha prayer",
  submitted_at: "2026-03-05T11:00:00Z",
}

describe("PromptAnswerReveal", () => {
  // ── UNIT: Renders both answers ──────────────────────────────

  it("renders reveal container with both answers", () => {
    render(
      <PromptAnswerReveal myAnswer={mockMyAnswer} partnerAnswer={mockPartnerAnswer} />
    )

    expect(screen.getByTestId("prompt-answer-reveal")).toBeInTheDocument()
    expect(screen.getByTestId("my-answer")).toBeInTheDocument()
    expect(screen.getByTestId("partner-answer")).toBeInTheDocument()
  })

  it("shows 'You' label for my answer", () => {
    render(
      <PromptAnswerReveal myAnswer={mockMyAnswer} partnerAnswer={mockPartnerAnswer} />
    )

    expect(screen.getByText("You")).toBeInTheDocument()
  })

  it("shows 'Partner' label for partner answer", () => {
    render(
      <PromptAnswerReveal myAnswer={mockMyAnswer} partnerAnswer={mockPartnerAnswer} />
    )

    expect(screen.getByText("Partner")).toBeInTheDocument()
  })

  it("displays my answer text", () => {
    render(
      <PromptAnswerReveal myAnswer={mockMyAnswer} partnerAnswer={mockPartnerAnswer} />
    )

    expect(screen.getByText("When you make me tea in the morning")).toBeInTheDocument()
  })

  it("displays partner answer text", () => {
    render(
      <PromptAnswerReveal myAnswer={mockMyAnswer} partnerAnswer={mockPartnerAnswer} />
    )

    expect(screen.getByText("Long walks after Isha prayer")).toBeInTheDocument()
  })

  // ── UNIT: Custom className ──────────────────────────────────

  it("applies custom className", () => {
    render(
      <PromptAnswerReveal
        myAnswer={mockMyAnswer}
        partnerAnswer={mockPartnerAnswer}
        className="custom-class"
      />
    )

    expect(screen.getByTestId("prompt-answer-reveal")).toHaveClass("custom-class")
  })

  // ── INTEGRATION: Long answers rendered fully ────────────────

  it("renders long answers without truncation", () => {
    const longText = "A ".repeat(500).trim()
    const longMyAnswer = { ...mockMyAnswer, answer_text: longText }
    const longPartnerAnswer = { ...mockPartnerAnswer, answer_text: longText }

    render(
      <PromptAnswerReveal myAnswer={longMyAnswer} partnerAnswer={longPartnerAnswer} />
    )

    const myAnswerEl = screen.getByTestId("my-answer")
    expect(myAnswerEl.textContent).toContain(longText)
  })
})

import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileTap, layout, layoutId, ...rest } = props
      void initial; void animate; void exit; void transition; void whileTap; void layout; void layoutId
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

vi.mock("@/components/shared/PosterCard", () => ({
  PosterCard: ({ children, accent, grain, ...rest }: Record<string, unknown> & React.PropsWithChildren) => {
    void accent; void grain
    return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
  },
}))

import { ConnectView, type ConnectData } from "@/components/prompts/ConnectView"

function makeData(overrides: Partial<ConnectData> = {}): ConnectData {
  return {
    streak: 5,
    category: "Deep Dive",
    question: "What did you think of me first?",
    partnerName: "Yara",
    partnerAnswer: "You were trouble — the good kind.",
    partnerAnswered: true,
    history: [],
    ...overrides,
  }
}

describe("ConnectView — reveal & waiting state", () => {
  // ── reveal when both answered ──────────────────────────────
  it("shows the partner's answer on reveal when partnerAnswered is true", () => {
    render(<ConnectView data={makeData({ partnerAnswered: true })} initialAnswer="My answer" initialRevealed />)
    expect(screen.getByText("My answer")).toBeInTheDocument()
    expect(screen.getByText("You were trouble — the good kind.")).toBeInTheDocument()
    expect(screen.queryByTestId("connect-waiting-partner")).not.toBeInTheDocument()
  })

  // ── waiting state when partner has not answered ────────────
  it("shows a waiting-for-partner state (not an empty card) when partnerAnswered is false", () => {
    render(
      <ConnectView
        data={makeData({ partnerAnswered: false, partnerAnswer: "" })}
        initialAnswer="My answer"
        initialRevealed
      />
    )
    // My answer still shown…
    expect(screen.getByText("My answer")).toBeInTheDocument()
    // …but the partner side is the waiting state, naming the partner.
    const waiting = screen.getByTestId("connect-waiting-partner")
    expect(waiting).toBeInTheDocument()
    expect(waiting).toHaveTextContent(/Waiting for Yara/i)
    // The partner's actual answer is never leaked.
    expect(screen.queryByText("You were trouble — the good kind.")).not.toBeInTheDocument()
  })

  it("falls into the waiting state after composing when the partner has not answered yet", () => {
    const onSubmit = vi.fn()
    render(<ConnectView data={makeData({ partnerAnswered: false, partnerAnswer: "" })} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByPlaceholderText(/write it the way you'd say it/i), {
      target: { value: "Acts of service" },
    })
    fireEvent.click(screen.getByRole("button", { name: /reveal Yara's/i }))

    expect(onSubmit).toHaveBeenCalledWith("Acts of service")
    expect(screen.getByText("Acts of service")).toBeInTheDocument()
    expect(screen.getByTestId("connect-waiting-partner")).toBeInTheDocument()
  })
})

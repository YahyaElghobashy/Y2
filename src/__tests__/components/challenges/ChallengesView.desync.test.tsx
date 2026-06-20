import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ChallengesView, type ChallengeItem } from "@/components/challenges/ChallengesView"

const ch = (id: string, title: string): ChallengeItem => ({
  id, title, emoji: "🎯", stakes: 10, accent: "coral", from: "your love",
})

describe("ChallengesView — re-syncs lists from props (realtime)", () => {
  it("renders a newly-arrived pending challenge after the prop changes", () => {
    const { rerender } = render(
      <ChallengesView pending={[ch("p1", "Push-ups")]} active={[]} past={[]} bounties={[]} initialBalance={100} />,
    )
    expect(screen.getByText("Push-ups")).toBeInTheDocument()
    expect(screen.queryByText("Read a book")).not.toBeInTheDocument()

    // Partner created a new challenge → parent re-derives pending from realtime.
    rerender(
      <ChallengesView
        pending={[ch("p1", "Push-ups"), ch("p2", "Read a book")]}
        active={[]}
        past={[]}
        bounties={[]}
        initialBalance={100}
      />,
    )
    expect(screen.getByText("Read a book")).toBeInTheDocument()
  })

  it("reflects a balance change pushed in via props", () => {
    const { rerender } = render(
      <ChallengesView pending={[]} active={[]} past={[]} bounties={[]} initialBalance={100} />,
    )
    expect(screen.getByText("100")).toBeInTheDocument()

    rerender(<ChallengesView pending={[]} active={[]} past={[]} bounties={[]} initialBalance={250} />)
    expect(screen.getByText("250")).toBeInTheDocument()
  })
})

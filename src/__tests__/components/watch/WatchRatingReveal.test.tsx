import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const filtered: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(props)) {
        if (!["initial", "animate", "exit", "transition", "whileTap", "layout"].some(p => k.startsWith(p))) filtered[k] = v
      }
      return <div {...filtered}>{children}</div>
    },
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const filtered: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(props)) {
        if (!["initial", "animate", "exit", "transition"].some(p => k.startsWith(p))) filtered[k] = v
      }
      return <p {...filtered}>{children}</p>
    },
  },
}))

import { WatchRatingReveal } from "@/components/watch/WatchRatingReveal"

const myRating = {
  id: "r-1",
  item_id: "item-1",
  user_id: "user-1",
  score: 9,
  reaction: "Loved it!",
  submitted_at: "2026-03-05T00:00:00Z",
}

const partnerRatingClose = {
  id: "r-2",
  item_id: "item-1",
  user_id: "user-2",
  score: 8,
  reaction: "Really good",
  submitted_at: "2026-03-05T01:00:00Z",
}

const partnerRatingFar = {
  id: "r-3",
  item_id: "item-1",
  user_id: "user-2",
  score: 4,
  reaction: "Meh",
  submitted_at: "2026-03-05T01:00:00Z",
}

describe("WatchRatingReveal", () => {
  // ── UNIT ────────────────────────────────────────────────────

  it("renders both scores", () => {
    render(<WatchRatingReveal myRating={myRating} partnerRating={partnerRatingClose} />)
    expect(screen.getByTestId("my-score")).toHaveTextContent("9")
    expect(screen.getByTestId("partner-score")).toHaveTextContent("8")
  })

  it("renders reactions when provided", () => {
    render(<WatchRatingReveal myRating={myRating} partnerRating={partnerRatingClose} />)
    expect(screen.getByText("Loved it!")).toBeInTheDocument()
    expect(screen.getByText("Really good")).toBeInTheDocument()
  })

  it("shows 'You agree!' when scores differ by <= 1", () => {
    render(<WatchRatingReveal myRating={myRating} partnerRating={partnerRatingClose} />)
    expect(screen.getByTestId("match-message")).toHaveTextContent("You agree!")
  })

  it("shows 'You diverge' when scores differ by > 1", () => {
    render(<WatchRatingReveal myRating={myRating} partnerRating={partnerRatingFar} />)
    expect(screen.getByTestId("match-message")).toHaveTextContent("You diverge")
  })

  it("hides reactions when not provided", () => {
    const noReactionRating = { ...myRating, reaction: null }
    render(<WatchRatingReveal myRating={noReactionRating} partnerRating={{ ...partnerRatingClose, reaction: null }} />)
    expect(screen.queryByText("Loved it!")).not.toBeInTheDocument()
  })
})

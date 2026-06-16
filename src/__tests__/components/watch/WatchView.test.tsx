import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────
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

// PosterCard forwards onClick/interactive; render a simple wrapper for the test.
vi.mock("@/components/shared/PosterCard", () => ({
  PosterCard: ({ children, onClick, interactive, grain, accent, ...rest }: Record<string, unknown> & React.PropsWithChildren) => {
    void interactive; void grain; void accent
    return (
      <div onClick={onClick as React.MouseEventHandler} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    )
  },
}))

import { WatchView, type WatchItem } from "@/components/watch/WatchView"

const items: WatchItem[] = [
  { id: "w1", title: "Inception", year: 2010, kind: "movie", status: "watchlist" },
  { id: "w2", title: "The Bear", year: 2024, kind: "show", status: "watching" },
  { id: "w3", title: "Past Lives", year: 2023, kind: "movie", status: "watched", mine: 9, theirs: 10 },
]

describe("WatchView — status transitions (track flow)", () => {
  // ── watchlist → watching ──────────────────────────────────
  it("renders a Start action on watchlist cards when onStartWatching is provided", () => {
    render(<WatchView items={items} onStartWatching={vi.fn()} />)
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument()
  })

  it("calls onStartWatching(id) when Start is clicked", () => {
    const onStartWatching = vi.fn()
    render(<WatchView items={items} onStartWatching={onStartWatching} />)
    fireEvent.click(screen.getByRole("button", { name: "Start" }))
    expect(onStartWatching).toHaveBeenCalledWith("w1")
  })

  it("does NOT render a Start action when onStartWatching is undefined (preview is inert)", () => {
    render(<WatchView items={items} />)
    expect(screen.queryByRole("button", { name: "Start" })).not.toBeInTheDocument()
  })

  // ── watching → watched ────────────────────────────────────
  it("renders a Finished action on watching cards and fires onMarkWatched(id)", () => {
    const onMarkWatched = vi.fn()
    render(<WatchView items={items} onMarkWatched={onMarkWatched} />)
    // Switch to the Watching tab.
    fireEvent.click(screen.getByRole("button", { name: "Watching" }))
    const finished = screen.getByRole("button", { name: "Finished" })
    expect(finished).toBeInTheDocument()
    fireEvent.click(finished)
    expect(onMarkWatched).toHaveBeenCalledWith("w2")
  })

  it("does NOT render a Finished action when onMarkWatched is undefined", () => {
    render(<WatchView items={items} />)
    fireEvent.click(screen.getByRole("button", { name: "Watching" }))
    expect(screen.queryByRole("button", { name: "Finished" })).not.toBeInTheDocument()
  })

  // ── no transition affordance on watched ───────────────────
  it("shows neither Start nor Finished on the Watched tab", () => {
    render(<WatchView items={items} onStartWatching={vi.fn()} onMarkWatched={vi.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: "Watched" }))
    expect(screen.queryByRole("button", { name: "Start" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Finished" })).not.toBeInTheDocument()
  })

  it("does not advance status when tapping the card body itself (only the action button)", () => {
    const onStartWatching = vi.fn()
    render(<WatchView items={items} onStartWatching={onStartWatching} />)
    // Tapping the title (card body) on a watchlist item must not trigger the transition.
    fireEvent.click(screen.getByText("Inception"))
    expect(onStartWatching).not.toHaveBeenCalled()
  })
})

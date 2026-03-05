import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Framer Motion mock ────────────────────────────────────────

vi.mock("framer-motion", () => ({
  motion: {
    button: React.forwardRef(
      (
        {
          children,
          initial,
          animate,
          transition,
          whileTap,
          ...rest
        }: {
          children?: React.ReactNode
          initial?: unknown
          animate?: unknown
          transition?: unknown
          whileTap?: unknown
          [key: string]: unknown
        },
        ref: React.Ref<HTMLButtonElement>
      ) => (
        <button ref={ref} {...rest}>
          {children}
        </button>
      )
    ),
    div: React.forwardRef(
      (
        {
          children,
          initial,
          animate,
          transition,
          whileTap,
          ...rest
        }: {
          children?: React.ReactNode
          initial?: unknown
          animate?: unknown
          transition?: unknown
          whileTap?: unknown
          [key: string]: unknown
        },
        ref: React.Ref<HTMLDivElement>
      ) => (
        <div ref={ref} {...rest}>
          {children}
        </div>
      )
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { SnapReaction } from "@/components/snap/SnapReaction"

describe("SnapReaction", () => {
  const defaultProps = {
    snapId: "snap-1",
    currentReaction: null as string | null,
    onReact: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("renders exactly 5 emoji buttons", () => {
      render(<SnapReaction {...defaultProps} />)

      const container = screen.getByTestId("snap-reaction")
      const buttons = container.querySelectorAll("button")
      expect(buttons).toHaveLength(5)
    })

    it("renders the correct 5 reaction emojis", () => {
      render(<SnapReaction {...defaultProps} />)

      const expectedEmojis = ["❤️", "😂", "😍", "🔥", "🥺"]
      for (const emoji of expectedEmojis) {
        expect(screen.getByTestId(`reaction-${emoji}`)).toBeInTheDocument()
      }
    })

    it("highlights the selected emoji with ring class", () => {
      render(<SnapReaction {...defaultProps} currentReaction="🔥" />)

      const selectedBtn = screen.getByTestId("reaction-🔥")
      expect(selectedBtn.className).toContain("ring-2")
    })

    it("unselected emojis have dimmed opacity", () => {
      render(<SnapReaction {...defaultProps} currentReaction="🔥" />)

      const unselectedBtn = screen.getByTestId("reaction-❤️")
      expect(unselectedBtn.className).toContain("opacity-60")
    })

    it("applies custom className to container", () => {
      render(<SnapReaction {...defaultProps} className="custom-class" />)

      const container = screen.getByTestId("snap-reaction")
      expect(container.className).toContain("custom-class")
    })

    it("renders with null currentReaction (no selection)", () => {
      render(<SnapReaction {...defaultProps} currentReaction={null} />)

      const emojis = ["❤️", "😂", "😍", "🔥", "🥺"]
      for (const emoji of emojis) {
        const btn = screen.getByTestId(`reaction-${emoji}`)
        expect(btn.className).toContain("opacity-60")
        expect(btn.className).not.toContain("ring-2")
      }
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("clicking unselected emoji calls onReact with snapId and emoji", async () => {
      const user = userEvent.setup()
      const onReact = vi.fn()
      render(<SnapReaction {...defaultProps} onReact={onReact} />)

      await user.click(screen.getByTestId("reaction-❤️"))
      expect(onReact).toHaveBeenCalledWith("snap-1", "❤️")
    })

    it("clicking selected emoji calls onReact with snapId and null (deselect)", async () => {
      const user = userEvent.setup()
      const onReact = vi.fn()
      render(
        <SnapReaction {...defaultProps} currentReaction="😂" onReact={onReact} />
      )

      await user.click(screen.getByTestId("reaction-😂"))
      expect(onReact).toHaveBeenCalledWith("snap-1", null)
    })

    it("clicking different emoji after one is selected calls onReact with new emoji", async () => {
      const user = userEvent.setup()
      const onReact = vi.fn()
      render(
        <SnapReaction {...defaultProps} currentReaction="❤️" onReact={onReact} />
      )

      await user.click(screen.getByTestId("reaction-😍"))
      expect(onReact).toHaveBeenCalledWith("snap-1", "😍")
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("onReact receives the correct snapId from props", async () => {
      const user = userEvent.setup()
      const onReact = vi.fn()
      render(
        <SnapReaction snapId="custom-snap-id" currentReaction={null} onReact={onReact} />
      )

      await user.click(screen.getByTestId("reaction-🥺"))
      expect(onReact).toHaveBeenCalledWith("custom-snap-id", "🥺")
    })

    it("all REACTION_EMOJIS from snap.types are rendered in order", () => {
      render(<SnapReaction {...defaultProps} />)

      const container = screen.getByTestId("snap-reaction")
      const buttons = container.querySelectorAll("button")
      const renderedEmojis = Array.from(buttons).map((btn) => btn.textContent)

      expect(renderedEmojis).toEqual(["❤️", "😂", "😍", "🔥", "🥺"])
    })
  })
})

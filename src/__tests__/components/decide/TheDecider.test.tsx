import { describe, it, expect, vi, beforeEach } from "vitest"
import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// ── framer-motion mock (Proxy passthrough — handles every motion.* tag) ──
vi.mock("framer-motion", () => {
  const passthrough = (tag: string) =>
    React.forwardRef(({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<unknown>) => {
      const {
        initial,
        animate,
        exit,
        transition,
        whileHover,
        whileTap,
        whileInView,
        layout,
        layoutId,
        variants,
        drag,
        ...rest
      } = props
      void initial
      void animate
      void exit
      void transition
      void whileHover
      void whileTap
      void whileInView
      void layout
      void layoutId
      void variants
      void drag
      return React.createElement(tag, { ref, ...rest }, children)
    })
  const motion = new Proxy({}, { get: (_t, tag: string) => passthrough(tag) })
  return {
    motion,
    AnimatePresence: ({ children }: React.PropsWithChildren) =>
      React.createElement(React.Fragment, null, children),
    useReducedMotion: () => false,
  }
})

// Component under test — imported AFTER all mocks.
import { TheDecider } from "@/components/decide/TheDecider"

/**
 * Type into an option input one char at a time, re-querying between keystrokes.
 * Each keystroke flips `filled.length`, which re-renders the motion-wrapped
 * option rows; under the framer-motion mock that detaches a held element
 * reference, so a single `user.type(el, "Solo")` would only register "S".
 * Re-querying keeps the keyboard interaction real while surviving the remount.
 */
async function typeOption(user: ReturnType<typeof userEvent.setup>, index: number, text: string) {
  for (const ch of text) {
    await user.type(screen.getByTestId(`option-input-${index}`), ch)
  }
}

describe("TheDecider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── UNIT / STATE: recommendation reacts to the description text ──
  describe("recommendation reacts to description", () => {
    it("recommends Pros & Cons (weigh) for an important decision", async () => {
      const user = userEvent.setup()
      render(<TheDecider onLaunch={vi.fn()} />)

      // Default (no description, no options) → "many" → Spin the Wheel.
      expect(screen.getByTestId("decider-pick")).toHaveTextContent("Spin the Wheel")

      await user.type(screen.getByTestId("decider-description"), "this is an important decision")

      expect(screen.getByTestId("decider-pick")).toHaveTextContent("Pros & Cons")
    })

    it("switches to the playful pick (Roll the Dice) when the description is for fun", async () => {
      const user = userEvent.setup()
      render(<TheDecider onLaunch={vi.fn()} />)

      const description = screen.getByTestId("decider-description")

      // First land on the weigh tool…
      await user.type(description, "this is an important decision")
      expect(screen.getByTestId("decider-pick")).toHaveTextContent("Pros & Cons")

      // …then clear + retype a playful prompt → "surprise" hint → Roll the Dice.
      await user.clear(description)
      await user.type(description, "surprise me, just for fun")

      expect(screen.getByTestId("decider-pick")).toHaveTextContent("Roll the Dice")
    })
  })

  // ── INTEGRATION: clicking "Use" launches the recommended game with the options ──
  describe("onLaunch integration", () => {
    it("calls onLaunch with (game, options, { autoRun: true }) by default", async () => {
      const user = userEvent.setup()
      const onLaunch = vi.fn()
      render(<TheDecider onLaunch={onLaunch} />)

      // Component starts with 2 blank option rows.
      await typeOption(user, 0, "A")
      await typeOption(user, 1, "B")

      // autoRun checkbox defaults to checked.
      expect(screen.getByTestId("decider-autorun")).toBeChecked()

      await user.click(screen.getByTestId("decider-use"))

      expect(onLaunch).toHaveBeenCalledTimes(1)
      const [game, options, opts] = onLaunch.mock.calls[0]

      // game matches the current recommendation. With 2 filled options and no
      // description, classify → binary → Rock Paper Scissors (id "rps").
      expect(game.id).toBe("rps")
      const pick = screen.getByTestId("decider-pick")
      expect(pick).toHaveTextContent(game.label)

      // options carries the two labelled entries.
      expect(options).toHaveLength(2)
      expect(options.map((o: { label: string }) => o.label)).toEqual(["A", "B"])

      // autoRun defaults true.
      expect(opts).toEqual({ autoRun: true })
    })

    it("passes autoRun: false after toggling the checkbox off", async () => {
      const user = userEvent.setup()
      const onLaunch = vi.fn()
      render(<TheDecider onLaunch={onLaunch} />)

      await typeOption(user, 0, "A")
      await typeOption(user, 1, "B")

      const autorun = screen.getByTestId("decider-autorun")
      expect(autorun).toBeChecked()
      await user.click(autorun)
      expect(autorun).not.toBeChecked()

      await user.click(screen.getByTestId("decider-use"))

      expect(onLaunch).toHaveBeenCalledTimes(1)
      const [game, options, opts] = onLaunch.mock.calls[0]
      expect(game.id).toBe("rps")
      expect(options.map((o: { label: string }) => o.label)).toEqual(["A", "B"])
      expect(opts).toEqual({ autoRun: false })
    })

    it("launches the recommended game that matches the typed description", async () => {
      const user = userEvent.setup()
      const onLaunch = vi.fn()
      render(<TheDecider onLaunch={onLaunch} />)

      await user.type(screen.getByTestId("decider-description"), "this is an important decision")
      await typeOption(user, 0, "A")
      await typeOption(user, 1, "B")

      // Recommendation is now the weigh tool.
      expect(screen.getByTestId("decider-pick")).toHaveTextContent("Pros & Cons")

      await user.click(screen.getByTestId("decider-use"))

      const [game, options] = onLaunch.mock.calls[0]
      expect(game.id).toBe("proscons")
      expect(options.map((o: { label: string }) => o.label)).toEqual(["A", "B"])
    })
  })

  // ── INTERACTION: launching from an alternative chip uses that game ──
  describe("alternative chips", () => {
    it("launches an alternative game when its chip is clicked", async () => {
      const user = userEvent.setup()
      const onLaunch = vi.fn()
      render(<TheDecider onLaunch={onLaunch} />)

      // Playful prompt → primary pick is dice; bonus ("Ask Fate") is the alt.
      await user.type(screen.getByTestId("decider-description"), "surprise me, just for fun")
      expect(screen.getByTestId("decider-pick")).toHaveTextContent("Roll the Dice")

      const altChip = screen.getByTestId("decider-alt-bonus")
      expect(altChip).toHaveTextContent("Ask Fate")

      await user.click(altChip)

      expect(onLaunch).toHaveBeenCalledTimes(1)
      const [game] = onLaunch.mock.calls[0]
      expect(game.id).toBe("bonus")
    })
  })

  // ── EDGE: when fewer than 2 options are filled, the raw option list is passed ──
  describe("edge cases", () => {
    it("passes the raw (unfilled) options when fewer than 2 are labelled", async () => {
      const user = userEvent.setup()
      const onLaunch = vi.fn()
      render(<TheDecider onLaunch={onLaunch} />)

      // Only fill one option → filled.length === 1 (< 2) → falls back to `options`.
      await typeOption(user, 0, "Solo")
      // Confirm the controlled input committed the full value before launching.
      expect(screen.getByTestId("option-input-0")).toHaveValue("Solo")

      await user.click(screen.getByTestId("decider-use"))

      const [, options] = onLaunch.mock.calls[0]
      // The component starts with 2 option rows; the raw list (both) is sent.
      expect(options).toHaveLength(2)
      expect(options[0].label).toBe("Solo")
      expect(options[1].label).toBe("")
    })

    it("honours an injected games prop for the recommendation", async () => {
      const user = userEvent.setup()
      const onLaunch = vi.fn()
      const onlyProscons = [
        {
          id: "proscons",
          label: "Pros & Cons",
          arabicLabel: "إيجابيات وسلبيات",
          whenToUse: "Weigh it.",
          kind: "weigh" as const,
          asset: "",
          Component: () => null,
        },
      ]
      render(<TheDecider games={onlyProscons} onLaunch={onLaunch} />)

      // Single registered game → it is always the pick regardless of input.
      expect(screen.getByTestId("decider-pick")).toHaveTextContent("Pros & Cons")

      await user.click(screen.getByTestId("decider-use"))
      const [game] = onLaunch.mock.calls[0]
      expect(game.id).toBe("proscons")
    })
  })

  // ── INTERACTION: OptionInput presets + add wired through to recommendation ──
  describe("OptionInput wiring", () => {
    it("applying a preset updates the option list and recommendation", async () => {
      const user = userEvent.setup()
      const onLaunch = vi.fn()
      render(<TheDecider onLaunch={onLaunch} />)

      // "Dinner" preset → 5 options → "many" → Spin the Wheel.
      await user.click(screen.getByTestId("preset-dinner"))
      expect(screen.getByTestId("decider-pick")).toHaveTextContent("Spin the Wheel")

      await user.click(screen.getByTestId("decider-use"))
      const [game, options] = onLaunch.mock.calls[0]
      expect(game.id).toBe("wheel")
      expect(options).toHaveLength(5)
      expect(options.map((o: { label: string }) => o.label)).toEqual([
        "Pizza",
        "Shawarma",
        "Koshari",
        "Sushi",
        "Cook at home",
      ])
    })

    it("adds a new option row via add-option", async () => {
      const user = userEvent.setup()
      render(<TheDecider onLaunch={vi.fn()} />)

      // Starts with rows 0 and 1; no row 2 yet.
      expect(screen.queryByTestId("option-input-2")).not.toBeInTheDocument()

      await user.click(screen.getByTestId("add-option"))

      expect(screen.getByTestId("option-input-2")).toBeInTheDocument()
    })
  })

  // ── render sanity for the recommendation block (not the only assertion) ──
  it("renders the recommendation block with a Use button", () => {
    render(<TheDecider onLaunch={vi.fn()} />)
    const rec = screen.getByTestId("decider-recommendation")
    expect(within(rec).getByTestId("decider-use")).toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"
import React from "react"
import { render, screen, within, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// ── Mocks (ALL vi.mock calls BEFORE importing the component under test) ──────

// framer-motion: Proxy passthrough — handles every motion.* tag + AnimatePresence + useReducedMotion.
vi.mock("framer-motion", () => {
  const passthrough = (tag: string) =>
    React.forwardRef<HTMLElement, Record<string, unknown>>(({ children, ...props }, ref) => {
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
      } = props as Record<string, unknown>
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
      return React.createElement(tag, { ref, ...rest }, children as React.ReactNode)
    })
  const motion = new Proxy(
    {},
    { get: (_t, tag: string) => passthrough(tag) },
  )
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useReducedMotion: () => false,
  }
})

// Component under test — imported AFTER the mocks.
import { DecideHub, DECIDE_MOCK } from "@/components/decide/DecideHub"

// ── Shared helpers ──────────────────────────────────────────────────────────

const TOOL_IDS = ["wheel", "dice", "rps", "proscons", "bonus"] as const

/** Always re-query the open modal — it re-renders as state/phase change. */
const dialog = () => screen.getByRole("dialog")

/**
 * Set an option-input's full value inside the modal and wait for React to
 * commit it. OptionInput rows are controlled inputs whose onChange closure is
 * recreated each render; firing the next change before the previous commits
 * would clobber it. We flush between writes so each value sticks verbatim.
 */
async function setOption(index: number, value: string) {
  const input = within(dialog()).getByTestId(`option-input-${index}`)
  fireEvent.change(input, { target: { value } })
  await waitFor(() =>
    expect(within(dialog()).getByTestId(`option-input-${index}`)).toHaveValue(value),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("DecideHub", () => {
  // ──────────────────────────────────────────────────────────────────────────
  // EMPTY — no decisions: empty history, all 5 tool cards, surprise CTA.
  // ──────────────────────────────────────────────────────────────────────────
  describe("empty state", () => {
    it("renders the empty-history placeholder, all 5 tool cards, and the surprise CTA", () => {
      render(<DecideHub decisions={[]} />)

      // Empty history placeholder present; no history items.
      expect(screen.getByTestId("history-empty")).toBeInTheDocument()
      expect(screen.queryByTestId("history-item")).not.toBeInTheDocument()

      // All five real tools render their selector cards.
      for (const id of TOOL_IDS) {
        expect(screen.getByTestId(`tool-${id}`)).toBeInTheDocument()
      }

      // "Let fate decide" surprise button is present.
      expect(screen.getByTestId("surprise-btn")).toBeInTheDocument()
    })

    it("does not open any game modal on initial render (no game-start / game-close)", () => {
      render(<DecideHub decisions={[]} />)
      expect(screen.queryByTestId("game-start")).not.toBeInTheDocument()
      expect(screen.queryByTestId("game-close")).not.toBeInTheDocument()
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // HISTORY — DECIDE_MOCK renders history items with winner labels.
  // ──────────────────────────────────────────────────────────────────────────
  describe("history rendering", () => {
    it("renders history items and surfaces the 'Shawarma' winner label", () => {
      render(<DecideHub decisions={DECIDE_MOCK} />)

      const items = screen.getAllByTestId("history-item")
      expect(items.length).toBeGreaterThan(0)
      // DECIDE_MOCK has 3 entries — assert the exact count for integration fidelity.
      expect(items).toHaveLength(DECIDE_MOCK.length)

      // The first mock decision's winner ("Shawarma") is shown.
      expect(screen.getByText("Shawarma")).toBeInTheDocument()

      // No empty placeholder when there's history.
      expect(screen.queryByTestId("history-empty")).not.toBeInTheDocument()
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // FULL FLOW — interaction + integration: open wheel → fill options → start →
  // run → onSaveDecision fires with the correct payload + result phase renders.
  // ──────────────────────────────────────────────────────────────────────────
  describe("full decide flow (interaction + integration)", () => {
    it("opens the wheel, runs it, calls onSaveDecision once with the right payload, and shows the result", async () => {
      const user = userEvent.setup()
      const onSaveDecision = vi.fn()
      render(<DecideHub decisions={[]} onSaveDecision={onSaveDecision} />)

      // Open the wheel tool → modal opens into setup with a Start button.
      await user.click(screen.getByTestId("tool-wheel"))
      expect(await screen.findByTestId("game-start")).toBeInTheDocument()

      // Scope option inputs to the modal dialog — TheDecider on the main page
      // also renders an OptionInput with the same option-input-* testids.
      // The setup starts with two blank option inputs.
      expect(within(dialog()).getByTestId("option-input-0")).toHaveValue("")
      expect(within(dialog()).getByTestId("option-input-1")).toHaveValue("")

      // Enter two real options.
      await setOption(0, "Pizza")
      await setOption(1, "Sushi")
      expect(within(dialog()).getByTestId("option-input-0")).toHaveValue("Pizza")
      expect(within(dialog()).getByTestId("option-input-1")).toHaveValue("Sushi")

      // Start → the game renders its run button (button is now enabled).
      const startBtn = screen.getByTestId("game-start")
      expect(startBtn).not.toBeDisabled()
      await user.click(startBtn)
      const runBtn = await screen.findByTestId("decide-game-run")
      expect(runBtn).toBeInTheDocument()

      // Run the game → onSaveDecision fires exactly once.
      await user.click(runBtn)
      await waitFor(() => expect(onSaveDecision).toHaveBeenCalledTimes(1))

      // Inspect the saved payload (integration: hub builds the correct SaveDecisionInput).
      const payload = onSaveDecision.mock.calls[0][0]
      expect(payload).toMatchObject({ kind: "many", toolId: "wheel" })
      expect(payload.options).toHaveLength(2)
      const labels = payload.options.map((o: { label: string }) => o.label)
      expect(labels).toEqual(["Pizza", "Sushi"])

      // Result is a real, non-null winner from the typed options, summary "<label> wins".
      expect(payload.result).toBeTruthy()
      expect(payload.result.winner).not.toBeNull()
      expect(labels).toContain(payload.result.winner.label)
      expect(payload.result.summary).toMatch(/wins$/)

      // The result phase renders the winner panel.
      const winner = await screen.findByTestId("result-winner")
      expect(winner).toBeInTheDocument()
      expect(winner).toHaveTextContent(payload.result.winner.label)
    })

    it("does not call onSaveDecision until the game is actually run", async () => {
      const user = userEvent.setup()
      const onSaveDecision = vi.fn()
      render(<DecideHub decisions={[]} onSaveDecision={onSaveDecision} />)

      await user.click(screen.getByTestId("tool-wheel"))
      await screen.findByTestId("game-start")
      await setOption(0, "Pizza")
      await setOption(1, "Sushi")
      await user.click(screen.getByTestId("game-start"))
      await screen.findByTestId("decide-game-run")

      // Reached the play phase but have NOT pressed run yet.
      expect(onSaveDecision).not.toHaveBeenCalled()
    })

    it("closes the modal via game-close and tears down the runner", async () => {
      const user = userEvent.setup()
      render(<DecideHub decisions={[]} />)

      await user.click(screen.getByTestId("tool-wheel"))
      expect(await screen.findByTestId("game-close")).toBeInTheDocument()

      await user.click(screen.getByTestId("game-close"))
      await waitFor(() => expect(screen.queryByTestId("game-close")).not.toBeInTheDocument())
      expect(screen.queryByTestId("game-start")).not.toBeInTheDocument()
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // SURPRISE — "Let fate decide" launches some tool into setup.
  // ──────────────────────────────────────────────────────────────────────────
  describe("surprise / let fate decide", () => {
    it("launches a random tool into setup (game-start appears)", async () => {
      const user = userEvent.setup()
      render(<DecideHub decisions={[]} />)

      // No modal before clicking.
      expect(screen.queryByTestId("game-start")).not.toBeInTheDocument()

      await user.click(screen.getByTestId("surprise-btn"))

      // A tool launched into setup.
      expect(await screen.findByTestId("game-start")).toBeInTheDocument()
      // The modal chrome (close button) is present too.
      expect(screen.getByTestId("game-close")).toBeInTheDocument()
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // CLEAR — owner's decision exposes a delete control that fires onClearDecision.
  // ──────────────────────────────────────────────────────────────────────────
  describe("clear decision", () => {
    it("calls onClearDecision with the decision id when the owner deletes their entry", async () => {
      const user = userEvent.setup()
      const onClearDecision = vi.fn()
      render(
        <DecideHub
          decisions={DECIDE_MOCK}
          currentUserId="me"
          onClearDecision={onClearDecision}
        />,
      )

      // The first mock decision (created_by "me", id "mock-1") shows a clear button.
      const clearButtons = screen.getAllByTestId("history-clear")
      expect(clearButtons.length).toBeGreaterThan(0)

      // Click the clear control on the first owner-authored item (mock-1).
      const firstItem = screen.getAllByTestId("history-item")[0]
      const clearInFirst = within(firstItem).getByTestId("history-clear")
      await user.click(clearInFirst)

      expect(onClearDecision).toHaveBeenCalledTimes(1)
      expect(onClearDecision).toHaveBeenCalledWith("mock-1")
    })

    it("does not render a clear control for the partner's decision (mock-2)", () => {
      render(
        <DecideHub
          decisions={DECIDE_MOCK}
          currentUserId="me"
          partnerName="Yara"
          onClearDecision={vi.fn()}
        />,
      )

      const items = screen.getAllByTestId("history-item")
      // mock-2 is created_by "partner" → no clear button on that item.
      const partnerItem = items[1]
      expect(within(partnerItem).queryByTestId("history-clear")).not.toBeInTheDocument()
    })

    it("renders no clear controls when currentUserId is absent (null user edge case)", () => {
      render(<DecideHub decisions={DECIDE_MOCK} onClearDecision={vi.fn()} />)
      expect(screen.queryByTestId("history-clear")).not.toBeInTheDocument()
    })
  })
})

import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks (must precede import of component under test) ──────────

vi.mock("framer-motion", () => {
  const passthrough = (tag: string) =>
    React.forwardRef(
      ({ children, ...props }: { children?: React.ReactNode; [k: string]: unknown }, ref: React.Ref<unknown>) => {
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
      }
    )
  const motion = new Proxy(
    {},
    { get: (_t, tag) => passthrough(tag as string) }
  )
  return {
    motion,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useReducedMotion: () => false,
  }
})

import { OptionInput } from "@/components/decide/OptionInput"
import type { DecideOption } from "@/components/decide/contract"

// ── Helpers ─────────────────────────────────────────────────────

function opt(id: string, label: string, weight?: number): DecideOption {
  return weight === undefined ? { id, label } : { id, label, weight }
}

function twoOptions(): DecideOption[] {
  return [opt("a", "Apple"), opt("b", "Banana")]
}

function threeOptions(): DecideOption[] {
  return [opt("a", "Apple"), opt("b", "Banana"), opt("c", "Cherry")]
}

describe("OptionInput", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit: rendering ───────────────────────────────────────────

  describe("unit", () => {
    it("renders one text input per option", () => {
      render(<OptionInput options={twoOptions()} onChange={vi.fn()} />)
      expect(screen.getByTestId("option-input-0")).toBeInTheDocument()
      expect(screen.getByTestId("option-input-1")).toBeInTheDocument()
      expect(screen.queryByTestId("option-input-2")).not.toBeInTheDocument()
      // Inputs are seeded with the controlled labels.
      expect(screen.getByTestId("option-input-0")).toHaveValue("Apple")
      expect(screen.getByTestId("option-input-1")).toHaveValue("Banana")
    })

    it("typing into option-input-0 calls onChange with the edited label for that option id", () => {
      const onChange = vi.fn()
      render(<OptionInput options={twoOptions()} onChange={onChange} />)

      // fireEvent.change gives a single deterministic onChange with the full value,
      // since the component is controlled and does not re-render itself here.
      fireEvent.change(screen.getByTestId("option-input-0"), {
        target: { value: "Apricot" },
      })

      expect(onChange).toHaveBeenCalledTimes(1)
      const payload = onChange.mock.calls[0][0] as DecideOption[]
      expect(payload).toHaveLength(2)
      // Only the edited option (id "a") changes; the other is untouched.
      expect(payload[0]).toEqual({ id: "a", label: "Apricot" })
      expect(payload[1]).toEqual({ id: "b", label: "Banana" })
    })

    it("edits the correct option id when typing into a non-first row", () => {
      const onChange = vi.fn()
      render(<OptionInput options={twoOptions()} onChange={onChange} />)

      fireEvent.change(screen.getByTestId("option-input-1"), {
        target: { value: "Blueberry" },
      })

      const payload = onChange.mock.calls[0][0] as DecideOption[]
      expect(payload[0]).toEqual({ id: "a", label: "Apple" })
      expect(payload[1]).toEqual({ id: "b", label: "Blueberry" })
    })
  })

  // ── Interaction: add / remove flows ───────────────────────────

  describe("interaction — add", () => {
    it("clicking add-option calls onChange with an array of length 3 (original 2 + 1 new)", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      const initial = twoOptions()
      render(<OptionInput options={initial} onChange={onChange} />)

      await user.click(screen.getByTestId("add-option"))

      expect(onChange).toHaveBeenCalledTimes(1)
      const payload = onChange.mock.calls[0][0] as DecideOption[]
      expect(payload).toHaveLength(3)
      // The two originals are preserved...
      expect(payload[0]).toEqual(initial[0])
      expect(payload[1]).toEqual(initial[1])
      // ...and the appended option is fresh: a real id and an empty label.
      expect(payload[2].label).toBe("")
      expect(typeof payload[2].id).toBe("string")
      expect(payload[2].id.length).toBeGreaterThan(0)
      expect(payload[2].id).not.toBe(initial[0].id)
      expect(payload[2].id).not.toBe(initial[1].id)
    })

    it("disables add-option when options.length === max so onChange is NOT called", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      // max=2 with 2 options → at capacity.
      render(<OptionInput options={twoOptions()} onChange={onChange} max={2} />)

      const addBtn = screen.getByTestId("add-option")
      expect(addBtn).toBeDisabled()

      await user.click(addBtn)
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe("interaction — remove", () => {
    it("with 3 options, clicking remove-option-2 calls onChange with length 2 (that option dropped)", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<OptionInput options={threeOptions()} onChange={onChange} />)

      const removeBtn = screen.getByTestId("remove-option-2")
      expect(removeBtn).not.toBeDisabled()

      await user.click(removeBtn)

      expect(onChange).toHaveBeenCalledTimes(1)
      const payload = onChange.mock.calls[0][0] as DecideOption[]
      expect(payload).toHaveLength(2)
      // The removed option ("c") is gone; the rest preserved in order.
      expect(payload.map((o) => o.id)).toEqual(["a", "b"])
      expect(payload.find((o) => o.id === "c")).toBeUndefined()
    })

    it("disables remove buttons when options.length === min (2) so onChange is NOT called", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      // min defaults to 2, and we pass exactly 2 options → cannot remove.
      render(<OptionInput options={twoOptions()} onChange={onChange} min={2} />)

      const remove0 = screen.getByTestId("remove-option-0")
      const remove1 = screen.getByTestId("remove-option-1")
      expect(remove0).toBeDisabled()
      expect(remove1).toBeDisabled()

      await user.click(remove0)
      await user.click(remove1)
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  // ── Interaction: presets ──────────────────────────────────────

  describe("interaction — presets", () => {
    it('clicking the "Yes / No" preset calls onChange with [{label:"Yes"},{label:"No"}]', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<OptionInput options={threeOptions()} onChange={onChange} />)

      // DEFAULT_PRESETS "Yes / No" → slug "preset-yes-no".
      const presetBtn = screen.getByTestId("preset-yes-no")
      await user.click(presetBtn)

      expect(onChange).toHaveBeenCalledTimes(1)
      const payload = onChange.mock.calls[0][0] as DecideOption[]
      expect(payload).toHaveLength(2)
      expect(payload.map((o) => o.label)).toEqual(["Yes", "No"])
      // Each preset option gets a fresh, unique id.
      expect(payload[0].id).toBeTruthy()
      expect(payload[1].id).toBeTruthy()
      expect(payload[0].id).not.toBe(payload[1].id)
    })

    it("preset honors max by truncating the generated option list", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      // "Dinner" preset has 5 options; max=3 should clamp to 3.
      render(<OptionInput options={twoOptions()} onChange={onChange} max={3} />)

      await user.click(screen.getByTestId("preset-dinner"))

      const payload = onChange.mock.calls[0][0] as DecideOption[]
      expect(payload).toHaveLength(3)
      expect(payload.map((o) => o.label)).toEqual(["Pizza", "Shawarma", "Koshari"])
    })
  })

  // ── Interaction + Integration: weights stepper ────────────────

  describe("weights (showWeights)", () => {
    it("hides the weight stepper when showWeights is false (default)", () => {
      render(<OptionInput options={twoOptions()} onChange={vi.fn()} />)
      expect(screen.queryByTestId("weight-0")).not.toBeInTheDocument()
      expect(
        screen.queryByLabelText("Raise weight of option 1")
      ).not.toBeInTheDocument()
    })

    it("renders a weight stepper per row when showWeights is true (default weight 1)", () => {
      render(<OptionInput options={twoOptions()} onChange={vi.fn()} showWeights />)
      expect(screen.getByTestId("weight-0")).toHaveTextContent("1")
      expect(screen.getByTestId("weight-1")).toHaveTextContent("1")
      expect(screen.getByLabelText("Raise weight of option 1")).toBeInTheDocument()
      expect(screen.getByLabelText("Lower weight of option 1")).toBeInTheDocument()
    })

    it('clicking "Raise weight of option 1" calls onChange where that option weight increased by 1', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      // Start with explicit weight 2 on option "a".
      const options = [opt("a", "Apple", 2), opt("b", "Banana", 1)]
      render(<OptionInput options={options} onChange={onChange} showWeights />)

      await user.click(screen.getByLabelText("Raise weight of option 1"))

      expect(onChange).toHaveBeenCalledTimes(1)
      const payload = onChange.mock.calls[0][0] as DecideOption[]
      // Only option "a" changes; its weight goes 2 → 3, others untouched.
      expect(payload[0]).toEqual({ id: "a", label: "Apple", weight: 3 })
      expect(payload[1]).toEqual({ id: "b", label: "Banana", weight: 1 })
    })

    it("defaults a missing weight to 1 then raises to 2", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      // No weight on "a" → treated as 1, raise → 2.
      render(<OptionInput options={twoOptions()} onChange={onChange} showWeights />)

      await user.click(screen.getByLabelText("Raise weight of option 1"))

      const payload = onChange.mock.calls[0][0] as DecideOption[]
      expect(payload[0]).toEqual({ id: "a", label: "Apple", weight: 2 })
    })

    it('clicking "Lower weight of option 1" decreases that option weight by 1', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      const options = [opt("a", "Apple", 3), opt("b", "Banana", 1)]
      render(<OptionInput options={options} onChange={onChange} showWeights />)

      await user.click(screen.getByLabelText("Lower weight of option 1"))

      const payload = onChange.mock.calls[0][0] as DecideOption[]
      expect(payload[0]).toEqual({ id: "a", label: "Apple", weight: 2 })
      expect(payload[1]).toEqual({ id: "b", label: "Banana", weight: 1 })
    })

    it("clamps weight at the maximum (5): raise button is disabled and onChange not fired", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      const options = [opt("a", "Apple", 5), opt("b", "Banana", 1)]
      render(<OptionInput options={options} onChange={onChange} showWeights />)

      const raise = screen.getByLabelText("Raise weight of option 1")
      expect(raise).toBeDisabled()
      await user.click(raise)
      expect(onChange).not.toHaveBeenCalled()
    })

    it("clamps weight at the minimum (1): lower button is disabled and onChange not fired", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      const options = [opt("a", "Apple", 1), opt("b", "Banana", 2)]
      render(<OptionInput options={options} onChange={onChange} showWeights />)

      const lower = screen.getByLabelText("Lower weight of option 1")
      expect(lower).toBeDisabled()
      await user.click(lower)
      expect(onChange).not.toHaveBeenCalled()
    })
  })
})

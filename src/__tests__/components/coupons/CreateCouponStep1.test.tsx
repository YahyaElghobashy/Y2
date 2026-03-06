import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock framer-motion (same pattern as project convention)
vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
        ref: React.Ref<HTMLDivElement>
      ) => {
        const { initial, animate, exit, transition, variants, whileHover, whileTap, ...rest } = props
        void initial; void animate; void exit; void transition; void variants; void whileHover; void whileTap
        return <div ref={ref} {...rest}>{children}</div>
      }
    ),
    button: React.forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
        ref: React.Ref<HTMLButtonElement>
      ) => {
        const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
        void initial; void animate; void exit; void transition; void whileHover; void whileTap
        return <button ref={ref} {...rest}>{children}</button>
      }
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { CreateCouponStep1 } from "@/components/coupons/CreateCouponStep1"
import type { Step1Data } from "@/components/coupons/CreateCouponStep1"

describe("CreateCouponStep1", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let onNext: any

  beforeEach(() => {
    vi.clearAllMocks()
    onNext = vi.fn()
  })

  // ─── UNIT TESTS ───────────────────────────────────────────────────────

  describe("Unit", () => {
    it("onNext callback receives correct { title, description, emoji, category } shape", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep1 onNext={onNext} />)

      // Fill required title
      await user.type(screen.getByTestId("title-input"), "Breakfast in bed")
      // Fill optional description
      await user.type(screen.getByTestId("description-input"), "With pancakes")
      // Pick an emoji
      const emojiButtons = screen.getByTestId("emoji-picker").querySelectorAll("button")
      await user.click(emojiButtons[0]) // "❤️"
      // Pick a category
      await user.click(screen.getByText("Romantic"))

      // Submit
      await user.click(screen.getByTestId("next-button"))

      await waitFor(() => {
        expect(onNext).toHaveBeenCalledTimes(1)
        const payload: Step1Data = onNext.mock.calls[0][0]
        expect(payload).toEqual({
          title: "Breakfast in bed",
          description: "With pancakes",
          emoji: "❤️",
          category: "romantic",
        })
      })
    })

    it("onNext sends empty string for emoji when none selected", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep1 onNext={onNext} />)

      await user.type(screen.getByTestId("title-input"), "A hug")
      await user.click(screen.getByTestId("next-button"))

      await waitFor(() => {
        expect(onNext).toHaveBeenCalledTimes(1)
        expect(onNext.mock.calls[0][0].emoji).toBe("")
      })
    })

    it("defaults category to 'general' when no category explicitly picked", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep1 onNext={onNext} />)

      await user.type(screen.getByTestId("title-input"), "A hug")
      await user.click(screen.getByTestId("next-button"))

      await waitFor(() => {
        expect(onNext.mock.calls[0][0].category).toBe("general")
      })
    })

    it("Zod validation rejects empty title — error message shown, onNext not called", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep1 onNext={onNext} />)

      // mode: "onChange" requires an actual value change to trigger validation.
      // Type something then clear it to trigger the empty-title error.
      const titleInput = screen.getByTestId("title-input")
      await user.type(titleInput, "x")
      await user.clear(titleInput)

      await waitFor(() => {
        expect(screen.getByText("Title is required")).toBeInTheDocument()
      })

      // Next button should be disabled
      expect(screen.getByTestId("next-button")).toBeDisabled()
      expect(onNext).not.toHaveBeenCalled()
    })

    it("Zod validation rejects title longer than 100 characters", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep1 onNext={onNext} />)

      const longTitle = "A".repeat(101)
      await user.type(screen.getByTestId("title-input"), longTitle)

      await waitFor(() => {
        expect(screen.getByText("Max 100 characters")).toBeInTheDocument()
      })

      expect(screen.getByTestId("next-button")).toBeDisabled()
    })

    it("populates default values when data prop is provided", () => {
      render(
        <CreateCouponStep1
          data={{
            title: "Pre-filled title",
            description: "Pre-filled description",
            emoji: "⭐",
            category: "fun",
          }}
          onNext={onNext}
        />
      )

      expect(screen.getByTestId("title-input")).toHaveValue("Pre-filled title")
      expect(screen.getByTestId("description-input")).toHaveValue("Pre-filled description")

      // Check that the star emoji has the selected ring style
      const emojiButtons = screen.getByTestId("emoji-picker").querySelectorAll("button")
      const starButton = Array.from(emojiButtons).find((btn) => btn.textContent === "⭐")
      expect(starButton?.className).toContain("ring-2")

      // Check that 'Fun' category is selected (has accent-primary bg)
      const funButton = screen.getByText("Fun")
      expect(funButton.className).toContain("bg-[var(--accent-primary)]")
    })

    it("description is optional — submits successfully without it", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep1 onNext={onNext} />)

      await user.type(screen.getByTestId("title-input"), "Quick hug")
      await user.click(screen.getByTestId("next-button"))

      await waitFor(() => {
        expect(onNext).toHaveBeenCalledTimes(1)
        expect(onNext.mock.calls[0][0].description).toBe("")
      })
    })
  })

  // ─── INTERACTION TESTS ────────────────────────────────────────────────

  describe("Interaction", () => {
    it("full flow: select emoji -> enter title -> pick category -> submit -> onNext called", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep1 onNext={onNext} />)

      // 1. Select emoji
      const emojiButtons = screen.getByTestId("emoji-picker").querySelectorAll("button")
      await user.click(emojiButtons[4]) // "💆"

      // 2. Enter title
      await user.type(screen.getByTestId("title-input"), "Spa day")

      // 3. Pick category
      await user.click(screen.getByText("Practical"))

      // 4. Submit
      await user.click(screen.getByTestId("next-button"))

      await waitFor(() => {
        expect(onNext).toHaveBeenCalledWith({
          title: "Spa day",
          description: "",
          emoji: "💆",
          category: "practical",
        })
      })
    })

    it("toggling emoji: clicking selected emoji deselects it", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep1 onNext={onNext} />)

      const emojiButtons = screen.getByTestId("emoji-picker").querySelectorAll("button")
      const heartButton = emojiButtons[0] // "❤️"

      // Select
      await user.click(heartButton)
      expect(heartButton.className).toContain("ring-2")

      // Deselect
      await user.click(heartButton)
      expect(heartButton.className).not.toContain("ring-2")
    })

    it("toggling emoji: selecting a new emoji replaces the previous one", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep1 onNext={onNext} />)

      const emojiButtons = screen.getByTestId("emoji-picker").querySelectorAll("button")
      const heartButton = emojiButtons[0] // "❤️"
      const starButton = emojiButtons[1] // "⭐"

      // Select heart
      await user.click(heartButton)
      expect(heartButton.className).toContain("ring-2")

      // Select star — heart should deselect
      await user.click(starButton)
      expect(starButton.className).toContain("ring-2")
      expect(heartButton.className).not.toContain("ring-2")

      // Submit and verify only star emoji sent
      await user.type(screen.getByTestId("title-input"), "Test")
      await user.click(screen.getByTestId("next-button"))

      await waitFor(() => {
        expect(onNext.mock.calls[0][0].emoji).toBe("⭐")
      })
    })

    it("next button is disabled until title is filled", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep1 onNext={onNext} />)

      // Initially disabled
      expect(screen.getByTestId("next-button")).toBeDisabled()

      // Type a title
      await user.type(screen.getByTestId("title-input"), "Valid title")

      // Now enabled
      await waitFor(() => {
        expect(screen.getByTestId("next-button")).not.toBeDisabled()
      })
    })

    it("next button becomes disabled again when title is cleared", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep1 onNext={onNext} />)

      const titleInput = screen.getByTestId("title-input")
      await user.type(titleInput, "Hello")

      await waitFor(() => {
        expect(screen.getByTestId("next-button")).not.toBeDisabled()
      })

      // Clear the input
      await user.clear(titleInput)

      await waitFor(() => {
        expect(screen.getByTestId("next-button")).toBeDisabled()
      })
    })

    it("renders all 8 emoji options", () => {
      render(<CreateCouponStep1 onNext={onNext} />)

      const emojiButtons = screen.getByTestId("emoji-picker").querySelectorAll("button")
      expect(emojiButtons).toHaveLength(8)

      const expectedEmojis = ["❤️", "⭐", "🍪", "🎬", "💆", "🚗", "☕", "🎁"]
      expectedEmojis.forEach((emoji, i) => {
        expect(emojiButtons[i].textContent).toBe(emoji)
      })
    })

    it("renders all 5 category options", () => {
      render(<CreateCouponStep1 onNext={onNext} />)

      const expectedCategories = ["Romantic", "Practical", "Fun", "Food", "General"]
      expectedCategories.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument()
      })
    })

    it("switching categories updates the visual selection", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep1 onNext={onNext} />)

      // General is selected by default
      const generalButton = screen.getByText("General")
      expect(generalButton.className).toContain("bg-[var(--accent-primary)]")

      // Click Romantic
      const romanticButton = screen.getByText("Romantic")
      await user.click(romanticButton)

      // Romantic should now be selected
      expect(romanticButton.className).toContain("bg-[var(--accent-primary)]")
      // General should be deselected
      expect(generalButton.className).not.toContain("bg-[var(--accent-primary)]")
    })
  })

  // ─── INTEGRATION TESTS (react-hook-form + Zod) ────────────────────────

  describe("Integration: react-hook-form + Zod resolver", () => {
    it("shows error message on invalid submit — empty title field", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep1 onNext={onNext} />)

      // mode: "onChange" — type and clear to trigger validation error
      const titleInput = screen.getByTestId("title-input")
      await user.type(titleInput, "x")
      await user.clear(titleInput)

      await waitFor(() => {
        expect(screen.getByText("Title is required")).toBeInTheDocument()
      })

      expect(onNext).not.toHaveBeenCalled()
    })

    it("clears error message when user types a valid title", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep1 onNext={onNext} />)

      // Trigger error via type-then-clear
      const titleInput = screen.getByTestId("title-input")
      await user.type(titleInput, "x")
      await user.clear(titleInput)

      await waitFor(() => {
        expect(screen.getByText("Title is required")).toBeInTheDocument()
      })

      // Type valid title — error should clear
      await user.type(titleInput, "Now valid")

      await waitFor(() => {
        expect(screen.queryByText("Title is required")).not.toBeInTheDocument()
      })
    })

    it("description max length validation shows error for > 500 chars", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep1 onNext={onNext} />)

      await user.type(screen.getByTestId("title-input"), "Valid title")
      await user.type(screen.getByTestId("description-input"), "D".repeat(501))

      await waitFor(() => {
        expect(screen.getByText("Max 500 characters")).toBeInTheDocument()
        expect(screen.getByTestId("next-button")).toBeDisabled()
      })
    })

    it("form mode is onChange — validation runs on every keystroke", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep1 onNext={onNext} />)

      const titleInput = screen.getByTestId("title-input")

      // Trigger error via type-then-clear (onChange mode needs a value change)
      await user.type(titleInput, "x")
      await user.clear(titleInput)

      await waitFor(() => {
        expect(screen.getByText("Title is required")).toBeInTheDocument()
      })

      // Type one char — error should clear immediately via onChange
      await user.type(titleInput, "A")

      await waitFor(() => {
        expect(screen.queryByText("Title is required")).not.toBeInTheDocument()
        expect(screen.getByTestId("next-button")).not.toBeDisabled()
      })
    })

    it("form submits via enter key when valid", async () => {
      const user = userEvent.setup()
      render(<CreateCouponStep1 onNext={onNext} />)

      await user.type(screen.getByTestId("title-input"), "Enter test")
      await user.keyboard("{Enter}")

      await waitFor(() => {
        expect(onNext).toHaveBeenCalledTimes(1)
        expect(onNext.mock.calls[0][0].title).toBe("Enter test")
      })
    })

    it("preserves all data prop values through react-hook-form and state", async () => {
      const user = userEvent.setup()
      render(
        <CreateCouponStep1
          data={{
            title: "Existing",
            description: "Existing desc",
            emoji: "🎁",
            category: "food",
          }}
          onNext={onNext}
        />
      )

      // Submit without changing anything
      await user.click(screen.getByTestId("next-button"))

      await waitFor(() => {
        expect(onNext).toHaveBeenCalledWith({
          title: "Existing",
          description: "Existing desc",
          emoji: "🎁",
          category: "food",
        })
      })
    })
  })
})

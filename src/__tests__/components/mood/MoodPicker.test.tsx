import React from "react"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────

const mockSetMood = vi.fn(() => Promise.resolve())

const defaultMoodReturn = {
  todayMood: null as { id: string; user_id: string; mood: string; note: string | null; mood_date: string; logged_at: string } | null,
  partnerMood: null,
  isLoading: false,
  error: null as string | null,
  setMood: mockSetMood,
}

const { useMood } = vi.hoisted(() => ({
  useMood: vi.fn(() => defaultMoodReturn),
}))

vi.mock("@/lib/hooks/use-mood", () => ({ useMood }))

import { MoodPicker } from "@/components/mood/MoodPicker"

describe("MoodPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSetMood.mockImplementation(() => Promise.resolve())
    useMood.mockReturnValue({ ...defaultMoodReturn, setMood: mockSetMood })
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("renders 6 mood buttons", () => {
      render(<MoodPicker />)
      const picker = screen.getByTestId("mood-picker")
      expect(picker).toBeInTheDocument()

      const buttons = [
        screen.getByTestId("mood-button-good"),
        screen.getByTestId("mood-button-calm"),
        screen.getByTestId("mood-button-meh"),
        screen.getByTestId("mood-button-low"),
        screen.getByTestId("mood-button-frustrated"),
        screen.getByTestId("mood-button-loving"),
      ]
      expect(buttons).toHaveLength(6)
    })

    it("each button shows correct emoji", () => {
      render(<MoodPicker />)

      expect(screen.getByTestId("mood-button-good")).toHaveTextContent("😊")
      expect(screen.getByTestId("mood-button-calm")).toHaveTextContent("😌")
      expect(screen.getByTestId("mood-button-meh")).toHaveTextContent("😐")
      expect(screen.getByTestId("mood-button-low")).toHaveTextContent("😔")
      expect(screen.getByTestId("mood-button-frustrated")).toHaveTextContent("😤")
      expect(screen.getByTestId("mood-button-loving")).toHaveTextContent("🥰")
    })

    it("shows labels below buttons", () => {
      render(<MoodPicker />)

      expect(screen.getByText("Good")).toBeInTheDocument()
      expect(screen.getByText("Calm")).toBeInTheDocument()
      expect(screen.getByText("Meh")).toBeInTheDocument()
      expect(screen.getByText("Low")).toBeInTheDocument()
      expect(screen.getByText("Frustrated")).toBeInTheDocument()
      expect(screen.getByText("Loving")).toBeInTheDocument()
    })

    it("selected mood has accent-copper border style", () => {
      useMood.mockReturnValue({
        ...defaultMoodReturn,
        todayMood: {
          id: "mood-1",
          user_id: "user-1",
          mood: "good",
          note: null,
          mood_date: "2026-03-05",
          logged_at: "2026-03-05T08:00:00Z",
        },
      })

      render(<MoodPicker />)

      const goodButton = screen.getByTestId("mood-button-good")
      expect(goodButton.style.border).toContain("var(--accent-copper")
    })

    it("unselected moods have soft-cream background style", () => {
      useMood.mockReturnValue({
        ...defaultMoodReturn,
        todayMood: {
          id: "mood-1",
          user_id: "user-1",
          mood: "good",
          note: null,
          mood_date: "2026-03-05",
          logged_at: "2026-03-05T08:00:00Z",
        },
      })

      render(<MoodPicker />)

      const calmButton = screen.getByTestId("mood-button-calm")
      expect(calmButton.style.backgroundColor).toContain("var(--bg-soft-cream")
    })

    it("custom className applied", () => {
      render(<MoodPicker className="mt-4" />)
      const picker = screen.getByTestId("mood-picker")
      expect(picker.className).toContain("mt-4")
    })

    it("returns null during loading", () => {
      useMood.mockReturnValue({
        ...defaultMoodReturn,
        isLoading: true,
      })

      const { container } = render(<MoodPicker />)
      expect(container.firstChild).toBeNull()
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("clicking mood calls setMood with correct value", async () => {
      render(<MoodPicker />)

      await act(async () => {
        fireEvent.click(screen.getByTestId("mood-button-calm"))
      })
      expect(mockSetMood).toHaveBeenCalledWith("calm")
    })

    it("clicking each mood calls setMood with its corresponding value", async () => {
      render(<MoodPicker />)

      await act(async () => {
        fireEvent.click(screen.getByTestId("mood-button-frustrated"))
      })
      expect(mockSetMood).toHaveBeenCalledWith("frustrated")
    })

    it("clicking already selected mood does not call setMood again", async () => {
      useMood.mockReturnValue({
        ...defaultMoodReturn,
        todayMood: {
          id: "mood-1",
          user_id: "user-1",
          mood: "loving",
          note: null,
          mood_date: "2026-03-05",
          logged_at: "2026-03-05T08:00:00Z",
        },
      })

      render(<MoodPicker />)

      await act(async () => {
        fireEvent.click(screen.getByTestId("mood-button-loving"))
      })
      expect(mockSetMood).not.toHaveBeenCalled()
    })

    it("shows note input after mood selection", async () => {
      render(<MoodPicker />)

      // Note input should not exist initially
      expect(screen.queryByTestId("mood-note-input")).not.toBeInTheDocument()

      // Select a mood (wrapping in act since it triggers async state updates)
      await act(async () => {
        fireEvent.click(screen.getByTestId("mood-button-good"))
      })

      // Note input should appear
      expect(screen.getByTestId("mood-note-input")).toBeInTheDocument()
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("uses useMood hook for todayMood data", () => {
      useMood.mockReturnValue({
        ...defaultMoodReturn,
        todayMood: {
          id: "mood-1",
          user_id: "user-1",
          mood: "meh",
          note: null,
          mood_date: "2026-03-05",
          logged_at: "2026-03-05T08:00:00Z",
        },
      })

      render(<MoodPicker />)

      // The meh button should be the selected one (accent-copper border)
      const mehButton = screen.getByTestId("mood-button-meh")
      expect(mehButton.style.border).toContain("var(--accent-copper")
    })

    it("calls setMood from useMood hook on button click", async () => {
      render(<MoodPicker />)

      await act(async () => {
        fireEvent.click(screen.getByTestId("mood-button-low"))
      })
      expect(mockSetMood).toHaveBeenCalledTimes(1)
      expect(mockSetMood).toHaveBeenCalledWith("low")
    })
  })
})

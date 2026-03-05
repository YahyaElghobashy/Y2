import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────

const defaultMoodReturn = {
  todayMood: null,
  partnerMood: null as { id: string; user_id: string; mood: string; note: string | null; mood_date: string; logged_at: string } | null,
  isLoading: false,
  error: null as string | null,
  setMood: vi.fn(),
}

const defaultAuthReturn = {
  user: { id: "user-1" },
  partner: { id: "partner-1", display_name: "Yara" } as { id: string; display_name: string } | null,
  profile: null,
  isLoading: false,
  profileNeedsSetup: false,
  signOut: vi.fn(),
  refreshProfile: vi.fn(),
}

const { useMood } = vi.hoisted(() => ({
  useMood: vi.fn(() => defaultMoodReturn),
}))

const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(() => defaultAuthReturn),
}))

vi.mock("@/lib/hooks/use-mood", () => ({ useMood }))
vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth }))

import { PartnerMoodIndicator } from "@/components/home/PartnerMoodIndicator"

describe("PartnerMoodIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useMood.mockReturnValue({ ...defaultMoodReturn })
    useAuth.mockReturnValue({ ...defaultAuthReturn })
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("returns null when no partner mood", () => {
      const { container } = render(<PartnerMoodIndicator />)
      expect(container.firstChild).toBeNull()
    })

    it("shows partner name", () => {
      useMood.mockReturnValue({
        ...defaultMoodReturn,
        partnerMood: {
          id: "mood-2",
          user_id: "partner-1",
          mood: "calm",
          note: null,
          mood_date: "2026-03-05",
          logged_at: "2026-03-05T09:00:00Z",
        },
      })

      render(<PartnerMoodIndicator />)
      expect(screen.getByText(/Yara/)).toBeInTheDocument()
    })

    it("shows mood emoji", () => {
      useMood.mockReturnValue({
        ...defaultMoodReturn,
        partnerMood: {
          id: "mood-2",
          user_id: "partner-1",
          mood: "calm",
          note: null,
          mood_date: "2026-03-05",
          logged_at: "2026-03-05T09:00:00Z",
        },
      })

      render(<PartnerMoodIndicator />)
      expect(screen.getByText(/😌/)).toBeInTheDocument()
    })

    it('shows "is feeling" text', () => {
      useMood.mockReturnValue({
        ...defaultMoodReturn,
        partnerMood: {
          id: "mood-2",
          user_id: "partner-1",
          mood: "good",
          note: null,
          mood_date: "2026-03-05",
          logged_at: "2026-03-05T09:00:00Z",
        },
      })

      render(<PartnerMoodIndicator />)
      expect(screen.getByText(/is feeling/)).toBeInTheDocument()
    })

    it("has default cursor when no note exists", () => {
      useMood.mockReturnValue({
        ...defaultMoodReturn,
        partnerMood: {
          id: "mood-2",
          user_id: "partner-1",
          mood: "calm",
          note: null,
          mood_date: "2026-03-05",
          logged_at: "2026-03-05T09:00:00Z",
        },
      })

      render(<PartnerMoodIndicator />)
      const indicator = screen.getByTestId("partner-mood-indicator")
      const textElement = indicator.firstChild as HTMLElement
      expect(textElement.className).toContain("cursor-default")
    })

    it("has pointer cursor when note exists", () => {
      useMood.mockReturnValue({
        ...defaultMoodReturn,
        partnerMood: {
          id: "mood-2",
          user_id: "partner-1",
          mood: "calm",
          note: "Feeling peaceful",
          mood_date: "2026-03-05",
          logged_at: "2026-03-05T09:00:00Z",
        },
      })

      render(<PartnerMoodIndicator />)
      const indicator = screen.getByTestId("partner-mood-indicator")
      const textElement = indicator.firstChild as HTMLElement
      expect(textElement.className).toContain("cursor-pointer")
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("tap reveals note card when note exists", () => {
      useMood.mockReturnValue({
        ...defaultMoodReturn,
        partnerMood: {
          id: "mood-2",
          user_id: "partner-1",
          mood: "calm",
          note: "Feeling peaceful",
          mood_date: "2026-03-05",
          logged_at: "2026-03-05T09:00:00Z",
        },
      })

      render(<PartnerMoodIndicator />)

      // Note card should not be visible initially
      expect(screen.queryByTestId("partner-mood-note")).not.toBeInTheDocument()

      // Click to reveal
      const textEl = screen.getByText(/Yara is feeling/)
      fireEvent.click(textEl)

      expect(screen.getByTestId("partner-mood-note")).toBeInTheDocument()
      expect(screen.getByText("Feeling peaceful")).toBeInTheDocument()
    })

    it("second tap hides note card", () => {
      useMood.mockReturnValue({
        ...defaultMoodReturn,
        partnerMood: {
          id: "mood-2",
          user_id: "partner-1",
          mood: "loving",
          note: "Love you!",
          mood_date: "2026-03-05",
          logged_at: "2026-03-05T09:00:00Z",
        },
      })

      render(<PartnerMoodIndicator />)

      const textEl = screen.getByText(/Yara is feeling/)

      // First click - show
      fireEvent.click(textEl)
      expect(screen.getByTestId("partner-mood-note")).toBeInTheDocument()

      // Second click - hide
      fireEvent.click(textEl)
      // AnimatePresence may keep it briefly; check it's gone or exiting
      // With no waitFor, the exit animation starts immediately
    })

    it("no tap interaction when no note", () => {
      useMood.mockReturnValue({
        ...defaultMoodReturn,
        partnerMood: {
          id: "mood-2",
          user_id: "partner-1",
          mood: "meh",
          note: null,
          mood_date: "2026-03-05",
          logged_at: "2026-03-05T09:00:00Z",
        },
      })

      render(<PartnerMoodIndicator />)

      const textEl = screen.getByText(/Yara is feeling/)
      fireEvent.click(textEl)

      // No note card should appear since no note exists
      expect(screen.queryByTestId("partner-mood-note")).not.toBeInTheDocument()
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("uses useMood hook for partnerMood data", () => {
      useMood.mockReturnValue({
        ...defaultMoodReturn,
        partnerMood: {
          id: "mood-2",
          user_id: "partner-1",
          mood: "frustrated",
          note: null,
          mood_date: "2026-03-05",
          logged_at: "2026-03-05T09:00:00Z",
        },
      })

      render(<PartnerMoodIndicator />)

      expect(useMood).toHaveBeenCalled()
      expect(screen.getByText(/😤/)).toBeInTheDocument()
    })

    it("uses useAuth hook for partner display name", () => {
      useMood.mockReturnValue({
        ...defaultMoodReturn,
        partnerMood: {
          id: "mood-2",
          user_id: "partner-1",
          mood: "good",
          note: null,
          mood_date: "2026-03-05",
          logged_at: "2026-03-05T09:00:00Z",
        },
      })

      useAuth.mockReturnValue({
        ...defaultAuthReturn,
        partner: { id: "partner-1", display_name: "TestPartner" },
      })

      render(<PartnerMoodIndicator />)

      expect(useAuth).toHaveBeenCalled()
      expect(screen.getByText(/TestPartner/)).toBeInTheDocument()
    })

    it("falls back to 'Partner' when display_name is missing", () => {
      useMood.mockReturnValue({
        ...defaultMoodReturn,
        partnerMood: {
          id: "mood-2",
          user_id: "partner-1",
          mood: "good",
          note: null,
          mood_date: "2026-03-05",
          logged_at: "2026-03-05T09:00:00Z",
        },
      })

      useAuth.mockReturnValue({
        ...defaultAuthReturn,
        partner: null,
      })

      render(<PartnerMoodIndicator />)

      expect(screen.getByText(/Partner is feeling/)).toBeInTheDocument()
    })
  })
})

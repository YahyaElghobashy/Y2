import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ──────────────────────────────────────────────
const mockLogRitual = vi.fn()
const mockCreateRitual = vi.fn()
const mockNotifInsert = vi.fn(() => Promise.resolve({ error: null }))

const LETTER_RITUAL = { id: "ritual-1", title: "Monthly Letter" }

vi.mock("@/lib/hooks/use-rituals", () => ({
  useRituals: () => ({
    rituals: [LETTER_RITUAL],
    isLoading: false,
    logRitual: mockLogRitual,
    uploadRitualPhoto: vi.fn(),
    createRitual: mockCreateRitual,
  }),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    profile: { display_name: "Yahya" },
    partner: { id: "partner-1", display_name: "Yara" },
  }),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: (table: string) => {
      if (table === "notifications") return { insert: mockNotifInsert }
      // ritual_logs fetch chain
      return {
        select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
      }
    },
  }),
}))

// Stub the views so we can trigger handleSend directly.
vi.mock("@/components/keepsake/LettersView", () => ({
  LettersView: () => <div data-testid="letters-view" />,
}))
vi.mock("@/components/rituals/MonthlyLetterComposer", () => ({
  MonthlyLetterComposer: ({ onSend }: { onSend: (c: string) => void }) => (
    <button data-testid="send-letter" onClick={() => onSend("Dear love, missing you today.")}>send</button>
  ),
}))

import LettersPage from "@/app/(main)/keepsake/letters/page"

describe("LettersPage — notifies partner on a new letter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogRitual.mockResolvedValue(undefined)
  })

  it("logs the ritual then inserts a 'letter' notification to the partner", async () => {
    render(<LettersPage />)
    // The page shows a skeleton until fetchLogs resolves; wait for the composer.
    fireEvent.click(await screen.findByTestId("send-letter"))

    await waitFor(() => expect(mockLogRitual).toHaveBeenCalledWith("ritual-1", "Dear love, missing you today.", undefined))
    await waitFor(() => expect(mockNotifInsert).toHaveBeenCalledTimes(1))
    expect(mockNotifInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        sender_id: "user-1",
        recipient_id: "partner-1",
        type: "letter",
        emoji: "💌",
        status: "sent",
        metadata: { ritual_id: "ritual-1" },
      })
    )
  })
})

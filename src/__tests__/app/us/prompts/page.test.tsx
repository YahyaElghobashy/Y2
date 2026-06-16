import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock framer-motion ──────────────────────────────────────────
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileTap, whileHover, layoutId, ...domProps } =
        props as Record<string, unknown>
      void initial; void animate; void exit; void transition; void whileTap; void whileHover; void layoutId
      return <div {...(domProps as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileTap, whileHover, ...domProps } =
        props as Record<string, unknown>
      void initial; void animate; void exit; void transition; void whileTap; void whileHover
      return <button {...(domProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// ── Mock useAuth — provides the partner profile the page reads for partnerName ──
const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(() => ({
    user: { id: "user-1" },
    profile: {
      id: "user-1",
      display_name: "Yahya",
      email: "yahya@test.com",
      avatar_url: null,
      partner_id: "user-2",
      role: "user",
      created_at: "",
      updated_at: "",
    },
    partner: {
      id: "user-2",
      display_name: "Yara",
      email: "yara@test.com",
      avatar_url: null,
      partner_id: "user-1",
      role: "user",
      created_at: "",
      updated_at: "",
    },
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  })),
}))
vi.mock("@/lib/providers/AuthProvider", () => ({ useAuth }))

// ── Mock the domain hook ─────────────────────────────────────────
const TODAY = new Date().toISOString().split("T")[0]

const mockTodayPrompt = {
  id: "prompt-today",
  prompt_date: TODAY,
  prompt_text: "What is your love language?",
  prompt_category: "deep",
  both_answered: false,
  created_at: `${TODAY}T00:00:00Z`,
}

// History (excludes today; the page filters today's prompt out of this list).
const mockHistory = [
  {
    id: "prompt-1",
    prompt_date: "2026-03-04",
    prompt_text: "Describe your perfect Sunday",
    prompt_category: "playful",
    both_answered: true,
    created_at: "2026-03-04T00:00:00Z",
    my_answer: {
      id: "a1",
      prompt_id: "prompt-1",
      user_id: "user-1",
      answer_text: "Sleeping in",
      submitted_at: "2026-03-04T10:00:00Z",
    },
    partner_answer: {
      id: "a2",
      prompt_id: "prompt-1",
      user_id: "user-2",
      answer_text: "Brunch together",
      submitted_at: "2026-03-04T11:00:00Z",
    },
  },
  {
    id: "prompt-2",
    prompt_date: "2026-03-03",
    prompt_text: "What dream do you want to chase?",
    prompt_category: "dream",
    both_answered: false,
    created_at: "2026-03-03T00:00:00Z",
    my_answer: {
      id: "a3",
      prompt_id: "prompt-2",
      user_id: "user-1",
      answer_text: "Start a business",
      submitted_at: "2026-03-03T10:00:00Z",
    },
  },
]

function defaultReturn(overrides: Record<string, unknown> = {}) {
  return {
    todayPrompt: mockTodayPrompt,
    myAnswer: null,
    partnerAnswer: null,
    history: mockHistory,
    streak: 3,
    isLoading: false,
    error: null,
    submitAnswer: vi.fn(async () => {}),
    ...overrides,
  }
}

const { useDailyPrompt } = vi.hoisted(() => ({ useDailyPrompt: vi.fn() }))
vi.mock("@/lib/hooks/use-daily-prompt", () => ({ useDailyPrompt }))

import PromptsPage from "@/app/(main)/us/prompts/page"

describe("PromptsPage (Connect / ConnectView)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDailyPrompt.mockImplementation(() => defaultReturn())
    useAuth.mockImplementation(() => ({
      user: { id: "user-1" },
      profile: null,
      partner: {
        id: "user-2",
        display_name: "Yara",
        email: "yara@test.com",
        avatar_url: null,
        partner_id: "user-1",
        role: "user",
        created_at: "",
        updated_at: "",
      },
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    }))
  })

  // ── UNIT: Loading state ─────────────────────────────────────
  it("renders loading skeleton when isLoading is true", () => {
    useDailyPrompt.mockImplementation(() =>
      defaultReturn({ todayPrompt: null, history: [], streak: 0, isLoading: true })
    )
    render(<PromptsPage />)
    expect(screen.getByTestId("prompts-loading")).toBeInTheDocument()
    // Connect header should not render while loading.
    expect(screen.queryByRole("heading", { name: "Connect" })).not.toBeInTheDocument()
  })

  // ── UNIT: Error state ───────────────────────────────────────
  it("renders the error message in place of the view when error exists", () => {
    useDailyPrompt.mockImplementation(() =>
      defaultReturn({ todayPrompt: null, history: [], streak: 0, error: "Something went wrong" })
    )
    render(<PromptsPage />)
    const err = screen.getByTestId("prompts-error")
    expect(err).toBeInTheDocument()
    expect(err).toHaveTextContent("Something went wrong")
    expect(screen.queryByRole("heading", { name: "Connect" })).not.toBeInTheDocument()
  })

  // ── UNIT: Header + streak derived value ─────────────────────
  it("renders the Connect header and the streak value from the hook", () => {
    render(<PromptsPage />)
    expect(screen.getByRole("heading", { name: "Connect" })).toBeInTheDocument()
    // streak: 3 renders as a bare number in the streak pill.
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("reflects a different streak value from the hook", () => {
    useDailyPrompt.mockImplementation(() => defaultReturn({ streak: 12 }))
    render(<PromptsPage />)
    expect(screen.getByText("12")).toBeInTheDocument()
  })

  // ── UNIT: Today's prompt — text + humanized category ────────
  it("renders today's question and the humanized category label", () => {
    render(<PromptsPage />)
    expect(screen.getByText("What is your love language?")).toBeInTheDocument()
    // "deep" → "Deep Dive" via the page's CATEGORY_LABEL map.
    expect(screen.getByText(/Today\s*·\s*Deep Dive/)).toBeInTheDocument()
  })

  it("falls back to a placeholder question when there is no prompt today", () => {
    useDailyPrompt.mockImplementation(() => defaultReturn({ todayPrompt: null }))
    render(<PromptsPage />)
    expect(screen.getByText("No prompt yet — check back soon.")).toBeInTheDocument()
  })

  // ── UNIT: partnerName derived from useAuth ──────────────────
  it("uses the partner's display name from useAuth in the reveal CTA", () => {
    render(<PromptsPage />)
    // CTA reads "Share & reveal Yara's"
    expect(screen.getByRole("button", { name: /reveal Yara's/i })).toBeInTheDocument()
  })

  it("falls back to 'your love' when there is no partner profile", () => {
    useAuth.mockImplementation(() => ({
      user: { id: "user-1" },
      profile: null,
      partner: null,
      isLoading: false,
      profileNeedsSetup: false,
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    }))
    render(<PromptsPage />)
    expect(screen.getByRole("button", { name: /reveal your love's/i })).toBeInTheDocument()
  })

  // ── UNIT: History ("Lately") derived rendering ──────────────
  it("renders the Lately section with past prompt questions", () => {
    render(<PromptsPage />)
    expect(screen.getByRole("heading", { name: "Lately" })).toBeInTheDocument()
    expect(screen.getByText("Describe your perfect Sunday")).toBeInTheDocument()
    expect(screen.getByText("What dream do you want to chase?")).toBeInTheDocument()
  })

  it("maps both partners' answers into the Lately cards", () => {
    render(<PromptsPage />)
    // prompt-1: both answered → mine + hers rendered
    expect(screen.getByText("Sleeping in")).toBeInTheDocument()
    expect(screen.getByText("Brunch together")).toBeInTheDocument()
    // prompt-2: only mine answered → my answer rendered, hers empty
    expect(screen.getByText("Start a business")).toBeInTheDocument()
  })

  it("excludes today's prompt from the Lately history", () => {
    // Add today's prompt into the history array; the page must filter it out
    // of "Lately" since it is the active card.
    useDailyPrompt.mockImplementation(() =>
      defaultReturn({
        history: [
          {
            ...mockTodayPrompt,
            my_answer: undefined,
            partner_answer: undefined,
          },
          ...mockHistory,
        ],
      })
    )
    render(<PromptsPage />)
    // Today's question appears once (the active card), never duplicated into Lately.
    expect(screen.getAllByText("What is your love language?")).toHaveLength(1)
  })

  // ── INTERACTION + INTEGRATION: compose → reveal → submitAnswer ──
  it("submits the typed answer to submitAnswer when revealing", () => {
    const submitAnswer = vi.fn(async () => {})
    useDailyPrompt.mockImplementation(() => defaultReturn({ submitAnswer }))

    render(<PromptsPage />)

    const textarea = screen.getByPlaceholderText(/write it the way you'd say it/i)
    fireEvent.change(textarea, { target: { value: "Acts of service" } })

    const revealBtn = screen.getByRole("button", { name: /reveal Yara's/i })
    expect(revealBtn).not.toBeDisabled()
    fireEvent.click(revealBtn)

    // Integration: the real mutation is called with the typed text.
    expect(submitAnswer).toHaveBeenCalledTimes(1)
    expect(submitAnswer).toHaveBeenCalledWith("Acts of service")
  })

  it("disables the reveal CTA until an answer is typed", () => {
    render(<PromptsPage />)
    const revealBtn = screen.getByRole("button", { name: /reveal Yara's/i })
    // Empty composer → disabled, clicking must not call submit.
    expect(revealBtn).toBeDisabled()
  })

  it("transitions to the reveal state showing my answer and the partner's answer", () => {
    useDailyPrompt.mockImplementation(() =>
      defaultReturn({ partnerAnswer: { answer_text: "Quality time" } })
    )
    render(<PromptsPage />)

    const textarea = screen.getByPlaceholderText(/write it the way you'd say it/i)
    fireEvent.change(textarea, { target: { value: "Acts of service" } })
    fireEvent.click(screen.getByRole("button", { name: /reveal Yara's/i }))

    // After reveal, both answers + author labels are visible; the composer is gone.
    expect(screen.getByText("Acts of service")).toBeInTheDocument()
    expect(screen.getByText("Quality time")).toBeInTheDocument()
    expect(screen.getByText("You")).toBeInTheDocument()
    expect(screen.getByText("Yara")).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/write it the way you'd say it/i)).not.toBeInTheDocument()
  })

  // ── UNIT: seeding from a previously-submitted answer ────────
  it("seeds the composer and opens straight to reveal when I already answered today", () => {
    useDailyPrompt.mockImplementation(() =>
      defaultReturn({
        myAnswer: { answer_text: "Words of affirmation" },
        partnerAnswer: { answer_text: "Physical touch" },
      })
    )
    render(<PromptsPage />)

    // initialRevealed → reveal state immediately, no composer.
    expect(screen.queryByPlaceholderText(/write it the way you'd say it/i)).not.toBeInTheDocument()
    expect(screen.getByText("Words of affirmation")).toBeInTheDocument()
    expect(screen.getByText("Physical touch")).toBeInTheDocument()
  })

  // ── INTEGRATION: hooks are consulted ────────────────────────
  it("reads both useDailyPrompt and useAuth", () => {
    render(<PromptsPage />)
    expect(useDailyPrompt).toHaveBeenCalled()
    expect(useAuth).toHaveBeenCalled()
  })
})

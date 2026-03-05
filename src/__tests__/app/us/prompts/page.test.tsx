import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock framer-motion ──────────────────────────────────────────
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, transition, whileTap, ...domProps } = props as Record<string, unknown>
      return <div {...(domProps as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, transition, whileTap, ...domProps } = props as Record<string, unknown>
      return <button {...(domProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// ── Mock hook ────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split("T")[0]

const mockTodayPrompt = {
  id: "prompt-today",
  prompt_date: TODAY,
  prompt_text: "What is your love language?",
  prompt_category: "deep",
  both_answered: false,
  created_at: `${TODAY}T00:00:00Z`,
}

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
  {
    id: "prompt-3",
    prompt_date: "2026-03-02",
    prompt_text: "Share an unpopular opinion",
    prompt_category: "opinion",
    both_answered: false,
    created_at: "2026-03-02T00:00:00Z",
  },
]

const mockUseDailyPrompt = vi.fn(() => ({
  todayPrompt: mockTodayPrompt,
  myAnswer: null,
  partnerAnswer: null,
  history: mockHistory,
  streak: 3,
  isLoading: false,
  error: null,
  submitAnswer: vi.fn(),
}))

vi.mock("@/lib/hooks/use-daily-prompt", () => ({
  useDailyPrompt: () => mockUseDailyPrompt(),
}))

// DailyPromptCard mock — render with data-testid
vi.mock("@/components/prompts/DailyPromptCard", () => ({
  DailyPromptCard: (props: Record<string, unknown>) => (
    <div data-testid="daily-prompt-card" data-prompt-id={(props.prompt as { id: string })?.id} />
  ),
}))

// PromptAnswerReveal mock
vi.mock("@/components/prompts/PromptAnswerReveal", () => ({
  PromptAnswerReveal: () => <div data-testid="prompt-answer-reveal" />,
}))

// EmptyState mock
vi.mock("@/components/shared/EmptyState", () => ({
  EmptyState: (props: { title: string }) => (
    <div data-testid="empty-state">{props.title}</div>
  ),
}))

import PromptsPage from "@/app/(main)/us/prompts/page"

describe("PromptsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDailyPrompt.mockReturnValue({
      todayPrompt: mockTodayPrompt,
      myAnswer: null,
      partnerAnswer: null,
      history: mockHistory,
      streak: 3,
      isLoading: false,
      error: null,
      submitAnswer: vi.fn(),
    })
  })

  // ── UNIT: Loading state ─────────────────────────────────────

  it("renders loading skeleton when isLoading", () => {
    mockUseDailyPrompt.mockReturnValue({
      todayPrompt: null,
      myAnswer: null,
      partnerAnswer: null,
      history: [],
      streak: 0,
      isLoading: true,
      error: null,
      submitAnswer: vi.fn(),
    })

    render(<PromptsPage />)
    expect(screen.getByTestId("prompts-loading")).toBeInTheDocument()
  })

  // ── UNIT: Error state ───────────────────────────────────────

  it("renders error message when error exists", () => {
    mockUseDailyPrompt.mockReturnValue({
      todayPrompt: null,
      myAnswer: null,
      partnerAnswer: null,
      history: [],
      streak: 0,
      isLoading: false,
      error: "Something went wrong",
      submitAnswer: vi.fn(),
    })

    render(<PromptsPage />)
    expect(screen.getByTestId("prompts-error")).toBeInTheDocument()
    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
  })

  // ── UNIT: Streak badge ──────────────────────────────────────

  it("shows streak badge when streak > 0", () => {
    render(<PromptsPage />)
    expect(screen.getByTestId("streak-badge")).toBeInTheDocument()
    expect(screen.getByText("3 day streak")).toBeInTheDocument()
  })

  it("hides streak badge when streak is 0", () => {
    mockUseDailyPrompt.mockReturnValue({
      todayPrompt: mockTodayPrompt,
      myAnswer: null,
      partnerAnswer: null,
      history: mockHistory,
      streak: 0,
      isLoading: false,
      error: null,
      submitAnswer: vi.fn(),
    })

    render(<PromptsPage />)
    expect(screen.queryByTestId("streak-badge")).not.toBeInTheDocument()
  })

  // ── UNIT: Today's prompt card ───────────────────────────────

  it("renders DailyPromptCard for today's prompt", () => {
    render(<PromptsPage />)
    expect(screen.getByTestId("daily-prompt-card")).toBeInTheDocument()
  })

  // ── UNIT: History section ───────────────────────────────────

  it("renders Past Prompts heading", () => {
    render(<PromptsPage />)
    expect(screen.getByText("Past Prompts")).toBeInTheDocument()
  })

  it("renders history items excluding today", () => {
    render(<PromptsPage />)
    // The page filters out today's prompt from history
    // Our mock history has dates 2026-03-04, 03, 02 which should all show
    expect(screen.getByText("Describe your perfect Sunday")).toBeInTheDocument()
    expect(screen.getByText("What dream do you want to chase?")).toBeInTheDocument()
    expect(screen.getByText("Share an unpopular opinion")).toBeInTheDocument()
  })

  it("shows 'Not answered' for unanswered history items", () => {
    render(<PromptsPage />)
    expect(screen.getByText("Not answered")).toBeInTheDocument()
  })

  it("shows my answer for items I answered but partner didn't", () => {
    render(<PromptsPage />)
    expect(screen.getByText("Start a business")).toBeInTheDocument()
  })

  it("renders PromptAnswerReveal for items where both answered", () => {
    render(<PromptsPage />)
    expect(screen.getByTestId("prompt-answer-reveal")).toBeInTheDocument()
  })

  // ── UNIT: Category filter chips ─────────────────────────────

  it("renders category filter chips", () => {
    render(<PromptsPage />)
    expect(screen.getByTestId("category-filters")).toBeInTheDocument()
    expect(screen.getByTestId("cat-all")).toBeInTheDocument()
    expect(screen.getByTestId("cat-deep")).toBeInTheDocument()
    expect(screen.getByTestId("cat-playful")).toBeInTheDocument()
    expect(screen.getByTestId("cat-memory")).toBeInTheDocument()
    expect(screen.getByTestId("cat-dream")).toBeInTheDocument()
    expect(screen.getByTestId("cat-opinion")).toBeInTheDocument()
    expect(screen.getByTestId("cat-challenge")).toBeInTheDocument()
  })

  // ── INTERACTION: Category filtering ─────────────────────────

  it("filters history by category when chip is clicked", () => {
    render(<PromptsPage />)

    // Click "Dream" category
    fireEvent.click(screen.getByTestId("cat-dream"))

    // Only dream prompt should be visible
    expect(screen.getByText("What dream do you want to chase?")).toBeInTheDocument()
    expect(screen.queryByText("Describe your perfect Sunday")).not.toBeInTheDocument()
    expect(screen.queryByText("Share an unpopular opinion")).not.toBeInTheDocument()
  })

  it("shows all items when 'All' chip is clicked after filtering", () => {
    render(<PromptsPage />)

    fireEvent.click(screen.getByTestId("cat-dream"))
    fireEvent.click(screen.getByTestId("cat-all"))

    expect(screen.getByText("What dream do you want to chase?")).toBeInTheDocument()
    expect(screen.getByText("Describe your perfect Sunday")).toBeInTheDocument()
    expect(screen.getByText("Share an unpopular opinion")).toBeInTheDocument()
  })

  // ── INTERACTION: Search filtering ───────────────────────────

  it("filters history by search query", () => {
    render(<PromptsPage />)

    const searchInput = screen.getByTestId("history-search")
    fireEvent.change(searchInput, { target: { value: "sunday" } })

    expect(screen.getByText("Describe your perfect Sunday")).toBeInTheDocument()
    expect(screen.queryByText("What dream do you want to chase?")).not.toBeInTheDocument()
  })

  it("searches in answer text too", () => {
    render(<PromptsPage />)

    const searchInput = screen.getByTestId("history-search")
    fireEvent.change(searchInput, { target: { value: "business" } })

    // "Start a business" is in my_answer for prompt-2
    expect(screen.getByText("What dream do you want to chase?")).toBeInTheDocument()
  })

  // ── UNIT: Empty state ───────────────────────────────────────

  it("shows empty state when no history matches filter", () => {
    render(<PromptsPage />)

    const searchInput = screen.getByTestId("history-search")
    fireEvent.change(searchInput, { target: { value: "zzzznotfound" } })

    expect(screen.getByTestId("empty-state")).toBeInTheDocument()
    expect(screen.getByText("No past prompts")).toBeInTheDocument()
  })

  // ── INTEGRATION: Hook called correctly ──────────────────────

  it("calls useDailyPrompt hook", () => {
    render(<PromptsPage />)
    expect(mockUseDailyPrompt).toHaveBeenCalled()
  })

  it("passes correct props to DailyPromptCard", () => {
    render(<PromptsPage />)
    const card = screen.getByTestId("daily-prompt-card")
    expect(card).toHaveAttribute("data-prompt-id", "prompt-today")
  })
})

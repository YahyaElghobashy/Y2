import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────

const mockUser = { id: "user-1", email: "yahya@test.com" }
const mockPartner = { id: "user-2", email: "yara@test.com" }
const mockUseAuth: ReturnType<typeof vi.fn> = vi.fn(() => ({
  user: mockUser,
  partner: mockPartner,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}))

// ── Test Data ─────────────────────────────────────────────────

const TODAY_STR = new Date().toISOString().split("T")[0]
const YESTERDAY_STR = (() => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split("T")[0]
})()
const TWO_DAYS_AGO_STR = (() => {
  const d = new Date()
  d.setDate(d.getDate() - 2)
  return d.toISOString().split("T")[0]
})()

const MOCK_TODAY_PROMPT = {
  id: "prompt-today",
  prompt_date: TODAY_STR,
  prompt_text: "What is your favorite memory together?",
  prompt_category: "memory",
  both_answered: false,
  created_at: `${TODAY_STR}T00:00:00Z`,
}

const MOCK_YESTERDAY_PROMPT = {
  id: "prompt-yesterday",
  prompt_date: YESTERDAY_STR,
  prompt_text: "If you could travel anywhere, where would you go?",
  prompt_category: "dream",
  both_answered: true,
  created_at: `${YESTERDAY_STR}T00:00:00Z`,
}

const MOCK_TWO_DAYS_AGO_PROMPT = {
  id: "prompt-2d",
  prompt_date: TWO_DAYS_AGO_STR,
  prompt_text: "What challenge taught you the most?",
  prompt_category: "challenge",
  both_answered: true,
  created_at: `${TWO_DAYS_AGO_STR}T00:00:00Z`,
}

const MOCK_MY_ANSWER = {
  id: "ans-1",
  prompt_id: "prompt-today",
  user_id: "user-1",
  answer_text: "Our first trip to Istanbul",
  submitted_at: `${TODAY_STR}T10:00:00Z`,
}

const MOCK_PARTNER_ANSWER = {
  id: "ans-2",
  prompt_id: "prompt-today",
  user_id: "user-2",
  answer_text: "When we cooked dinner together",
  submitted_at: `${TODAY_STR}T11:00:00Z`,
}

const MOCK_YESTERDAY_MY_ANSWER = {
  id: "ans-3",
  prompt_id: "prompt-yesterday",
  user_id: "user-1",
  answer_text: "Japan",
  submitted_at: `${YESTERDAY_STR}T10:00:00Z`,
}

const MOCK_YESTERDAY_PARTNER_ANSWER = {
  id: "ans-4",
  prompt_id: "prompt-yesterday",
  user_id: "user-2",
  answer_text: "Maldives",
  submitted_at: `${YESTERDAY_STR}T11:00:00Z`,
}

// ── Mutable query result refs ─────────────────────────────────

let promptsResult = {
  data: [MOCK_TODAY_PROMPT, MOCK_YESTERDAY_PROMPT, MOCK_TWO_DAYS_AGO_PROMPT] as unknown[] | null,
  error: null as unknown,
}
let answersResult = {
  data: [MOCK_MY_ANSWER, MOCK_YESTERDAY_MY_ANSWER, MOCK_YESTERDAY_PARTNER_ANSWER] as unknown[] | null,
  error: null as unknown,
}
let insertResult = { data: MOCK_TODAY_PROMPT as unknown, error: null as unknown }

const insertCalls: unknown[] = []

const mockSubscribe = vi.fn()
const mockRemoveChannel = vi.fn()
const mockChannelOn = vi.fn(function (this: unknown) { return this })

function buildChain(table: string) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => {
    if (table === "couple_prompts") return Promise.resolve(promptsResult)
    if (table === "prompt_answers") return Promise.resolve(answersResult)
    return Promise.resolve({ data: [], error: null })
  })
  chain.single = vi.fn(() => Promise.resolve(insertResult))
  chain.insert = vi.fn((data: unknown) => {
    insertCalls.push({ table, data })
    return chain
  })
  return chain
}

const mockFrom = vi.fn((table: string) => buildChain(table))

const stableSupabase = {
  from: mockFrom,
  channel: vi.fn(() => ({ on: mockChannelOn, subscribe: mockSubscribe })),
  removeChannel: mockRemoveChannel,
}

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => stableSupabase,
}))

vi.mock("@/data/prompts-bank", () => ({
  PROMPTS_BANK: [
    { text: "Test prompt 1", category: "deep" },
    { text: "Test prompt 2", category: "playful" },
  ],
  getPromptForDate: () => ({ text: "Auto-generated prompt", category: "deep" }),
}))

import { useDailyPrompt } from "@/lib/hooks/use-daily-prompt"

describe("useDailyPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser, partner: mockPartner })
    promptsResult = {
      data: [MOCK_TODAY_PROMPT, MOCK_YESTERDAY_PROMPT, MOCK_TWO_DAYS_AGO_PROMPT],
      error: null,
    }
    answersResult = {
      data: [MOCK_MY_ANSWER, MOCK_YESTERDAY_MY_ANSWER, MOCK_YESTERDAY_PARTNER_ANSWER],
      error: null,
    }
    insertResult = { data: MOCK_TODAY_PROMPT, error: null }
    insertCalls.length = 0
    mockChannelOn.mockImplementation(function (this: unknown) { return this })
  })

  // ── UNIT: Null user ───────────────────────────────────────────

  it("returns inert state when user is null", () => {
    mockUseAuth.mockReturnValue({ user: null, partner: null })
    const { result } = renderHook(() => useDailyPrompt())

    expect(result.current.todayPrompt).toBeNull()
    expect(result.current.myAnswer).toBeNull()
    expect(result.current.partnerAnswer).toBeNull()
    expect(result.current.history).toEqual([])
    expect(result.current.streak).toBe(0)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  // ── UNIT: Today's prompt identification ────────────────────────

  it("identifies today's prompt correctly", async () => {
    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.todayPrompt).not.toBeNull()
    expect(result.current.todayPrompt!.id).toBe("prompt-today")
    expect(result.current.todayPrompt!.prompt_date).toBe(TODAY_STR)
  })

  // ── UNIT: My answer derivation ─────────────────────────────────

  it("derives myAnswer from answers for today's prompt + current user", async () => {
    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.myAnswer).not.toBeNull()
    expect(result.current.myAnswer!.answer_text).toBe("Our first trip to Istanbul")
  })

  it("returns null myAnswer when I haven't answered", async () => {
    answersResult = {
      data: [MOCK_YESTERDAY_MY_ANSWER, MOCK_YESTERDAY_PARTNER_ANSWER],
      error: null,
    }
    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.myAnswer).toBeNull()
  })

  // ── UNIT: Partner answer masking ───────────────────────────────

  it("masks partner answer when both_answered is false", async () => {
    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Today's prompt has both_answered = false
    expect(result.current.partnerAnswer).toBeNull()
  })

  it("reveals partner answer when both_answered is true", async () => {
    // Make today both_answered=true and include partner answer
    promptsResult = {
      data: [
        { ...MOCK_TODAY_PROMPT, both_answered: true },
        MOCK_YESTERDAY_PROMPT,
        MOCK_TWO_DAYS_AGO_PROMPT,
      ],
      error: null,
    }
    answersResult = {
      data: [MOCK_MY_ANSWER, MOCK_PARTNER_ANSWER, MOCK_YESTERDAY_MY_ANSWER, MOCK_YESTERDAY_PARTNER_ANSWER],
      error: null,
    }

    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.partnerAnswer).not.toBeNull()
    expect(result.current.partnerAnswer!.answer_text).toBe("When we cooked dinner together")
  })

  // ── UNIT: History with merged answers ──────────────────────────

  it("builds history with merged answers", async () => {
    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.history).toHaveLength(3)

    // Today has my_answer but no partner_answer (both_answered=false)
    const today = result.current.history.find((h) => h.id === "prompt-today")
    expect(today?.my_answer).toBeDefined()
    expect(today?.partner_answer).toBeUndefined()

    // Yesterday has both answers (both_answered=true)
    const yesterday = result.current.history.find((h) => h.id === "prompt-yesterday")
    expect(yesterday?.my_answer).toBeDefined()
    expect(yesterday?.partner_answer).toBeDefined()
  })

  // ── UNIT: Streak calculation ───────────────────────────────────

  it("calculates streak of consecutive both_answered days from today", async () => {
    // Today both_answered=true, yesterday both_answered=true, 2d ago both_answered=true
    promptsResult = {
      data: [
        { ...MOCK_TODAY_PROMPT, both_answered: true },
        MOCK_YESTERDAY_PROMPT, // both_answered: true
        MOCK_TWO_DAYS_AGO_PROMPT, // both_answered: true
      ],
      error: null,
    }

    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.streak).toBe(3)
  })

  it("streak is 0 when today is not both_answered", async () => {
    // Today both_answered=false (default)
    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.streak).toBe(0)
  })

  it("streak breaks on gap day", async () => {
    // Today=true, yesterday=false, 2d ago=true → streak=1
    promptsResult = {
      data: [
        { ...MOCK_TODAY_PROMPT, both_answered: true },
        { ...MOCK_YESTERDAY_PROMPT, both_answered: false },
        MOCK_TWO_DAYS_AGO_PROMPT,
      ],
      error: null,
    }

    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.streak).toBe(1)
  })

  // ── UNIT: Error handling ───────────────────────────────────────

  it("sets error when prompts fetch fails", async () => {
    promptsResult = { data: null, error: { message: "DB connection failed" } }

    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe("DB connection failed")
  })

  it("sets error when answers fetch fails", async () => {
    answersResult = { data: null, error: { message: "Answers query error" } }

    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe("Answers query error")
  })

  // ── UNIT: Auto-create today's prompt ───────────────────────────

  it("auto-creates today's prompt when not found", async () => {
    promptsResult = {
      data: [MOCK_YESTERDAY_PROMPT, MOCK_TWO_DAYS_AGO_PROMPT],
      error: null,
    }
    insertResult = {
      data: {
        id: "prompt-new",
        prompt_date: TODAY_STR,
        prompt_text: "Auto-generated prompt",
        prompt_category: "deep",
        both_answered: false,
        created_at: `${TODAY_STR}T00:00:00Z`,
      },
      error: null,
    }

    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Verify insert was called on couple_prompts
    const promptInsert = insertCalls.find((c: any) => c.table === "couple_prompts")
    expect(promptInsert).toBeDefined()
    expect((promptInsert as any).data).toMatchObject({
      prompt_date: TODAY_STR,
      prompt_text: "Auto-generated prompt",
      prompt_category: "deep",
    })
  })

  it("does not auto-create if today already exists", async () => {
    // Default data has today in it
    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const promptInsert = insertCalls.find((c: any) => c.table === "couple_prompts")
    expect(promptInsert).toBeUndefined()
  })

  // ── INTERACTION: Submit answer ─────────────────────────────────

  it("submits answer with optimistic update", async () => {
    // Start without my answer
    answersResult = {
      data: [MOCK_YESTERDAY_MY_ANSWER, MOCK_YESTERDAY_PARTNER_ANSWER],
      error: null,
    }
    insertResult = {
      data: {
        id: "ans-new",
        prompt_id: "prompt-today",
        user_id: "user-1",
        answer_text: "My new answer",
        submitted_at: `${TODAY_STR}T12:00:00Z`,
      },
      error: null,
    }

    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.myAnswer).toBeNull()

    await act(async () => {
      await result.current.submitAnswer("My new answer")
    })

    expect(result.current.myAnswer).not.toBeNull()
    expect(result.current.myAnswer!.answer_text).toBe("My new answer")
  })

  it("does not submit empty answer", async () => {
    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.submitAnswer("   ")
    })

    // No insert to prompt_answers
    const answerInsert = insertCalls.find((c: any) => c.table === "prompt_answers")
    expect(answerInsert).toBeUndefined()
  })

  it("truncates answer to 2000 chars", async () => {
    answersResult = { data: [], error: null }
    insertResult = { data: { id: "ans-trunc", prompt_id: "prompt-today", user_id: "user-1", answer_text: "x".repeat(2000), submitted_at: `${TODAY_STR}T12:00:00Z` }, error: null }

    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.submitAnswer("x".repeat(2500))
    })

    const call = insertCalls.find((c: any) => c.table === "prompt_answers") as any
    expect(call).toBeDefined()
    expect(call.data.answer_text).toHaveLength(2000)
  })

  it("rolls back optimistic answer on error", async () => {
    answersResult = { data: [], error: null }
    insertResult = { data: null, error: { message: "Insert failed" } }

    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.submitAnswer("This will fail")
    })

    expect(result.current.myAnswer).toBeNull()
    expect(result.current.error).toBe("Insert failed")
  })

  // ── INTEGRATION: Supabase calls ────────────────────────────────

  it("fetches from couple_prompts and prompt_answers tables", async () => {
    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const fromCalls = mockFrom.mock.calls.map((c: unknown[]) => c[0])
    expect(fromCalls).toContain("couple_prompts")
    expect(fromCalls).toContain("prompt_answers")
  })

  it("submits answer to prompt_answers table with correct fields", async () => {
    answersResult = { data: [], error: null }
    insertResult = {
      data: { id: "ans-new", prompt_id: "prompt-today", user_id: "user-1", answer_text: "Test", submitted_at: `${TODAY_STR}T12:00:00Z` },
      error: null,
    }

    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.submitAnswer("Test")
    })

    const call = insertCalls.find((c: any) => c.table === "prompt_answers") as any
    expect(call).toBeDefined()
    expect(call.data).toMatchObject({
      prompt_id: "prompt-today",
      user_id: "user-1",
      answer_text: "Test",
    })
  })

  // ── INTEGRATION: Realtime subscriptions ────────────────────────

  it("subscribes to realtime for couple_prompts and prompt_answers", async () => {
    const { result } = renderHook(() => useDailyPrompt())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(stableSupabase.channel).toHaveBeenCalledWith("prompts_realtime")
    expect(mockSubscribe).toHaveBeenCalled()

    // On was called twice (once for couple_prompts, once for prompt_answers)
    expect(mockChannelOn).toHaveBeenCalledTimes(2)
  })
})

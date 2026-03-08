import { vi, describe, it, expect, beforeEach } from "vitest"

// ─── Mocks (before component imports) ───

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, ...rest } = props
      return <div {...rest}>{children}</div>
    },
    path: (props: any) => {
      const { initial, animate, exit, transition, pathLength, ...rest } = props
      return <path {...rest} />
    },
    circle: (props: any) => {
      const { initial, animate, exit, transition, ...rest } = props
      return <circle {...rest} />
    },
    p: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props
      return <p {...rest}>{children}</p>
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const mockGetAnswerHistory = vi.fn()

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1", user_metadata: { display_name: "Yahya" } },
    partner: { display_name: "Yara" },
  }),
}))

vi.mock("@/lib/hooks/use-game-engine", () => ({
  useGameEngine: () => ({
    getAnswerHistory: mockGetAnswerHistory,
  }),
}))

import { render, screen, waitFor } from "@testing-library/react"
import { AnswerTrajectory } from "@/components/game/AnswerTrajectory"

describe("AnswerTrajectory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "First time answering" message when history is empty', async () => {
    mockGetAnswerHistory.mockResolvedValue([])

    render(<AnswerTrajectory questionId="q1" />)

    await waitFor(() => {
      expect(screen.getByText(/First time answering/)).toBeInTheDocument()
    })
    expect(screen.getByText(/Your answer will be saved for future comparison/)).toBeInTheDocument()
  })

  it("renders SVG chart when scale data exists", async () => {
    mockGetAnswerHistory.mockResolvedValue([
      {
        session_id: "s1",
        user_id: "user-1",
        answer_value: { value: 7 },
        created_at: "2025-12-01T10:00:00Z",
      },
      {
        session_id: "s1",
        user_id: "partner-1",
        answer_value: { value: 5 },
        created_at: "2025-12-01T10:00:00Z",
      },
      {
        session_id: "s2",
        user_id: "user-1",
        answer_value: { value: 8 },
        created_at: "2026-01-15T10:00:00Z",
      },
      {
        session_id: "s2",
        user_id: "partner-1",
        answer_value: { value: 6 },
        created_at: "2026-01-15T10:00:00Z",
      },
    ])

    const { container } = render(<AnswerTrajectory questionId="q1" />)

    await waitFor(() => {
      expect(container.querySelector("svg")).toBeInTheDocument()
    })
  })

  it('shows "Your history with this question" label', async () => {
    mockGetAnswerHistory.mockResolvedValue([
      {
        session_id: "s1",
        user_id: "user-1",
        answer_value: { value: 7 },
        created_at: "2025-12-01T10:00:00Z",
      },
    ])

    render(<AnswerTrajectory questionId="q1" />)

    await waitFor(() => {
      expect(screen.getByText("Your history with this question")).toBeInTheDocument()
    })
  })

  it("shows legend with user and partner names", async () => {
    mockGetAnswerHistory.mockResolvedValue([
      {
        session_id: "s1",
        user_id: "user-1",
        answer_value: { value: 7 },
        created_at: "2025-12-01T10:00:00Z",
      },
      {
        session_id: "s1",
        user_id: "partner-1",
        answer_value: { value: 5 },
        created_at: "2025-12-01T10:00:00Z",
      },
    ])

    render(<AnswerTrajectory questionId="q1" />)

    await waitFor(() => {
      expect(screen.getByText("Yahya")).toBeInTheDocument()
    })
    expect(screen.getByText("Yara")).toBeInTheDocument()
  })

  it("renders text timeline for open-ended (non-scale) answers", async () => {
    mockGetAnswerHistory.mockResolvedValue([
      {
        session_id: "s1",
        user_id: "user-1",
        answer_value: { text: "my answer" },
        created_at: "2025-12-01T10:00:00Z",
      },
      {
        session_id: "s2",
        user_id: "partner-1",
        answer_value: { text: "partner answer" },
        created_at: "2026-01-15T10:00:00Z",
      },
    ])

    render(<AnswerTrajectory questionId="q1" />)

    await waitFor(() => {
      expect(screen.getByText("my answer")).toBeInTheDocument()
    })
    expect(screen.getByText("partner answer")).toBeInTheDocument()
    expect(screen.getByText("Your history with this question")).toBeInTheDocument()
  })

  it("returns null during loading", () => {
    mockGetAnswerHistory.mockReturnValue(new Promise(() => {})) // never resolves

    const { container } = render(<AnswerTrajectory questionId="q1" />)

    expect(container.innerHTML).toBe("")
  })
})

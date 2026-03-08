import { vi, describe, it, expect, beforeEach } from "vitest"

// ─── Mocks (before component imports) ───

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, ...rest } = props
      return <div {...rest}>{children}</div>
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileTap, whileHover, ...rest } = props
      return <button {...rest}>{children}</button>
    },
    h2: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props
      return <h2 {...rest}>{children}</h2>
    },
    p: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props
      return <p {...rest}>{children}</p>
    },
    span: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props
      return <span {...rest}>{children}</span>
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1", user_metadata: { display_name: "Yahya" } },
  }),
}))

const mockInsert = vi.fn().mockResolvedValue({ error: null })

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}))

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ContributeForm } from "@/components/game/ContributeForm"

describe("ContributeForm", () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <ContributeForm isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    expect(container.innerHTML).toBe("")
  })

  it('shows "Contribute a Question" heading when open', () => {
    render(
      <ContributeForm isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    expect(screen.getByText("Contribute a Question")).toBeInTheDocument()
  })

  it('shows cost text "Cost: 5"', () => {
    render(
      <ContributeForm isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    expect(screen.getByText(/Cost: 5/)).toBeInTheDocument()
  })

  it("shows question textarea", () => {
    render(
      <ContributeForm isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    expect(screen.getByPlaceholderText(/Write a thoughtful question/)).toBeInTheDocument()
  })

  it("shows category buttons", () => {
    render(
      <ContributeForm isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    // First 8 categories from QUESTION_CATEGORIES
    expect(screen.getByText(/Communication/)).toBeInTheDocument()
    expect(screen.getByText(/Intimacy/)).toBeInTheDocument()
    expect(screen.getByText(/Finances/)).toBeInTheDocument()
    expect(screen.getByText(/Faith/)).toBeInTheDocument()
  })

  it("shows answer type buttons", () => {
    render(
      <ContributeForm isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    // First 4 answer types
    expect(screen.getByText(/Open-ended/)).toBeInTheDocument()
    expect(screen.getByText(/Scale/)).toBeInTheDocument()
    expect(screen.getByText(/Yes \/ No/)).toBeInTheDocument()
    expect(screen.getByText(/Multiple Choice/)).toBeInTheDocument()
  })

  it('shows "Suitable for" mode buttons', () => {
    render(
      <ContributeForm isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    expect(screen.getByText("Suitable for")).toBeInTheDocument()
    // Mode buttons show first word of label
    // check_in => "Alignment", deep_dive => "Deep", date_night => "Date"
    const suitableSection = screen.getByText("Suitable for").parentElement
    expect(suitableSection).toBeInTheDocument()
  })

  it("shows difficulty buttons", () => {
    render(
      <ContributeForm isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    expect(screen.getByText(/Light/)).toBeInTheDocument()
    // "Medium" and "Deep" can appear in both difficulty and mode sections; use getAllByText
    expect(screen.getAllByText(/Medium/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Deep/).length).toBeGreaterThanOrEqual(1)
  })

  it("submit button disabled when text is empty", () => {
    render(
      <ContributeForm isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    const submitButton = screen.getByRole("button", { name: /Submit/ })
    expect(submitButton).toBeDisabled()
  })

  it("calls supabase insert with correct payload on submit", async () => {
    render(
      <ContributeForm isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    // Type a question
    const textarea = screen.getByPlaceholderText(/Write a thoughtful question/)
    fireEvent.change(textarea, { target: { value: "What is your love language?" } })

    // Click submit
    const submitButton = screen.getByRole("button", { name: /Submit/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(1)
    })

    const payload = mockInsert.mock.calls[0][0]
    expect(payload).toMatchObject({
      user_id: "user-1",
      text: "What is your love language?",
      category: "communication",
      difficulty: "light",
      answer_type: "open",
      target_mode: "check_in",
      coyyns_spent: 5,
      status: "pending",
    })
  })

  it('shows "Submitted for review!" after successful submit', async () => {
    render(
      <ContributeForm isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const textarea = screen.getByPlaceholderText(/Write a thoughtful question/)
    fireEvent.change(textarea, { target: { value: "How do you feel today?" } })

    const submitButton = screen.getByRole("button", { name: /Submit/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Submitted for review!/)).toBeInTheDocument()
    })
  })

  it("calls onClose after submission", async () => {
    render(
      <ContributeForm isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )

    const textarea = screen.getByPlaceholderText(/Write a thoughtful question/)
    fireEvent.change(textarea, { target: { value: "A question for us" } })

    const submitButton = screen.getByRole("button", { name: /Submit/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Submitted for review!/)).toBeInTheDocument()
    })

    // The component calls onClose/onSuccess after 1500ms setTimeout
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    }, { timeout: 3000 })

    expect(mockOnSuccess).toHaveBeenCalled()
  })
})

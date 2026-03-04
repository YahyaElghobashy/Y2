import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mocks ---
const mockInsert = vi.fn()
const mockFrom = vi.fn(() => ({ insert: mockInsert }))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ from: mockFrom }),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "test@test.com" },
    profile: { id: "user-1", display_name: "Yahya", email: "test@test.com", avatar_url: null, partner_id: "user-2", role: "admin", created_at: "", updated_at: "" },
    partner: { id: "user-2", display_name: "Yara", email: "yara@test.com", avatar_url: null, partner_id: "user-1", role: "user", created_at: "", updated_at: "" },
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { CreateChallengeForm } from "@/components/relationship/CreateChallengeForm"

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onCreated: vi.fn(),
}

describe("CreateChallengeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
  })

  it("renders the dialog when open", () => {
    render(<CreateChallengeForm {...defaultProps} />)
    expect(screen.getByTestId("challenge-form-dialog")).toBeInTheDocument()
  })

  it("does not render when closed", () => {
    render(<CreateChallengeForm {...defaultProps} open={false} />)
    expect(screen.queryByTestId("challenge-form-dialog")).not.toBeInTheDocument()
  })

  it("renders the title 'Create Challenge'", () => {
    render(<CreateChallengeForm {...defaultProps} />)
    const headings = screen.getAllByText("Create Challenge")
    expect(headings.length).toBeGreaterThanOrEqual(1)
    // The heading h2 should be present
    const heading = headings.find((el) => el.tagName === "H2")
    expect(heading).toBeInTheDocument()
  })

  it("renders emoji picker with 10 emoji options", () => {
    render(<CreateChallengeForm {...defaultProps} />)
    expect(screen.getByTestId("emoji-picker")).toBeInTheDocument()
    const emojis = ["⚡", "🏆", "💪", "🎯", "🔥", "✨", "🎮", "📚", "🏃‍♂️", "🧘"]
    emojis.forEach((emoji) => {
      expect(screen.getByTestId(`emoji-${emoji}`)).toBeInTheDocument()
    })
  })

  it("selects a different emoji when clicked", () => {
    render(<CreateChallengeForm {...defaultProps} />)
    const trophyBtn = screen.getByTestId("emoji-🏆")
    fireEvent.click(trophyBtn)
    expect(trophyBtn).toHaveAttribute("aria-pressed", "true")
  })

  it("renders title input", () => {
    render(<CreateChallengeForm {...defaultProps} />)
    expect(screen.getByTestId("challenge-title-input")).toBeInTheDocument()
  })

  it("renders description textarea", () => {
    render(<CreateChallengeForm {...defaultProps} />)
    expect(screen.getByTestId("challenge-description-input")).toBeInTheDocument()
  })

  it("renders stakes input with default value 50", () => {
    render(<CreateChallengeForm {...defaultProps} />)
    const stakes = screen.getByTestId("challenge-stakes-input") as HTMLInputElement
    expect(stakes).toBeInTheDocument()
    expect(stakes.value).toBe("50")
  })

  it("renders deadline input", () => {
    render(<CreateChallengeForm {...defaultProps} />)
    expect(screen.getByTestId("challenge-deadline-input")).toBeInTheDocument()
  })

  it("shows title error when submitting empty title", async () => {
    render(<CreateChallengeForm {...defaultProps} />)
    // Clear the stakes (if needed — it has default 50)
    fireEvent.click(screen.getByTestId("challenge-submit"))
    await waitFor(() => {
      expect(screen.getByTestId("title-error")).toBeInTheDocument()
    })
  })

  it("calls supabase insert on valid submit", async () => {
    render(<CreateChallengeForm {...defaultProps} />)

    fireEvent.change(screen.getByTestId("challenge-title-input"), {
      target: { value: "No Screen Sunday" },
    })
    fireEvent.click(screen.getByTestId("challenge-submit"))

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("challenges")
      expect(mockInsert).toHaveBeenCalled()
    })
  })

  it("calls onCreated after successful creation", async () => {
    const onCreated = vi.fn()
    render(<CreateChallengeForm {...defaultProps} onCreated={onCreated} />)

    fireEvent.change(screen.getByTestId("challenge-title-input"), {
      target: { value: "No Screen Sunday" },
    })
    fireEvent.click(screen.getByTestId("challenge-submit"))

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledOnce()
    })
  })

  it("calls onClose after successful creation", async () => {
    const onClose = vi.fn()
    render(<CreateChallengeForm {...defaultProps} onClose={onClose} />)

    fireEvent.change(screen.getByTestId("challenge-title-input"), {
      target: { value: "No Screen Sunday" },
    })
    fireEvent.click(screen.getByTestId("challenge-submit"))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn()
    render(<CreateChallengeForm {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByTestId("challenge-form-close"))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn()
    render(<CreateChallengeForm {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByTestId("challenge-form-backdrop"))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("shows error toast when supabase insert fails", async () => {
    const { toast } = await import("sonner")
    mockInsert.mockResolvedValueOnce({ error: { message: "fail" } })

    render(<CreateChallengeForm {...defaultProps} />)

    fireEvent.change(screen.getByTestId("challenge-title-input"), {
      target: { value: "No Screen Sunday" },
    })
    fireEvent.click(screen.getByTestId("challenge-submit"))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to create challenge")
    })
  })

  it("renders the submit button", () => {
    render(<CreateChallengeForm {...defaultProps} />)
    expect(screen.getByTestId("challenge-submit")).toBeInTheDocument()
    expect(screen.getByTestId("challenge-submit")).toHaveTextContent("Create Challenge")
  })
})

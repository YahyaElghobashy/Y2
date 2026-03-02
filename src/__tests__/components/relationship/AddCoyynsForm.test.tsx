import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mock data ---
const mockAddCoyyns = vi.fn()

let mockCoyynsReturn = {
  wallet: { id: "w1", user_id: "u1", balance: 500, lifetime_earned: 1000, lifetime_spent: 500, created_at: "", updated_at: "" },
  partnerWallet: null,
  transactions: [],
  isLoading: false,
  error: null as string | null,
  addCoyyns: mockAddCoyyns,
  spendCoyyns: vi.fn(),
  refreshWallet: vi.fn(),
}

vi.mock("@/lib/hooks/use-coyyns", () => ({
  useCoyyns: () => mockCoyynsReturn,
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <div ref={ref} {...rest}>{children}</div>
    }),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock createPortal to render inline
vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom")
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  }
})

import { AddCoyynsForm } from "@/components/relationship/AddCoyynsForm"

describe("AddCoyynsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAddCoyyns.mockResolvedValue(undefined)
    mockCoyynsReturn = {
      ...mockCoyynsReturn,
      addCoyyns: mockAddCoyyns,
    }
  })

  it("renders nothing when open=false", () => {
    const { container } = render(<AddCoyynsForm open={false} onClose={vi.fn()} />)
    expect(container.querySelector("[role='dialog']")).not.toBeInTheDocument()
  })

  it("shows 'Add CoYYns' title when open=true", () => {
    render(<AddCoyynsForm open={true} onClose={vi.fn()} />)
    expect(screen.getByRole("dialog", { name: "Add CoYYns" })).toBeInTheDocument()
  })

  it("validates empty amount shows error on blur", async () => {
    render(<AddCoyynsForm open={true} onClose={vi.fn()} />)
    const amountInput = screen.getByTestId("add-amount-input")
    fireEvent.focus(amountInput)
    fireEvent.blur(amountInput)

    await waitFor(() => {
      expect(screen.getByText("Enter an amount")).toBeInTheDocument()
    })
  })

  it("validates empty description shows error on submit", async () => {
    render(<AddCoyynsForm open={true} onClose={vi.fn()} />)
    const amountInput = screen.getByTestId("add-amount-input")
    fireEvent.change(amountInput, { target: { value: "50" } })

    const submitButton = screen.getByTestId("add-submit-button")
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText("Description is required")).toBeInTheDocument()
    })
  })

  it("validates amount > 10000 shows error", async () => {
    render(<AddCoyynsForm open={true} onClose={vi.fn()} />)
    const amountInput = screen.getByTestId("add-amount-input")
    fireEvent.change(amountInput, { target: { value: "10001" } })
    fireEvent.blur(amountInput)

    await waitFor(() => {
      expect(screen.getByText("Max 10,000")).toBeInTheDocument()
    })
  })

  it("calls addCoyyns with correct values on valid submit", async () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()
    render(<AddCoyynsForm open={true} onClose={onClose} onSuccess={onSuccess} />)

    const amountInput = screen.getByTestId("add-amount-input")
    const descInput = screen.getByTestId("add-description-input")

    fireEvent.change(amountInput, { target: { value: "100" } })
    fireEvent.change(descInput, { target: { value: "Completed daily check-in" } })

    const submitButton = screen.getByTestId("add-submit-button")
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockAddCoyyns).toHaveBeenCalledWith(100, "Completed daily check-in")
    })
  })

  it("calls onClose and onSuccess after successful submit", async () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()
    render(<AddCoyynsForm open={true} onClose={onClose} onSuccess={onSuccess} />)

    fireEvent.change(screen.getByTestId("add-amount-input"), { target: { value: "50" } })
    fireEvent.change(screen.getByTestId("add-description-input"), { target: { value: "Test" } })
    fireEvent.click(screen.getByTestId("add-submit-button"))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it("shows root error if addCoyyns throws", async () => {
    mockAddCoyyns.mockRejectedValueOnce(new Error("Network error"))
    render(<AddCoyynsForm open={true} onClose={vi.fn()} />)

    fireEvent.change(screen.getByTestId("add-amount-input"), { target: { value: "50" } })
    fireEvent.change(screen.getByTestId("add-description-input"), { target: { value: "Test" } })
    fireEvent.click(screen.getByTestId("add-submit-button"))

    await waitFor(() => {
      expect(screen.getByTestId("add-form-error")).toHaveTextContent("Failed to add CoYYns. Try again.")
    })
  })

  it("X button calls onClose", () => {
    const onClose = vi.fn()
    render(<AddCoyynsForm open={true} onClose={onClose} />)
    fireEvent.click(screen.getByTestId("add-form-close"))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("backdrop click calls onClose", () => {
    const onClose = vi.fn()
    render(<AddCoyynsForm open={true} onClose={onClose} />)
    fireEvent.click(screen.getByTestId("add-form-backdrop"))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

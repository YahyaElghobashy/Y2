import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// --- Mock data ---
const mockSpendCoyyns = vi.fn()

const MOCK_WALLET = {
  id: "w1",
  user_id: "u1",
  balance: 500,
  lifetime_earned: 1000,
  lifetime_spent: 500,
  created_at: "",
  updated_at: "",
}

let mockCoyynsReturn = {
  wallet: MOCK_WALLET,
  partnerWallet: null,
  transactions: [],
  isLoading: false,
  error: null as string | null,
  addCoyyns: vi.fn(),
  spendCoyyns: mockSpendCoyyns,
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

import { SpendCoyynsForm } from "@/components/relationship/SpendCoyynsForm"

describe("SpendCoyynsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSpendCoyyns.mockResolvedValue(undefined)
    mockCoyynsReturn = {
      wallet: { ...MOCK_WALLET },
      partnerWallet: null,
      transactions: [],
      isLoading: false,
      error: null,
      addCoyyns: vi.fn(),
      spendCoyyns: mockSpendCoyyns,
      refreshWallet: vi.fn(),
    }
  })

  it("renders nothing when open=false", () => {
    const { container } = render(<SpendCoyynsForm open={false} onClose={vi.fn()} />)
    expect(container.querySelector("[role='dialog']")).not.toBeInTheDocument()
  })

  it("displays current balance", () => {
    render(<SpendCoyynsForm open={true} onClose={vi.fn()} />)
    expect(screen.getByTestId("spend-balance")).toHaveTextContent("500")
  })

  it("amount within balance shows no warning and button is enabled when description provided", async () => {
    render(<SpendCoyynsForm open={true} onClose={vi.fn()} />)

    fireEvent.change(screen.getByTestId("spend-amount-input"), { target: { value: "100" } })
    fireEvent.change(screen.getByTestId("spend-description-input"), { target: { value: "Test spend" } })

    await waitFor(() => {
      expect(screen.queryByTestId("insufficient-warning")).not.toBeInTheDocument()
      expect(screen.getByTestId("spend-submit-button")).not.toBeDisabled()
    })
  })

  it("amount exceeds balance shows 'Insufficient CoYYns' warning and button disabled", async () => {
    render(<SpendCoyynsForm open={true} onClose={vi.fn()} />)

    fireEvent.change(screen.getByTestId("spend-amount-input"), { target: { value: "999" } })
    fireEvent.change(screen.getByTestId("spend-description-input"), { target: { value: "Test" } })

    await waitFor(() => {
      expect(screen.getByTestId("insufficient-warning")).toHaveTextContent("Insufficient CoYYns")
      expect(screen.getByTestId("spend-submit-button")).toBeDisabled()
    })
  })

  it("empty description keeps button disabled", () => {
    render(<SpendCoyynsForm open={true} onClose={vi.fn()} />)

    fireEvent.change(screen.getByTestId("spend-amount-input"), { target: { value: "50" } })
    // No description entered

    expect(screen.getByTestId("spend-submit-button")).toBeDisabled()
  })

  it("calls spendCoyyns with correct values on valid submit", async () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()
    render(<SpendCoyynsForm open={true} onClose={onClose} onSuccess={onSuccess} />)

    fireEvent.change(screen.getByTestId("spend-amount-input"), { target: { value: "200" } })
    fireEvent.change(screen.getByTestId("spend-description-input"), { target: { value: "Bought a reward" } })
    fireEvent.click(screen.getByTestId("spend-submit-button"))

    await waitFor(() => {
      expect(mockSpendCoyyns).toHaveBeenCalledWith(200, "Bought a reward", "manual")
    })
  })

  it("calls onClose and onSuccess after successful submit", async () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()
    render(<SpendCoyynsForm open={true} onClose={onClose} onSuccess={onSuccess} />)

    fireEvent.change(screen.getByTestId("spend-amount-input"), { target: { value: "50" } })
    fireEvent.change(screen.getByTestId("spend-description-input"), { target: { value: "Test" } })
    fireEvent.click(screen.getByTestId("spend-submit-button"))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it("shows root error if spendCoyyns throws", async () => {
    mockSpendCoyyns.mockRejectedValueOnce(new Error("Network error"))
    render(<SpendCoyynsForm open={true} onClose={vi.fn()} />)

    fireEvent.change(screen.getByTestId("spend-amount-input"), { target: { value: "50" } })
    fireEvent.change(screen.getByTestId("spend-description-input"), { target: { value: "Test" } })
    fireEvent.click(screen.getByTestId("spend-submit-button"))

    await waitFor(() => {
      expect(screen.getByTestId("spend-form-error")).toHaveTextContent("Failed to spend CoYYns. Try again.")
    })
  })

  it("prefilled values populate form on open", () => {
    render(
      <SpendCoyynsForm
        open={true}
        onClose={vi.fn()}
        prefilledAmount={75}
        prefilledDescription="Weekly reward"
        prefilledCategory="reward"
      />
    )

    expect(screen.getByTestId("spend-amount-input")).toHaveValue(75)
    expect(screen.getByTestId("spend-description-input")).toHaveValue("Weekly reward")
  })

  it("X button calls onClose", () => {
    const onClose = vi.fn()
    render(<SpendCoyynsForm open={true} onClose={onClose} />)
    fireEvent.click(screen.getByTestId("spend-form-close"))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("backdrop click calls onClose", () => {
    const onClose = vi.fn()
    render(<SpendCoyynsForm open={true} onClose={onClose} />)
    fireEvent.click(screen.getByTestId("spend-form-backdrop"))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

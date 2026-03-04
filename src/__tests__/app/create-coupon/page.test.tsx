import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "test@test.com" },
    profile: null,
    partner: { id: "u2" },
    isLoading: false,
    profileNeedsSetup: false,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}))

const mockCreateCoupon = vi.fn().mockResolvedValue({ id: "new-c1" })
vi.mock("@/lib/hooks/use-coupons", () => ({
  useCoupons: () => ({
    myCoupons: [],
    receivedCoupons: [],
    pendingApprovals: [],
    isLoading: false,
    error: null,
    createCoupon: mockCreateCoupon,
    redeemCoupon: vi.fn(),
    approveCoupon: vi.fn(),
    rejectCoupon: vi.fn(),
    revealSurprise: vi.fn(),
    refreshCoupons: vi.fn(),
  }),
}))

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "https://example.com/photo.jpg" } }),
      }),
    },
  }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLDivElement>) => {
      const { initial, animate, exit, transition, variants, layoutId, ...rest } = props
      void initial; void animate; void exit; void transition; void variants; void layoutId
      return <div ref={ref} {...rest}>{children}</div>
    }),
    button: React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: React.Ref<HTMLButtonElement>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props
      void initial; void animate; void exit; void transition; void whileHover; void whileTap
      return <button ref={ref} {...rest}>{children}</button>
    }),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import CreateCouponPage from "@/app/(main)/create-coupon/page"

describe("CreateCouponPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders Step 1 by default", () => {
    render(<CreateCouponPage />)
    expect(screen.getByTestId("step1-form")).toBeInTheDocument()
    expect(screen.getByText("What's the gift?")).toBeInTheDocument()
  })

  it("renders step indicator with 4 dots", () => {
    render(<CreateCouponPage />)
    expect(screen.getByTestId("step-indicator")).toBeInTheDocument()
    expect(screen.getByTestId("step-dot-1")).toBeInTheDocument()
    expect(screen.getByTestId("step-dot-4")).toBeInTheDocument()
  })

  it("advances to Step 2 when Step 1 form is submitted", async () => {
    render(<CreateCouponPage />)
    // Fill title
    fireEvent.change(screen.getByTestId("title-input"), { target: { value: "Test Coupon" } })
    // Submit step 1
    await waitFor(() => {
      expect(screen.getByTestId("next-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("next-button"))
    await waitFor(() => {
      expect(screen.getByTestId("step2-form")).toBeInTheDocument()
    })
  })

  it("navigates back from Step 2 to Step 1", async () => {
    render(<CreateCouponPage />)
    // Go to step 2
    fireEvent.change(screen.getByTestId("title-input"), { target: { value: "Test" } })
    await waitFor(() => {
      expect(screen.getByTestId("next-button")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("next-button"))
    await waitFor(() => {
      expect(screen.getByTestId("step2-form")).toBeInTheDocument()
    })
    // Go back
    fireEvent.click(screen.getByTestId("back-button"))
    await waitFor(() => {
      expect(screen.getByTestId("step1-form")).toBeInTheDocument()
    })
  })

  it("renders PageHeader with correct title", () => {
    render(<CreateCouponPage />)
    expect(screen.getByText("New Coupon")).toBeInTheDocument()
  })
})

describe("CreateCouponStep1", () => {
  it("renders emoji picker", () => {
    render(<CreateCouponPage />)
    expect(screen.getByTestId("emoji-picker")).toBeInTheDocument()
  })

  it("renders category pills", () => {
    render(<CreateCouponPage />)
    expect(screen.getByTestId("category-picker")).toBeInTheDocument()
    expect(screen.getByText("Romantic")).toBeInTheDocument()
    expect(screen.getByText("Fun")).toBeInTheDocument()
  })

  it("disables Next when title is empty", () => {
    render(<CreateCouponPage />)
    expect(screen.getByTestId("next-button")).toBeDisabled()
  })
})

import React from "react"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Domain hook ────────────────────────────────────────
// The page reads useCoupons for { myCoupons, receivedCoupons, redeemCoupon, isLoading }.
const { useCoupons } = vi.hoisted(() => ({ useCoupons: vi.fn() }))
vi.mock("@/lib/hooks/use-coupons", () => ({ useCoupons }))

// The page reads useAuth for { partner, profile } to label each ticket's "from".
// user-1 = the logged-in target; user-2 = the partner who sent coupons.
vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "yahya@test.com" },
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
  }),
}))

// next/link is reached via PageHeader (loading branch) and EmptyState (CTA).
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
        ref: React.Ref<HTMLDivElement>,
      ) => {
        const { initial, animate, exit, transition, whileHover, whileTap, variants, layoutId, ...rest } = props
        void initial; void animate; void exit; void transition; void whileHover; void whileTap; void variants; void layoutId
        return (
          <div ref={ref} {...rest}>
            {children}
          </div>
        )
      },
    ),
    button: React.forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
        ref: React.Ref<HTMLButtonElement>,
      ) => {
        const { initial, animate, exit, transition, whileHover, whileTap, layoutId, ...rest } = props
        void initial; void animate; void exit; void transition; void whileHover; void whileTap; void layoutId
        return (
          <button ref={ref} {...rest}>
            {children}
          </button>
        )
      },
    ),
    h2: React.forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
        ref: React.Ref<HTMLHeadingElement>,
      ) => {
        const { initial, animate, exit, transition, ...rest } = props
        void initial; void animate; void exit; void transition
        return (
          <h2 ref={ref} {...rest}>
            {children}
          </h2>
        )
      },
    ),
    p: React.forwardRef(
      (
        { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
        ref: React.Ref<HTMLParagraphElement>,
      ) => {
        const { initial, animate, exit, transition, ...rest } = props
        void initial; void animate; void exit; void transition
        return (
          <p ref={ref} {...rest}>
            {children}
          </p>
        )
      },
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("@/components/animations", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FadeIn: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}))

import CouponWalletPage from "@/app/(main)/us/coupons/page"
import type { Coupon } from "@/lib/types/relationship.types"

// ── Fixtures ───────────────────────────────────────────
function makeCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: "c1",
    creator_id: "user-2",
    recipient_id: "user-1",
    title: "Movie Night",
    description: "Pick any movie",
    emoji: "🎬",
    category: "fun",
    image_url: null,
    status: "active",
    is_surprise: false,
    surprise_revealed: true,
    redeemed_at: null,
    approved_at: null,
    rejected_at: null,
    rejection_reason: null,
    expires_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as Coupon
}

function seed(over: Record<string, unknown> = {}) {
  useCoupons.mockReturnValue({
    myCoupons: [],
    receivedCoupons: [],
    pendingApprovals: [],
    isLoading: false,
    error: null,
    createCoupon: vi.fn(),
    redeemCoupon: vi.fn(),
    approveCoupon: vi.fn(),
    rejectCoupon: vi.fn(),
    revealSurprise: vi.fn(),
    refreshCoupons: vi.fn(),
    ...over,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  seed()
})

describe("CouponWalletPage", () => {
  // ── unit: derived rendering from mocked data ───────────
  it("renders the Coupons heading from CouponsView", () => {
    render(<CouponWalletPage />)
    expect(screen.getByRole("heading", { name: "Coupons" })).toBeInTheDocument()
  })

  it("renders the three tab pills with their real labels", () => {
    render(<CouponWalletPage />)
    expect(screen.getByRole("button", { name: "For me" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "I made" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "History" })).toBeInTheDocument()
  })

  it("marks the For me tab active by default via pill-tab-active", () => {
    render(<CouponWalletPage />)
    const forMe = screen.getByRole("button", { name: "For me" })
    const iMade = screen.getByRole("button", { name: "I made" })
    expect(forMe.className).toContain("pill-tab-active")
    expect(iMade.className).not.toContain("pill-tab-active")
  })

  it("renders received coupons as tickets in the For me tab, labelled from the partner", () => {
    seed({ receivedCoupons: [makeCoupon({ id: "r1", title: "Breakfast in bed" })] })
    render(<CouponWalletPage />)
    expect(screen.getByText("Breakfast in bed")).toBeInTheDocument()
    // useAuth.partner.display_name ("Yara") flows into the ticket's "from"
    expect(screen.getByText("from Yara")).toBeInTheDocument()
    // a received, non-redeemed coupon in For me exposes a Redeem control
    expect(screen.getByRole("button", { name: "Redeem" })).toBeInTheDocument()
  })

  it("excludes already-redeemed coupons from the For me tab", () => {
    seed({
      receivedCoupons: [
        makeCoupon({ id: "r1", title: "Active one", status: "active" }),
        makeCoupon({ id: "r2", title: "Done one", status: "redeemed" }),
      ],
    })
    render(<CouponWalletPage />)
    expect(screen.getByText("Active one")).toBeInTheDocument()
    expect(screen.queryByText("Done one")).not.toBeInTheDocument()
  })

  it("shows the empty state in the For me tab when there are no received coupons", () => {
    render(<CouponWalletPage />)
    expect(screen.getByText("No coupons waiting")).toBeInTheDocument()
    // no ticket and no redeem control
    expect(screen.queryByRole("button", { name: "Redeem" })).not.toBeInTheDocument()
  })

  it("renders coupons I created in the I made tab, labelled from me, without a Redeem control", () => {
    seed({ myCoupons: [makeCoupon({ id: "m1", title: "I owe you a hug", creator_id: "user-1", recipient_id: "user-2" })] })
    render(<CouponWalletPage />)
    fireEvent.click(screen.getByRole("button", { name: "I made" }))
    expect(screen.getByText("I owe you a hug")).toBeInTheDocument()
    // profile.display_name ("Yahya") flows into "from" for my own coupons
    expect(screen.getByText("from Yahya")).toBeInTheDocument()
    // Redeem is only offered in the For me tab
    expect(screen.queryByRole("button", { name: "Redeem" })).not.toBeInTheDocument()
  })

  it("shows the I made empty state with a Create CTA pointing at /create-coupon", () => {
    render(<CouponWalletPage />)
    fireEvent.click(screen.getByRole("button", { name: "I made" }))
    expect(screen.getByText("Make your first coupon")).toBeInTheDocument()
    const cta = screen.getByRole("link", { name: "Create a coupon" })
    expect(cta).toHaveAttribute("href", "/create-coupon")
  })

  it("lists only redeemed coupons in the History tab", () => {
    seed({
      receivedCoupons: [
        makeCoupon({ id: "r1", title: "Still active", status: "active" }),
        makeCoupon({ id: "r2", title: "Already redeemed", status: "redeemed" }),
      ],
    })
    render(<CouponWalletPage />)
    fireEvent.click(screen.getByRole("button", { name: "History" }))
    expect(screen.getByText("Already redeemed")).toBeInTheDocument()
    expect(screen.queryByText("Still active")).not.toBeInTheDocument()
  })

  it("shows the History empty state when nothing has been redeemed", () => {
    seed({ receivedCoupons: [makeCoupon({ id: "r1", status: "active" })] })
    render(<CouponWalletPage />)
    fireEvent.click(screen.getByRole("button", { name: "History" }))
    expect(screen.getByText("Nothing redeemed yet")).toBeInTheDocument()
  })

  // ── interaction + integration: redeem flow ─────────────
  it("redeeming a coupon fires onRedeem → redeemCoupon(id) with the coupon id", () => {
    const redeemCoupon = vi.fn()
    seed({ receivedCoupons: [makeCoupon({ id: "r-target", title: "A long walk" })], redeemCoupon })
    render(<CouponWalletPage />)

    fireEvent.click(screen.getByRole("button", { name: "Redeem" }))
    expect(redeemCoupon).toHaveBeenCalledTimes(1)
    expect(redeemCoupon).toHaveBeenCalledWith("r-target")
  })

  it("redeeming opens the Celebration with the redeemed coupon's title as subtitle", () => {
    seed({ receivedCoupons: [makeCoupon({ id: "r-target", title: "A long walk" })] })
    render(<CouponWalletPage />)

    // No celebration before redeem
    expect(screen.queryByRole("status")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Redeem" }))

    const celebration = screen.getByRole("status")
    expect(celebration).toBeInTheDocument()
    expect(within(celebration).getByText("Redeemed ✦")).toBeInTheDocument()
    expect(within(celebration).getByText("A long walk")).toBeInTheDocument()
  })

  it("optimistically stamps the redeemed coupon so it leaves the For me tab", () => {
    seed({ receivedCoupons: [makeCoupon({ id: "r-target", title: "A long walk" })] })
    render(<CouponWalletPage />)

    fireEvent.click(screen.getByRole("button", { name: "Redeem" }))

    // After the optimistic redeem the For me list filters out the now-redeemed
    // ticket, so its Redeem control is gone.
    expect(screen.queryByRole("button", { name: "Redeem" })).not.toBeInTheDocument()
  })

  // ── loading branch ─────────────────────────────────────
  it("renders the loading branch (PageHeader → /treasury back link, no tabs) while data loads", () => {
    seed({ isLoading: true })
    render(<CouponWalletPage />)

    // Loading branch renders the PageHeader titled Coupons with a /treasury back link
    const backLink = screen.getByRole("link", { name: "Go back" })
    expect(backLink).toHaveAttribute("href", "/treasury")
    expect(screen.getByRole("heading", { name: "Coupons" })).toBeInTheDocument()

    // and NONE of the CouponsView tab controls
    expect(screen.queryByRole("button", { name: "For me" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "I made" })).not.toBeInTheDocument()
  })
})

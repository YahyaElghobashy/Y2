import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, ...rest } = props
      void initial
      void animate
      void exit
      void transition
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

import { PairingNudge } from "@/components/pairing/PairingNudge"

describe("PairingNudge", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  // ── Unit ────────────────────────────────────────────────
  it("renders the nudge with a CTA when not dismissed", () => {
    render(<PairingNudge />)
    expect(screen.getByTestId("pairing-nudge")).toBeInTheDocument()
    expect(screen.getByTestId("pairing-nudge-cta")).toBeInTheDocument()
  })

  it("does not render when already dismissed this session", () => {
    sessionStorage.setItem("pairingNudgeDismissed", "1")
    render(<PairingNudge />)
    expect(screen.queryByTestId("pairing-nudge")).not.toBeInTheDocument()
  })

  // ── Interaction ─────────────────────────────────────────
  it("navigates to /pair when the CTA is tapped", async () => {
    const user = userEvent.setup()
    render(<PairingNudge />)

    await user.click(screen.getByTestId("pairing-nudge-cta"))
    expect(mockPush).toHaveBeenCalledWith("/pair")
  })

  it("dismisses and remembers the dismissal for the session", async () => {
    const user = userEvent.setup()
    render(<PairingNudge />)

    await user.click(screen.getByTestId("pairing-nudge-dismiss"))

    expect(screen.queryByTestId("pairing-nudge")).not.toBeInTheDocument()
    expect(sessionStorage.getItem("pairingNudgeDismissed")).toBe("1")
  })
})

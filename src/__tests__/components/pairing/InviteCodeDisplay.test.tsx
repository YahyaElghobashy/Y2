import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { InviteCodeDisplay } from "@/components/pairing/InviteCodeDisplay"

// Mock pairing-link to return predictable URLs
vi.mock("@/lib/pairing-link", () => ({
  generatePairingLink: (code: string) => `http://localhost/pair/${code}`,
}))

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props as Record<string, unknown>
      const htmlProps = Object.fromEntries(
        Object.entries(rest).filter(([k]) => !k.startsWith("data-") ? /^[a-z]/.test(k) || k.startsWith("data-") || k === "className" || k === "style" || k === "role" || k === "onClick" : true)
      )
      return <div {...htmlProps}>{children}</div>
    },
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, ...rest } = props as Record<string, unknown>
      const htmlProps = Object.fromEntries(
        Object.entries(rest).filter(([k]) => /^[a-z]/.test(k) || k.startsWith("data-") || k === "className" || k === "style")
      )
      return <p {...htmlProps}>{children}</p>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe("InviteCodeDisplay", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // ── Unit tests ──────────────────────────────────────────
  describe("unit", () => {
    it("renders loading skeleton when code is null", () => {
      render(<InviteCodeDisplay code={null} />)
      // Should show skeleton elements, not the code
      expect(screen.queryByTestId("invite-code")).not.toBeInTheDocument()
    })

    it("renders the invite code in monospace", () => {
      render(<InviteCodeDisplay code="ABC123" />)
      const codeEl = screen.getByTestId("invite-code")
      expect(codeEl).toHaveTextContent("ABC123")
    })

    it("renders copy and share buttons", () => {
      render(<InviteCodeDisplay code="ABC123" />)
      expect(screen.getByTestId("copy-code-btn")).toBeInTheDocument()
      expect(screen.getByTestId("share-code-btn")).toBeInTheDocument()
    })

    it("renders 'Your invite code' label", () => {
      render(<InviteCodeDisplay code="ABC123" />)
      expect(screen.getByText("Your invite code")).toBeInTheDocument()
    })

    it("accepts className prop", () => {
      const { container } = render(<InviteCodeDisplay code="ABC123" className="test-class" />)
      expect(container.firstChild).toHaveClass("test-class")
    })
  })

  // ── Interaction tests ───────────────────────────────────
  describe("interaction", () => {
    it("copies code to clipboard on copy click", async () => {
      const user = userEvent.setup()
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      })

      render(<InviteCodeDisplay code="ABC123" />)
      await user.click(screen.getByTestId("copy-code-btn"))

      expect(mockWriteText).toHaveBeenCalledWith("http://localhost/pair/ABC123")
    })

    it("shows 'Copied!' after successful copy", async () => {
      const user = userEvent.setup()
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        writable: true,
        configurable: true,
      })

      render(<InviteCodeDisplay code="ABC123" />)
      await user.click(screen.getByTestId("copy-code-btn"))

      await waitFor(() => {
        expect(screen.getByText("Copied!")).toBeInTheDocument()
      })
    })

    it("calls navigator.share on share click when supported", async () => {
      const user = userEvent.setup()
      const mockShare = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, "share", {
        value: mockShare,
        writable: true,
        configurable: true,
      })

      render(<InviteCodeDisplay code="XYZ789" />)
      await user.click(screen.getByTestId("share-code-btn"))

      expect(mockShare).toHaveBeenCalledWith({
        title: "Join me on Hayah",
        text: "Join me on Hayah! Use my invite code: XYZ789",
        url: "http://localhost/pair/XYZ789",
      })
    })

    it("falls back to copy when navigator.share is unavailable", async () => {
      const user = userEvent.setup()
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      })
      Object.defineProperty(navigator, "share", {
        value: undefined,
        writable: true,
        configurable: true,
      })

      render(<InviteCodeDisplay code="ABC123" />)
      await user.click(screen.getByTestId("share-code-btn"))

      expect(mockWriteText).toHaveBeenCalledWith("http://localhost/pair/ABC123")
    })
  })
})

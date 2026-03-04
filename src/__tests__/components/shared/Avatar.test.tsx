import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Avatar } from "@/components/shared/Avatar"

describe("Avatar", () => {
  // ── Unit tests ──────────────────────────────────────────
  describe("unit", () => {
    it("renders with initials fallback when no src", () => {
      render(<Avatar name="Yahya Elghobashy" />)
      const el = screen.getByTestId("avatar")
      expect(el).toHaveTextContent("YE")
    })

    it("renders single initial for single-word name", () => {
      render(<Avatar name="Yara" />)
      expect(screen.getByTestId("avatar")).toHaveTextContent("Y")
    })

    it("renders '?' when no name and no src", () => {
      render(<Avatar />)
      expect(screen.getByTestId("avatar")).toHaveTextContent("?")
    })

    it("renders at sm size (24px)", () => {
      render(<Avatar name="Test" size="sm" />)
      const el = screen.getByTestId("avatar")
      expect(el.style.width).toBe("24px")
      expect(el.style.height).toBe("24px")
    })

    it("renders at md size (32px) by default", () => {
      render(<Avatar name="Test" />)
      const el = screen.getByTestId("avatar")
      expect(el.style.width).toBe("32px")
      expect(el.style.height).toBe("32px")
    })

    it("renders at lg size (48px)", () => {
      render(<Avatar name="Test" size="lg" />)
      const el = screen.getByTestId("avatar")
      expect(el.style.width).toBe("48px")
      expect(el.style.height).toBe("48px")
    })

    it("renders at xl size (80px)", () => {
      render(<Avatar name="Test" size="xl" />)
      const el = screen.getByTestId("avatar")
      expect(el.style.width).toBe("80px")
      expect(el.style.height).toBe("80px")
    })

    it("renders image when src provided", () => {
      render(<Avatar src="https://example.com/avatar.jpg" name="Test User" />)
      const img = screen.getByRole("img")
      expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg")
      expect(img).toHaveAttribute("alt", "Test User")
    })

    it("renders initials when src is null", () => {
      render(<Avatar src={null} name="Yara" />)
      expect(screen.getByTestId("avatar")).toHaveTextContent("Y")
      expect(screen.queryByRole("img")).not.toBeInTheDocument()
    })

    it("accepts className prop", () => {
      render(<Avatar name="Test" className="custom-class" />)
      expect(screen.getByTestId("avatar")).toHaveClass("custom-class")
    })

    it("limits initials to 2 characters", () => {
      render(<Avatar name="John James William" />)
      expect(screen.getByTestId("avatar")).toHaveTextContent("JJ")
    })

    it("uppercases initials", () => {
      render(<Avatar name="yahya" />)
      expect(screen.getByTestId("avatar")).toHaveTextContent("Y")
    })
  })

  // ── Interaction tests ───────────────────────────────────
  describe("interaction", () => {
    it("falls back to initials on image error", () => {
      render(<Avatar src="https://broken.com/404.jpg" name="Yara M" />)
      const img = screen.getByRole("img")
      fireEvent.error(img)

      // After error, should show initials instead of image
      expect(screen.queryByRole("img")).not.toBeInTheDocument()
      expect(screen.getByTestId("avatar")).toHaveTextContent("YM")
    })

    it("falls back to ? on image error when no name", () => {
      render(<Avatar src="https://broken.com/404.jpg" />)
      fireEvent.error(screen.getByRole("img"))
      expect(screen.getByTestId("avatar")).toHaveTextContent("?")
    })
  })
})

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      ({ children, ...rest }: { children?: React.ReactNode; [k: string]: unknown }, ref: React.Ref<HTMLDivElement>) => (
        <div ref={ref} {...rest}>{children}</div>
      )
    ),
  },
}))

import { RitualCard } from "@/components/rituals/RitualCard"
import type { Ritual } from "@/lib/types/rituals.types"

const BASE_RITUAL: Ritual = {
  id: "r1",
  user_id: "user-1",
  title: "Morning Walk",
  description: "Walk 30 min",
  icon: "🚶",
  cadence: "daily",
  is_shared: false,
  coyyns_reward: 0,
  created_at: "",
  updated_at: "",
}

describe("RitualCard", () => {
  const mockOnLog = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("unit", () => {
    it("renders ritual title", () => {
      render(<RitualCard ritual={BASE_RITUAL} isLogged={false} partnerLogged={false} onLog={mockOnLog} />)
      expect(screen.getByTestId("ritual-title-r1")).toHaveTextContent("Morning Walk")
    })

    it("renders icon", () => {
      render(<RitualCard ritual={BASE_RITUAL} isLogged={false} partnerLogged={false} onLog={mockOnLog} />)
      expect(screen.getByTestId("ritual-icon-r1")).toHaveTextContent("🚶")
    })

    it("shows cadence label", () => {
      render(<RitualCard ritual={BASE_RITUAL} isLogged={false} partnerLogged={false} onLog={mockOnLog} />)
      expect(screen.getByTestId("ritual-cadence-r1")).toHaveTextContent("Daily")
    })

    it("shows CoYYns reward when > 0", () => {
      const ritual = { ...BASE_RITUAL, coyyns_reward: 5 }
      render(<RitualCard ritual={ritual} isLogged={false} partnerLogged={false} onLog={mockOnLog} />)
      expect(screen.getByTestId("ritual-reward-r1")).toHaveTextContent("+5 CoYYns")
    })

    it("hides CoYYns reward when 0", () => {
      render(<RitualCard ritual={BASE_RITUAL} isLogged={false} partnerLogged={false} onLog={mockOnLog} />)
      expect(screen.queryByTestId("ritual-reward-r1")).not.toBeInTheDocument()
    })

    it("shows single status dot for personal rituals", () => {
      render(<RitualCard ritual={BASE_RITUAL} isLogged={false} partnerLogged={false} onLog={mockOnLog} />)
      expect(screen.getByTestId("ritual-status-r1")).toBeInTheDocument()
      expect(screen.queryByTestId("ritual-shared-status-r1")).not.toBeInTheDocument()
    })

    it("shows dual status dots for shared rituals", () => {
      const ritual = { ...BASE_RITUAL, is_shared: true }
      render(<RitualCard ritual={ritual} isLogged={false} partnerLogged={false} onLog={mockOnLog} />)
      expect(screen.getByTestId("ritual-shared-status-r1")).toBeInTheDocument()
      expect(screen.queryByTestId("ritual-status-r1")).not.toBeInTheDocument()
    })
  })

  describe("interaction", () => {
    it("calls onLog when clicked and not logged", async () => {
      const user = userEvent.setup()
      render(<RitualCard ritual={BASE_RITUAL} isLogged={false} partnerLogged={false} onLog={mockOnLog} />)

      await user.click(screen.getByTestId("ritual-card-r1"))
      expect(mockOnLog).toHaveBeenCalledWith("r1")
    })

    it("does NOT call onLog when already logged", async () => {
      const user = userEvent.setup()
      render(<RitualCard ritual={BASE_RITUAL} isLogged={true} partnerLogged={false} onLog={mockOnLog} />)

      await user.click(screen.getByTestId("ritual-card-r1"))
      expect(mockOnLog).not.toHaveBeenCalled()
    })
  })

  describe("integration", () => {
    it("has accessible aria-label", () => {
      render(<RitualCard ritual={BASE_RITUAL} isLogged={false} partnerLogged={false} onLog={mockOnLog} />)
      expect(screen.getByTestId("ritual-card-r1")).toHaveAttribute("aria-label", "Morning Walk tap to complete")
    })

    it("shows completed aria-label when logged", () => {
      render(<RitualCard ritual={BASE_RITUAL} isLogged={true} partnerLogged={false} onLog={mockOnLog} />)
      expect(screen.getByTestId("ritual-card-r1")).toHaveAttribute("aria-label", "Morning Walk completed")
    })

    it("applies custom className", () => {
      render(<RitualCard ritual={BASE_RITUAL} isLogged={false} partnerLogged={false} onLog={mockOnLog} className="my-custom" />)
      expect(screen.getByTestId("ritual-card-r1").className).toContain("my-custom")
    })
  })
})

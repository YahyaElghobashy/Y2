import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ChallengeCard } from "@/components/relationship/ChallengeCard"

const defaultProps = {
  title: "No Screen Sunday",
  stakes: "Loser cooks dinner for a week",
  status: "pending" as const,
  participants: [
    { name: "Yahya", initial: "Y" },
    { name: "Yara", initial: "R" },
  ],
}

describe("ChallengeCard", () => {
  it("renders the title text", () => {
    render(<ChallengeCard {...defaultProps} />)
    expect(screen.getByText("No Screen Sunday")).toBeInTheDocument()
  })

  it("renders the stakes text", () => {
    render(<ChallengeCard {...defaultProps} />)
    expect(screen.getByText("Loser cooks dinner for a week")).toBeInTheDocument()
  })

  it("renders 'Pending' badge when status is pending", () => {
    render(<ChallengeCard {...defaultProps} status="pending" />)
    expect(screen.getByTestId("status-badge")).toHaveTextContent("Pending")
  })

  it("renders 'Active' badge when status is active", () => {
    render(<ChallengeCard {...defaultProps} status="active" />)
    expect(screen.getByTestId("status-badge")).toHaveTextContent("Active")
  })

  it("renders 'Completed' badge when status is completed", () => {
    render(<ChallengeCard {...defaultProps} status="completed" />)
    expect(screen.getByTestId("status-badge")).toHaveTextContent("Completed")
  })

  it("renders 'Declined' badge when status is declined", () => {
    render(<ChallengeCard {...defaultProps} status="declined" />)
    expect(screen.getByTestId("status-badge")).toHaveTextContent("Declined")
  })

  it("renders participant initials", () => {
    render(<ChallengeCard {...defaultProps} />)
    expect(screen.getByText("Y")).toBeInTheDocument()
    expect(screen.getByText("R")).toBeInTheDocument()
  })

  it("renders participant names", () => {
    render(<ChallengeCard {...defaultProps} />)
    expect(screen.getByText("Yahya & Yara")).toBeInTheDocument()
  })

  it("renders Accept button when status is pending", () => {
    render(<ChallengeCard {...defaultProps} status="pending" />)
    expect(screen.getByText("Accept")).toBeInTheDocument()
  })

  it("renders Decline button when status is pending", () => {
    render(<ChallengeCard {...defaultProps} status="pending" />)
    expect(screen.getByText("Decline")).toBeInTheDocument()
  })

  it("does NOT render Accept/Decline buttons when status is active", () => {
    render(<ChallengeCard {...defaultProps} status="active" />)
    expect(screen.queryByText("Accept")).not.toBeInTheDocument()
    expect(screen.queryByText("Decline")).not.toBeInTheDocument()
  })

  it("does NOT render Accept/Decline buttons when status is completed", () => {
    render(<ChallengeCard {...defaultProps} status="completed" />)
    expect(screen.queryByText("Accept")).not.toBeInTheDocument()
    expect(screen.queryByText("Decline")).not.toBeInTheDocument()
  })

  it("fires onAccept callback when Accept button is clicked", () => {
    const handleAccept = vi.fn()
    render(
      <ChallengeCard {...defaultProps} status="pending" onAccept={handleAccept} />
    )
    fireEvent.click(screen.getByText("Accept"))
    expect(handleAccept).toHaveBeenCalledOnce()
  })

  it("fires onDecline callback when Decline button is clicked", () => {
    const handleDecline = vi.fn()
    render(
      <ChallengeCard {...defaultProps} status="pending" onDecline={handleDecline} />
    )
    fireEvent.click(screen.getByText("Decline"))
    expect(handleDecline).toHaveBeenCalledOnce()
  })

  it("accepts className prop", () => {
    const { container } = render(
      <ChallengeCard {...defaultProps} className="mt-6" />
    )
    expect(container.firstChild).toHaveClass("mt-6")
  })
})

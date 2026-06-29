import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { LogVisitForm } from "@/components/travels/LogVisitForm"
import { toast } from "sonner"

describe("LogVisitForm", () => {
  beforeEach(() => vi.clearAllMocks())

  it("blocks submit with no country and surfaces an error", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<LogVisitForm open onClose={() => {}} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole("button", { name: /Save visit/i }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("together vs solo swaps the fields", () => {
    render(<LogVisitForm open onClose={() => {}} onSubmit={vi.fn()} meName="Yahya" partnerName="Yara" />)
    // default = together → memorable prompt
    expect(screen.getByText(/What made it special/i)).toBeInTheDocument()
    // switch to a solo traveler → recommendation + companions
    fireEvent.click(screen.getByRole("button", { name: "Yahya" }))
    expect(screen.getByText(/What should we do there together/i)).toBeInTheDocument()
    expect(screen.getByText(/Who were you with/i)).toBeInTheDocument()
  })

  it("submits the right payload for a together visit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(
      <LogVisitForm open onClose={onClose} onSubmit={onSubmit} presetCountry="NL" />
    )
    fireEvent.change(screen.getByPlaceholderText("2024"), { target: { value: "2024" } })
    fireEvent.change(screen.getByPlaceholderText(/canal-side breakfast/i), {
      target: { value: "golden hour" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Save visit/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        countryCode: "NL",
        isTogether: true,
        traveler: "me",
        visitedYear: 2024,
        memorable: "golden hour",
      })
    )
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it("hides the Who-went chips when unpaired (solo only)", () => {
    render(<LogVisitForm open onClose={() => {}} onSubmit={vi.fn()} hasPartner={false} presetCountry="EG" />)
    expect(screen.queryByText("Who went?")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Together" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Partner" })).not.toBeInTheDocument()
    // solo fields are shown by default
    expect(screen.getByText(/What should we do there together/i)).toBeInTheDocument()
  })

  it("unpaired submit logs as your own solo visit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<LogVisitForm open onClose={() => {}} onSubmit={onSubmit} hasPartner={false} presetCountry="EG" />)
    fireEvent.click(screen.getByRole("button", { name: /Save visit/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ countryCode: "EG", traveler: "me", isTogether: false })
    )
  })

  it("a throwing onSubmit keeps the sheet open (no false success)", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("boom"))
    const onClose = vi.fn()
    render(<LogVisitForm open onClose={onClose} onSubmit={onSubmit} presetCountry="NL" />)
    fireEvent.click(screen.getByRole("button", { name: /Save visit/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(toast.success).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})

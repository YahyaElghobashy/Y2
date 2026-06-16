import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { MarketplaceAdminView } from "@/components/marketplace/MarketplaceAdminView"
import type { MarketplaceItem } from "@/lib/types/marketplace.types"

const mk = (over: Partial<MarketplaceItem>): MarketplaceItem => ({
  id: "id",
  name: "Name",
  description: "Desc",
  price: 10,
  icon: "🔔",
  effect_type: "extra_ping",
  effect_config: {},
  is_active: true,
  sort_order: 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...over,
})

const ITEMS: MarketplaceItem[] = [
  mk({ id: "a", name: "Extra Ping", effect_type: "extra_ping", sort_order: 1 }),
  mk({ id: "b", name: "Movie Veto", effect_type: "veto", sort_order: 2, is_active: false }),
  mk({ id: "c", name: "Coffee Run", effect_type: "task_order", sort_order: 3 }),
]

describe("MarketplaceAdminView", () => {
  it("renders every item including deactivated ones, with an Off badge", () => {
    render(<MarketplaceAdminView items={ITEMS} />)
    expect(within(screen.getByTestId("admin-item-list")).getAllByRole("listitem")).toHaveLength(3)
    expect(screen.getByTestId("badge-inactive-b")).toBeInTheDocument()
  })

  it("filters by effect type when a chip is clicked", () => {
    render(<MarketplaceAdminView items={ITEMS} />)
    fireEvent.click(screen.getByTestId("filter-veto"))
    const list = screen.getByTestId("admin-item-list")
    expect(within(list).getAllByRole("listitem")).toHaveLength(1)
    expect(within(list).getByText("Movie Veto")).toBeInTheDocument()
  })

  it("filters by search term over name + description", () => {
    render(<MarketplaceAdminView items={ITEMS} />)
    fireEvent.change(screen.getByTestId("admin-search"), { target: { value: "coffee" } })
    const list = screen.getByTestId("admin-item-list")
    expect(within(list).getAllByRole("listitem")).toHaveLength(1)
    expect(within(list).getByText("Coffee Run")).toBeInTheDocument()
  })

  it("shows an empty state when nothing matches", () => {
    render(<MarketplaceAdminView items={ITEMS} />)
    fireEvent.change(screen.getByTestId("admin-search"), { target: { value: "zzzzz" } })
    expect(screen.getByTestId("admin-empty")).toBeInTheDocument()
  })

  it("opens the create sheet, fills the form, and calls onCreate with the payload", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined)
    render(<MarketplaceAdminView items={ITEMS} onCreate={onCreate} />)

    fireEvent.click(screen.getByTestId("admin-add"))
    expect(screen.getByTestId("admin-sheet")).toBeInTheDocument()

    fireEvent.change(screen.getByTestId("form-name"), { target: { value: "Day Off" } })
    fireEvent.change(screen.getByTestId("form-description"), { target: { value: "A full day off" } })
    fireEvent.change(screen.getByTestId("form-price"), { target: { value: "90" } })
    fireEvent.change(screen.getByTestId("form-icon"), { target: { value: "🏖" } })
    fireEvent.click(screen.getByTestId("form-effect-wildcard"))
    fireEvent.click(screen.getByTestId("form-submit"))

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1))
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Day Off",
        price: 90,
        icon: "🏖",
        effect_type: "wildcard",
        is_active: true,
      }),
    )
  })

  it("blocks submit and shows an error for an invalid price", async () => {
    const onCreate = vi.fn()
    render(<MarketplaceAdminView items={ITEMS} onCreate={onCreate} />)
    fireEvent.click(screen.getByTestId("admin-add"))
    fireEvent.change(screen.getByTestId("form-name"), { target: { value: "Bad" } })
    fireEvent.change(screen.getByTestId("form-price"), { target: { value: "0" } })
    fireEvent.click(screen.getByTestId("form-submit"))

    expect(await screen.findByTestId("form-error")).toHaveTextContent("greater than 0")
    expect(onCreate).not.toHaveBeenCalled()
  })

  it("prefills the edit sheet and calls onUpdate with the item id + changes", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    render(<MarketplaceAdminView items={ITEMS} onUpdate={onUpdate} />)

    fireEvent.click(screen.getByTestId("edit-a"))
    const nameInput = screen.getByTestId("form-name") as HTMLInputElement
    expect(nameInput.value).toBe("Extra Ping")

    fireEvent.change(nameInput, { target: { value: "Extra Ping Plus" } })
    fireEvent.click(screen.getByTestId("form-submit"))

    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1))
    expect(onUpdate).toHaveBeenCalledWith("a", expect.objectContaining({ name: "Extra Ping Plus" }))
  })

  it("calls onToggleActive with the flipped value", async () => {
    const onToggleActive = vi.fn().mockResolvedValue(undefined)
    render(<MarketplaceAdminView items={ITEMS} onToggleActive={onToggleActive} />)
    fireEvent.click(screen.getByTestId("toggle-a")) // 'a' is active → expect false
    await waitFor(() => expect(onToggleActive).toHaveBeenCalledWith("a", false))
  })

  it("calls onDelete with the item id", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    render(<MarketplaceAdminView items={ITEMS} onDelete={onDelete} />)
    fireEvent.click(screen.getByTestId("delete-c"))
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("c"))
  })

  it("demo mode (no callbacks) mutates local state — new item appears in the list", async () => {
    render(<MarketplaceAdminView items={ITEMS} />)
    fireEvent.click(screen.getByTestId("admin-add"))
    fireEvent.change(screen.getByTestId("form-name"), { target: { value: "Local Demo Item" } })
    fireEvent.click(screen.getByTestId("form-submit"))
    await waitFor(() =>
      expect(within(screen.getByTestId("admin-item-list")).getByText("Local Demo Item")).toBeInTheDocument(),
    )
  })

  it("demo mode toggle flips the Off badge locally", () => {
    render(<MarketplaceAdminView items={ITEMS} />)
    // 'a' active → toggle → becomes inactive → Off badge appears
    expect(screen.queryByTestId("badge-inactive-a")).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId("toggle-a"))
    expect(screen.getByTestId("badge-inactive-a")).toBeInTheDocument()
  })

  it("surfaces an error banner when onToggleActive rejects (no silent no-op)", async () => {
    const onToggleActive = vi.fn().mockRejectedValue(new Error("RLS denied"))
    render(<MarketplaceAdminView items={ITEMS} onToggleActive={onToggleActive} />)
    fireEvent.click(screen.getByTestId("toggle-a"))
    expect(await screen.findByTestId("admin-action-error")).toHaveTextContent("RLS denied")
  })

  it("surfaces an error banner when onDelete rejects (e.g. purchased item FK)", async () => {
    const onDelete = vi.fn().mockRejectedValue(new Error("This item has been purchased — deactivate it instead"))
    render(<MarketplaceAdminView items={ITEMS} onDelete={onDelete} />)
    fireEvent.click(screen.getByTestId("delete-a"))
    expect(await screen.findByTestId("admin-action-error")).toHaveTextContent("deactivate it instead")
  })

  it("blocks submit when a numeric effect_config field is cleared to 0", async () => {
    const onCreate = vi.fn()
    render(<MarketplaceAdminView items={ITEMS} onCreate={onCreate} />)
    fireEvent.click(screen.getByTestId("admin-add")) // defaults to extra_ping / extra_sends=1
    fireEvent.change(screen.getByTestId("form-name"), { target: { value: "Bad Cfg" } })
    fireEvent.change(screen.getByTestId("cfg-extra_sends"), { target: { value: "0" } })
    fireEvent.click(screen.getByTestId("form-submit"))
    expect(await screen.findByTestId("form-error")).toHaveTextContent("Extra sends")
    expect(onCreate).not.toHaveBeenCalled()
  })
})

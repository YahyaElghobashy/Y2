import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Framer Motion mock ──────────────────────────────────────
vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(
      (
        { children, ...rest }: { children?: React.ReactNode; [k: string]: unknown },
        ref: React.Ref<HTMLDivElement>
      ) => (
        <div ref={ref} {...rest}>
          {children}
        </div>
      )
    ),
    button: React.forwardRef(
      (
        { children, ...rest }: { children?: React.ReactNode; [k: string]: unknown },
        ref: React.Ref<HTMLButtonElement>
      ) => (
        <button ref={ref} {...rest}>
          {children}
        </button>
      )
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { ListItemCard } from "@/components/list/ListItemCard"
import type { ListItem } from "@/lib/types/shared-list.types"

const BASE_ITEM: ListItem = {
  id: "item-1",
  list_id: "list-1",
  parent_id: null,
  title: "Milk",
  is_completed: false,
  completed_by: null,
  completed_at: null,
  coyyns_reward: 0,
  position: 0,
  created_by: "user-1",
  created_at: "2026-03-05T00:00:00Z",
  updated_at: "2026-03-05T00:00:00Z",
}

const SUB_ITEM: ListItem = {
  ...BASE_ITEM,
  id: "sub-1",
  parent_id: "item-1",
  title: "Whole milk",
  position: 0,
}

describe("ListItemCard", () => {
  const mockToggle = vi.fn()
  const mockDelete = vi.fn()
  const mockAddSubItem = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("renders item title", () => {
      render(
        <ListItemCard item={BASE_ITEM} isOwn onToggle={mockToggle} onDelete={mockDelete} />
      )
      expect(screen.getByTestId("title-item-1")).toHaveTextContent("Milk")
    })

    it("shows CoYYns badge when reward > 0", () => {
      const item = { ...BASE_ITEM, coyyns_reward: 5 }
      render(
        <ListItemCard item={item} isOwn onToggle={mockToggle} onDelete={mockDelete} />
      )
      expect(screen.getByTestId("coyyns-badge-item-1")).toHaveTextContent("5")
    })

    it("hides CoYYns badge when reward is 0", () => {
      render(
        <ListItemCard item={BASE_ITEM} isOwn onToggle={mockToggle} onDelete={mockDelete} />
      )
      expect(screen.queryByTestId("coyyns-badge-item-1")).not.toBeInTheDocument()
    })

    it("shows creator dot with Y for own items", () => {
      render(
        <ListItemCard item={BASE_ITEM} isOwn onToggle={mockToggle} onDelete={mockDelete} />
      )
      expect(screen.getByTestId("creator-item-1")).toHaveTextContent("Y")
    })

    it("shows creator dot with P for partner items", () => {
      render(
        <ListItemCard item={BASE_ITEM} isOwn={false} onToggle={mockToggle} onDelete={mockDelete} />
      )
      expect(screen.getByTestId("creator-item-1")).toHaveTextContent("P")
    })

    it("shows checkbox as unchecked for active items", () => {
      render(
        <ListItemCard item={BASE_ITEM} isOwn onToggle={mockToggle} onDelete={mockDelete} />
      )
      expect(screen.getByTestId("toggle-item-1")).toHaveAttribute("aria-pressed", "false")
    })

    it("shows checkbox as checked for completed items", () => {
      const item = { ...BASE_ITEM, is_completed: true, completed_by: "user-1" }
      render(
        <ListItemCard item={item} isOwn onToggle={mockToggle} onDelete={mockDelete} />
      )
      expect(screen.getByTestId("toggle-item-1")).toHaveAttribute("aria-pressed", "true")
    })

    it("applies line-through on completed items", () => {
      const item = { ...BASE_ITEM, is_completed: true }
      render(
        <ListItemCard item={item} isOwn onToggle={mockToggle} onDelete={mockDelete} />
      )
      expect(screen.getByTestId("title-item-1").className).toContain("line-through")
    })

    it("shows expand button for active items", () => {
      render(
        <ListItemCard item={BASE_ITEM} isOwn onToggle={mockToggle} onDelete={mockDelete} />
      )
      expect(screen.getByTestId("expand-item-1")).toBeInTheDocument()
    })

    it("hides expand button for completed items", () => {
      const item = { ...BASE_ITEM, is_completed: true }
      render(
        <ListItemCard item={item} isOwn onToggle={mockToggle} onDelete={mockDelete} />
      )
      expect(screen.queryByTestId("expand-item-1")).not.toBeInTheDocument()
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("calls onToggle with item id on checkbox click", async () => {
      const user = userEvent.setup()
      render(
        <ListItemCard item={BASE_ITEM} isOwn onToggle={mockToggle} onDelete={mockDelete} />
      )

      await user.click(screen.getByTestId("toggle-item-1"))
      expect(mockToggle).toHaveBeenCalledWith("item-1")
    })

    it("calls onDelete with item id on delete click", async () => {
      const user = userEvent.setup()
      render(
        <ListItemCard item={BASE_ITEM} isOwn onToggle={mockToggle} onDelete={mockDelete} />
      )

      await user.click(screen.getByTestId("delete-item-1"))
      expect(mockDelete).toHaveBeenCalledWith("item-1")
    })

    it("expands sub-items on expand click", async () => {
      const user = userEvent.setup()
      render(
        <ListItemCard
          item={BASE_ITEM}
          subItems={[SUB_ITEM]}
          isOwn
          onToggle={mockToggle}
          onDelete={mockDelete}
          onAddSubItem={mockAddSubItem}
        />
      )

      expect(screen.queryByTestId("sub-items-item-1")).not.toBeInTheDocument()

      await user.click(screen.getByTestId("expand-item-1"))
      expect(screen.getByTestId("sub-items-item-1")).toBeInTheDocument()
      expect(screen.getByTestId("sub-item-sub-1")).toBeInTheDocument()
    })

    it("toggles sub-item completion", async () => {
      const user = userEvent.setup()
      render(
        <ListItemCard
          item={BASE_ITEM}
          subItems={[SUB_ITEM]}
          isOwn
          onToggle={mockToggle}
          onDelete={mockDelete}
          onAddSubItem={mockAddSubItem}
        />
      )

      await user.click(screen.getByTestId("expand-item-1"))
      await user.click(screen.getByTestId("toggle-sub-1"))
      expect(mockToggle).toHaveBeenCalledWith("sub-1")
    })

    it("adds sub-item via sub-input Enter", async () => {
      const user = userEvent.setup()
      render(
        <ListItemCard
          item={BASE_ITEM}
          subItems={[]}
          isOwn
          onToggle={mockToggle}
          onDelete={mockDelete}
          onAddSubItem={mockAddSubItem}
        />
      )

      await user.click(screen.getByTestId("expand-item-1"))
      await user.type(screen.getByTestId("sub-input-item-1"), "Almond milk{Enter}")
      expect(mockAddSubItem).toHaveBeenCalledWith("item-1", "Almond milk")
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("renders with all sub-items when expanded", async () => {
      const user = userEvent.setup()
      const sub2: ListItem = { ...SUB_ITEM, id: "sub-2", title: "Oat milk", position: 1 }
      render(
        <ListItemCard
          item={BASE_ITEM}
          subItems={[SUB_ITEM, sub2]}
          isOwn
          onToggle={mockToggle}
          onDelete={mockDelete}
        />
      )

      await user.click(screen.getByTestId("expand-item-1"))
      expect(screen.getByTestId("sub-item-sub-1")).toBeInTheDocument()
      expect(screen.getByTestId("sub-item-sub-2")).toBeInTheDocument()
    })

    it("applies custom className", () => {
      render(
        <ListItemCard
          item={BASE_ITEM}
          isOwn
          onToggle={mockToggle}
          onDelete={mockDelete}
          className="my-custom"
        />
      )
      expect(screen.getByTestId("list-item-item-1").className).toContain("my-custom")
    })

    it("has accessible labels on toggle and delete", () => {
      render(
        <ListItemCard item={BASE_ITEM} isOwn onToggle={mockToggle} onDelete={mockDelete} />
      )
      expect(screen.getByTestId("toggle-item-1")).toHaveAttribute("aria-label", "Mark complete")
      expect(screen.getByTestId("delete-item-1")).toHaveAttribute("aria-label", "Delete item")
    })
  })
})

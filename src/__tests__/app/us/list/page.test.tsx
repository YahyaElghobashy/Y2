import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────

const mockUser = { id: "user-1", email: "yahya@test.com" }

vi.mock("@/lib/providers/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser, partner: { id: "user-2" } }),
}))

const mockAddItem = vi.fn()
const mockAddSubItem = vi.fn()
const mockToggleComplete = vi.fn()
const mockDeleteItem = vi.fn()
const mockCreateList = vi.fn().mockResolvedValue("list-new")
const mockSelectList = vi.fn()
const mockDeleteList = vi.fn()

const mockUseSharedList: ReturnType<typeof vi.fn> = vi.fn(() => ({
  lists: [
    {
      id: "list-1",
      created_by: "user-1",
      title: "Groceries",
      list_type: "grocery",
      created_at: "2026-03-05",
      updated_at: "2026-03-05",
    },
  ],
  list: {
    id: "list-1",
    created_by: "user-1",
    title: "Groceries",
    list_type: "grocery",
    created_at: "2026-03-05",
    updated_at: "2026-03-05",
  },
  items: [
    {
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
      created_at: "2026-03-05",
      updated_at: "2026-03-05",
    },
  ],
  completedItems: [],
  isLoading: false,
  error: null,
  addItem: mockAddItem,
  addSubItem: mockAddSubItem,
  toggleComplete: mockToggleComplete,
  deleteItem: mockDeleteItem,
  createList: mockCreateList,
  deleteList: mockDeleteList,
  selectList: mockSelectList,
  reorderItems: vi.fn(),
}))

vi.mock("@/lib/hooks/use-shared-list", () => ({
  useSharedList: () => mockUseSharedList(),
}))

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

vi.mock("@/components/animations", () => ({
  StaggerList: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  FadeIn: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}))

import SharedListPage from "@/app/(main)/us/list/page"

describe("SharedListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSharedList.mockReturnValue({
      lists: [
        {
          id: "list-1",
          created_by: "user-1",
          title: "Groceries",
          list_type: "grocery",
          created_at: "2026-03-05",
          updated_at: "2026-03-05",
        },
      ],
      list: {
        id: "list-1",
        created_by: "user-1",
        title: "Groceries",
        list_type: "grocery",
        created_at: "2026-03-05",
        updated_at: "2026-03-05",
      },
      items: [
        {
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
          created_at: "2026-03-05",
          updated_at: "2026-03-05",
        },
      ],
      completedItems: [],
      isLoading: false,
      error: null,
      addItem: mockAddItem,
      addSubItem: mockAddSubItem,
      toggleComplete: mockToggleComplete,
      deleteItem: mockDeleteItem,
      createList: mockCreateList,
      deleteList: mockDeleteList,
      selectList: mockSelectList,
      reorderItems: vi.fn(),
    })
  })

  // ── Unit Tests ──────────────────────────────────────────────

  describe("unit", () => {
    it("renders page container", () => {
      render(<SharedListPage />)
      expect(screen.getByTestId("shared-list-page")).toBeInTheDocument()
    })

    it("shows loading skeleton", () => {
      mockUseSharedList.mockReturnValue({
        lists: [],
        list: null,
        items: [],
        completedItems: [],
        isLoading: true,
        error: null,
        addItem: vi.fn(),
        addSubItem: vi.fn(),
        toggleComplete: vi.fn(),
        deleteItem: vi.fn(),
        createList: vi.fn(),
        deleteList: vi.fn(),
        selectList: vi.fn(),
        reorderItems: vi.fn(),
      })
      render(<SharedListPage />)
      expect(screen.getByTestId("list-loading")).toBeInTheDocument()
    })

    it("shows error message", () => {
      mockUseSharedList.mockReturnValue({
        lists: [],
        list: null,
        items: [],
        completedItems: [],
        isLoading: false,
        error: "Something went wrong",
        addItem: vi.fn(),
        addSubItem: vi.fn(),
        toggleComplete: vi.fn(),
        deleteItem: vi.fn(),
        createList: vi.fn(),
        deleteList: vi.fn(),
        selectList: vi.fn(),
        reorderItems: vi.fn(),
      })
      render(<SharedListPage />)
      expect(screen.getByTestId("list-error")).toHaveTextContent("Something went wrong")
    })

    it("shows empty state when no lists", () => {
      mockUseSharedList.mockReturnValue({
        lists: [],
        list: null,
        items: [],
        completedItems: [],
        isLoading: false,
        error: null,
        addItem: vi.fn(),
        addSubItem: vi.fn(),
        toggleComplete: vi.fn(),
        deleteItem: vi.fn(),
        createList: vi.fn(),
        deleteList: vi.fn(),
        selectList: vi.fn(),
        reorderItems: vi.fn(),
      })
      render(<SharedListPage />)
      expect(screen.getByText("No lists yet")).toBeInTheDocument()
    })

    it("shows list selector tabs", () => {
      render(<SharedListPage />)
      expect(screen.getByTestId("list-selector")).toBeInTheDocument()
      expect(screen.getByTestId("list-tab-list-1")).toHaveTextContent("Groceries")
    })

    it("shows quick-add input when list selected", () => {
      render(<SharedListPage />)
      expect(screen.getByTestId("quick-add-input")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Add to Groceries...")).toBeInTheDocument()
    })

    it("renders active items", () => {
      render(<SharedListPage />)
      expect(screen.getByTestId("list-item-item-1")).toBeInTheDocument()
      expect(screen.getByTestId("title-item-1")).toHaveTextContent("Milk")
    })

    it("shows empty state when list is empty", () => {
      mockUseSharedList.mockReturnValue({
        lists: [{ id: "list-1", title: "Empty", created_by: "user-1", list_type: "general", created_at: "", updated_at: "" }],
        list: { id: "list-1", title: "Empty", created_by: "user-1", list_type: "general", created_at: "", updated_at: "" },
        items: [],
        completedItems: [],
        isLoading: false,
        error: null,
        addItem: vi.fn(),
        addSubItem: vi.fn(),
        toggleComplete: vi.fn(),
        deleteItem: vi.fn(),
        createList: vi.fn(),
        deleteList: vi.fn(),
        selectList: vi.fn(),
        reorderItems: vi.fn(),
      })
      render(<SharedListPage />)
      expect(screen.getByText("List is empty")).toBeInTheDocument()
    })
  })

  // ── Interaction Tests ───────────────────────────────────────

  describe("interaction", () => {
    it("adds item via QuickAddInput", async () => {
      const user = userEvent.setup()
      render(<SharedListPage />)

      await user.type(screen.getByTestId("quick-add-field"), "Eggs{Enter}")
      expect(mockAddItem).toHaveBeenCalledWith("Eggs")
    })

    it("toggles item completion", async () => {
      const user = userEvent.setup()
      render(<SharedListPage />)

      await user.click(screen.getByTestId("toggle-item-1"))
      expect(mockToggleComplete).toHaveBeenCalledWith("item-1")
    })

    it("deletes item", async () => {
      const user = userEvent.setup()
      render(<SharedListPage />)

      await user.click(screen.getByTestId("delete-item-1"))
      expect(mockDeleteItem).toHaveBeenCalledWith("item-1")
    })

    it("switches list on tab click", async () => {
      mockUseSharedList.mockReturnValue({
        ...mockUseSharedList(),
        lists: [
          { id: "list-1", title: "Groceries", created_by: "user-1", list_type: "grocery", created_at: "", updated_at: "" },
          { id: "list-2", title: "Wishlist", created_by: "user-1", list_type: "wishlist", created_at: "", updated_at: "" },
        ],
      })

      const user = userEvent.setup()
      render(<SharedListPage />)

      await user.click(screen.getByTestId("list-tab-list-2"))
      expect(mockSelectList).toHaveBeenCalledWith("list-2")
    })

    it("opens new list form and creates list", async () => {
      const user = userEvent.setup()
      render(<SharedListPage />)

      await user.click(screen.getByTestId("new-list-button"))
      expect(screen.getByTestId("new-list-form")).toBeInTheDocument()

      await user.type(screen.getByTestId("new-list-input"), "Shopping{Enter}")
      expect(mockCreateList).toHaveBeenCalledWith("Shopping")
    })

    it("shows completed section with toggle", async () => {
      mockUseSharedList.mockReturnValue({
        ...mockUseSharedList(),
        completedItems: [
          {
            id: "done-1",
            list_id: "list-1",
            parent_id: null,
            title: "Done Item",
            is_completed: true,
            completed_by: "user-1",
            completed_at: "2026-03-05",
            coyyns_reward: 0,
            position: 0,
            created_by: "user-1",
            created_at: "2026-03-05",
            updated_at: "2026-03-05",
          },
        ],
      })

      const user = userEvent.setup()
      render(<SharedListPage />)

      expect(screen.getByTestId("completed-section")).toBeInTheDocument()
      expect(screen.getByTestId("completed-toggle")).toHaveTextContent("Completed (1)")

      await user.click(screen.getByTestId("completed-toggle"))
      expect(screen.getByTestId("list-item-done-1")).toBeInTheDocument()
    })
  })

  // ── Integration Tests ───────────────────────────────────────

  describe("integration", () => {
    it("uses useSharedList hook", () => {
      render(<SharedListPage />)
      expect(mockUseSharedList).toHaveBeenCalled()
    })

    it("passes correct props to ListItemCard", () => {
      render(<SharedListPage />)
      // Item should show creator dot as "Y" for own item
      expect(screen.getByTestId("creator-item-1")).toHaveTextContent("Y")
    })

    it("renders new list button in selector", () => {
      render(<SharedListPage />)
      expect(screen.getByTestId("new-list-button")).toBeInTheDocument()
      expect(screen.getByTestId("new-list-button")).toHaveAttribute("aria-label", "Create new list")
    })
  })
})

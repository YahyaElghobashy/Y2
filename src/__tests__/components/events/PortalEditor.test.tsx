import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock data ──
const MOCK_PAGES = [
  { id: "page-1", portal_id: "portal-1", slug: "main", title: "Home", icon: "🏠", position: 0, is_visible: true, created_at: "", updated_at: "" },
  { id: "page-2", portal_id: "portal-1", slug: "travel", title: "Travel", icon: "✈️", position: 1, is_visible: true, created_at: "", updated_at: "" },
]

const MOCK_SECTIONS = {
  "page-1": [
    { id: "s1", page_id: "page-1", section_type: "hero", content: { heading: "Hi" }, position: 0, is_visible: true, created_at: "", updated_at: "" },
    { id: "s2", page_id: "page-1", section_type: "welcome", content: { body: "Test" }, position: 1, is_visible: true, created_at: "", updated_at: "" },
  ],
  "page-2": [],
}

// ── Mock hook ──
const mockAddSection = vi.fn().mockResolvedValue(null)
const mockUpdateSectionContent = vi.fn()
const mockDeleteSectionImmediate = vi.fn().mockResolvedValue(undefined)
const mockReorderSections = vi.fn().mockResolvedValue(undefined)

let mockIsLoading = false
let mockError: string | null = null

vi.mock("@/lib/hooks/use-portal-pages", () => ({
  usePortalPages: () => ({
    pages: MOCK_PAGES,
    sections: MOCK_SECTIONS,
    isLoading: mockIsLoading,
    error: mockError,
    createPage: vi.fn(),
    updatePage: vi.fn(),
    deletePage: vi.fn(),
    reorderPages: vi.fn(),
    addSection: mockAddSection,
    updateSectionContent: mockUpdateSectionContent,
    deleteSectionImmediate: mockDeleteSectionImmediate,
    reorderSections: mockReorderSections,
    refreshPages: vi.fn(),
  }),
}))

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { PortalEditor } from "@/components/events/PortalEditor"

describe("PortalEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsLoading = false
    mockError = null
  })

  // ── Unit: Initial render ──

  it("renders the editor shell", () => {
    render(<PortalEditor portalId="portal-1" />)
    expect(screen.getByTestId("portal-editor")).toBeInTheDocument()
  })

  it("shows loading state when isLoading", () => {
    mockIsLoading = true
    render(<PortalEditor portalId="portal-1" />)
    expect(screen.getByTestId("editor-loading")).toBeInTheDocument()
  })

  it("shows error state when error", () => {
    mockError = "Something went wrong"
    render(<PortalEditor portalId="portal-1" />)
    expect(screen.getByTestId("editor-error")).toBeInTheDocument()
    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
  })

  // ── Unit: Page tabs ──

  it("renders page tabs", () => {
    render(<PortalEditor portalId="portal-1" />)
    expect(screen.getByTestId("page-tab-main")).toBeInTheDocument()
    expect(screen.getByTestId("page-tab-travel")).toBeInTheDocument()
    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Travel")).toBeInTheDocument()
  })

  it("first page is selected by default", () => {
    render(<PortalEditor portalId="portal-1" />)
    // Should show sections for page-1
    expect(screen.getByTestId("section-hero-0")).toBeInTheDocument()
    expect(screen.getByTestId("section-welcome-1")).toBeInTheDocument()
  })

  it("switching tabs shows sections for that page", async () => {
    const user = userEvent.setup()
    render(<PortalEditor portalId="portal-1" />)

    // Click Travel tab
    await user.click(screen.getByTestId("page-tab-travel"))

    // Page 2 has no sections — show empty state
    expect(screen.getByTestId("empty-sections")).toBeInTheDocument()
  })

  // ── Unit: Section display ──

  it("renders section headers with labels and icons", () => {
    render(<PortalEditor portalId="portal-1" />)
    expect(screen.getByText("Hero Banner")).toBeInTheDocument()
    expect(screen.getByText("Welcome Message")).toBeInTheDocument()
  })

  it("renders section editor placeholder when no renderSectionEditor provided", () => {
    render(<PortalEditor portalId="portal-1" />)
    expect(screen.getByText("Hero Banner editor")).toBeInTheDocument()
    expect(screen.getByText("Welcome Message editor")).toBeInTheDocument()
  })

  it("calls renderSectionEditor when provided", () => {
    const mockRenderer = vi.fn().mockReturnValue(<div>Custom Editor</div>)
    render(
      <PortalEditor portalId="portal-1" renderSectionEditor={mockRenderer} />
    )
    expect(mockRenderer).toHaveBeenCalledTimes(2) // 2 sections on page-1
    expect(screen.getAllByText("Custom Editor")).toHaveLength(2)
  })

  // ── Interaction: Delete section ──

  it("calls deleteSectionImmediate when delete clicked", async () => {
    const user = userEvent.setup()
    render(<PortalEditor portalId="portal-1" />)

    await user.click(screen.getByTestId("delete-section-0"))
    expect(mockDeleteSectionImmediate).toHaveBeenCalledWith("s1")
  })

  // ── Interaction: Move section ──

  it("calls reorderSections when move up clicked", async () => {
    const user = userEvent.setup()
    render(<PortalEditor portalId="portal-1" />)

    // Click move up on second section (index 1)
    const moveUpButtons = screen.getAllByLabelText("Move up")
    await user.click(moveUpButtons[1]) // second section's move up

    expect(mockReorderSections).toHaveBeenCalledWith("page-1", ["s2", "s1"])
  })

  it("move up is disabled on first section", () => {
    render(<PortalEditor portalId="portal-1" />)
    const moveUpButtons = screen.getAllByLabelText("Move up")
    expect(moveUpButtons[0]).toBeDisabled()
  })

  it("move down is disabled on last section", () => {
    render(<PortalEditor portalId="portal-1" />)
    const moveDownButtons = screen.getAllByLabelText("Move down")
    expect(moveDownButtons[moveDownButtons.length - 1]).toBeDisabled()
  })

  // ── Interaction: Add section ──

  it("shows add section picker when add button clicked", async () => {
    const user = userEvent.setup()
    render(<PortalEditor portalId="portal-1" />)

    await user.click(screen.getByTestId("add-section-button"))
    expect(screen.getByTestId("add-section-picker")).toBeInTheDocument()
  })

  it("add section picker shows grouped section types", async () => {
    const user = userEvent.setup()
    render(<PortalEditor portalId="portal-1" />)

    await user.click(screen.getByTestId("add-section-button"))

    // Picker should have section type buttons
    expect(screen.getByTestId("add-section-hero")).toBeInTheDocument()
    expect(screen.getByTestId("add-section-map")).toBeInTheDocument()
    expect(screen.getByTestId("add-section-rsvp_form")).toBeInTheDocument()
    expect(screen.getByTestId("add-section-faq")).toBeInTheDocument()
  })

  it("clicking a section type in picker calls addSection", async () => {
    const user = userEvent.setup()
    render(<PortalEditor portalId="portal-1" />)

    await user.click(screen.getByTestId("add-section-button"))
    await user.click(screen.getByTestId("add-section-faq"))

    expect(mockAddSection).toHaveBeenCalledWith("page-1", "faq")
  })

  it("closes picker when backdrop clicked", async () => {
    const user = userEvent.setup()
    render(<PortalEditor portalId="portal-1" />)

    await user.click(screen.getByTestId("add-section-button"))
    expect(screen.getByTestId("add-section-picker")).toBeInTheDocument()

    await user.click(screen.getByTestId("add-picker-backdrop"))
    // AnimatePresence is mocked, so it immediately removes
    expect(screen.queryByTestId("add-section-picker")).not.toBeInTheDocument()
  })

  // ── Interaction: Preview button ──

  it("shows preview button when onPreview is provided", () => {
    const mockPreview = vi.fn()
    render(<PortalEditor portalId="portal-1" onPreview={mockPreview} />)
    expect(screen.getByTestId("preview-button")).toBeInTheDocument()
  })

  it("calls onPreview when preview button clicked", async () => {
    const user = userEvent.setup()
    const mockPreview = vi.fn()
    render(<PortalEditor portalId="portal-1" onPreview={mockPreview} />)

    await user.click(screen.getByTestId("preview-button"))
    expect(mockPreview).toHaveBeenCalledTimes(1)
  })

  it("does not show preview button when onPreview is not provided", () => {
    render(<PortalEditor portalId="portal-1" />)
    expect(screen.queryByTestId("preview-button")).not.toBeInTheDocument()
  })

  // ── Interaction: Content change ──

  it("updateSectionContent is called when renderSectionEditor triggers change", async () => {
    const TestRenderer = (
      _section: unknown,
      onContentChange: (content: Record<string, unknown>) => void
    ) => (
      <button onClick={() => onContentChange({ heading: "Updated" })}>
        Update Content
      </button>
    )

    const user = userEvent.setup()
    render(
      <PortalEditor
        portalId="portal-1"
        renderSectionEditor={TestRenderer}
      />
    )

    // Click the first "Update Content" button
    const buttons = screen.getAllByText("Update Content")
    await user.click(buttons[0])

    expect(mockUpdateSectionContent).toHaveBeenCalledWith("s1", { heading: "Updated" })
  })

  // ── Unit: Empty page ──

  it("shows empty state for page with no sections", async () => {
    const user = userEvent.setup()
    render(<PortalEditor portalId="portal-1" />)

    await user.click(screen.getByTestId("page-tab-travel"))
    expect(screen.getByTestId("empty-sections")).toBeInTheDocument()
    expect(screen.getByTestId("add-first-section")).toBeInTheDocument()
  })

  it("add first section button opens picker", async () => {
    const user = userEvent.setup()
    render(<PortalEditor portalId="portal-1" />)

    await user.click(screen.getByTestId("page-tab-travel"))
    await user.click(screen.getByTestId("add-first-section"))

    expect(screen.getByTestId("add-section-picker")).toBeInTheDocument()
  })
})

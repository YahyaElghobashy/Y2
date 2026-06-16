import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ──
const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useParams: () => ({ portalId: "portal-1" }),
  useRouter: () => ({ push: mockPush }),
}))

const MOCK_PORTAL = {
  id: "portal-1",
  slug: "our-wedding-ab12",
  title: "Our Wedding",
  event_type: "wedding",
  is_published: true,
}

vi.mock("@/lib/hooks/use-event-portal", () => ({
  useEventPortal: () => ({ portals: [MOCK_PORTAL] }),
}))

const MOCK_PAGES = [
  { id: "page-1", portal_id: "portal-1", slug: "main", title: "Home", icon: "🏠", position: 0, is_visible: true, created_at: "", updated_at: "" },
]
const MOCK_SECTIONS = {
  "page-1": [
    { id: "s1", page_id: "page-1", section_type: "hero", content: { heading: "Hi" }, position: 0, is_visible: true, created_at: "", updated_at: "" },
  ],
}

vi.mock("@/lib/hooks/use-portal-pages", () => ({
  usePortalPages: () => ({
    pages: MOCK_PAGES,
    sections: MOCK_SECTIONS,
    isLoading: false,
    error: null,
    createPage: vi.fn(),
    updatePage: vi.fn(),
    deletePage: vi.fn(),
    reorderPages: vi.fn(),
    addSection: vi.fn(),
    updateSectionContent: vi.fn(),
    deleteSectionImmediate: vi.fn(),
    reorderSections: vi.fn(),
    refreshPages: vi.fn(),
  }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import PortalEditPage from "@/app/(main)/us/events/[portalId]/edit/page"

describe("Portal edit route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the PortalEditor for the portal", () => {
    render(<PortalEditPage />)
    expect(screen.getByTestId("portal-editor")).toBeInTheDocument()
  })

  it("shows the portal title in the header", () => {
    render(<PortalEditPage />)
    expect(screen.getByText("Our Wedding")).toBeInTheDocument()
  })

  it("wires section editors from the real registry (renders HeroEditor)", () => {
    render(<PortalEditPage />)
    // renderSectionEditor resolves the hero section to the real HeroEditor,
    // so its fields render instead of the placeholder.
    expect(screen.getByTestId("hero-editor")).toBeInTheDocument()
    expect(screen.getByTestId("hero-heading")).toBeInTheDocument()
    expect(screen.queryByText("Hero Banner editor")).not.toBeInTheDocument()
  })

  it("shows a Preview button (portal has a slug) and opens the public URL", async () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null)
    const user = userEvent.setup()
    render(<PortalEditPage />)

    const previewBtn = screen.getByTestId("preview-button")
    expect(previewBtn).toBeInTheDocument()
    await user.click(previewBtn)
    expect(openSpy).toHaveBeenCalledWith("/e/our-wedding-ab12", "_blank", "noopener,noreferrer")
    openSpy.mockRestore()
  })

  it("Back button routes to the portal dashboard", async () => {
    const user = userEvent.setup()
    render(<PortalEditPage />)

    await user.click(screen.getByTestId("edit-back"))
    expect(mockPush).toHaveBeenCalledWith("/us/events/portal-1")
  })
})

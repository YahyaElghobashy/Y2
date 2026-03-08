import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// ── Mocks (must be before imports that use them) ──

const mockRefresh = vi.fn()
const mockPush = vi.fn()
const mockPathname = vi.fn(() => "/e/test-portal/home")

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ refresh: mockRefresh, push: mockPush }),
  notFound: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: {
      children?: React.ReactNode
      [key: string]: unknown
    }) => {
      const safe: Record<string, unknown> = {}
      Object.keys(props).forEach((k) => {
        if (
          typeof props[k] !== "function" &&
          typeof props[k] !== "object" &&
          !k.startsWith("while") &&
          !k.startsWith("initial") &&
          !k.startsWith("animate") &&
          !k.startsWith("exit") &&
          !k.startsWith("viewport") &&
          !k.startsWith("transition") &&
          k !== "layoutId"
        ) {
          safe[k] = props[k]
        }
        // Keep style and data-testid
        if (k === "style" || k.startsWith("data-")) {
          safe[k] = props[k]
        }
      })
      return <div {...safe}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockVerifyPassword = vi.fn()
vi.mock("@/lib/actions/portal-auth", () => ({
  verifyPortalPassword: (...args: unknown[]) => mockVerifyPassword(...args),
}))

// ── Imports (after mocks) ──

import { PortalDataProvider, usePortalData } from "@/components/events/public/PortalDataProvider"
import { PortalNavigation } from "@/components/events/public/PortalNavigation"
import { PasswordGate } from "@/components/events/public/PasswordGate"
import { SectionRenderer } from "@/components/events/public/SectionRenderer"

// ── Test Data ──

const mockPortal = {
  id: "portal-1",
  creator_id: "user-1",
  slug: "test-portal",
  title: "Test Wedding",
  subtitle: "Join us for our celebration",
  event_type: "wedding" as const,
  event_date: "2026-06-15",
  event_end_date: null,
  location_name: "Grand Hall",
  location_lat: null,
  location_lng: null,
  theme_config: {
    preset: "elegant_gold",
    colors: {
      primary: "#C4956A",
      secondary: "#D4A574",
      background: "#FBF8F4",
      surface: "#FFFFFF",
      text: "#2C2825",
      textMuted: "#8C8279",
      border: "#E5D9CB",
    },
    fonts: { heading: "Playfair Display", body: "DM Sans" },
    borderRadius: "lg" as const,
    spacing: "spacious" as const,
  },
  cover_image_url: null,
  is_published: true,
  password_hash: null,
  template_id: null,
  meta_title: null,
  meta_description: null,
  og_image_url: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const mockPages = [
  {
    id: "page-1",
    portal_id: "portal-1",
    slug: "home",
    title: "Home",
    icon: "🏠",
    position: 0,
    is_visible: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "page-2",
    portal_id: "portal-1",
    slug: "details",
    title: "Details",
    icon: "📋",
    position: 1,
    is_visible: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
]

const mockSections = [
  {
    id: "section-1",
    page_id: "page-1",
    section_type: "hero" as const,
    content: { heading: "Welcome", subheading: "To our wedding" },
    position: 0,
    is_visible: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "section-2",
    page_id: "page-1",
    section_type: "text" as const,
    content: { heading: "About Us", body: "Our story..." },
    position: 1,
    is_visible: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "section-3",
    page_id: "page-1",
    section_type: "divider" as const,
    content: { style: "line", spacing: "md" },
    position: 2,
    is_visible: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
]

// ── PortalDataProvider Tests ──

describe("PortalDataProvider", () => {
  it("provides portal and pages via context", () => {
    function TestChild() {
      const { portal, pages } = usePortalData()
      return (
        <div>
          <span data-testid="title">{portal.title}</span>
          <span data-testid="pages">{pages.length}</span>
        </div>
      )
    }

    render(
      <PortalDataProvider portal={mockPortal} pages={mockPages}>
        <TestChild />
      </PortalDataProvider>
    )

    expect(screen.getByTestId("title")).toHaveTextContent("Test Wedding")
    expect(screen.getByTestId("pages")).toHaveTextContent("2")
  })

  it("throws when usePortalData is used outside provider", () => {
    function BadChild() {
      usePortalData()
      return null
    }

    // Suppress console.error for expected error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<BadChild />)).toThrow(
      "usePortalData must be used within PortalDataProvider"
    )
    spy.mockRestore()
  })
})

// ── PortalNavigation Tests ──

describe("PortalNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname.mockReturnValue("/e/test-portal/home")
  })

  it("renders navigation tabs for multiple pages", () => {
    render(
      <PortalNavigation
        portalSlug="test-portal"
        portalTitle="Test Wedding"
        pages={mockPages}
      />
    )

    expect(screen.getByTestId("portal-navigation")).toBeInTheDocument()
    expect(screen.getByTestId("nav-page-home")).toBeInTheDocument()
    expect(screen.getByTestId("nav-page-details")).toBeInTheDocument()
  })

  it("does not render when only one page", () => {
    const { container } = render(
      <PortalNavigation
        portalSlug="test-portal"
        portalTitle="Test Wedding"
        pages={[mockPages[0]]}
      />
    )

    expect(container.innerHTML).toBe("")
  })

  it("highlights the active page tab", () => {
    render(
      <PortalNavigation
        portalSlug="test-portal"
        portalTitle="Test Wedding"
        pages={mockPages}
      />
    )

    const homeLink = screen.getByTestId("nav-page-home")
    const detailsLink = screen.getByTestId("nav-page-details")

    expect(homeLink.style.color).toContain("var(--portal-primary)")
    expect(detailsLink.style.color).toContain("var(--portal-text-muted)")
  })

  it("links use correct href format", () => {
    render(
      <PortalNavigation
        portalSlug="test-portal"
        portalTitle="Test Wedding"
        pages={mockPages}
      />
    )

    expect(screen.getByTestId("nav-page-home")).toHaveAttribute(
      "href",
      "/e/test-portal/home"
    )
    expect(screen.getByTestId("nav-page-details")).toHaveAttribute(
      "href",
      "/e/test-portal/details"
    )
  })

  it("renders page icons when present", () => {
    render(
      <PortalNavigation
        portalSlug="test-portal"
        portalTitle="Test Wedding"
        pages={mockPages}
      />
    )

    expect(screen.getByText("🏠")).toBeInTheDocument()
    expect(screen.getByText("📋")).toBeInTheDocument()
  })

  it("shows portal title on mobile", () => {
    render(
      <PortalNavigation
        portalSlug="test-portal"
        portalTitle="Test Wedding"
        pages={mockPages}
      />
    )

    expect(screen.getByText("Test Wedding")).toBeInTheDocument()
  })

  it("handles pages without icons", () => {
    const pagesNoIcons = mockPages.map((p) => ({ ...p, icon: null }))

    render(
      <PortalNavigation
        portalSlug="test-portal"
        portalTitle="Test Wedding"
        pages={pagesNoIcons}
      />
    )

    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Details")).toBeInTheDocument()
  })
})

// ── PasswordGate Tests ──

describe("PasswordGate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders password form", () => {
    render(<PasswordGate portalId="portal-1" portalTitle="Test Wedding" />)

    expect(screen.getByTestId("password-gate")).toBeInTheDocument()
    expect(screen.getByTestId("password-input")).toBeInTheDocument()
    expect(screen.getByTestId("password-submit")).toBeInTheDocument()
    expect(screen.getByText("Test Wedding")).toBeInTheDocument()
    expect(screen.getByText("This portal is password protected")).toBeInTheDocument()
  })

  it("calls verifyPortalPassword on form submit", async () => {
    const user = userEvent.setup()
    mockVerifyPassword.mockResolvedValue({ success: true })

    render(<PasswordGate portalId="portal-1" portalTitle="Test Wedding" />)

    await user.type(screen.getByTestId("password-input"), "secret123")
    await user.click(screen.getByTestId("password-submit"))

    await waitFor(() => {
      expect(mockVerifyPassword).toHaveBeenCalledWith("portal-1", "secret123")
    })
  })

  it("refreshes page on successful password entry", async () => {
    const user = userEvent.setup()
    mockVerifyPassword.mockResolvedValue({ success: true })

    render(<PasswordGate portalId="portal-1" portalTitle="Test Wedding" />)

    await user.type(screen.getByTestId("password-input"), "secret123")
    await user.click(screen.getByTestId("password-submit"))

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it("shows error on incorrect password", async () => {
    const user = userEvent.setup()
    mockVerifyPassword.mockResolvedValue({ success: false })

    render(<PasswordGate portalId="portal-1" portalTitle="Test Wedding" />)

    await user.type(screen.getByTestId("password-input"), "wrong")
    await user.click(screen.getByTestId("password-submit"))

    await waitFor(() => {
      expect(screen.getByTestId("password-error")).toHaveTextContent("Incorrect password")
    })
  })

  it("clears password input on error", async () => {
    const user = userEvent.setup()
    mockVerifyPassword.mockResolvedValue({ success: false })

    render(<PasswordGate portalId="portal-1" portalTitle="Test Wedding" />)

    const input = screen.getByTestId("password-input") as HTMLInputElement
    await user.type(input, "wrong")
    await user.click(screen.getByTestId("password-submit"))

    await waitFor(() => {
      expect(input.value).toBe("")
    })
  })

  it("disables submit when password is empty", () => {
    render(<PasswordGate portalId="portal-1" portalTitle="Test Wedding" />)

    expect(screen.getByTestId("password-submit")).toBeDisabled()
  })
})

// ── SectionRenderer Tests ──

describe("SectionRenderer", () => {
  it("renders visible sections only", () => {
    render(<SectionRenderer sections={mockSections} />)

    expect(screen.getByTestId("section-stack")).toBeInTheDocument()
    expect(screen.getByTestId("hero-section")).toBeInTheDocument()
    expect(screen.getByTestId("text-section")).toBeInTheDocument()
    // divider is is_visible: false, should not render
    expect(screen.queryByTestId("divider-section")).not.toBeInTheDocument()
  })

  it("renders empty state when no visible sections", () => {
    const hiddenSections = mockSections.map((s) => ({ ...s, is_visible: false }))

    render(<SectionRenderer sections={hiddenSections} />)

    expect(screen.getByTestId("empty-sections")).toBeInTheDocument()
    expect(screen.getByText("No content yet")).toBeInTheDocument()
  })

  it("renders empty state for empty array", () => {
    render(<SectionRenderer sections={[]} />)

    expect(screen.getByTestId("empty-sections")).toBeInTheDocument()
  })

  it("renders real section components for each type", () => {
    render(<SectionRenderer sections={[mockSections[0]]} />)

    const heroSection = screen.getByTestId("hero-section")
    expect(heroSection).toBeInTheDocument()
    expect(screen.getByText("Welcome")).toBeInTheDocument()
  })

  it("maintains section order by position", () => {
    render(<SectionRenderer sections={mockSections} />)

    const stack = screen.getByTestId("section-stack")
    // Real components use {type}-section testids
    const heroSection = stack.querySelector("[data-testid='hero-section']")
    const textSection = stack.querySelector("[data-testid='text-section']")

    expect(heroSection).toBeInTheDocument()
    expect(textSection).toBeInTheDocument()
    // hero (position 0) comes before text (position 1)
    const children = Array.from(stack.children)
    const heroIdx = children.findIndex((el) => el.querySelector("[data-testid='hero-section']"))
    const textIdx = children.findIndex((el) => el.querySelector("[data-testid='text-section']"))
    expect(heroIdx).toBeLessThan(textIdx)
  })

  it("applies portal theme gap variable to section stack", () => {
    render(<SectionRenderer sections={mockSections} />)

    const stack = screen.getByTestId("section-stack")
    expect(stack.style.gap).toBe("var(--portal-section-gap)")
  })

  it("renders gift_registry section type correctly", () => {
    const customSections = [
      {
        ...mockSections[0],
        section_type: "gift_registry" as const,
        content: { heading: "Our Registry", show_external_registries: false },
      },
    ]

    render(<SectionRenderer sections={customSections} />)

    expect(screen.getByTestId("gift-registry-section")).toBeInTheDocument()
  })
})

// ── NotFound Page Tests ──

describe("PortalNotFound", () => {
  it("renders not found message with link to home", async () => {
    const PortalNotFound = (await import("@/app/e/[slug]/not-found")).default

    render(<PortalNotFound />)

    expect(screen.getByText("Portal Not Found")).toBeInTheDocument()
    expect(
      screen.getByText(/doesn't exist or hasn't been published/)
    ).toBeInTheDocument()
    expect(screen.getByText("Go Home")).toHaveAttribute("href", "/")
  })
})

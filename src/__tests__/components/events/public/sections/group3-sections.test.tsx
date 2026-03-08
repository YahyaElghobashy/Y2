import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// ── Mocks ──

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [k: string]: unknown }) => {
      const safe: Record<string, unknown> = {}
      Object.keys(props).forEach((k) => {
        if (k === "style" || k === "className" || k.startsWith("data-")) safe[k] = props[k]
      })
      return <div {...safe}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/e/test-portal/home",
  useRouter: () => ({ refresh: vi.fn() }),
}))

const mockInsert = vi.fn()
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}))

vi.mock("@/components/events/public/PortalDataProvider", () => ({
  usePortalData: () => ({
    portal: { id: "portal-1", title: "Test Wedding", slug: "test-portal" },
    pages: [],
  }),
}))

// ── Imports ──

import { RSVPFormSection } from "@/components/events/public/sections/RSVPFormSection"
import { GiftRegistrySection } from "@/components/events/public/sections/GiftRegistrySection"
import { CTASection } from "@/components/events/public/sections/CTASection"
import { FAQSection } from "@/components/events/public/sections/FAQSection"
import { TextSection } from "@/components/events/public/sections/TextSection"
import { QuoteSection } from "@/components/events/public/sections/QuoteSection"
import { DividerSection } from "@/components/events/public/sections/DividerSection"
import { CustomHTMLSection } from "@/components/events/public/sections/CustomHTMLSection"

function makeSection(type: string, content: Record<string, unknown> = {}) {
  return {
    id: `section-${type}`,
    page_id: "page-1",
    section_type: type as "rsvp_form",
    content,
    position: 0,
    is_visible: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  }
}

// ── RSVPFormSection Tests ──

describe("RSVPFormSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
  })

  it("renders RSVP form with core fields", () => {
    render(
      <RSVPFormSection
        section={makeSection("rsvp_form", {
          heading: "RSVP",
          description: "Please let us know",
        })}
      />
    )
    expect(screen.getByTestId("rsvp-section")).toBeInTheDocument()
    expect(screen.getByText("RSVP")).toBeInTheDocument()
    expect(screen.getByTestId("rsvp-name")).toBeInTheDocument()
    expect(screen.getByTestId("rsvp-email")).toBeInTheDocument()
    expect(screen.getByTestId("rsvp-submit")).toBeInTheDocument()
  })

  it("renders attendance toggle buttons", () => {
    render(<RSVPFormSection section={makeSection("rsvp_form", {})} />)
    expect(screen.getByTestId("rsvp-attending-yes")).toBeInTheDocument()
    expect(screen.getByTestId("rsvp-attending-no")).toBeInTheDocument()
    expect(screen.getByTestId("rsvp-attending-maybe")).toBeInTheDocument()
  })

  it("shows conditional fields based on config", () => {
    render(
      <RSVPFormSection
        section={makeSection("rsvp_form", {
          show_plus_ones: true,
          max_plus_ones: 3,
          show_meal_preference: true,
          meal_options: ["Chicken", "Fish"],
          show_dietary_notes: true,
          show_hotel_choice: true,
          hotel_options: ["Grand Hotel"],
          show_message: true,
        })}
      />
    )
    expect(screen.getByTestId("rsvp-plus-ones")).toBeInTheDocument()
    expect(screen.getByTestId("rsvp-meal")).toBeInTheDocument()
    expect(screen.getByTestId("rsvp-dietary")).toBeInTheDocument()
    expect(screen.getByTestId("rsvp-hotel")).toBeInTheDocument()
    expect(screen.getByTestId("rsvp-message")).toBeInTheDocument()
  })

  it("hides optional fields when not configured", () => {
    render(
      <RSVPFormSection
        section={makeSection("rsvp_form", {
          show_plus_ones: false,
          show_meal_preference: false,
          show_dietary_notes: false,
          show_hotel_choice: false,
          show_message: false,
        })}
      />
    )
    expect(screen.queryByTestId("rsvp-plus-ones")).not.toBeInTheDocument()
    expect(screen.queryByTestId("rsvp-meal")).not.toBeInTheDocument()
    expect(screen.queryByTestId("rsvp-dietary")).not.toBeInTheDocument()
    expect(screen.queryByTestId("rsvp-hotel")).not.toBeInTheDocument()
    expect(screen.queryByTestId("rsvp-message")).not.toBeInTheDocument()
  })

  it("submits RSVP to Supabase", async () => {
    const user = userEvent.setup()
    render(<RSVPFormSection section={makeSection("rsvp_form", {})} />)

    await user.type(screen.getByTestId("rsvp-name"), "John Doe")
    await user.type(screen.getByTestId("rsvp-email"), "john@test.com")
    await user.click(screen.getByTestId("rsvp-submit"))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          portal_id: "portal-1",
          name: "John Doe",
          email: "john@test.com",
          attending: "yes",
        })
      )
    })
  })

  it("shows success state after submission", async () => {
    const user = userEvent.setup()
    render(<RSVPFormSection section={makeSection("rsvp_form", {})} />)

    await user.type(screen.getByTestId("rsvp-name"), "Jane")
    await user.click(screen.getByTestId("rsvp-submit"))

    await waitFor(() => {
      expect(screen.getByTestId("rsvp-success")).toBeInTheDocument()
    })
  })

  it("shows error on submission failure", async () => {
    mockInsert.mockResolvedValue({ error: { message: "DB error" } })
    const user = userEvent.setup()
    render(<RSVPFormSection section={makeSection("rsvp_form", {})} />)

    await user.type(screen.getByTestId("rsvp-name"), "Jane")
    await user.click(screen.getByTestId("rsvp-submit"))

    await waitFor(() => {
      expect(screen.getByTestId("rsvp-error")).toBeInTheDocument()
    })
  })

  it("shows closed message when deadline has passed", () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    render(
      <RSVPFormSection
        section={makeSection("rsvp_form", { deadline: pastDate })}
      />
    )
    expect(screen.getByTestId("rsvp-closed")).toBeInTheDocument()
  })

  it("shows custom confirmation message", async () => {
    const user = userEvent.setup()
    render(
      <RSVPFormSection
        section={makeSection("rsvp_form", {
          confirmation_message: "See you there!",
        })}
      />
    )

    await user.type(screen.getByTestId("rsvp-name"), "Jane")
    await user.click(screen.getByTestId("rsvp-submit"))

    await waitFor(() => {
      expect(screen.getByText("See you there!")).toBeInTheDocument()
    })
  })
})

// ── GiftRegistrySection Tests ──

describe("GiftRegistrySection", () => {
  it("renders external registries", () => {
    render(
      <GiftRegistrySection
        section={makeSection("gift_registry", {
          heading: "Gift Registry",
          description: "Your presence is our gift",
          show_external_registries: true,
          external_registries: [
            { name: "Amazon", url: "https://amazon.com/registry" },
          ],
        })}
      />
    )
    expect(screen.getByTestId("gift-registry-section")).toBeInTheDocument()
    expect(screen.getByText("Gift Registry")).toBeInTheDocument()
    const link = screen.getByTestId("registry-link-0")
    expect(link).toHaveAttribute("href", "https://amazon.com/registry")
  })

  it("shows placeholder when external registries disabled", () => {
    render(
      <GiftRegistrySection
        section={makeSection("gift_registry", {
          show_external_registries: false,
        })}
      />
    )
    expect(screen.getByText("Gift registry details coming soon")).toBeInTheDocument()
  })
})

// ── CTASection Tests ──

describe("CTASection", () => {
  it("renders heading and CTA button", () => {
    render(
      <CTASection
        section={makeSection("cta", {
          heading: "Don't Miss Out",
          description: "Register today",
          button_text: "Register",
          button_url: "https://rsvp.com",
          button_style: "primary",
        })}
      />
    )
    expect(screen.getByTestId("cta-section")).toBeInTheDocument()
    expect(screen.getByText("Don't Miss Out")).toBeInTheDocument()
    const btn = screen.getByTestId("cta-button")
    expect(btn).toHaveTextContent("Register")
    expect(btn).toHaveAttribute("href", "https://rsvp.com")
  })

  it("renders outline button style", () => {
    render(
      <CTASection
        section={makeSection("cta", {
          heading: "Join",
          button_text: "Click",
          button_url: "#",
          button_style: "outline",
        })}
      />
    )
    const btn = screen.getByTestId("cta-button")
    expect(btn.style.border).toContain("var(--portal-primary)")
  })
})

// ── FAQSection Tests ──

describe("FAQSection", () => {
  it("renders FAQ items in accordion layout", () => {
    render(
      <FAQSection
        section={makeSection("faq", {
          heading: "FAQ",
          items: [
            { question: "When?", answer: "June 15" },
            { question: "Where?", answer: "Grand Hall" },
          ],
          layout: "accordion",
        })}
      />
    )
    expect(screen.getByTestId("faq-section")).toBeInTheDocument()
    expect(screen.getByText("FAQ")).toBeInTheDocument()
    expect(screen.getByTestId("faq-item-0")).toBeInTheDocument()
  })

  it("shows answer on accordion click", async () => {
    const user = userEvent.setup()
    render(
      <FAQSection
        section={makeSection("faq", {
          items: [{ question: "When?", answer: "June 15, 2026" }],
          layout: "accordion",
        })}
      />
    )
    expect(screen.queryByText("June 15, 2026")).not.toBeInTheDocument()

    await user.click(screen.getByText("When?"))
    await waitFor(() => {
      expect(screen.getByText("June 15, 2026")).toBeInTheDocument()
    })
  })

  it("renders list layout with visible answers", () => {
    render(
      <FAQSection
        section={makeSection("faq", {
          items: [{ question: "When?", answer: "June 15" }],
          layout: "list",
        })}
      />
    )
    expect(screen.getByText("June 15")).toBeInTheDocument()
  })

  it("returns null when no items", () => {
    const { container } = render(
      <FAQSection section={makeSection("faq", { items: [] })} />
    )
    expect(container.innerHTML).toBe("")
  })
})

// ── TextSection Tests ──

describe("TextSection", () => {
  it("renders heading and body with alignment", () => {
    render(
      <TextSection
        section={makeSection("text", {
          heading: "About Us",
          body: "We met in college",
          alignment: "center",
        })}
      />
    )
    expect(screen.getByTestId("text-section")).toBeInTheDocument()
    expect(screen.getByText("About Us")).toBeInTheDocument()
    expect(screen.getByText("We met in college")).toBeInTheDocument()
    expect(screen.getByTestId("text-section").style.textAlign).toBe("center")
  })
})

// ── QuoteSection Tests ──

describe("QuoteSection", () => {
  it("renders quote text and attribution", () => {
    render(
      <QuoteSection
        section={makeSection("quote", {
          text: "Love is patient",
          attribution: "1 Corinthians",
          style: "simple",
        })}
      />
    )
    expect(screen.getByTestId("quote-section")).toBeInTheDocument()
    expect(screen.getByText(/"Love is patient"/)).toBeInTheDocument()
    expect(screen.getByText("1 Corinthians")).toBeInTheDocument()
  })

  it("renders decorative style with large quote mark", () => {
    render(
      <QuoteSection
        section={makeSection("quote", { text: "Love", style: "decorative" })}
      />
    )
    expect(screen.getByText("\u201C")).toBeInTheDocument()
  })
})

// ── DividerSection Tests ──

describe("DividerSection", () => {
  it("renders line divider", () => {
    render(
      <DividerSection section={makeSection("divider", { style: "line", spacing: "md" })} />
    )
    expect(screen.getByTestId("divider-section")).toBeInTheDocument()
    expect(screen.getByTestId("divider-section").querySelector("hr")).toBeInTheDocument()
  })

  it("renders dots divider", () => {
    render(
      <DividerSection section={makeSection("divider", { style: "dots" })} />
    )
    const dots = screen.getByTestId("divider-section").querySelectorAll("span.block")
    expect(dots.length).toBe(3)
  })

  it("renders space-only divider", () => {
    render(
      <DividerSection section={makeSection("divider", { style: "space", spacing: "lg" })} />
    )
    const div = screen.getByTestId("divider-section")
    expect(div.style.height).toBe("3.5rem")
    expect(div.children.length).toBe(0)
  })

  it("renders ornament divider", () => {
    render(
      <DividerSection section={makeSection("divider", { style: "ornament" })} />
    )
    expect(screen.getByText("✦")).toBeInTheDocument()
  })
})

// ── CustomHTMLSection Tests ──

describe("CustomHTMLSection", () => {
  it("renders iframe for sandboxed HTML", () => {
    render(
      <CustomHTMLSection
        section={makeSection("custom_html", { html: "<p>Hello</p>", sandbox: true })}
      />
    )
    expect(screen.getByTestId("custom-html-section")).toBeInTheDocument()
    const iframe = screen.getByTestId("custom-html-section").querySelector("iframe")
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute("sandbox", "allow-scripts")
  })

  it("renders HTML directly when not sandboxed", () => {
    render(
      <CustomHTMLSection
        section={makeSection("custom_html", { html: "<p>Direct</p>", sandbox: false })}
      />
    )
    expect(screen.getByText("Direct")).toBeInTheDocument()
  })

  it("returns null when no HTML", () => {
    const { container } = render(
      <CustomHTMLSection section={makeSection("custom_html", { html: "" })} />
    )
    expect(container.innerHTML).toBe("")
  })
})

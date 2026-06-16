import { describe, it, expect, vi } from "vitest"
import {
  buildTemplatePageRows,
  buildSectionRowsForPage,
  buildSubEventRows,
  seedPortalFromTemplate,
  seedPortalSubEvents,
  type SeedTemplate,
  type WizardSubEvent,
} from "@/lib/portal-seed"
import { getTemplateById } from "@/lib/portal-templates"

const TEMPLATE: SeedTemplate = {
  pages: [
    {
      slug: "main",
      title: "Home",
      icon: "🏠",
      sections: [
        { section_type: "hero", content: { heading: "Hi" } },
        { section_type: "welcome", content: { body: "Welcome" } },
      ],
    },
    {
      slug: "rsvp",
      title: "RSVP",
      icon: "✉️",
      sections: [{ section_type: "rsvp_form", content: { heading: "RSVP" } }],
    },
  ],
}

// Build a supabase mock whose insert behaviour is configurable per table.
function makeClient(opts: {
  pagesResult?: { data: unknown; error: unknown }
  sectionsError?: unknown
  subEventsError?: unknown
}) {
  const pagesInsert = vi.fn()
  const sectionsInsert = vi.fn()
  const subEventsInsert = vi.fn()

  const from = vi.fn((table: string) => {
    if (table === "portal_pages") {
      return {
        insert: (rows: Array<Record<string, unknown>>) => {
          pagesInsert(rows)
          return {
            select: () =>
              Promise.resolve(
                opts.pagesResult ?? {
                  // Echo rows back with synthetic ids so slug→id mapping works.
                  data: rows.map((r, i) => ({ id: `page-${i}`, ...r })),
                  error: null,
                }
              ),
          }
        },
      }
    }
    if (table === "portal_sections") {
      return {
        insert: (rows: Array<Record<string, unknown>>) => {
          sectionsInsert(rows)
          return Promise.resolve({ error: opts.sectionsError ?? null })
        },
      }
    }
    if (table === "portal_sub_events") {
      return {
        insert: (rows: Array<Record<string, unknown>>) => {
          subEventsInsert(rows)
          return Promise.resolve({ error: opts.subEventsError ?? null })
        },
      }
    }
    throw new Error(`unexpected table ${table}`)
  })

  return { client: { from }, pagesInsert, sectionsInsert, subEventsInsert, from }
}

describe("portal-seed builders", () => {
  // ── Unit: buildTemplatePageRows ──
  it("builds page rows with portal_id, position, is_visible", () => {
    const rows = buildTemplatePageRows("portal-1", TEMPLATE)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      portal_id: "portal-1",
      slug: "main",
      title: "Home",
      icon: "🏠",
      position: 0,
      is_visible: true,
    })
    expect(rows[1].position).toBe(1)
  })

  it("defaults missing page icon to null", () => {
    const rows = buildTemplatePageRows("p", {
      pages: [{ slug: "x", title: "X", icon: "", sections: [] }],
    })
    expect(rows[0].icon).toBeNull()
  })

  // ── Unit: buildSectionRowsForPage ──
  it("builds section rows keyed to a page id, preserving content and order", () => {
    const rows = buildSectionRowsForPage("page-9", TEMPLATE.pages[0])
    expect(rows).toEqual([
      { page_id: "page-9", section_type: "hero", content: { heading: "Hi" }, position: 0, is_visible: true },
      { page_id: "page-9", section_type: "welcome", content: { body: "Welcome" }, position: 1, is_visible: true },
    ])
  })

  // ── Unit: buildSubEventRows ──
  it("drops blank-title sub-events and normalises empty date/time to null", () => {
    const subs: WizardSubEvent[] = [
      { title: " Ceremony ", date: "2026-09-15", startTime: "14:00" },
      { title: "", date: "2026-09-16", startTime: "10:00" },
      { title: "Reception", date: "", startTime: "" },
    ]
    const rows = buildSubEventRows("portal-1", subs)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      portal_id: "portal-1",
      title: "Ceremony",
      event_date: "2026-09-15",
      start_time: "14:00",
      position: 0,
    })
    expect(rows[1]).toEqual({
      portal_id: "portal-1",
      title: "Reception",
      event_date: null,
      start_time: null,
      position: 1,
    })
  })

  it("returns empty array when all sub-events are blank", () => {
    expect(buildSubEventRows("p", [{ title: "  ", date: "", startTime: "" }])).toEqual([])
  })
})

describe("seedPortalFromTemplate (integration)", () => {
  it("inserts pages then sections with correct tables and args", async () => {
    const { client, pagesInsert, sectionsInsert, from } = makeClient({})

    const pages = await seedPortalFromTemplate(client, "portal-1", TEMPLATE)

    // pages inserted once with both template pages
    expect(from).toHaveBeenCalledWith("portal_pages")
    expect(pagesInsert).toHaveBeenCalledTimes(1)
    expect(pagesInsert.mock.calls[0][0]).toHaveLength(2)

    // sections inserted once with all 3 sections (2 + 1)
    expect(from).toHaveBeenCalledWith("portal_sections")
    expect(sectionsInsert).toHaveBeenCalledTimes(1)
    const sectionRows = sectionsInsert.mock.calls[0][0]
    expect(sectionRows).toHaveLength(3)

    // sections attach to created page ids (page-0 = main, page-1 = rsvp)
    expect(sectionRows.filter((s: { page_id: string }) => s.page_id === "page-0")).toHaveLength(2)
    expect(sectionRows.filter((s: { page_id: string }) => s.page_id === "page-1")).toHaveLength(1)

    expect(pages).toHaveLength(2)
  })

  it("works end-to-end with a real PORTAL_TEMPLATES entry (wedding)", async () => {
    const wedding = getTemplateById("wedding")!
    const { client, pagesInsert, sectionsInsert } = makeClient({})

    await seedPortalFromTemplate(client, "portal-1", wedding)

    expect(pagesInsert.mock.calls[0][0]).toHaveLength(wedding.pages.length)
    const totalSections = wedding.pages.reduce((n, p) => n + p.sections.length, 0)
    expect(sectionsInsert.mock.calls[0][0]).toHaveLength(totalSections)
  })

  it("throws when page insert errors and never inserts sections", async () => {
    const { client, sectionsInsert } = makeClient({
      pagesResult: { data: null, error: { message: "pages boom" } },
    })

    await expect(seedPortalFromTemplate(client, "portal-1", TEMPLATE)).rejects.toThrow(/pages boom/)
    expect(sectionsInsert).not.toHaveBeenCalled()
  })

  it("throws when section insert errors", async () => {
    const { client } = makeClient({ sectionsError: { message: "sections boom" } })
    await expect(seedPortalFromTemplate(client, "portal-1", TEMPLATE)).rejects.toThrow(/sections boom/)
  })

  it("no-op for a template with zero pages", async () => {
    const { client, pagesInsert } = makeClient({})
    const pages = await seedPortalFromTemplate(client, "portal-1", { pages: [] })
    expect(pages).toEqual([])
    expect(pagesInsert).not.toHaveBeenCalled()
  })
})

describe("seedPortalSubEvents (integration)", () => {
  it("inserts only valid sub-events into portal_sub_events", async () => {
    const { client, subEventsInsert, from } = makeClient({})
    await seedPortalSubEvents(client, "portal-1", [
      { title: "Ceremony", date: "2026-09-15", startTime: "14:00" },
      { title: "", date: "", startTime: "" },
    ])
    expect(from).toHaveBeenCalledWith("portal_sub_events")
    expect(subEventsInsert).toHaveBeenCalledTimes(1)
    expect(subEventsInsert.mock.calls[0][0]).toHaveLength(1)
    expect(subEventsInsert.mock.calls[0][0][0]).toMatchObject({
      portal_id: "portal-1",
      title: "Ceremony",
    })
  })

  it("does not call insert when there are no valid sub-events", async () => {
    const { client, subEventsInsert } = makeClient({})
    await seedPortalSubEvents(client, "portal-1", [])
    expect(subEventsInsert).not.toHaveBeenCalled()
  })

  it("throws on insert error", async () => {
    const { client } = makeClient({ subEventsError: { message: "sub boom" } })
    await expect(
      seedPortalSubEvents(client, "portal-1", [{ title: "X", date: "", startTime: "" }])
    ).rejects.toThrow(/sub boom/)
  })
})

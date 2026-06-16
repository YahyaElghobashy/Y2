// ── Portal Seeding ──
// Turns a chosen PortalTemplate into real portal_pages + portal_sections rows,
// and persists wizard-collected sub-events. Pure row builders are exported
// separately so they can be unit-tested without a Supabase client.

import type {
  PortalPage,
  PortalPageInsert,
  PortalSectionInsert,
  PortalSubEventInsert,
  SectionType,
} from "@/lib/types/portal.types"

// Wizard sub-event shape (collected by PortalCreationWizard)
export type WizardSubEvent = {
  title: string
  date: string
  startTime: string
}

// Minimal template shape the seeders need — a full PortalTemplate satisfies this
// structurally, so we avoid a hard import dependency on portal-templates.
export type SeedTemplatePage = {
  slug: string
  title: string
  icon: string
  sections: Array<{ section_type: SectionType; content: Record<string, unknown> }>
}

export type SeedTemplate = {
  pages: SeedTemplatePage[]
}

// Minimal Supabase surface the seeders rely on. Kept loose so both the real
// browser client and test mocks satisfy it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SeedClient = { from: (table: string) => any }

// ── Pure builders ──

/** Build portal_pages insert rows from a template (position = array order). */
export function buildTemplatePageRows(
  portalId: string,
  template: SeedTemplate
): PortalPageInsert[] {
  return template.pages.map((page, index) => ({
    portal_id: portalId,
    slug: page.slug,
    title: page.title,
    icon: page.icon || null,
    position: index,
    is_visible: true,
  }))
}

/** Build portal_sections insert rows for a single page from its template page. */
export function buildSectionRowsForPage(
  pageId: string,
  templatePage: SeedTemplatePage
): PortalSectionInsert[] {
  return templatePage.sections.map((section, index) => ({
    page_id: pageId,
    section_type: section.section_type,
    content: section.content,
    position: index,
    is_visible: true,
  }))
}

/**
 * Build portal_sub_events insert rows from wizard sub-events.
 * Drops entries with a blank title and normalises empty date/time strings to null
 * (the columns are `date` / `time` and reject empty strings).
 */
export function buildSubEventRows(
  portalId: string,
  subEvents: WizardSubEvent[]
): PortalSubEventInsert[] {
  return subEvents
    .filter((s) => s.title.trim().length > 0)
    .map((s, index) => ({
      portal_id: portalId,
      title: s.title.trim(),
      event_date: s.date || null,
      start_time: s.startTime || null,
      position: index,
    }))
}

// ── Seeders (perform inserts) ──

/**
 * Seed a portal's pages and sections from the chosen template.
 * Inserts all pages first (one batch), then inserts every section keyed to its
 * newly-created page id. Throws on the first insert error so callers can surface it.
 */
export async function seedPortalFromTemplate(
  supabase: SeedClient,
  portalId: string,
  template: SeedTemplate
): Promise<PortalPage[]> {
  const pageRows = buildTemplatePageRows(portalId, template)
  if (pageRows.length === 0) return []

  const { data: createdPages, error: pagesError } = await supabase
    .from("portal_pages")
    .insert(pageRows)
    .select()

  if (pagesError) {
    throw new Error(`Failed to seed portal pages: ${pagesError.message}`)
  }

  const pages = (createdPages as PortalPage[]) ?? []

  // Map slug → created page id so sections attach to the right page.
  const idBySlug = new Map<string, string>()
  for (const page of pages) idBySlug.set(page.slug, page.id)

  const sectionRows: PortalSectionInsert[] = []
  for (const templatePage of template.pages) {
    const pageId = idBySlug.get(templatePage.slug)
    if (!pageId) continue
    sectionRows.push(...buildSectionRowsForPage(pageId, templatePage))
  }

  if (sectionRows.length > 0) {
    const { error: sectionsError } = await supabase
      .from("portal_sections")
      .insert(sectionRows)

    if (sectionsError) {
      throw new Error(`Failed to seed portal sections: ${sectionsError.message}`)
    }
  }

  return pages
}

/**
 * Persist wizard sub-events for a portal. No-op when there are no valid entries.
 * Throws on insert error.
 */
export async function seedPortalSubEvents(
  supabase: SeedClient,
  portalId: string,
  subEvents: WizardSubEvent[]
): Promise<void> {
  const rows = buildSubEventRows(portalId, subEvents)
  if (rows.length === 0) return

  const { error } = await supabase.from("portal_sub_events").insert(rows)
  if (error) {
    throw new Error(`Failed to seed sub-events: ${error.message}`)
  }
}

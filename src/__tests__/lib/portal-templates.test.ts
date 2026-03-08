import { describe, it, expect } from "vitest"
import {
  PORTAL_TEMPLATES,
  getTemplateById,
  getTemplatesForEventType,
  getSuggestedTemplate,
} from "@/lib/portal-templates"
import { THEME_PRESETS } from "@/lib/portal-themes"
import { SECTION_TYPES } from "@/lib/types/portal.types"
import type { SectionType } from "@/lib/types/portal.types"

describe("Portal Templates", () => {
  // ── Unit: Template registry ──

  it("has 6 templates", () => {
    expect(PORTAL_TEMPLATES).toHaveLength(6)
  })

  it("all templates have unique IDs", () => {
    const ids = PORTAL_TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("every template has required fields", () => {
    for (const template of PORTAL_TEMPLATES) {
      expect(template.id).toBeTruthy()
      expect(template.name).toBeTruthy()
      expect(template.description).toBeTruthy()
      expect(template.event_type).toBeTruthy()
      expect(template.theme_preset).toBeTruthy()
      expect(template.pages.length).toBeGreaterThan(0)
    }
  })

  it("every template references a valid theme preset", () => {
    for (const template of PORTAL_TEMPLATES) {
      expect(THEME_PRESETS).toHaveProperty(template.theme_preset)
    }
  })

  it("every template page has at least one section", () => {
    for (const template of PORTAL_TEMPLATES) {
      for (const page of template.pages) {
        expect(page.slug).toBeTruthy()
        expect(page.title).toBeTruthy()
        expect(page.icon).toBeTruthy()
        expect(page.sections.length).toBeGreaterThan(0)
      }
    }
  })

  it("every section in templates uses a valid section type", () => {
    const validTypes = new Set<string>(SECTION_TYPES)
    for (const template of PORTAL_TEMPLATES) {
      for (const page of template.pages) {
        for (const section of page.sections) {
          expect(validTypes.has(section.section_type)).toBe(true)
        }
      }
    }
  })

  it("every section has content object", () => {
    for (const template of PORTAL_TEMPLATES) {
      for (const page of template.pages) {
        for (const section of page.sections) {
          expect(typeof section.content).toBe("object")
          expect(section.content).not.toBeNull()
        }
      }
    }
  })

  // ── Unit: Template pages have unique slugs within each template ──

  it("page slugs are unique within each template", () => {
    for (const template of PORTAL_TEMPLATES) {
      const slugs = template.pages.map((p) => p.slug)
      expect(new Set(slugs).size).toBe(slugs.length)
    }
  })

  // ── Unit: Specific templates ──

  it("wedding template has travel page with map and hotels", () => {
    const wedding = getTemplateById("wedding")!
    const travelPage = wedding.pages.find((p) => p.slug === "travel")
    expect(travelPage).toBeDefined()
    const types = travelPage!.sections.map((s) => s.section_type)
    expect(types).toContain("map")
    expect(types).toContain("hotels")
  })

  it("wedding template has RSVP with meal preference", () => {
    const wedding = getTemplateById("wedding")!
    const rsvpPage = wedding.pages.find((p) => p.slug === "rsvp")!
    const rsvpSection = rsvpPage.sections.find(
      (s) => s.section_type === "rsvp_form"
    )!
    expect(rsvpSection.content.show_meal_preference).toBe(true)
  })

  it("blank template has minimal content", () => {
    const blank = getTemplateById("blank")!
    expect(blank.pages).toHaveLength(1)
    expect(blank.pages[0].sections).toHaveLength(1)
    expect(blank.pages[0].sections[0].section_type).toBe("hero")
  })

  // ── Unit: getTemplateById ──

  it("getTemplateById returns correct template", () => {
    const engagement = getTemplateById("engagement")
    expect(engagement).not.toBeNull()
    expect(engagement!.name).toBe("Engagement")
  })

  it("getTemplateById returns null for unknown ID", () => {
    expect(getTemplateById("nonexistent")).toBeNull()
  })

  // ── Unit: getTemplatesForEventType ──

  it("getTemplatesForEventType returns matching + blank", () => {
    const weddingTemplates = getTemplatesForEventType("wedding")
    expect(weddingTemplates.length).toBeGreaterThanOrEqual(2) // wedding + blank
    expect(weddingTemplates.some((t) => t.id === "wedding")).toBe(true)
    expect(weddingTemplates.some((t) => t.id === "blank")).toBe(true)
  })

  it("getTemplatesForEventType always includes blank", () => {
    const templates = getTemplatesForEventType("custom")
    expect(templates.some((t) => t.id === "blank")).toBe(true)
  })

  // ── Unit: getSuggestedTemplate ──

  it("getSuggestedTemplate returns matching template for event type", () => {
    expect(getSuggestedTemplate("wedding").id).toBe("wedding")
    expect(getSuggestedTemplate("birthday").id).toBe("birthday")
    expect(getSuggestedTemplate("engagement").id).toBe("engagement")
  })

  it("getSuggestedTemplate returns blank for custom event type", () => {
    expect(getSuggestedTemplate("custom").id).toBe("blank")
  })

  // ── Integration: Section types used across templates ──

  it("templates collectively use a variety of section types", () => {
    const usedTypes = new Set<SectionType>()
    for (const template of PORTAL_TEMPLATES) {
      for (const page of template.pages) {
        for (const section of page.sections) {
          usedTypes.add(section.section_type)
        }
      }
    }
    // Should use at least 10 different section types across all templates
    expect(usedTypes.size).toBeGreaterThanOrEqual(10)
  })
})

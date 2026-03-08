import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const SQL = readFileSync(
  resolve(__dirname, "../../../supabase/migrations/032_event_portal.sql"),
  "utf-8"
)

describe("032_event_portal migration", () => {
  // ── Unit Tests — Table creation ──

  it("creates event_portals table", () => {
    expect(SQL).toContain("create table public.event_portals")
  })

  it("creates portal_pages table", () => {
    expect(SQL).toContain("create table public.portal_pages")
  })

  it("creates portal_sections table", () => {
    expect(SQL).toContain("create table public.portal_sections")
  })

  it("creates portal_sub_events table", () => {
    expect(SQL).toContain("create table public.portal_sub_events")
  })

  it("creates portal_guests table", () => {
    expect(SQL).toContain("create table public.portal_guests")
  })

  it("creates portal_rsvps table", () => {
    expect(SQL).toContain("create table public.portal_rsvps")
  })

  it("creates portal_map_pins table", () => {
    expect(SQL).toContain("create table public.portal_map_pins")
  })

  it("creates portal_analytics table", () => {
    expect(SQL).toContain("create table public.portal_analytics")
  })

  it("creates portal_media table", () => {
    expect(SQL).toContain("create table public.portal_media")
  })

  it("creates portal_registry table", () => {
    expect(SQL).toContain("create table public.portal_registry")
  })

  it("creates portal_form_fields table", () => {
    expect(SQL).toContain("create table public.portal_form_fields")
  })

  // ── Unit Tests — Event portals columns ──

  it("event_portals has required columns", () => {
    expect(SQL).toContain("creator_id")
    expect(SQL).toContain("slug")
    expect(SQL).toContain("title")
    expect(SQL).toContain("event_type")
    expect(SQL).toContain("theme_config")
    expect(SQL).toContain("is_published")
    expect(SQL).toContain("password_hash")
  })

  it("event_type has correct CHECK constraint", () => {
    expect(SQL).toContain("'engagement'")
    expect(SQL).toContain("'wedding'")
    expect(SQL).toContain("'birthday'")
    expect(SQL).toContain("'anniversary'")
    expect(SQL).toContain("'gathering'")
    expect(SQL).toContain("'custom'")
  })

  it("has unique index on slug", () => {
    expect(SQL).toContain("create unique index event_portals_slug_idx")
  })

  // ── Unit Tests — Portal sections ──

  it("section_type has CHECK constraint with 24 types", () => {
    const sectionTypes = [
      "hero", "welcome", "event_cards", "timeline", "countdown",
      "calendar", "dress_code", "map", "transport", "hotels",
      "restaurants", "activities", "beauty", "travel_tips",
      "guides_hub", "rsvp_form", "gift_registry", "cta",
      "faq", "text", "quote", "divider", "custom_html", "gallery",
    ]
    for (const type of sectionTypes) {
      expect(SQL).toContain(`'${type}'`)
    }
  })

  it("portal_sections has content JSONB column", () => {
    expect(SQL).toContain("content       jsonb       not null default '{}'::jsonb")
  })

  // ── Unit Tests — Portal RSVPS ──

  it("portal_rsvps has attending CHECK constraint", () => {
    expect(SQL).toContain("'yes'")
    expect(SQL).toContain("'no'")
    expect(SQL).toContain("'maybe'")
    expect(SQL).toContain("'pending'")
  })

  it("portal_rsvps has plus_ones with non-negative check", () => {
    expect(SQL).toContain("plus_ones       integer     not null default 0 check (plus_ones >= 0)")
  })

  it("portal_rsvps has sub_event_ids uuid array", () => {
    expect(SQL).toContain("sub_event_ids   uuid[]")
  })

  // ── Unit Tests — Portal guests ──

  it("portal_guests has guest_group CHECK constraint", () => {
    expect(SQL).toContain("'family'")
    expect(SQL).toContain("'friends'")
    expect(SQL).toContain("'work'")
    expect(SQL).toContain("'vip'")
  })

  // ── Unit Tests — Map pins ──

  it("portal_map_pins has category CHECK constraint", () => {
    expect(SQL).toContain("'venue'")
    expect(SQL).toContain("'hotel'")
    expect(SQL).toContain("'restaurant'")
    expect(SQL).toContain("'activity'")
    expect(SQL).toContain("'transport'")
  })

  it("portal_map_pins has lat/lng columns", () => {
    expect(SQL).toContain("lat         numeric(10,7) not null")
    expect(SQL).toContain("lng         numeric(10,7) not null")
  })

  // ── Unit Tests — Form fields ──

  it("portal_form_fields has field_type CHECK constraint", () => {
    const fieldTypes = ["text", "textarea", "select", "radio", "checkbox", "number", "email", "phone"]
    for (const ft of fieldTypes) {
      expect(SQL).toContain(`'${ft}'`)
    }
  })

  it("portal_form_fields has options text[] column", () => {
    expect(SQL).toContain("options     text[]")
  })

  // ── Unit Tests — Triggers ──

  it("creates updated_at triggers for all mutable tables", () => {
    const tables = [
      "event_portals", "portal_pages", "portal_sections",
      "portal_sub_events", "portal_guests", "portal_rsvps",
      "portal_map_pins", "portal_media", "portal_registry",
      "portal_form_fields",
    ]
    for (const table of tables) {
      expect(SQL).toContain(`create trigger ${table}_set_updated_at`)
      expect(SQL).toContain(`before update on public.${table}`)
    }
  })

  it("reuses set_updated_at() function", () => {
    expect(SQL).toContain("execute function public.set_updated_at()")
  })

  // ── Unit Tests — RLS ──

  it("enables RLS on all 11 tables", () => {
    const tables = [
      "event_portals", "portal_pages", "portal_sections",
      "portal_sub_events", "portal_guests", "portal_rsvps",
      "portal_map_pins", "portal_analytics", "portal_media",
      "portal_registry", "portal_form_fields",
    ]
    for (const table of tables) {
      expect(SQL).toContain(`alter table public.${table} enable row level security`)
    }
  })

  it("event_portals has anon public select policy", () => {
    expect(SQL).toContain("event_portals: public select")
    expect(SQL).toContain("for select to anon")
  })

  it("event_portals creator CRUD policies exist", () => {
    expect(SQL).toContain("event_portals: creator select")
    expect(SQL).toContain("event_portals: creator insert")
    expect(SQL).toContain("event_portals: creator update")
    expect(SQL).toContain("event_portals: creator delete")
  })

  it("event_portals has partner read policy", () => {
    expect(SQL).toContain("event_portals: partner select")
    expect(SQL).toContain("public.get_partner_id()")
  })

  it("portal_rsvps allows anon insert on published portals", () => {
    expect(SQL).toContain("portal_rsvps: public insert")
    expect(SQL).toContain("for insert to anon")
  })

  it("portal_analytics allows anon insert for view tracking", () => {
    expect(SQL).toContain("portal_analytics: public insert")
  })

  it("portal_registry allows anon update for claiming gifts", () => {
    expect(SQL).toContain("portal_registry: public update")
  })

  // ── Unit Tests — Realtime ──

  it("adds portal_rsvps to realtime publication", () => {
    expect(SQL).toContain("alter publication supabase_realtime add table public.portal_rsvps")
  })

  // ── Unit Tests — Storage ──

  it("creates portal-media storage bucket", () => {
    expect(SQL).toContain("'portal-media'")
    expect(SQL).toContain("insert into storage.buckets")
  })

  it("storage bucket is public with 10MB limit", () => {
    expect(SQL).toContain("true")
    expect(SQL).toContain("10485760")
  })

  it("storage allows image and video mime types", () => {
    expect(SQL).toContain("image/jpeg")
    expect(SQL).toContain("image/png")
    expect(SQL).toContain("image/webp")
    expect(SQL).toContain("video/mp4")
  })

  // ── Integration Tests — Foreign keys ──

  it("event_portals references profiles with CASCADE", () => {
    expect(SQL).toContain("references public.profiles (id) on delete cascade")
  })

  it("portal_pages references event_portals with CASCADE", () => {
    expect(SQL).toContain("references public.event_portals (id) on delete cascade")
  })

  it("portal_sections references portal_pages with CASCADE", () => {
    expect(SQL).toContain("references public.portal_pages (id) on delete cascade")
  })

  it("portal_rsvps references portal_guests with SET NULL", () => {
    expect(SQL).toContain("references public.portal_guests (id) on delete set null")
  })

  it("portal_pages has unique constraint on (portal_id, slug)", () => {
    expect(SQL).toContain("constraint portal_pages_unique_slug unique (portal_id, slug)")
  })

  // ── Integration Tests — Indexes ──

  it("creates indexes for performance", () => {
    expect(SQL).toContain("event_portals_creator_idx")
    expect(SQL).toContain("portal_pages_portal_idx")
    expect(SQL).toContain("portal_sections_page_idx")
    expect(SQL).toContain("portal_sub_events_portal_idx")
    expect(SQL).toContain("portal_guests_portal_idx")
    expect(SQL).toContain("portal_rsvps_portal_idx")
    expect(SQL).toContain("portal_rsvps_email_idx")
    expect(SQL).toContain("portal_map_pins_portal_idx")
    expect(SQL).toContain("portal_analytics_portal_idx")
    expect(SQL).toContain("portal_media_portal_idx")
    expect(SQL).toContain("portal_registry_portal_idx")
    expect(SQL).toContain("portal_form_fields_portal_idx")
  })

  // ── Integration Tests — SQL validity ──

  it("has balanced parentheses", () => {
    const opens = (SQL.match(/\(/g) || []).length
    const closes = (SQL.match(/\)/g) || []).length
    expect(opens).toBe(closes)
  })

  it("last non-empty line ends with semicolon", () => {
    const lines = SQL.split("\n")
      .filter((l) => !l.startsWith("--") && l.trim().length > 0)
    const lastLine = lines[lines.length - 1].trim()
    expect(lastLine.endsWith(";")).toBe(true)
  })

  // ── Unit Tests — portal_guests defined before portal_rsvps ──

  it("portal_guests table is defined before portal_rsvps (FK order)", () => {
    const guestsPos = SQL.indexOf("create table public.portal_guests")
    const rsvpsPos = SQL.indexOf("create table public.portal_rsvps")
    expect(guestsPos).toBeLessThan(rsvpsPos)
  })
})

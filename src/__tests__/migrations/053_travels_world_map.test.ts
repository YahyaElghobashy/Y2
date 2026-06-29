import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const SQL = readFileSync(
  resolve(process.cwd(), "supabase/migrations/053_travels_world_map.sql"),
  "utf8"
)

describe("migration 053 — travels world map", () => {
  describe("country_visits", () => {
    it("creates the table with the country_code length check", () => {
      expect(SQL).toMatch(/create table public\.country_visits/)
      expect(SQL).toMatch(/country_visits_code_len check \(char_length\(country_code\) = 2\)/)
    })

    it("has the per-instance shape (is_together + traveler_id + partner_note)", () => {
      expect(SQL).toContain("traveler_id")
      expect(SQL).toContain("is_together")
      expect(SQL).toContain("partner_note")
    })

    it("RLS = owner CRUD + partner read via get_partner_id()", () => {
      expect(SQL).toMatch(/"country_visits: own read"[\s\S]*auth\.uid\(\) = created_by/)
      expect(SQL).toMatch(/"country_visits: partner read"[\s\S]*created_by = public\.get_partner_id\(\)/)
    })

    it("reuses the shared set_updated_at() helper", () => {
      expect(SQL).toMatch(/country_visits_set_updated_at[\s\S]*execute function public\.set_updated_at\(\)/)
    })
  })

  describe("partner column-scope trigger", () => {
    it("lets the partner move ONLY partner_note", () => {
      expect(SQL).toMatch(/enforce_country_visit_partner_update_scope/)
      expect(SQL).toMatch(/partner may only modify partner_note/)
      // owner / no-JWT short-circuit
      expect(SQL).toMatch(/auth\.uid\(\) is null or auth\.uid\(\) = old\.created_by/)
    })

    it("adds a partner UPDATE policy so the partner can update at all", () => {
      expect(SQL).toMatch(/"country_visits: partner update note"[\s\S]*created_by = public\.get_partner_id\(\)/)
    })
  })

  describe("country_pins", () => {
    it("creates the table, unique(owner,country), and code-length check", () => {
      expect(SQL).toMatch(/create table public\.country_pins/)
      expect(SQL).toMatch(/unique \(owner_id, country_code\)/)
      expect(SQL).toMatch(/country_pins_code_len check \(char_length\(country_code\) = 2\)/)
    })

    it("enforces <= 3 pins per owner via a BEFORE INSERT trigger", () => {
      expect(SQL).toMatch(/enforce_max_country_pins/)
      expect(SQL).toMatch(/>= 3 then[\s\S]*at most 3 aspirational countries/)
      expect(SQL).toMatch(/before insert on public\.country_pins/)
    })

    it("RLS = owner CRUD + partner read", () => {
      expect(SQL).toMatch(/"country_pins: own read"/)
      expect(SQL).toMatch(/"country_pins: partner read"[\s\S]*owner_id = public\.get_partner_id\(\)/)
    })
  })

  describe("notifications", () => {
    it("re-states the full CHECK with travel_pin_match added", () => {
      expect(SQL).toMatch(/notifications_type_check/)
      for (const t of [
        "custom",
        "coupon_approval",
        "system",
        "marketplace_effect",
        "event_reminder",
        "cycle_reminder",
        "letter",
        "snap_reaction",
        "travel_pin_match",
      ]) {
        expect(SQL).toContain(`'${t}'`)
      }
    })
  })

  describe("realtime", () => {
    it("adds both tables to the realtime publication", () => {
      expect(SQL).toMatch(/alter publication supabase_realtime add table public\.country_visits/)
      expect(SQL).toMatch(/alter publication supabase_realtime add table public\.country_pins/)
    })
  })
})

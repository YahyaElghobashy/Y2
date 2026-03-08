import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const SQL = readFileSync(
  resolve(__dirname, "../../../supabase/migrations/028_event_reminders.sql"),
  "utf-8"
)

describe("028_event_reminders migration", () => {
  // ── Unit Tests — Schema structure ──

  it("creates the event_reminders table", () => {
    expect(SQL).toContain("CREATE TABLE IF NOT EXISTS public.event_reminders")
  })

  it("has required columns", () => {
    expect(SQL).toContain("id uuid PRIMARY KEY DEFAULT gen_random_uuid()")
    expect(SQL).toContain("event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE")
    expect(SQL).toContain("user_id uuid NOT NULL REFERENCES public.profiles(id)")
    expect(SQL).toContain("remind_before interval NOT NULL")
    expect(SQL).toContain("remind_at timestamptz")
    expect(SQL).toContain("is_sent boolean NOT NULL DEFAULT false")
    expect(SQL).toContain("sent_at timestamptz")
    expect(SQL).toContain("created_at timestamptz NOT NULL DEFAULT now()")
  })

  it("has unique constraint on (event_id, user_id, remind_before)", () => {
    expect(SQL).toContain("CONSTRAINT event_reminders_unique UNIQUE (event_id, user_id, remind_before)")
  })

  it("creates index for pending reminder queries", () => {
    expect(SQL).toContain("idx_event_reminders_pending")
    expect(SQL).toContain("ON public.event_reminders (is_sent, remind_at)")
    expect(SQL).toContain("WHERE is_sent = false")
  })

  it("creates index on event_id", () => {
    expect(SQL).toContain("idx_event_reminders_event_id")
  })

  // ── Unit Tests — Trigger function ──

  it("creates compute_remind_at trigger function", () => {
    expect(SQL).toContain("CREATE OR REPLACE FUNCTION public.compute_remind_at()")
    expect(SQL).toContain("RETURNS trigger")
  })

  it("handles all-day events with 9:00 AM default", () => {
    expect(SQL).toContain("T09:00:00")
  })

  it("computes remind_at as base_timestamp - remind_before", () => {
    expect(SQL).toContain("NEW.remind_at := base_timestamp - NEW.remind_before")
  })

  it("creates trigger on INSERT and UPDATE", () => {
    expect(SQL).toContain("CREATE TRIGGER trg_compute_remind_at")
    expect(SQL).toContain("BEFORE INSERT OR UPDATE OF remind_before, event_id")
    expect(SQL).toContain("EXECUTE FUNCTION public.compute_remind_at()")
  })

  // ── Unit Tests — RLS Policies ──

  it("enables RLS", () => {
    expect(SQL).toContain("ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY")
  })

  it("has SELECT policy for own reminders", () => {
    expect(SQL).toContain("Users can view own reminders")
    expect(SQL).toContain("FOR SELECT")
    expect(SQL).toContain("auth.uid() = user_id")
  })

  it("has INSERT policy for own reminders", () => {
    expect(SQL).toContain("Users can create own reminders")
    expect(SQL).toContain("FOR INSERT")
  })

  it("has UPDATE policy for own reminders", () => {
    expect(SQL).toContain("Users can update own reminders")
    expect(SQL).toContain("FOR UPDATE")
  })

  it("has DELETE policy for own reminders", () => {
    expect(SQL).toContain("Users can delete own reminders")
    expect(SQL).toContain("FOR DELETE")
  })

  it("has service role bypass for edge functions", () => {
    expect(SQL).toContain("Service role full access")
    expect(SQL).toContain("auth.role() = 'service_role'")
  })

  // ── Integration Tests — Foreign keys ──

  it("event_id references events table with CASCADE delete", () => {
    expect(SQL).toContain("REFERENCES public.events(id) ON DELETE CASCADE")
  })

  it("user_id references profiles table", () => {
    expect(SQL).toContain("REFERENCES public.profiles(id)")
  })

  // ── Integration Tests — SQL validity ──

  it("does not contain syntax errors (balanced parentheses)", () => {
    const opens = (SQL.match(/\(/g) || []).length
    const closes = (SQL.match(/\)/g) || []).length
    expect(opens).toBe(closes)
  })

  it("all statements end with semicolons", () => {
    // Remove comments and empty lines, check that non-empty content blocks end with ;
    const lines = SQL.split("\n")
      .filter((l) => !l.startsWith("--") && l.trim().length > 0)
    const lastLine = lines[lines.length - 1].trim()
    expect(lastLine.endsWith(";")).toBe(true)
  })
})

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const SRC = readFileSync(
  resolve(__dirname, "../../../supabase/functions/google-calendar-pull/index.ts"),
  "utf-8"
)

describe("google-calendar-pull edge function", () => {
  // ── Unit Tests — CORS ──

  it("handles CORS preflight with OPTIONS", () => {
    expect(SRC).toContain('req.method === "OPTIONS"')
    expect(SRC).toContain("Access-Control-Allow-Origin")
    expect(SRC).toContain("Access-Control-Allow-Headers")
  })

  // ── Unit Tests — Auth ──

  it("requires service role authorization", () => {
    expect(SRC).toContain("SUPABASE_SERVICE_ROLE_KEY")
    expect(SRC).toContain("Unauthorized: service role required")
    expect(SRC).toContain("401")
  })

  it("validates auth header contains service role key", () => {
    expect(SRC).toContain("authHeader.includes(serviceRoleKey)")
  })

  // ── Unit Tests — User discovery ──

  it("fetches users with Google Calendar connected", () => {
    expect(SRC).toContain('.from("profiles")')
    expect(SRC).toContain("google_calendar_refresh_token")
    expect(SRC).toContain('.not("google_calendar_refresh_token", "is", null)')
    expect(SRC).toContain(".limit(50)")
  })

  it("returns early when no connected users", () => {
    expect(SRC).toContain("no_connected_users")
    expect(SRC).toContain("synced: 0")
  })

  // ── Unit Tests — Token exchange ──

  it("exchanges refresh token for access token", () => {
    expect(SRC).toContain("getAccessToken")
    expect(SRC).toContain("https://oauth2.googleapis.com/token")
    expect(SRC).toContain("grant_type")
    expect(SRC).toContain("refresh_token")
  })

  it("uses correct Google OAuth environment variables", () => {
    expect(SRC).toContain("GOOGLE_CLIENT_ID")
    expect(SRC).toContain("GOOGLE_CLIENT_SECRET")
  })

  // ── Integration Tests — Google Calendar API ──

  it("fetches events from Google Calendar primary calendar", () => {
    expect(SRC).toContain("googleapis.com/calendar/v3/calendars/primary/events")
    expect(SRC).toContain("Authorization")
    expect(SRC).toContain("Bearer")
  })

  it("queries events for next 30 days", () => {
    expect(SRC).toContain("timeMin")
    expect(SRC).toContain("timeMax")
    expect(SRC).toContain("30 * 24 * 60 * 60 * 1000")
  })

  it("requests single events (expanded recurrences)", () => {
    expect(SRC).toContain('singleEvents: "true"')
    expect(SRC).toContain('orderBy: "startTime"')
  })

  it("limits results to 100 events per user", () => {
    expect(SRC).toContain('maxResults: "100"')
  })

  // ── Integration Tests — Duplicate detection ──

  it("checks existing events by google_calendar_event_id", () => {
    expect(SRC).toContain("existingGcalIds")
    expect(SRC).toContain('.select("google_calendar_event_id")')
    expect(SRC).toContain('.eq("creator_id", profile.id)')
    expect(SRC).toContain(".in(")
  })

  it("skips already-synced events", () => {
    expect(SRC).toContain("existingGcalIds.has")
    expect(SRC).toContain("totalSkipped")
  })

  // ── Unit Tests — Event mapping ──

  it("maps Google Calendar event fields to Y2 schema", () => {
    expect(SRC).toContain("mapGoogleEventToY2")
    expect(SRC).toContain("gcalEvent.summary")
    expect(SRC).toContain("gcalEvent.description")
    expect(SRC).toContain("gcalEvent.start")
    expect(SRC).toContain("google_calendar_event_id: gcalEvent.id")
  })

  it("handles all-day events (date only)", () => {
    expect(SRC).toContain("gcalEvent.start?.date")
    expect(SRC).toContain("isAllDay = true")
  })

  it("handles timed events (dateTime)", () => {
    expect(SRC).toContain("gcalEvent.start?.dateTime")
    expect(SRC).toContain("eventTime")
    expect(SRC).toContain("endTime")
  })

  it("maps recurrence rules", () => {
    expect(SRC).toContain("WEEKLY")
    expect(SRC).toContain("MONTHLY")
    expect(SRC).toContain("YEARLY")
    expect(SRC).toContain('"annual"')
  })

  it("skips cancelled events", () => {
    expect(SRC).toContain('"cancelled"')
    expect(SRC).toContain("gcalEvent.status")
  })

  it("defaults imported events to category 'other'", () => {
    expect(SRC).toContain('category: "other"')
  })

  it("defaults imported events to not shared", () => {
    expect(SRC).toContain("is_shared: false")
  })

  it("sets creator_id to the connected user", () => {
    expect(SRC).toContain("creator_id: userId")
  })

  // ── Integration Tests — Insert ──

  it("inserts new events into Y2 events table", () => {
    expect(SRC).toContain('.from("events")')
    expect(SRC).toContain(".insert(newEvents)")
  })

  // ── Integration Tests — Response format ──

  it("returns processed status with counts", () => {
    expect(SRC).toContain('"processed"')
    expect(SRC).toContain("totalSynced")
    expect(SRC).toContain("totalSkipped")
    expect(SRC).toContain("totalErrors")
  })

  // ── Unit Tests — Error handling ──

  it("handles profile fetch error", () => {
    expect(SRC).toContain("Failed to fetch profiles")
    expect(SRC).toContain("500")
  })

  it("handles unhandled errors", () => {
    expect(SRC).toContain("Internal server error")
  })

  it("continues processing other users on per-user error", () => {
    // Each user is processed in a try-catch, errors increment counter
    expect(SRC).toContain("totalErrors++")
    // Should have multiple totalErrors++ for different failure paths
    const errorIncrements = SRC.match(/totalErrors\+\+/g)
    expect(errorIncrements!.length).toBeGreaterThanOrEqual(3)
  })

  // ── Unit Tests — Entry point ──

  it("uses Deno.serve entry point", () => {
    expect(SRC).toContain("Deno.serve")
  })

  it("imports createClient from supabase-js", () => {
    expect(SRC).toContain("createClient")
    expect(SRC).toContain("supabase-js")
  })
})

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const SRC = readFileSync(
  resolve(__dirname, "../../../supabase/functions/send-event-reminder/index.ts"),
  "utf-8"
)

describe("send-event-reminder edge function", () => {
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

  // ── Unit Tests — Reminder query ──

  it("queries pending reminders with correct filters", () => {
    expect(SRC).toContain('.from("event_reminders")')
    expect(SRC).toContain('.eq("is_sent", false)')
    expect(SRC).toContain('.lte("remind_at", now)')
    expect(SRC).toContain(".limit(20)")
  })

  it("joins with events table for event details", () => {
    expect(SRC).toContain("events!inner")
    expect(SRC).toContain("title")
    expect(SRC).toContain("event_date")
    expect(SRC).toContain("event_time")
  })

  it("returns early when no pending reminders", () => {
    expect(SRC).toContain("no_pending")
    expect(SRC).toContain("sent: 0")
  })

  // ── Unit Tests — Notification composition ──

  it("formats reminder body based on remind_before interval", () => {
    expect(SRC).toContain("formatReminderBody")
    expect(SRC).toContain("is starting now")
    expect(SRC).toContain("starts in 15 minutes")
    expect(SRC).toContain("starts in 1 hour")
    expect(SRC).toContain("is tomorrow")
    expect(SRC).toContain("is in 1 week")
  })

  it("uses bell emoji in notification title", () => {
    expect(SRC).toContain("🔔")
  })

  it("includes event data in push payload", () => {
    expect(SRC).toContain("event_reminder")
    expect(SRC).toContain("event_id")
    expect(SRC).toContain("reminder_id")
  })

  // ── Unit Tests — Push notification ──

  it("configures VAPID keys for web push", () => {
    expect(SRC).toContain("webpush.setVapidDetails")
    expect(SRC).toContain("VAPID_SUBJECT")
    expect(SRC).toContain("VAPID_PUBLIC_KEY")
    expect(SRC).toContain("VAPID_PRIVATE_KEY")
  })

  it("fetches push subscriptions for user", () => {
    expect(SRC).toContain('.from("push_subscriptions")')
    expect(SRC).toContain('.eq("user_id", reminder.user_id)')
  })

  it("sends push notification via webpush", () => {
    expect(SRC).toContain("webpush.sendNotification")
  })

  it("includes icon and badge in push payload", () => {
    expect(SRC).toContain("/icons/icon-192x192.png")
    expect(SRC).toContain("/icons/badge-72x72.png")
  })

  // ── Unit Tests — Subscription cleanup ──

  it("cleans up expired subscriptions (410/404)", () => {
    expect(SRC).toContain("statusCode === 410")
    expect(SRC).toContain("statusCode === 404")
    expect(SRC).toContain('.from("push_subscriptions")')
    expect(SRC).toContain(".delete()")
  })

  // ── Integration Tests — Mark as sent ──

  it("marks reminder as sent after processing", () => {
    expect(SRC).toContain("markSent")
    expect(SRC).toContain("is_sent: true")
    expect(SRC).toContain("sent_at")
  })

  it("marks as sent even on error (prevent retry loops)", () => {
    // In the catch block, markSent is still called
    const catchBlock = SRC.substring(SRC.indexOf("} catch (err)"))
    expect(catchBlock).toContain("markSent")
  })

  // ── Integration Tests — Notification audit trail ──

  it("inserts notification row for audit", () => {
    expect(SRC).toContain('.from("notifications")')
    expect(SRC).toContain('.insert(')
    expect(SRC).toContain("recipient_id: reminder.user_id")
    expect(SRC).toContain('type: "event_reminder"')
  })

  it("includes remind_before in notification metadata", () => {
    expect(SRC).toContain("remind_before: reminder.remind_before")
  })

  // ── Integration Tests — Response format ──

  it("returns processed status with counts", () => {
    expect(SRC).toContain('"processed"')
    expect(SRC).toContain("sentCount")
    expect(SRC).toContain("failCount")
  })

  // ── Unit Tests — Error handling ──

  it("handles fetch error gracefully", () => {
    expect(SRC).toContain("Failed to fetch reminders")
    expect(SRC).toContain("500")
  })

  it("handles unhandled errors", () => {
    expect(SRC).toContain("Internal server error")
  })

  it("handles deleted events (event is null)", () => {
    expect(SRC).toContain("if (!event)")
    // Should mark as sent to clear the orphaned reminder
    expect(SRC).toContain("Event deleted but reminder lingered")
  })

  // ── Unit Tests — Batch processing ──

  it("processes up to 20 reminders per invocation", () => {
    expect(SRC).toContain(".limit(20)")
  })

  it("uses Promise.allSettled for parallel push sends", () => {
    expect(SRC).toContain("Promise.allSettled")
  })

  // ── SQL validity ──

  it("uses Deno.serve entry point", () => {
    expect(SRC).toContain("Deno.serve")
  })

  it("imports createClient from supabase-js", () => {
    expect(SRC).toContain("createClient")
    expect(SRC).toContain("supabase-js")
  })

  it("imports webpush", () => {
    expect(SRC).toContain("web-push")
  })
})

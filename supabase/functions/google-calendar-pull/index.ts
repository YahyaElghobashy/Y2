// ============================================================
// TC11: Google Calendar Pull Edge Function
// Scheduled function (cron every 30 min) that pulls Google Calendar
// events into Y2 for users with Google Calendar connected.
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ── CORS Headers ────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

// ── Google OAuth Token Exchange ─────────────────────────────
async function getAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")

  if (!clientId || !clientSecret) return null

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })

  if (!response.ok) return null

  const data = await response.json()
  return data.access_token ?? null
}

// ── Map Google Calendar event to Y2 event insert ────────────
function mapGoogleEventToY2(
  // deno-lint-ignore no-explicit-any
  gcalEvent: any,
  userId: string
): {
  title: string
  description: string | null
  event_date: string
  event_time: string | null
  end_time: string | null
  is_all_day: boolean
  recurrence: string
  category: string
  is_shared: boolean
  creator_id: string
  google_calendar_event_id: string
} | null {
  if (!gcalEvent.id || !gcalEvent.summary) return null
  // Skip cancelled events
  if (gcalEvent.status === "cancelled") return null

  let eventDate: string
  let eventTime: string | null = null
  let endTime: string | null = null
  let isAllDay = false

  if (gcalEvent.start?.date) {
    // All-day event
    eventDate = gcalEvent.start.date
    isAllDay = true
  } else if (gcalEvent.start?.dateTime) {
    // Timed event
    const startDt = new Date(gcalEvent.start.dateTime)
    eventDate = startDt.toISOString().split("T")[0]
    eventTime = startDt.toTimeString().slice(0, 8) // HH:mm:ss

    if (gcalEvent.end?.dateTime) {
      const endDt = new Date(gcalEvent.end.dateTime)
      endTime = endDt.toTimeString().slice(0, 8)
    }
  } else {
    return null // skip events without start date
  }

  // Map recurrence
  let recurrence = "none"
  if (gcalEvent.recurrence && gcalEvent.recurrence.length > 0) {
    const rrule = gcalEvent.recurrence[0]?.toUpperCase() ?? ""
    if (rrule.includes("WEEKLY")) recurrence = "weekly"
    else if (rrule.includes("MONTHLY")) recurrence = "monthly"
    else if (rrule.includes("YEARLY")) recurrence = "annual"
  }

  return {
    title: gcalEvent.summary,
    description: gcalEvent.description ?? null,
    event_date: eventDate,
    event_time: eventTime,
    end_time: endTime,
    is_all_day: isAllDay,
    recurrence,
    category: "other", // imported events default to "other"
    is_shared: false, // imported events are private by default
    creator_id: userId,
    google_calendar_event_id: gcalEvent.id,
  }
}

// ── Main Handler ────────────────────────────────────────────
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Service role auth check
    const authHeader = req.headers.get("authorization") ?? ""
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

    if (!authHeader.includes(serviceRoleKey)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: service role required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Fetch users with Google Calendar connected
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, google_calendar_refresh_token")
      .not("google_calendar_refresh_token", "is", null)
      .limit(50)

    if (profilesError || !profiles) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch profiles", details: profilesError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (profiles.length === 0) {
      return new Response(
        JSON.stringify({ status: "no_connected_users", synced: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    let totalSynced = 0
    let totalSkipped = 0
    let totalErrors = 0

    // Process each connected user
    for (const profile of profiles) {
      try {
        const accessToken = await getAccessToken(profile.google_calendar_refresh_token)
        if (!accessToken) {
          totalErrors++
          continue
        }

        // Calculate time range: now to +30 days
        const timeMin = new Date().toISOString()
        const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        // Fetch events from Google Calendar
        const params = new URLSearchParams({
          timeMin,
          timeMax,
          maxResults: "100",
          singleEvents: "true",
          orderBy: "startTime",
        })

        const gcalResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        )

        if (!gcalResponse.ok) {
          totalErrors++
          continue
        }

        const gcalData = await gcalResponse.json()
        const gcalEvents = gcalData.items ?? []

        if (gcalEvents.length === 0) continue

        // Get existing google_calendar_event_ids for this user to avoid duplicates
        const gcalIds = gcalEvents
          // deno-lint-ignore no-explicit-any
          .map((e: any) => e.id)
          .filter(Boolean)

        const { data: existingEvents } = await supabase
          .from("events")
          .select("google_calendar_event_id")
          .eq("creator_id", profile.id)
          .in("google_calendar_event_id", gcalIds)

        const existingGcalIds = new Set(
          (existingEvents ?? []).map((e: { google_calendar_event_id: string }) => e.google_calendar_event_id)
        )

        // Insert new events
        const newEvents = gcalEvents
          // deno-lint-ignore no-explicit-any
          .map((gcalEvent: any) => mapGoogleEventToY2(gcalEvent, profile.id))
          .filter(
            // deno-lint-ignore no-explicit-any
            (mapped: any) =>
              mapped !== null && !existingGcalIds.has(mapped.google_calendar_event_id)
          )

        if (newEvents.length === 0) {
          totalSkipped += gcalEvents.length
          continue
        }

        const { error: insertError } = await supabase
          .from("events")
          .insert(newEvents)

        if (insertError) {
          totalErrors++
          continue
        }

        totalSynced += newEvents.length
        totalSkipped += gcalEvents.length - newEvents.length
      } catch {
        totalErrors++
      }
    }

    return new Response(
      JSON.stringify({
        status: "processed",
        users: profiles.length,
        synced: totalSynced,
        skipped: totalSkipped,
        errors: totalErrors,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

// ============================================================
// T710: Google Calendar Sync Edge Function
// Creates/updates/deletes Google Calendar events when Y2 events change.
// Called by the client with { event_id, action }.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS Headers ────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Types ───────────────────────────────────────────────────
type SyncAction = "create" | "update" | "delete";

type SyncRequest = {
  event_id: string;
  action: SyncAction;
};

type EventRow = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  end_time: string | null;
  recurrence: string;
  category: string;
  google_calendar_event_id: string | null;
  is_shared: boolean;
};

// ── Google OAuth Token Exchange ─────────────────────────────
async function getAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!clientId || !clientSecret) return null;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.access_token ?? null;
}

// ── Build Google Calendar Event Body ────────────────────────
function buildGoogleEvent(event: EventRow) {
  const startDate = event.event_date;
  const hasTime = Boolean(event.event_time);

  // deno-lint-ignore no-explicit-any
  const gcalEvent: Record<string, any> = {
    summary: event.title,
    description: event.description ?? undefined,
  };

  if (hasTime) {
    const startDateTime = `${startDate}T${event.event_time}`;
    gcalEvent.start = { dateTime: startDateTime, timeZone: "Africa/Cairo" };

    if (event.end_time) {
      gcalEvent.end = { dateTime: `${startDate}T${event.end_time}`, timeZone: "Africa/Cairo" };
    } else {
      // Default 1-hour duration
      const [h, m] = (event.event_time ?? "00:00").split(":");
      const endHour = String(parseInt(h) + 1).padStart(2, "0");
      gcalEvent.end = { dateTime: `${startDate}T${endHour}:${m}:00`, timeZone: "Africa/Cairo" };
    }
  } else {
    gcalEvent.start = { date: startDate };
    gcalEvent.end = { date: startDate };
  }

  // Recurrence
  if (event.recurrence !== "none") {
    const freqMap: Record<string, string> = {
      weekly: "WEEKLY",
      monthly: "MONTHLY",
      annual: "YEARLY",
    };
    const freq = freqMap[event.recurrence];
    if (freq) {
      gcalEvent.recurrence = [`RRULE:FREQ=${freq}`];
    }
  }

  return gcalEvent;
}

// ── Main Handler ────────────────────────────────────────────
serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request
    const body: SyncRequest = await req.json();
    const { event_id, action } = body;

    if (!event_id || !action) {
      return new Response(
        JSON.stringify({ error: "event_id and action are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["create", "update", "delete"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "action must be create, update, or delete" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client (service role)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const typedEvent = event as EventRow;

    // Fetch the user's Google Calendar refresh token
    const { data: profile } = await supabase
      .from("profiles")
      .select("google_calendar_refresh_token")
      .eq("id", typedEvent.creator_id)
      .single();

    if (!profile?.google_calendar_refresh_token) {
      return new Response(
        JSON.stringify({ synced: false, reason: "not_connected" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get fresh access token
    const accessToken = await getAccessToken(profile.google_calendar_refresh_token);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ synced: false, reason: "token_refresh_failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const calendarApiBase = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

    // Execute action
    if (action === "create") {
      const gcalEvent = buildGoogleEvent(typedEvent);
      const gcalResponse = await fetch(calendarApiBase, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gcalEvent),
      });

      if (!gcalResponse.ok) {
        const err = await gcalResponse.text();
        return new Response(
          JSON.stringify({ synced: false, reason: "google_api_error", details: err }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const created = await gcalResponse.json();

      // Store Google Calendar event ID on our event row
      await supabase
        .from("events")
        .update({ google_calendar_event_id: created.id })
        .eq("id", event_id);

      return new Response(
        JSON.stringify({ synced: true, google_event_id: created.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update") {
      if (!typedEvent.google_calendar_event_id) {
        return new Response(
          JSON.stringify({ synced: false, reason: "no_google_event_id" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const gcalEvent = buildGoogleEvent(typedEvent);
      const gcalResponse = await fetch(
        `${calendarApiBase}/${typedEvent.google_calendar_event_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(gcalEvent),
        }
      );

      return new Response(
        JSON.stringify({ synced: gcalResponse.ok }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete") {
      if (!typedEvent.google_calendar_event_id) {
        return new Response(
          JSON.stringify({ synced: false, reason: "no_google_event_id" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const gcalResponse = await fetch(
        `${calendarApiBase}/${typedEvent.google_calendar_event_id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return new Response(
        JSON.stringify({ synced: gcalResponse.ok || gcalResponse.status === 410 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

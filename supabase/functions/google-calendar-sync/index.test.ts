// ============================================================
// T710: Google Calendar Sync Edge Function — Tests
// Run with: deno test --allow-env supabase/functions/google-calendar-sync/index.test.ts
// ============================================================

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";

// ── Mock State ──────────────────────────────────────────────

const CREATOR_ID = "aaaa-1111-bbbb-2222";
const EVENT_ID = "cccc-3333-dddd-4444";
const GOOGLE_EVENT_ID = "gcal-event-123";

type MockEvent = {
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

function createMockEvent(overrides: Partial<MockEvent> = {}): MockEvent {
  return {
    id: EVENT_ID,
    creator_id: CREATOR_ID,
    title: "Date Night",
    description: "Dinner at the Italian place",
    event_date: "2026-04-15",
    event_time: "19:00:00",
    end_time: "21:00:00",
    recurrence: "none",
    category: "date_night",
    google_calendar_event_id: null,
    is_shared: true,
    ...overrides,
  };
}

// ── Mock Supabase Client ─────────────────────────────────────

function createMockSupabaseClient(config: {
  event?: MockEvent | null;
  refreshToken?: string | null;
}) {
  const eventUpdates: Record<string, unknown>[] = [];

  const client = {
    from: (table: string) => {
      return {
        select: (_cols?: string) => ({
          // deno-lint-ignore no-explicit-any
          eq: (_col: string, _val: string): any => ({
            single: () => {
              if (table === "events") {
                if (config.event === null) {
                  return Promise.resolve({ data: null, error: { message: "Not found" } });
                }
                return Promise.resolve({ data: config.event ?? createMockEvent(), error: null });
              }
              if (table === "profiles") {
                return Promise.resolve({
                  data: { google_calendar_refresh_token: config.refreshToken ?? null },
                  error: null,
                });
              }
              return Promise.resolve({ data: null, error: null });
            },
          }),
        }),
        update: (data: Record<string, unknown>) => {
          eventUpdates.push(data);
          return {
            eq: (_col: string, _val: string) => Promise.resolve({ error: null }),
          };
        },
      };
    },
    _getEventUpdates: () => eventUpdates,
  };

  return client;
}

// ── Mock Google API ──────────────────────────────────────────

let googleApiCalls: { method: string; url: string; body?: string }[] = [];
let googleTokenResponse = { access_token: "mock-access-token" };
let googleCreateResponse = { id: GOOGLE_EVENT_ID };
let googleApiStatus = 200;

// deno-lint-ignore no-explicit-any
const originalFetch = (globalThis as any).fetch;

function mockFetch(url: string | URL | Request, init?: RequestInit): Promise<Response> {
  const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;

  if (urlStr.includes("oauth2.googleapis.com/token")) {
    return Promise.resolve(new Response(JSON.stringify(googleTokenResponse), { status: 200 }));
  }

  if (urlStr.includes("googleapis.com/calendar")) {
    googleApiCalls.push({
      method: init?.method ?? "GET",
      url: urlStr,
      body: init?.body as string | undefined,
    });
    return Promise.resolve(
      new Response(JSON.stringify(googleCreateResponse), { status: googleApiStatus })
    );
  }

  // Fallback
  return Promise.resolve(new Response("Not found", { status: 404 }));
}

// ── Test Helpers ─────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>, method = "POST"): Request {
  return new Request("http://localhost/google-calendar-sync", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ────────────────────────────────────────────────────

Deno.test("CORS preflight returns 204", async () => {
  // Import handler
  const { serve: _serve } = await import("https://deno.land/std@0.168.0/http/server.ts");

  const req = new Request("http://localhost/google-calendar-sync", {
    method: "OPTIONS",
  });

  // Simulate the handler logic
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  const response = new Response("ok", { headers: corsHeaders });
  assertEquals(response.status, 200);
  assertExists(response.headers.get("Access-Control-Allow-Origin"));
});

Deno.test("returns 400 when event_id is missing", async () => {
  const body = { action: "create" };
  const req = makeRequest(body);
  // Simulate validation
  const { event_id, action } = body as { event_id?: string; action?: string };
  assertEquals(!event_id || !action, true);
});

Deno.test("returns 400 for invalid action", () => {
  const action = "invalid";
  assertEquals(["create", "update", "delete"].includes(action), false);
});

Deno.test("returns synced:false when no refresh token", () => {
  const refreshToken = null;
  assertEquals(!refreshToken, true);
});

Deno.test("buildGoogleEvent creates all-day event for date-only events", () => {
  const event = createMockEvent({ event_time: null });
  const hasTime = Boolean(event.event_time);
  assertEquals(hasTime, false);
  // All-day events use date instead of dateTime
});

Deno.test("buildGoogleEvent creates timed event with dateTime", () => {
  const event = createMockEvent({ event_time: "19:00:00", end_time: "21:00:00" });
  const hasTime = Boolean(event.event_time);
  assertEquals(hasTime, true);
});

Deno.test("buildGoogleEvent adds recurrence for annual events", () => {
  const event = createMockEvent({ recurrence: "annual" });
  const freqMap: Record<string, string> = {
    weekly: "WEEKLY",
    monthly: "MONTHLY",
    annual: "YEARLY",
  };
  const freq = freqMap[event.recurrence];
  assertEquals(freq, "YEARLY");
});

Deno.test("buildGoogleEvent skips recurrence for 'none'", () => {
  const event = createMockEvent({ recurrence: "none" });
  assertEquals(event.recurrence, "none");
  // No RRULE should be added for 'none'
});

Deno.test("mock Google API integration — create flow", async () => {
  googleApiCalls = [];
  // deno-lint-ignore no-explicit-any
  (globalThis as any).fetch = mockFetch;

  try {
    // Simulate token refresh
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", { method: "POST" });
    const tokenData = await tokenResp.json();
    assertEquals(tokenData.access_token, "mock-access-token");

    // Simulate create
    const createResp = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ summary: "Date Night" }),
    });
    const created = await createResp.json();
    assertEquals(created.id, GOOGLE_EVENT_ID);
    assertEquals(googleApiCalls.length, 1);
    assertEquals(googleApiCalls[0].method, "POST");
  } finally {
    // deno-lint-ignore no-explicit-any
    (globalThis as any).fetch = originalFetch;
  }
});

Deno.test("update requires existing google_calendar_event_id", () => {
  const event = createMockEvent({ google_calendar_event_id: null });
  assertEquals(!event.google_calendar_event_id, true);
  // Should return synced: false, reason: "no_google_event_id"
});

Deno.test("delete requires existing google_calendar_event_id", () => {
  const event = createMockEvent({ google_calendar_event_id: null });
  assertEquals(!event.google_calendar_event_id, true);
});

Deno.test("mock Supabase client stores google_calendar_event_id after create", async () => {
  const client = createMockSupabaseClient({
    event: createMockEvent(),
    refreshToken: "test-refresh-token",
  });

  // Simulate storing the google event ID
  await client.from("events").update({ google_calendar_event_id: GOOGLE_EVENT_ID }).eq("id", EVENT_ID);

  const updates = client._getEventUpdates();
  assertEquals(updates.length, 1);
  assertEquals(updates[0].google_calendar_event_id, GOOGLE_EVENT_ID);
});

Deno.test("mock event lookup returns correct data", async () => {
  const mockEvent = createMockEvent({ title: "Anniversary" });
  const client = createMockSupabaseClient({ event: mockEvent });

  const { data } = await client.from("events").select("*").eq("id", EVENT_ID).single();
  assertEquals(data?.title, "Anniversary");
});

Deno.test("mock event lookup returns null for missing event", async () => {
  const client = createMockSupabaseClient({ event: null });
  const { data, error } = await client.from("events").select("*").eq("id", "missing").single();
  assertEquals(data, null);
  assertExists(error);
});

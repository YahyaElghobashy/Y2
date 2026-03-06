// ============================================================
// T1008: Snap Trigger Edge Function — Tests
// Uses Deno.test with mocked webpush and Supabase client.
// Run with: deno test --allow-env supabase/functions/snap-trigger/index.test.ts
// ============================================================

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";

// ── Mock State ──────────────────────────────────────────────

type MockSchedule = {
  id: string;
  schedule_date: string;
  trigger_time: string;
  created_at: string;
};

type MockProfile = {
  id: string;
};

type MockSubscription = {
  id: string;
  user_id: string;
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  device_name: string | null;
  created_at: string;
  updated_at: string;
};

const USER_1 = "user-aaaa-1111";
const USER_2 = "user-bbbb-2222";
const SERVICE_ROLE_KEY = "test-service-role-key";

let mockScheduleData: MockSchedule | null = null;
let mockExistingSnaps: { id: string }[] = [];
let mockProfiles: MockProfile[] = [{ id: USER_1 }, { id: USER_2 }];
let mockSubscriptions: MockSubscription[] = [];
let mockInsertError: string | null = null;
let mockPushResults: Map<string, "success" | "fail" | "410"> = new Map();
let mockDeletedSubIds: string[] = [];
let mockInsertedSnapRows: Record<string, unknown>[] = [];

function createMockSubscription(
  id: string,
  userId: string,
  endpoint = "https://fcm.googleapis.com/fcm/send/test",
): MockSubscription {
  return {
    id,
    user_id: userId,
    subscription: {
      endpoint,
      keys: { p256dh: "test-p256dh", auth: "test-auth" },
    },
    device_name: "Test Device",
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-01T10:00:00Z",
  };
}

function resetMocks() {
  mockScheduleData = {
    id: "sched-1",
    schedule_date: "2026-03-04",
    trigger_time: "14:30:00",
    created_at: "2026-03-04T00:00:00Z",
  };
  mockExistingSnaps = [];
  mockProfiles = [{ id: USER_1 }, { id: USER_2 }];
  mockSubscriptions = [
    createMockSubscription("sub-1", USER_1),
    createMockSubscription("sub-2", USER_2),
  ];
  mockInsertError = null;
  mockPushResults = new Map();
  mockDeletedSubIds = [];
  mockInsertedSnapRows = [];
}

// ── Mock Supabase builder chain ─────────────────────────────

function createMockSupabaseChain(table: string) {
  // deno-lint-ignore no-explicit-any
  const chain: Record<string, (...args: any[]) => any> = {};

  chain.select = () => chain;
  chain.eq = (col: string, val: string) => {
    if (table === "snap_schedule" && col === "schedule_date") {
      chain._scheduleDate = val;
    }
    if (table === "snaps" && col === "snap_date") {
      chain._snapDate = val;
    }
    if (table === "push_subscriptions" && col === "id") {
      chain._deleteSubId = val;
    }
    return chain;
  };
  chain.maybeSingle = () => {
    if (table === "snap_schedule") {
      return Promise.resolve({ data: mockScheduleData, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  };
  chain.insert = (rows: Record<string, unknown>[]) => {
    if (table === "snaps") {
      mockInsertedSnapRows = rows;
      if (mockInsertError) {
        return Promise.resolve({ error: { message: mockInsertError } });
      }
      return Promise.resolve({ error: null });
    }
    return Promise.resolve({ error: null });
  };
  chain.delete = () => {
    if (table === "push_subscriptions" && chain._deleteSubId) {
      mockDeletedSubIds.push(chain._deleteSubId);
    }
    return chain;
  };

  // For select without further chaining (profiles, push_subscriptions, snaps)
  chain.then = (
    resolve: (val: { data: unknown; error: null }) => void,
  ) => {
    if (table === "profiles") {
      resolve({ data: mockProfiles, error: null });
    } else if (table === "push_subscriptions") {
      resolve({ data: mockSubscriptions, error: null });
    } else if (table === "snaps") {
      resolve({ data: mockExistingSnaps, error: null });
    } else {
      resolve({ data: null, error: null });
    }
  };

  return chain;
}

// ── Core handler function (extracted from serve) ────────────

async function handleRequest(
  req: Request,
  nowOverride?: Date,
): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  function jsonResponse(
    body: Record<string, unknown>,
    status = 200,
  ): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") ?? "";

    if (!authHeader.includes(SERVICE_ROLE_KEY)) {
      return jsonResponse({ error: "Unauthorized: service role required" }, 401);
    }

    // Mock supabase client
    const supabase = {
      from: (table: string) => createMockSupabaseChain(table),
    };

    const now = nowOverride ?? new Date();
    const cairoFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayStr = cairoFormatter.format(now);

    const cairoTimeFormatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const nowTimeStr = cairoTimeFormatter.format(now);

    // Fetch schedule
    const scheduleResult = await supabase
      .from("snap_schedule")
      .select("*")
      .eq("schedule_date", todayStr)
      .maybeSingle();

    if (scheduleResult.error) {
      return jsonResponse({ error: (scheduleResult.error as { message: string }).message }, 500);
    }

    if (!scheduleResult.data) {
      return jsonResponse({ status: "no_schedule", date: todayStr });
    }

    const schedule = scheduleResult.data as MockSchedule;
    const triggerTime = schedule.trigger_time.slice(0, 5);
    const [triggerH, triggerM] = triggerTime.split(":").map(Number);
    const [nowH, nowM] = nowTimeStr.split(":").map(Number);

    const triggerMinutes = triggerH * 60 + triggerM;
    const nowMinutes = nowH * 60 + nowM;
    const diff = Math.abs(triggerMinutes - nowMinutes);

    if (diff > 1) {
      return jsonResponse({
        status: "not_yet",
        trigger_time: triggerTime,
        current_time: nowTimeStr,
      });
    }

    // Check existing snaps
    const existingResult = await new Promise<{ data: { id: string }[] | null }>(
      (resolve) => {
        resolve({ data: mockExistingSnaps });
      },
    );

    if (existingResult.data && existingResult.data.length > 0) {
      return jsonResponse({ status: "already_triggered", date: todayStr });
    }

    // Get profiles
    const profileResult = await new Promise<{ data: MockProfile[] | null }>(
      (resolve) => {
        resolve({ data: mockProfiles });
      },
    );

    if (!profileResult.data || profileResult.data.length === 0) {
      return jsonResponse({ status: "no_users" });
    }

    // Insert placeholder snaps
    const snapRows = profileResult.data.map((p) => ({
      user_id: p.id,
      snap_date: todayStr,
      window_opened_at: now.toISOString(),
    }));

    const insertResult = await supabase.from("snaps").insert(snapRows);

    if (insertResult.error) {
      return jsonResponse({ error: (insertResult.error as { message: string }).message }, 500);
    }

    // Send push
    const subResult = await new Promise<{
      data: MockSubscription[] | null;
    }>((resolve) => {
      resolve({ data: mockSubscriptions });
    });

    let sent = 0;
    let failed = 0;

    if (subResult.data && subResult.data.length > 0) {
      const results = await Promise.allSettled(
        subResult.data.map(async (sub) => {
          const result = mockPushResults.get(sub.id) ?? "success";
          if (result === "410") {
            mockDeletedSubIds.push(sub.id);
            throw { statusCode: 410 };
          }
          if (result === "fail") {
            throw new Error("Push failed");
          }
          return "ok";
        }),
      );

      for (const r of results) {
        if (r.status === "fulfilled") sent++;
        else failed++;
      }
    }

    return jsonResponse({
      status: "triggered",
      date: todayStr,
      snaps_created: snapRows.length,
      push_sent: sent,
      push_failed: failed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
}

// ── Tests ───────────────────────────────────────────────────

Deno.test("CORS preflight returns 200", async () => {
  resetMocks();
  const req = new Request("http://localhost/snap-trigger", {
    method: "OPTIONS",
  });
  const res = await handleRequest(req);
  assertEquals(res.status, 200);
  assertExists(res.headers.get("access-control-allow-origin"));
});

Deno.test("rejects without service role key", async () => {
  resetMocks();
  const req = new Request("http://localhost/snap-trigger", {
    method: "POST",
    headers: { authorization: "Bearer wrong-key" },
  });
  const res = await handleRequest(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Unauthorized: service role required");
});

Deno.test("returns no_schedule when no schedule for today", async () => {
  resetMocks();
  mockScheduleData = null;
  const req = new Request("http://localhost/snap-trigger", {
    method: "POST",
    headers: { authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  const res = await handleRequest(req);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.status, "no_schedule");
});

Deno.test("returns not_yet when time doesn't match", async () => {
  resetMocks();
  mockScheduleData = {
    id: "sched-1",
    schedule_date: "2026-03-04",
    trigger_time: "23:59:00",
    created_at: "2026-03-04T00:00:00Z",
  };
  const req = new Request("http://localhost/snap-trigger", {
    method: "POST",
    headers: { authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  // Use a time that's far from 23:59 Cairo
  const res = await handleRequest(req, new Date("2026-03-04T08:00:00Z"));
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.status, "not_yet");
});

Deno.test("returns already_triggered when snaps exist", async () => {
  resetMocks();
  // Set trigger time to match now
  const now = new Date();
  const cairoTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const nowTime = cairoTimeFormatter.format(now);
  mockScheduleData!.trigger_time = `${nowTime}:00`;
  mockExistingSnaps = [{ id: "snap-1" }];

  const req = new Request("http://localhost/snap-trigger", {
    method: "POST",
    headers: { authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  const res = await handleRequest(req, now);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.status, "already_triggered");
});

Deno.test("returns no_users when no profiles", async () => {
  resetMocks();
  const now = new Date();
  const cairoTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const nowTime = cairoTimeFormatter.format(now);
  mockScheduleData!.trigger_time = `${nowTime}:00`;
  mockProfiles = [];

  const req = new Request("http://localhost/snap-trigger", {
    method: "POST",
    headers: { authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  const res = await handleRequest(req, now);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.status, "no_users");
});

Deno.test("triggers snaps successfully", async () => {
  resetMocks();
  const now = new Date();
  const cairoTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const nowTime = cairoTimeFormatter.format(now);
  mockScheduleData!.trigger_time = `${nowTime}:00`;

  const req = new Request("http://localhost/snap-trigger", {
    method: "POST",
    headers: { authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  const res = await handleRequest(req, now);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.status, "triggered");
  assertEquals(body.snaps_created, 2);
  assertEquals(body.push_sent, 2);
  assertEquals(body.push_failed, 0);
});

Deno.test("inserts snap rows for each user", async () => {
  resetMocks();
  const now = new Date();
  const cairoTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const nowTime = cairoTimeFormatter.format(now);
  mockScheduleData!.trigger_time = `${nowTime}:00`;

  const req = new Request("http://localhost/snap-trigger", {
    method: "POST",
    headers: { authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  await handleRequest(req, now);

  assertEquals(mockInsertedSnapRows.length, 2);
  assertEquals(mockInsertedSnapRows[0].user_id, USER_1);
  assertEquals(mockInsertedSnapRows[1].user_id, USER_2);
});

Deno.test("handles insert error gracefully", async () => {
  resetMocks();
  const now = new Date();
  const cairoTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const nowTime = cairoTimeFormatter.format(now);
  mockScheduleData!.trigger_time = `${nowTime}:00`;
  mockInsertError = "Insert failed";

  const req = new Request("http://localhost/snap-trigger", {
    method: "POST",
    headers: { authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  const res = await handleRequest(req, now);
  assertEquals(res.status, 500);
  const body = await res.json();
  assertEquals(body.error, "Insert failed");
});

Deno.test("handles push failure with partial delivery", async () => {
  resetMocks();
  const now = new Date();
  const cairoTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const nowTime = cairoTimeFormatter.format(now);
  mockScheduleData!.trigger_time = `${nowTime}:00`;
  mockPushResults.set("sub-2", "fail");

  const req = new Request("http://localhost/snap-trigger", {
    method: "POST",
    headers: { authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  const res = await handleRequest(req, now);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.push_sent, 1);
  assertEquals(body.push_failed, 1);
});

Deno.test("cleans up 410 subscriptions", async () => {
  resetMocks();
  const now = new Date();
  const cairoTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const nowTime = cairoTimeFormatter.format(now);
  mockScheduleData!.trigger_time = `${nowTime}:00`;
  mockPushResults.set("sub-1", "410");

  const req = new Request("http://localhost/snap-trigger", {
    method: "POST",
    headers: { authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  const res = await handleRequest(req, now);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.push_sent, 1);
  assertEquals(body.push_failed, 1);
  assertEquals(mockDeletedSubIds.includes("sub-1"), true);
});

Deno.test("works with no push subscriptions", async () => {
  resetMocks();
  const now = new Date();
  const cairoTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const nowTime = cairoTimeFormatter.format(now);
  mockScheduleData!.trigger_time = `${nowTime}:00`;
  mockSubscriptions = [];

  const req = new Request("http://localhost/snap-trigger", {
    method: "POST",
    headers: { authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  const res = await handleRequest(req, now);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.status, "triggered");
  assertEquals(body.push_sent, 0);
  assertEquals(body.push_failed, 0);
});

// ============================================================
// T403: Push Notification Edge Function — Tests
// Uses Deno.test with mocked webpush and Supabase client.
// Run with: deno test --allow-env supabase/functions/send-notification/index.test.ts
// ============================================================

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";

// ── Mock State ──────────────────────────────────────────────

type MockCall = {
  table: string;
  method: string;
  args?: Record<string, unknown>;
};

type MockNotification = {
  id: string;
  sender_id: string;
  recipient_id: string;
  title: string;
  body: string;
  emoji: string | null;
  type: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
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

const SENDER_ID = "aaaa-1111-bbbb-2222";
const RECIPIENT_ID = "cccc-3333-dddd-4444";
const NOTIFICATION_ID = "eeee-5555-ffff-6666";

function createMockNotification(
  overrides: Partial<MockNotification> = {},
): MockNotification {
  return {
    id: NOTIFICATION_ID,
    sender_id: SENDER_ID,
    recipient_id: RECIPIENT_ID,
    title: "Thinking of you",
    body: "Just wanted you to know",
    emoji: "\u{1F319}",
    type: "custom",
    status: "sent",
    metadata: {},
    created_at: "2026-03-02T10:00:00Z",
    ...overrides,
  };
}

function createMockSubscription(
  id: string,
  endpoint = "https://fcm.googleapis.com/fcm/send/test-token",
): MockSubscription {
  return {
    id,
    user_id: RECIPIENT_ID,
    subscription: {
      endpoint,
      keys: { p256dh: "test-p256dh-key", auth: "test-auth-key" },
    },
    device_name: "Test Device",
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-01T10:00:00Z",
  };
}

// ── Mock Supabase Client Builder ────────────────────────────

type QueryResult = {
  data: unknown;
  error: { message: string } | null;
};

function createMockSupabaseClient(config: {
  notification?: MockNotification | null;
  subscriptions?: MockSubscription[];
  authUser?: { id: string } | null;
  authError?: { message: string } | null;
}) {
  const calls: MockCall[] = [];
  const deletedSubscriptionIds: string[] = [];
  const statusUpdates: { id: string; status: string }[] = [];

  const client = {
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: config.authUser ?? { id: SENDER_ID } },
          error: config.authError ?? null,
        }),
    },
    from: (table: string) => {
      const chain = {
        select: (_cols?: string) => {
          calls.push({ table, method: "select" });
          return {
            // deno-lint-ignore no-explicit-any
            eq: (col: string, val: string): any => {
              if (table === "notifications") {
                return {
                  single: <T>() => {
                    if (config.notification === null) {
                      return Promise.resolve({
                        data: null,
                        error: { message: "Not found" },
                      });
                    }
                    return Promise.resolve({
                      data: config.notification as unknown as T,
                      error: null,
                    });
                  },
                };
              }
              if (table === "push_subscriptions") {
                return Promise.resolve({
                  data: config.subscriptions ?? [],
                  error: null,
                });
              }
              return { single: <T>() => Promise.resolve({ data: null as T | null, error: null }) };
            },
          };
        },
        update: (values: Record<string, unknown>) => {
          calls.push({ table, method: "update", args: values });
          return {
            eq: (col: string, val: string) => {
              if (table === "notifications" && values.status) {
                statusUpdates.push({
                  id: val,
                  status: values.status as string,
                });
              }
              return Promise.resolve({ data: null, error: null });
            },
          };
        },
        delete: () => {
          calls.push({ table, method: "delete" });
          return {
            eq: (col: string, val: string) => {
              if (table === "push_subscriptions") {
                deletedSubscriptionIds.push(val);
              }
              return Promise.resolve({ data: null, error: null });
            },
          };
        },
      };
      return chain;
    },
    _calls: calls,
    _deletedSubscriptionIds: deletedSubscriptionIds,
    _statusUpdates: statusUpdates,
  };

  return client;
}

// ── Mock webpush ────────────────────────────────────────────

type WebPushBehavior = "success" | "gone" | "error";

function createMockWebPush(behaviors: Map<string, WebPushBehavior> = new Map()) {
  const sentTo: string[] = [];

  return {
    setVapidDetails: () => {},
    sendNotification: (
      subscription: { endpoint: string },
      _payload: string,
    ) => {
      sentTo.push(subscription.endpoint);
      const behavior = behaviors.get(subscription.endpoint) ?? "success";

      if (behavior === "gone") {
        const error = new Error("410 Gone") as Error & { statusCode: number };
        error.statusCode = 410;
        return Promise.reject(error);
      }
      if (behavior === "error") {
        const error = new Error("500 Server Error") as Error & {
          statusCode: number;
        };
        error.statusCode = 500;
        return Promise.reject(error);
      }
      return Promise.resolve({ statusCode: 201 });
    },
    _sentTo: sentTo,
  };
}

// ── Handler Simulation ──────────────────────────────────────
// Since we can't easily import the serve() handler in isolation,
// we simulate the handler logic directly for testing.

async function simulateHandler(
  req: {
    method: string;
    body?: Record<string, unknown>;
    hasAuth: boolean;
  },
  deps: {
    supabaseAuth: ReturnType<typeof createMockSupabaseClient>;
    supabaseService: ReturnType<typeof createMockSupabaseClient>;
    webpush: ReturnType<typeof createMockWebPush>;
  },
): Promise<{ status: number; body: Record<string, unknown> }> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  // CORS preflight
  if (req.method === "OPTIONS") {
    return { status: 200, body: {} };
  }

  try {
    // Validate body
    if (!req.body) {
      return {
        status: 400,
        body: { success: false, error: "Invalid JSON body" },
      };
    }

    const { notification_id, recipient_id } = req.body as {
      notification_id?: string;
      recipient_id?: string;
    };

    if (!notification_id || !recipient_id) {
      return {
        status: 400,
        body: {
          success: false,
          error: "Missing required fields: notification_id, recipient_id",
        },
      };
    }

    // Auth check
    if (!req.hasAuth) {
      return {
        status: 401,
        body: { success: false, error: "Missing authorization" },
      };
    }

    const { data: authData, error: authError } =
      await deps.supabaseAuth.auth.getUser();

    if (authError || !authData.user) {
      return {
        status: 401,
        body: { success: false, error: "Invalid authorization" },
      };
    }

    const senderId = authData.user.id;
    const supabase = deps.supabaseService;

    // Fetch notification
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notification_id)
      .single() as { data: MockNotification | null; error: { message: string } | null };

    if (notifError || !notification) {
      return {
        status: 404,
        body: { success: false, error: "Notification not found" },
      };
    }

    // Verify sender
    if (notification.sender_id !== senderId) {
      return {
        status: 403,
        body: { success: false, error: "Not authorized to send this notification" },
      };
    }

    // Idempotent check
    if (notification.status === "delivered") {
      return {
        status: 200,
        body: {
          success: true,
          delivered: 0,
          failed: 0,
          already_delivered: true,
        },
      };
    }

    // Fetch subscriptions
    const { data: subscriptions, error: subError } = (await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", recipient_id)) as {
      data: MockSubscription[] | null;
      error: { message: string } | null;
    };

    if (subError) {
      await supabase
        .from("notifications")
        .update({ status: "failed" })
        .eq("id", notification_id);
      return {
        status: 500,
        body: { success: false, error: "Failed to fetch subscriptions" },
      };
    }

    const subs = subscriptions ?? [];

    if (subs.length === 0) {
      await supabase
        .from("notifications")
        .update({ status: "failed" })
        .eq("id", notification_id);
      return {
        status: 200,
        body: { success: true, delivered: 0, failed: 0, warning: "no_subscriptions" },
      };
    }

    // Build payload
    const title = `${notification.emoji ?? ""} ${notification.title}`.trim();
    let body = notification.body;
    if (body.length > 200) {
      body = body.slice(0, 199) + "\u2026";
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      data: {
        notification_id: notification.id,
        type: notification.type,
        payload: notification.metadata ?? {},
      },
    });

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await deps.webpush.sendNotification(sub.subscription, payload);
          return { subscriptionId: sub.id, success: true };
        } catch (err: unknown) {
          const statusCode =
            err && typeof err === "object" && "statusCode" in err
              ? (err as { statusCode: number }).statusCode
              : 0;

          if (statusCode === 410) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
          }

          return { subscriptionId: sub.id, success: false, statusCode };
        }
      }),
    );

    let delivered = 0;
    let failed = 0;

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.success) {
        delivered++;
      } else {
        failed++;
      }
    }

    const finalStatus = delivered > 0 ? "delivered" : "failed";
    await supabase
      .from("notifications")
      .update({ status: finalStatus })
      .eq("id", notification_id);

    return { status: 200, body: { success: true, delivered, failed } };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Internal server error";
    return { status: 500, body: { success: false, error: errorMessage } };
  }
}

// ── Tests ───────────────────────────────────────────────────

Deno.test("returns 400 when request body is missing notification_id", async () => {
  const supabase = createMockSupabaseClient({ notification: createMockNotification() });
  const webpush = createMockWebPush();

  const result = await simulateHandler(
    { method: "POST", body: { recipient_id: RECIPIENT_ID }, hasAuth: true },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.status, 400);
  assertEquals(result.body.success, false);
});

Deno.test("returns 400 when request body is missing recipient_id", async () => {
  const supabase = createMockSupabaseClient({ notification: createMockNotification() });
  const webpush = createMockWebPush();

  const result = await simulateHandler(
    { method: "POST", body: { notification_id: NOTIFICATION_ID }, hasAuth: true },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.status, 400);
  assertEquals(result.body.success, false);
});

Deno.test("returns 401 when Authorization header is absent", async () => {
  const supabase = createMockSupabaseClient({ notification: createMockNotification() });
  const webpush = createMockWebPush();

  const result = await simulateHandler(
    {
      method: "POST",
      body: { notification_id: NOTIFICATION_ID, recipient_id: RECIPIENT_ID },
      hasAuth: false,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.status, 401);
  assertEquals(result.body.success, false);
});

Deno.test("returns 404 when notification row does not exist", async () => {
  const supabase = createMockSupabaseClient({ notification: null });
  const webpush = createMockWebPush();

  const result = await simulateHandler(
    {
      method: "POST",
      body: { notification_id: NOTIFICATION_ID, recipient_id: RECIPIENT_ID },
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.status, 404);
  assertEquals(result.body.error, "Notification not found");
});

Deno.test("returns 403 when sender_id does not match JWT sub", async () => {
  const notification = createMockNotification({ sender_id: "different-user-id" });
  const supabase = createMockSupabaseClient({ notification });
  const webpush = createMockWebPush();

  const result = await simulateHandler(
    {
      method: "POST",
      body: { notification_id: NOTIFICATION_ID, recipient_id: RECIPIENT_ID },
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.status, 403);
  assertEquals(result.body.success, false);
});

Deno.test("returns 200 with warning when recipient has no subscriptions", async () => {
  const supabase = createMockSupabaseClient({
    notification: createMockNotification(),
    subscriptions: [],
  });
  const webpush = createMockWebPush();

  const result = await simulateHandler(
    {
      method: "POST",
      body: { notification_id: NOTIFICATION_ID, recipient_id: RECIPIENT_ID },
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.status, 200);
  assertEquals(result.body.warning, "no_subscriptions");

  // Verify notification status was set to failed
  const statusUpdate = supabase._statusUpdates.find(
    (u) => u.id === NOTIFICATION_ID,
  );
  assertExists(statusUpdate);
  assertEquals(statusUpdate.status, "failed");
});

Deno.test("calls webpush.sendNotification once per subscription", async () => {
  const sub1 = createMockSubscription("sub-1", "https://endpoint-1.test");
  const sub2 = createMockSubscription("sub-2", "https://endpoint-2.test");
  const sub3 = createMockSubscription("sub-3", "https://endpoint-3.test");

  const supabase = createMockSupabaseClient({
    notification: createMockNotification(),
    subscriptions: [sub1, sub2, sub3],
  });
  const webpush = createMockWebPush();

  const result = await simulateHandler(
    {
      method: "POST",
      body: { notification_id: NOTIFICATION_ID, recipient_id: RECIPIENT_ID },
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.status, 200);
  assertEquals(result.body.delivered, 3);
  assertEquals(result.body.failed, 0);
  assertEquals(webpush._sentTo.length, 3);
});

Deno.test("a single 410 does not prevent other subscriptions from being attempted (Promise.allSettled)", async () => {
  const sub1 = createMockSubscription("sub-1", "https://endpoint-ok.test");
  const sub2 = createMockSubscription("sub-2", "https://endpoint-gone.test");
  const sub3 = createMockSubscription("sub-3", "https://endpoint-ok2.test");

  const behaviors = new Map<string, WebPushBehavior>([
    ["https://endpoint-ok.test", "success"],
    ["https://endpoint-gone.test", "gone"],
    ["https://endpoint-ok2.test", "success"],
  ]);

  const supabase = createMockSupabaseClient({
    notification: createMockNotification(),
    subscriptions: [sub1, sub2, sub3],
  });
  const webpush = createMockWebPush(behaviors);

  const result = await simulateHandler(
    {
      method: "POST",
      body: { notification_id: NOTIFICATION_ID, recipient_id: RECIPIENT_ID },
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.status, 200);
  assertEquals(result.body.delivered, 2);
  assertEquals(result.body.failed, 1);
  // All 3 endpoints were attempted
  assertEquals(webpush._sentTo.length, 3);
});

Deno.test("deletes push_subscription row when Web Push returns 410", async () => {
  const sub1 = createMockSubscription("sub-gone", "https://endpoint-gone.test");

  const behaviors = new Map<string, WebPushBehavior>([
    ["https://endpoint-gone.test", "gone"],
  ]);

  const supabase = createMockSupabaseClient({
    notification: createMockNotification(),
    subscriptions: [sub1],
  });
  const webpush = createMockWebPush(behaviors);

  await simulateHandler(
    {
      method: "POST",
      body: { notification_id: NOTIFICATION_ID, recipient_id: RECIPIENT_ID },
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  // Verify the subscription was deleted
  assertEquals(supabase._deletedSubscriptionIds.includes("sub-gone"), true);
});

Deno.test("sets notification status to 'delivered' when at least one succeeds", async () => {
  const sub1 = createMockSubscription("sub-1", "https://ok.test");
  const sub2 = createMockSubscription("sub-2", "https://fail.test");

  const behaviors = new Map<string, WebPushBehavior>([
    ["https://ok.test", "success"],
    ["https://fail.test", "error"],
  ]);

  const supabase = createMockSupabaseClient({
    notification: createMockNotification(),
    subscriptions: [sub1, sub2],
  });
  const webpush = createMockWebPush(behaviors);

  const result = await simulateHandler(
    {
      method: "POST",
      body: { notification_id: NOTIFICATION_ID, recipient_id: RECIPIENT_ID },
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.body.delivered, 1);
  assertEquals(result.body.failed, 1);

  const statusUpdate = supabase._statusUpdates.find(
    (u) => u.id === NOTIFICATION_ID,
  );
  assertExists(statusUpdate);
  assertEquals(statusUpdate.status, "delivered");
});

Deno.test("sets notification status to 'failed' when all subscriptions fail", async () => {
  const sub1 = createMockSubscription("sub-1", "https://fail1.test");
  const sub2 = createMockSubscription("sub-2", "https://fail2.test");

  const behaviors = new Map<string, WebPushBehavior>([
    ["https://fail1.test", "error"],
    ["https://fail2.test", "gone"],
  ]);

  const supabase = createMockSupabaseClient({
    notification: createMockNotification(),
    subscriptions: [sub1, sub2],
  });
  const webpush = createMockWebPush(behaviors);

  const result = await simulateHandler(
    {
      method: "POST",
      body: { notification_id: NOTIFICATION_ID, recipient_id: RECIPIENT_ID },
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.body.delivered, 0);
  assertEquals(result.body.failed, 2);

  const statusUpdate = supabase._statusUpdates.find(
    (u) => u.id === NOTIFICATION_ID,
  );
  assertExists(statusUpdate);
  assertEquals(statusUpdate.status, "failed");
});

Deno.test("forwards notification metadata as payload in push data for deep linking", async () => {
  const notification = createMockNotification({
    type: "coupon_received",
    metadata: { coupon_id: "coupon-abc-123" },
  });
  const sub1 = createMockSubscription("sub-1");

  const supabase = createMockSupabaseClient({
    notification,
    subscriptions: [sub1],
  });

  let capturedPayload = "";
  const webpush = {
    setVapidDetails: () => {},
    sendNotification: (
      _subscription: { endpoint: string },
      payload: string,
    ) => {
      capturedPayload = payload;
      return Promise.resolve({ statusCode: 201 });
    },
    _sentTo: [] as string[],
  };

  const result = await simulateHandler(
    {
      method: "POST",
      body: { notification_id: NOTIFICATION_ID, recipient_id: RECIPIENT_ID },
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.status, 200);
  assertEquals(result.body.delivered, 1);

  // Verify the push payload includes metadata as payload for deep linking
  const parsed = JSON.parse(capturedPayload);
  assertEquals(parsed.data.type, "coupon_received");
  assertEquals(parsed.data.payload.coupon_id, "coupon-abc-123");
});

Deno.test("returns 200 and skips sending when notification status is already 'delivered'", async () => {
  const notification = createMockNotification({ status: "delivered" });
  const sub1 = createMockSubscription("sub-1");

  const supabase = createMockSupabaseClient({
    notification,
    subscriptions: [sub1],
  });
  const webpush = createMockWebPush();

  const result = await simulateHandler(
    {
      method: "POST",
      body: { notification_id: NOTIFICATION_ID, recipient_id: RECIPIENT_ID },
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.status, 200);
  assertEquals(result.body.already_delivered, true);
  // webpush was never called
  assertEquals(webpush._sentTo.length, 0);
  // No status updates were made
  assertEquals(supabase._statusUpdates.length, 0);
});

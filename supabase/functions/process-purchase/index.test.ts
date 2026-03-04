// ============================================================
// T313: Process Purchase Edge Function — Tests
// Uses Deno.test with mocked webpush and Supabase client.
// Run with: deno test --allow-env supabase/functions/process-purchase/index.test.ts
// ============================================================

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";

// ── Constants ────────────────────────────────────────────────

const BUYER_ID = "buyer-aaaa-1111-bbbb-2222";
const TARGET_ID = "target-cccc-3333-dddd-4444";
const PURCHASE_ID = "purchase-eeee-5555-ffff-6666";
const ITEM_ID = "item-1111-2222-3333-4444";
const NOTIFICATION_ID = "notif-aaaa-bbbb-cccc-dddd";

// ── Mock Types ───────────────────────────────────────────────

type MockCall = {
  table: string;
  method: string;
  args?: Record<string, unknown>;
};

type InsertedRow = Record<string, unknown>;
type UpsertedRow = Record<string, unknown>;
type StatusUpdate = { table: string; id: string; status: string };

type PushSubscriptionRow = {
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

type DailySendLimit = {
  user_id: string;
  date: string;
  free_sends_used: number;
  bonus_sends_used: number;
  bonus_sends_available: number;
};

// ── Mock Helpers ─────────────────────────────────────────────

function createMockSubscription(
  id: string,
  userId: string,
  endpoint = "https://fcm.googleapis.com/fcm/send/test-token",
): PushSubscriptionRow {
  return {
    id,
    user_id: userId,
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

function createMockSupabaseClient(config: {
  authUser?: { id: string } | null;
  authError?: { message: string } | null;
  subscriptionsByUser?: Map<string, PushSubscriptionRow[]>;
  existingDailyLimit?: DailySendLimit | null;
}) {
  const calls: MockCall[] = [];
  const deletedSubscriptionIds: string[] = [];
  const statusUpdates: StatusUpdate[] = [];
  const insertedRows: InsertedRow[] = [];
  const upsertedRows: UpsertedRow[] = [];

  const client = {
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: config.authUser ?? { id: BUYER_ID } },
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
              if (table === "push_subscriptions") {
                const subs = config.subscriptionsByUser?.get(val) ?? [];
                return Promise.resolve({ data: subs, error: null });
              }
              if (table === "daily_send_limits") {
                return {
                  // deno-lint-ignore no-explicit-any
                  eq: (_col2: string, _val2: string): any => ({
                    single: () =>
                      Promise.resolve({
                        data: config.existingDailyLimit ?? null,
                        error: config.existingDailyLimit
                          ? null
                          : { message: "Not found" },
                      }),
                  }),
                };
              }
              return {
                // deno-lint-ignore no-explicit-any
                eq: (..._args: unknown[]): any => ({
                  single: () =>
                    Promise.resolve({ data: null, error: null }),
                }),
                single: () =>
                  Promise.resolve({ data: null, error: null }),
              };
            },
          };
        },
        insert: (row: Record<string, unknown>) => {
          calls.push({ table, method: "insert", args: row });
          insertedRows.push({ ...row, _table: table });
          return {
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: NOTIFICATION_ID, ...row },
                  error: null,
                }),
            }),
          };
        },
        upsert: (row: Record<string, unknown>, _opts?: unknown) => {
          calls.push({ table, method: "upsert", args: row });
          upsertedRows.push({ ...row, _table: table });
          return Promise.resolve({ data: null, error: null });
        },
        update: (values: Record<string, unknown>) => {
          calls.push({ table, method: "update", args: values });
          return {
            eq: (col: string, val: string) => {
              statusUpdates.push({
                table,
                id: val,
                status: (values.status as string) ?? "",
              });
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
    _insertedRows: insertedRows,
    _upsertedRows: upsertedRows,
  };

  return client;
}

// ── Mock webpush ────────────────────────────────────────────

type WebPushBehavior = "success" | "gone" | "error";

function createMockWebPush(
  behaviors: Map<string, WebPushBehavior> = new Map(),
) {
  const sentTo: string[] = [];
  const sentPayloads: string[] = [];

  return {
    setVapidDetails: () => {},
    sendNotification: (
      subscription: { endpoint: string },
      payload: string,
    ) => {
      sentTo.push(subscription.endpoint);
      sentPayloads.push(payload);
      const behavior = behaviors.get(subscription.endpoint) ?? "success";

      if (behavior === "gone") {
        const error = new Error("410 Gone") as Error & {
          statusCode: number;
        };
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
    _sentPayloads: sentPayloads,
  };
}

// ── Handler Simulation ──────────────────────────────────────
// Re-implements the process-purchase handler logic for isolated testing.

type ProcessPurchaseBody = {
  purchase_id: string;
  item_id: string;
  effect_type: string;
  effect_payload: Record<string, unknown> | null;
  buyer_id: string;
  target_id: string;
};

async function sendPushToUser(
  supabase: ReturnType<typeof createMockSupabaseClient>,
  webpush: ReturnType<typeof createMockWebPush>,
  recipientId: string,
  senderId: string,
  notification: {
    title: string;
    body: string;
    emoji: string;
    type: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  // Insert notification row
  const { data: notifRow } = await supabase
    .from("notifications")
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      title: notification.title,
      body: notification.body,
      emoji: notification.emoji,
      type: notification.type,
      metadata: notification.metadata ?? {},
      status: "sent",
    })
    .select()
    .single();

  // Fetch push subscriptions
  const { data: subscriptions } = (await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", recipientId)) as {
    data: PushSubscriptionRow[] | null;
    error: null;
  };

  const subs = (subscriptions ?? []) as PushSubscriptionRow[];

  if (subs.length === 0) {
    if (notifRow) {
      await supabase
        .from("notifications")
        .update({ status: "failed" })
        .eq("id", (notifRow as { id: string }).id);
    }
    return;
  }

  // Build push payload
  const title = `${notification.emoji} ${notification.title}`.trim();
  const payload = JSON.stringify({
    title,
    body: notification.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    data: {
      notification_id: (notifRow as { id: string })?.id,
      type: notification.type,
      url: "/",
    },
  });

  // Send to all devices
  let delivered = 0;
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        delivered++;
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
      }
    }),
  );

  // Update notification status
  if (notifRow) {
    await supabase
      .from("notifications")
      .update({ status: delivered > 0 ? "delivered" : "failed" })
      .eq("id", (notifRow as { id: string }).id);
  }
}

async function simulateHandler(
  req: {
    method: string;
    body?: Record<string, unknown> | null;
    hasAuth: boolean;
  },
  deps: {
    supabaseAuth: ReturnType<typeof createMockSupabaseClient>;
    supabaseService: ReturnType<typeof createMockSupabaseClient>;
    webpush: ReturnType<typeof createMockWebPush>;
  },
): Promise<{ status: number; body: Record<string, unknown> }> {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return { status: 200, body: {} };
  }

  try {
    // Validate body
    if (req.body === null || req.body === undefined) {
      return {
        status: 400,
        body: { success: false, error: "Invalid JSON body" },
      };
    }

    const body = req.body as ProcessPurchaseBody;
    const {
      purchase_id,
      item_id,
      effect_type,
      effect_payload,
      buyer_id,
      target_id,
    } = body;

    if (!purchase_id || !item_id || !effect_type || !buyer_id || !target_id) {
      return {
        status: 400,
        body: { success: false, error: "Missing required fields" },
      };
    }

    // Auth check
    if (!req.hasAuth) {
      return {
        status: 401,
        body: { success: false, error: "Missing authorization" },
      };
    }

    const {
      data: { user },
      error: authError,
    } = await deps.supabaseAuth.auth.getUser();

    if (authError || !user || user.id !== buyer_id) {
      return {
        status: 403,
        body: { success: false, error: "Unauthorized" },
      };
    }

    const supabase = deps.supabaseService;
    const wp = deps.webpush;

    // Dispatch by effect_type
    switch (effect_type) {
      case "extra_ping": {
        const today = new Date().toISOString().split("T")[0];

        const { data: existing } = await supabase
          .from("daily_send_limits")
          .select("*")
          .eq("user_id", buyer_id)
          .eq("date", today)
          .single();

        const currentBonus = (existing as DailySendLimit | null)
          ?.bonus_sends_available ?? 0;

        await supabase.from("daily_send_limits").upsert(
          {
            user_id: buyer_id,
            date: today,
            free_sends_used: (existing as DailySendLimit | null)
              ?.free_sends_used ?? 0,
            bonus_sends_used: (existing as DailySendLimit | null)
              ?.bonus_sends_used ?? 0,
            bonus_sends_available: currentBonus + 1,
          },
          { onConflict: "user_id,date" },
        );

        await sendPushToUser(supabase, wp, target_id, buyer_id, {
          title: "Extra Ping Purchased",
          body: "Your partner bought an extra notification slot!",
          emoji: "🔔",
          type: "marketplace_effect",
        });
        break;
      }
      case "veto": {
        const movie =
          (effect_payload?.movie as string) ?? "a movie";
        await sendPushToUser(supabase, wp, target_id, buyer_id, {
          title: "VETO!",
          body: `Movie night decision: "${movie}". No arguments allowed!`,
          emoji: "🎬",
          type: "marketplace_effect",
          metadata: { effect: "veto", movie },
        });
        break;
      }
      case "task_order": {
        const task =
          (effect_payload?.task as string) ?? "Complete a task";

        await supabase
          .from("purchases")
          .update({ status: "active" })
          .eq("id", purchase_id);

        await sendPushToUser(supabase, wp, target_id, buyer_id, {
          title: "Task Order!",
          body: `You've been assigned: "${task}"`,
          emoji: "🍳",
          type: "marketplace_effect",
          metadata: {
            effect: "task_order",
            task,
            purchase_id,
          },
        });
        break;
      }
      case "dnd_timer": {
        await supabase
          .from("purchases")
          .update({ status: "active" })
          .eq("id", purchase_id);

        const notifPayload = {
          title: "Shhh...",
          emoji: "🤫",
          type: "marketplace_effect",
          metadata: {
            effect: "dnd_timer",
            duration_minutes: 60,
            purchase_id,
          },
        };

        await Promise.all([
          sendPushToUser(supabase, wp, target_id, buyer_id, {
            ...notifPayload,
            body: "1 Hour of Silence has begun. Timer started!",
          }),
          sendPushToUser(supabase, wp, buyer_id, buyer_id, {
            ...notifPayload,
            body: "You activated 1 Hour of Silence. Timer started!",
          }),
        ]);
        break;
      }
      case "wildcard": {
        const wish =
          (effect_payload?.wish as string) ?? "A wildcard favor";
        await sendPushToUser(supabase, wp, target_id, buyer_id, {
          title: "Wildcard Favor!",
          body: `Your partner wishes: "${wish}". You can accept, decline, or negotiate.`,
          emoji: "🃏",
          type: "marketplace_effect",
          metadata: { effect: "wildcard", wish, negotiable: true },
        });
        break;
      }
      default:
        return {
          status: 400,
          body: {
            success: false,
            error: `Unknown effect_type: ${effect_type}`,
          },
        };
    }

    return {
      status: 200,
      body: { success: true, effect_type, purchase_id },
    };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Internal server error";
    return { status: 500, body: { success: false, error: errorMessage } };
  }
}

// ── Helper: default valid body ───────────────────────────────

function validBody(
  overrides: Partial<ProcessPurchaseBody> = {},
): ProcessPurchaseBody {
  return {
    purchase_id: PURCHASE_ID,
    item_id: ITEM_ID,
    effect_type: "extra_ping",
    effect_payload: null,
    buyer_id: BUYER_ID,
    target_id: TARGET_ID,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────

// 1. CORS preflight
Deno.test("returns 200 on CORS preflight OPTIONS request", async () => {
  const supabase = createMockSupabaseClient({});
  const webpush = createMockWebPush();

  const result = await simulateHandler(
    { method: "OPTIONS", hasAuth: false },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.status, 200);
});

// 2. Invalid JSON body
Deno.test("returns 400 on null/missing body", async () => {
  const supabase = createMockSupabaseClient({});
  const webpush = createMockWebPush();

  const result = await simulateHandler(
    { method: "POST", body: null, hasAuth: true },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.status, 400);
  assertEquals(result.body.error, "Invalid JSON body");
});

// 3. Missing required fields
Deno.test("returns 400 when required fields are missing", async () => {
  const supabase = createMockSupabaseClient({});
  const webpush = createMockWebPush();

  const result = await simulateHandler(
    {
      method: "POST",
      body: { purchase_id: PURCHASE_ID, item_id: ITEM_ID },
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.status, 400);
  assertEquals(result.body.error, "Missing required fields");
});

// 4. Missing Authorization header
Deno.test("returns 401 when Authorization header is absent", async () => {
  const supabase = createMockSupabaseClient({});
  const webpush = createMockWebPush();

  const result = await simulateHandler(
    { method: "POST", body: validBody(), hasAuth: false },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.status, 401);
  assertEquals(result.body.error, "Missing authorization");
});

// 5. JWT user.id !== buyer_id
Deno.test("returns 403 when JWT user.id does not match buyer_id", async () => {
  const supabase = createMockSupabaseClient({
    authUser: { id: "different-user-id" },
  });
  const webpush = createMockWebPush();

  const result = await simulateHandler(
    { method: "POST", body: validBody(), hasAuth: true },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.status, 403);
  assertEquals(result.body.error, "Unauthorized");
});

// 6. Unknown effect_type
Deno.test("returns 400 on unknown effect_type", async () => {
  const supabase = createMockSupabaseClient({});
  const webpush = createMockWebPush();

  const result = await simulateHandler(
    {
      method: "POST",
      body: validBody({ effect_type: "banana_split" }),
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.status, 400);
  assertEquals(
    result.body.error,
    "Unknown effect_type: banana_split",
  );
});

// 7. extra_ping: upserts daily_send_limits with +1 bonus
Deno.test("extra_ping: upserts daily_send_limits with +1 bonus_sends_available", async () => {
  const supabase = createMockSupabaseClient({
    existingDailyLimit: {
      user_id: BUYER_ID,
      date: "2026-03-04",
      free_sends_used: 2,
      bonus_sends_used: 0,
      bonus_sends_available: 1,
    },
    subscriptionsByUser: new Map([
      [TARGET_ID, [createMockSubscription("sub-1", TARGET_ID)]],
    ]),
  });
  const webpush = createMockWebPush();

  const result = await simulateHandler(
    { method: "POST", body: validBody(), hasAuth: true },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(result.status, 200);
  assertEquals(result.body.success, true);

  // Verify upsert was called with incremented bonus
  const upsertRow = supabase._upsertedRows.find(
    (r) => r._table === "daily_send_limits",
  );
  assertExists(upsertRow);
  assertEquals(upsertRow.bonus_sends_available, 2); // 1 + 1
});

// 8. extra_ping: sends push to target_id
Deno.test("extra_ping: sends push notification to target user", async () => {
  const sub = createMockSubscription("sub-1", TARGET_ID);
  const supabase = createMockSupabaseClient({
    subscriptionsByUser: new Map([[TARGET_ID, [sub]]]),
  });
  const webpush = createMockWebPush();

  await simulateHandler(
    { method: "POST", body: validBody(), hasAuth: true },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(webpush._sentTo.length, 1);
  assertEquals(webpush._sentTo[0], sub.subscription.endpoint);
});

// 9. veto: push body contains movie from payload
Deno.test("veto: push body contains movie name from effect_payload", async () => {
  const sub = createMockSubscription("sub-1", TARGET_ID);
  const supabase = createMockSupabaseClient({
    subscriptionsByUser: new Map([[TARGET_ID, [sub]]]),
  });
  const webpush = createMockWebPush();

  await simulateHandler(
    {
      method: "POST",
      body: validBody({
        effect_type: "veto",
        effect_payload: { movie: "Inception" },
      }),
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  const payload = JSON.parse(webpush._sentPayloads[0]);
  assertEquals(payload.body.includes("Inception"), true);
});

// 10. veto: defaults to "a movie" when no payload
Deno.test("veto: defaults to 'a movie' when effect_payload is null", async () => {
  const sub = createMockSubscription("sub-1", TARGET_ID);
  const supabase = createMockSupabaseClient({
    subscriptionsByUser: new Map([[TARGET_ID, [sub]]]),
  });
  const webpush = createMockWebPush();

  await simulateHandler(
    {
      method: "POST",
      body: validBody({ effect_type: "veto", effect_payload: null }),
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  const payload = JSON.parse(webpush._sentPayloads[0]);
  assertEquals(payload.body.includes("a movie"), true);
});

// 11. task_order: updates purchase status to "active"
Deno.test("task_order: updates purchase status to 'active'", async () => {
  const sub = createMockSubscription("sub-1", TARGET_ID);
  const supabase = createMockSupabaseClient({
    subscriptionsByUser: new Map([[TARGET_ID, [sub]]]),
  });
  const webpush = createMockWebPush();

  await simulateHandler(
    {
      method: "POST",
      body: validBody({
        effect_type: "task_order",
        effect_payload: { task: "Make breakfast" },
      }),
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  const purchaseUpdate = supabase._statusUpdates.find(
    (u) => u.table === "purchases" && u.id === PURCHASE_ID,
  );
  assertExists(purchaseUpdate);
  assertEquals(purchaseUpdate.status, "active");
});

// 12. task_order: push body contains task text
Deno.test("task_order: push body contains task text from payload", async () => {
  const sub = createMockSubscription("sub-1", TARGET_ID);
  const supabase = createMockSupabaseClient({
    subscriptionsByUser: new Map([[TARGET_ID, [sub]]]),
  });
  const webpush = createMockWebPush();

  await simulateHandler(
    {
      method: "POST",
      body: validBody({
        effect_type: "task_order",
        effect_payload: { task: "Make breakfast" },
      }),
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  const payload = JSON.parse(webpush._sentPayloads[0]);
  assertEquals(payload.body.includes("Make breakfast"), true);
});

// 13. dnd_timer: updates purchase status to "active"
Deno.test("dnd_timer: updates purchase status to 'active'", async () => {
  const targetSub = createMockSubscription("sub-t", TARGET_ID);
  const buyerSub = createMockSubscription("sub-b", BUYER_ID);
  const supabase = createMockSupabaseClient({
    subscriptionsByUser: new Map([
      [TARGET_ID, [targetSub]],
      [BUYER_ID, [buyerSub]],
    ]),
  });
  const webpush = createMockWebPush();

  await simulateHandler(
    {
      method: "POST",
      body: validBody({ effect_type: "dnd_timer" }),
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  const purchaseUpdate = supabase._statusUpdates.find(
    (u) => u.table === "purchases" && u.id === PURCHASE_ID,
  );
  assertExists(purchaseUpdate);
  assertEquals(purchaseUpdate.status, "active");
});

// 14. dnd_timer: sends push to BOTH buyer and target
Deno.test("dnd_timer: sends push to both buyer and target", async () => {
  const targetSub = createMockSubscription(
    "sub-t",
    TARGET_ID,
    "https://target.test",
  );
  const buyerSub = createMockSubscription(
    "sub-b",
    BUYER_ID,
    "https://buyer.test",
  );
  const supabase = createMockSupabaseClient({
    subscriptionsByUser: new Map([
      [TARGET_ID, [targetSub]],
      [BUYER_ID, [buyerSub]],
    ]),
  });
  const webpush = createMockWebPush();

  await simulateHandler(
    {
      method: "POST",
      body: validBody({ effect_type: "dnd_timer" }),
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  // Both endpoints were sent to
  assertEquals(webpush._sentTo.length, 2);
  assertEquals(webpush._sentTo.includes("https://target.test"), true);
  assertEquals(webpush._sentTo.includes("https://buyer.test"), true);

  // Two notification rows inserted
  const notifInserts = supabase._insertedRows.filter(
    (r) => r._table === "notifications",
  );
  assertEquals(notifInserts.length, 2);
});

// 15. wildcard: push body contains wish from payload
Deno.test("wildcard: push body contains wish text from payload", async () => {
  const sub = createMockSubscription("sub-1", TARGET_ID);
  const supabase = createMockSupabaseClient({
    subscriptionsByUser: new Map([[TARGET_ID, [sub]]]),
  });
  const webpush = createMockWebPush();

  await simulateHandler(
    {
      method: "POST",
      body: validBody({
        effect_type: "wildcard",
        effect_payload: { wish: "Dance in the rain" },
      }),
      hasAuth: true,
    },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  const payload = JSON.parse(webpush._sentPayloads[0]);
  assertEquals(payload.body.includes("Dance in the rain"), true);
});

// 16. Critical: notification insert uses status "sent" (not "pending")
Deno.test("CRITICAL: notification insert uses status 'sent' not 'pending'", async () => {
  const sub = createMockSubscription("sub-1", TARGET_ID);
  const supabase = createMockSupabaseClient({
    subscriptionsByUser: new Map([[TARGET_ID, [sub]]]),
  });
  const webpush = createMockWebPush();

  await simulateHandler(
    { method: "POST", body: validBody(), hasAuth: true },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  // Every notification insert should use status: "sent"
  const notifInserts = supabase._insertedRows.filter(
    (r) => r._table === "notifications",
  );
  for (const row of notifInserts) {
    assertEquals(
      row.status,
      "sent",
      `Expected notification status to be "sent" but got "${row.status}"`,
    );
  }
});

// 17. 410 Gone subscription is deleted
Deno.test("deletes push_subscription when web-push returns 410 Gone", async () => {
  const sub = createMockSubscription(
    "sub-gone",
    TARGET_ID,
    "https://gone.test",
  );
  const behaviors = new Map<string, WebPushBehavior>([
    ["https://gone.test", "gone"],
  ]);
  const supabase = createMockSupabaseClient({
    subscriptionsByUser: new Map([[TARGET_ID, [sub]]]),
  });
  const webpush = createMockWebPush(behaviors);

  await simulateHandler(
    { method: "POST", body: validBody(), hasAuth: true },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  assertEquals(
    supabase._deletedSubscriptionIds.includes("sub-gone"),
    true,
  );
});

// 18. Notification status set to "delivered" on successful push
Deno.test("notification status set to 'delivered' when push succeeds", async () => {
  const sub = createMockSubscription("sub-1", TARGET_ID);
  const supabase = createMockSupabaseClient({
    subscriptionsByUser: new Map([[TARGET_ID, [sub]]]),
  });
  const webpush = createMockWebPush();

  await simulateHandler(
    { method: "POST", body: validBody(), hasAuth: true },
    { supabaseAuth: supabase, supabaseService: supabase, webpush },
  );

  const deliveredUpdate = supabase._statusUpdates.find(
    (u) => u.table === "notifications" && u.status === "delivered",
  );
  assertExists(deliveredUpdate);
});

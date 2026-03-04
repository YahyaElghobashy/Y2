// ============================================================
// T313: Process Purchase Edge Function
// Dispatches marketplace purchase effects: extra_ping, veto,
// task_order, dnd_timer, wildcard.
// Called after purchase record creation.
//
// Depends on: 011_marketplace.sql (purchases table)
//             003_notifications.sql (notifications table)
//             send-notification edge function pattern
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

// ── VAPID Configuration ─────────────────────────────────
webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT")!,
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

// ── CORS Headers ─────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Types ────────────────────────────────────────────────
type ProcessPurchaseBody = {
  purchase_id: string;
  item_id: string;
  effect_type: string;
  effect_payload: Record<string, unknown> | null;
  buyer_id: string;
  target_id: string;
};

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  subscription: {
    endpoint: string;
    expirationTime?: number | null;
    keys: { p256dh: string; auth: string };
  };
  device_name: string | null;
  created_at: string;
  updated_at: string;
};

// ── Helpers ──────────────────────────────────────────────
function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Push Delivery ────────────────────────────────────────
// Creates notification row + delivers via web-push directly.
// Does NOT call send-notification edge function to avoid
// cross-function auth complexity.
async function sendPushToUser(
  supabase: ReturnType<typeof createClient>,
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
  // Insert notification row for history
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

  // Fetch push subscriptions for recipient
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", recipientId);

  const subs = (subscriptions ?? []) as PushSubscriptionRow[];

  if (subs.length === 0) {
    if (notifRow) {
      await supabase
        .from("notifications")
        .update({ status: "failed" })
        .eq("id", notifRow.id);
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
      notification_id: notifRow?.id,
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

        // Clean up 410 Gone subscriptions
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
      .eq("id", notifRow.id);
  }
}

// ── Effect Handlers ──────────────────────────────────────

async function handleExtraPing(
  supabase: ReturnType<typeof createClient>,
  buyerId: string,
  targetId: string,
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  // Upsert daily_send_limits to add 1 bonus send
  const { data: existing } = await supabase
    .from("daily_send_limits")
    .select("*")
    .eq("user_id", buyerId)
    .eq("date", today)
    .single();

  const currentBonus = existing?.bonus_sends_available ?? 0;

  await supabase.from("daily_send_limits").upsert(
    {
      user_id: buyerId,
      date: today,
      free_sends_used: existing?.free_sends_used ?? 0,
      bonus_sends_used: existing?.bonus_sends_used ?? 0,
      bonus_sends_available: currentBonus + 1,
    },
    { onConflict: "user_id,date" },
  );

  await sendPushToUser(supabase, targetId, buyerId, {
    title: "Extra Ping Purchased",
    body: "Your partner bought an extra notification slot!",
    emoji: "🔔",
    type: "marketplace_effect",
  });
}

async function handleVeto(
  supabase: ReturnType<typeof createClient>,
  buyerId: string,
  targetId: string,
  payload: Record<string, unknown> | null,
): Promise<void> {
  const movie = (payload?.movie as string) ?? "a movie";

  await sendPushToUser(supabase, targetId, buyerId, {
    title: "VETO!",
    body: `Movie night decision: "${movie}". No arguments allowed!`,
    emoji: "🎬",
    type: "marketplace_effect",
    metadata: { effect: "veto", movie },
  });
}

async function handleTaskOrder(
  supabase: ReturnType<typeof createClient>,
  purchaseId: string,
  buyerId: string,
  targetId: string,
  payload: Record<string, unknown> | null,
): Promise<void> {
  const task = (payload?.task as string) ?? "Complete a task";

  // Activate purchase
  await supabase
    .from("purchases")
    .update({ status: "active" })
    .eq("id", purchaseId);

  await sendPushToUser(supabase, targetId, buyerId, {
    title: "Task Order!",
    body: `You've been assigned: "${task}"`,
    emoji: "🍳",
    type: "marketplace_effect",
    metadata: { effect: "task_order", task, purchase_id: purchaseId },
  });
}

async function handleDndTimer(
  supabase: ReturnType<typeof createClient>,
  purchaseId: string,
  buyerId: string,
  targetId: string,
): Promise<void> {
  // Activate purchase
  await supabase
    .from("purchases")
    .update({ status: "active" })
    .eq("id", purchaseId);

  const notifPayload = {
    title: "Shhh...",
    emoji: "🤫",
    type: "marketplace_effect",
    metadata: { effect: "dnd_timer", duration_minutes: 60, purchase_id: purchaseId },
  };

  // Notify both users
  await Promise.all([
    sendPushToUser(supabase, targetId, buyerId, {
      ...notifPayload,
      body: "1 Hour of Silence has begun. Timer started!",
    }),
    sendPushToUser(supabase, buyerId, buyerId, {
      ...notifPayload,
      body: "You activated 1 Hour of Silence. Timer started!",
    }),
  ]);
}

async function handleWildcard(
  supabase: ReturnType<typeof createClient>,
  buyerId: string,
  targetId: string,
  payload: Record<string, unknown> | null,
): Promise<void> {
  const wish = (payload?.wish as string) ?? "A wildcard favor";

  await sendPushToUser(supabase, targetId, buyerId, {
    title: "Wildcard Favor!",
    body: `Your partner wishes: "${wish}". You can accept, decline, or negotiate.`,
    emoji: "🃏",
    type: "marketplace_effect",
    metadata: { effect: "wildcard", wish, negotiable: true },
  });
}

// ── Main Handler ─────────────────────────────────────────
serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    let body: ProcessPurchaseBody;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ success: false, error: "Invalid JSON body" }, 400);
    }

    const { purchase_id, item_id, effect_type, effect_payload, buyer_id, target_id } = body;

    if (!purchase_id || !item_id || !effect_type || !buyer_id || !target_id) {
      return jsonResponse(
        { success: false, error: "Missing required fields" },
        400,
      );
    }

    // Auth: verify caller is the buyer
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ success: false, error: "Missing authorization" }, 401);
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user || user.id !== buyer_id) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 403);
    }

    // Service role client for DB operations (bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Dispatch based on effect_type
    switch (effect_type) {
      case "extra_ping":
        await handleExtraPing(supabase, buyer_id, target_id);
        break;
      case "veto":
        await handleVeto(supabase, buyer_id, target_id, effect_payload);
        break;
      case "task_order":
        await handleTaskOrder(supabase, purchase_id, buyer_id, target_id, effect_payload);
        break;
      case "dnd_timer":
        await handleDndTimer(supabase, purchase_id, buyer_id, target_id);
        break;
      case "wildcard":
        await handleWildcard(supabase, buyer_id, target_id, effect_payload);
        break;
      default:
        return jsonResponse(
          { success: false, error: `Unknown effect_type: ${effect_type}` },
          400,
        );
    }

    return jsonResponse({ success: true, effect_type, purchase_id });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Internal server error";
    return jsonResponse({ success: false, error: errorMessage }, 500);
  }
});

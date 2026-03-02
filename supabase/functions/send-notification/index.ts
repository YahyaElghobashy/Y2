// ============================================================
// T403: Push Notification Edge Function — Deliver to Devices
// Sends Web Push notifications to all registered devices for a recipient.
// Called by the client after inserting a notification row.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

// ── VAPID Configuration ─────────────────────────────────────
// Let this throw at startup if keys are missing — misconfiguration
// should be immediately visible in function logs.
webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT")!,
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

// ── CORS Headers ────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Constants ───────────────────────────────────────────────
const MAX_BODY_LENGTH = 200;

// ── Types ───────────────────────────────────────────────────
type NotificationRow = {
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

// ── Helper: JSON response ───────────────────────────────────
function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Helper: Truncate body text ──────────────────────────────
function truncateBody(text: string): string {
  if (text.length <= MAX_BODY_LENGTH) return text;
  return text.slice(0, MAX_BODY_LENGTH - 1) + "\u2026";
}

// ── Helper: Build push payload ──────────────────────────────
function buildPayload(notification: NotificationRow): string {
  const title = `${notification.emoji ?? ""} ${notification.title}`.trim();
  const body = truncateBody(notification.body);

  return JSON.stringify({
    title,
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    data: {
      notification_id: notification.id,
      type: notification.type,
      url: "/",
    },
  });
}

// ── Main Handler ────────────────────────────────────────────
serve(async (req: Request) => {
  // 1. CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Parse and validate request body
    let body: { notification_id?: string; recipient_id?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ success: false, error: "Invalid JSON body" }, 400);
    }

    const { notification_id, recipient_id } = body;

    if (!notification_id || !recipient_id) {
      return jsonResponse(
        {
          success: false,
          error: "Missing required fields: notification_id, recipient_id",
        },
        400,
      );
    }

    // 3. Extract JWT and verify sender
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ success: false, error: "Missing authorization" }, 401);
    }

    // Create an auth client to extract the user from the JWT
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        global: { headers: { Authorization: authHeader } },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ success: false, error: "Invalid authorization" }, 401);
    }

    const senderId = user.id;

    // Service role client for all DB operations (bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 4. Fetch notification row
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notification_id)
      .single<NotificationRow>();

    if (notifError || !notification) {
      return jsonResponse(
        { success: false, error: "Notification not found" },
        404,
      );
    }

    // Verify the caller is the sender
    if (notification.sender_id !== senderId) {
      return jsonResponse(
        { success: false, error: "Not authorized to send this notification" },
        403,
      );
    }

    // Idempotent: skip if already delivered
    if (notification.status === "delivered") {
      return jsonResponse({
        success: true,
        delivered: 0,
        failed: 0,
        already_delivered: true,
      });
    }

    // 5. Fetch push subscriptions for recipient
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", recipient_id);

    if (subError) {
      await supabase
        .from("notifications")
        .update({ status: "failed" })
        .eq("id", notification_id);

      return jsonResponse(
        { success: false, error: "Failed to fetch subscriptions" },
        500,
      );
    }

    const subs = (subscriptions ?? []) as PushSubscriptionRow[];

    if (subs.length === 0) {
      await supabase
        .from("notifications")
        .update({ status: "failed" })
        .eq("id", notification_id);

      return jsonResponse({
        success: true,
        delivered: 0,
        failed: 0,
        warning: "no_subscriptions",
      });
    }

    // 6. Send Web Push to each subscription
    const payload = buildPayload(notification);

    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(sub.subscription, payload);
          return { subscriptionId: sub.id, success: true };
        } catch (err: unknown) {
          const statusCode =
            err && typeof err === "object" && "statusCode" in err
              ? (err as { statusCode: number }).statusCode
              : 0;

          // 7. Handle 410 Gone — device has unsubscribed
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

    // Count results
    let delivered = 0;
    let failed = 0;

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.success) {
        delivered++;
      } else {
        failed++;
      }
    }

    // 8. Update notification status
    const finalStatus = delivered > 0 ? "delivered" : "failed";

    await supabase
      .from("notifications")
      .update({ status: finalStatus })
      .eq("id", notification_id);

    // 9. Return response
    return jsonResponse({ success: true, delivered, failed });
  } catch (err: unknown) {
    // Unhandled error — mark as failed if we have the notification_id
    const errorMessage =
      err instanceof Error ? err.message : "Internal server error";

    return jsonResponse({ success: false, error: errorMessage }, 500);
  }
});

// ============================================================
// T1008: Snap Trigger Edge Function
// Called by pg_cron every minute. Checks if now matches today's
// scheduled snap trigger time (±1 min window). If so, sends push
// notifications to both users and inserts placeholder snap rows.
// Idempotent — skips if already triggered for today.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

// ── VAPID Configuration ─────────────────────────────────────
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

// ── Types ───────────────────────────────────────────────────
type SnapScheduleRow = {
  id: string;
  schedule_date: string;
  trigger_time: string;
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

serve(async (req: Request) => {
  // ── CORS Preflight ──────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth: service role only ────────────────────────────
    const authHeader = req.headers.get("authorization") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!authHeader.includes(serviceRoleKey) && serviceRoleKey !== "") {
      return jsonResponse({ error: "Unauthorized: service role required" }, 401);
    }

    // ── Create Supabase client with service role ───────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey,
    );

    // ── Get today's date in Cairo timezone ─────────────────
    const now = new Date();
    const cairoFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayStr = cairoFormatter.format(now); // YYYY-MM-DD

    const cairoTimeFormatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const nowTimeStr = cairoTimeFormatter.format(now); // HH:MM

    // ── Fetch today's schedule ─────────────────────────────
    const { data: schedule, error: scheduleErr } = await supabase
      .from("snap_schedule")
      .select("*")
      .eq("schedule_date", todayStr)
      .maybeSingle();

    if (scheduleErr) {
      return jsonResponse({ error: scheduleErr.message }, 500);
    }

    if (!schedule) {
      return jsonResponse({ status: "no_schedule", date: todayStr });
    }

    const scheduleRow = schedule as SnapScheduleRow;

    // ── Check if within ±1 minute window ──────────────────
    const triggerTime = scheduleRow.trigger_time.slice(0, 5); // HH:MM
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

    // ── Check if already triggered (idempotent) ────────────
    const { data: existingSnaps } = await supabase
      .from("snaps")
      .select("id")
      .eq("snap_date", todayStr);

    if (existingSnaps && existingSnaps.length > 0) {
      return jsonResponse({ status: "already_triggered", date: todayStr });
    }

    // ── Get all users (both partners) ──────────────────────
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id");

    if (!profiles || profiles.length === 0) {
      return jsonResponse({ status: "no_users" });
    }

    // ── Insert placeholder snap rows ──────────────────────
    const snapRows = profiles.map((p: { id: string }) => ({
      user_id: p.id,
      snap_date: todayStr,
      window_opened_at: now.toISOString(),
    }));

    const { error: insertErr } = await supabase
      .from("snaps")
      .insert(snapRows);

    if (insertErr) {
      return jsonResponse({ error: insertErr.message }, 500);
    }

    // ── Send push notifications ──────────────────────────
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*");

    let sent = 0;
    let failed = 0;

    if (subscriptions && subscriptions.length > 0) {
      const payload = JSON.stringify({
        title: "Snap Time! 📸",
        body: "Take your daily snap now!",
        data: { type: "snap", url: "/snap" },
      });

      const results = await Promise.allSettled(
        (subscriptions as PushSubscriptionRow[]).map((sub) =>
          webpush.sendNotification(sub.subscription, payload).catch(
            async (err: { statusCode?: number }) => {
              // Clean up expired subscriptions (410 Gone)
              if (err.statusCode === 410) {
                await supabase
                  .from("push_subscriptions")
                  .delete()
                  .eq("id", sub.id);
              }
              throw err;
            },
          ),
        ),
      );

      for (const r of results) {
        if (r.status === "fulfilled") sent++;
        else failed++;
      }
    }

    return jsonResponse({
      status: "triggered",
      date: todayStr,
      trigger_time: triggerTime,
      snaps_created: snapRows.length,
      push_sent: sent,
      push_failed: failed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});

// send-event-reminder — Scheduled edge function (pg_cron every 5 minutes)
// Queries pending reminders where remind_at <= NOW() and is_sent = false,
// sends push notifications, and marks them as sent.

import { createClient } from "jsr:@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Auth: service role only (cron or manual invocation)
    const authHeader = req.headers.get("authorization") ?? ""
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

    if (serviceRoleKey && !authHeader.includes(serviceRoleKey)) {
      return jsonResponse({ error: "Unauthorized: service role required" }, 401)
    }

    // Service role client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    // Configure web push
    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT")!,
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!,
    )

    // Query pending reminders: remind_at <= NOW() AND is_sent = false
    const now = new Date().toISOString()
    const { data: pendingReminders, error: fetchError } = await supabase
      .from("event_reminders")
      .select(`
        id,
        event_id,
        user_id,
        remind_before,
        remind_at,
        events!inner ( title, event_date, event_time, is_shared, creator_id )
      `)
      .eq("is_sent", false)
      .lte("remind_at", now)
      .limit(20)

    if (fetchError) {
      console.error("Error fetching reminders:", fetchError)
      return jsonResponse({ error: "Failed to fetch reminders", details: fetchError.message }, 500)
    }

    if (!pendingReminders || pendingReminders.length === 0) {
      return jsonResponse({ status: "no_pending", sent: 0 })
    }

    let sentCount = 0
    let failCount = 0

    for (const reminder of pendingReminders) {
      try {
        const event = (reminder as Record<string, unknown>).events as {
          title: string
          event_date: string
          event_time: string | null
          is_shared: boolean
          creator_id: string
        }

        if (!event) {
          // Event deleted but reminder lingered — mark as sent to clear
          await markSent(supabase, reminder.id)
          sentCount++
          continue
        }

        // Compose notification body based on remind_before interval
        const body = formatReminderBody(reminder.remind_before, event.title)

        // Fetch user's push subscriptions
        const { data: subscriptions } = await supabase
          .from("push_subscriptions")
          .select("id, subscription")
          .eq("user_id", reminder.user_id)

        if (subscriptions && subscriptions.length > 0) {
          const payload = JSON.stringify({
            title: `🔔 ${event.title}`,
            body,
            icon: "/icons/icon-192x192.png",
            badge: "/icons/badge-72x72.png",
            data: {
              type: "event_reminder",
              event_id: reminder.event_id,
              reminder_id: reminder.id,
            },
          })

          // Send to all subscriptions for this user
          const pushPromises = subscriptions.map(async (sub) => {
            try {
              await webpush.sendNotification(sub.subscription, payload)
            } catch (pushErr: unknown) {
              const statusCode = (pushErr as { statusCode?: number }).statusCode
              // Clean up expired subscriptions (410 Gone)
              if (statusCode === 410 || statusCode === 404) {
                await supabase
                  .from("push_subscriptions")
                  .delete()
                  .eq("id", sub.id)
              }
              console.error(`Push failed for sub ${sub.id}:`, pushErr)
            }
          })

          await Promise.allSettled(pushPromises)
        }

        // Insert notification row for audit trail
        await supabase
          .from("notifications")
          .insert({
            sender_id: null,
            recipient_id: reminder.user_id,
            title: event.title,
            body,
            emoji: "🔔",
            type: "event_reminder",
            metadata: {
              event_id: reminder.event_id,
              reminder_id: reminder.id,
              remind_before: reminder.remind_before,
            },
            status: "delivered",
          })

        // Mark as sent regardless of push success (prevent retry loops)
        await markSent(supabase, reminder.id)
        sentCount++
      } catch (err) {
        console.error(`Error processing reminder ${reminder.id}:`, err)
        // Mark as sent even on error to prevent infinite retry
        await markSent(supabase, reminder.id)
        failCount++
      }
    }

    return jsonResponse({
      status: "processed",
      sent: sentCount,
      failed: failCount,
      total: pendingReminders.length,
    })
  } catch (err) {
    console.error("Unhandled error:", err)
    return jsonResponse({ error: "Internal server error" }, 500)
  }
})

// ── Helpers ──

async function markSent(
  supabase: ReturnType<typeof createClient>,
  reminderId: string,
) {
  await supabase
    .from("event_reminders")
    .update({ is_sent: true, sent_at: new Date().toISOString() })
    .eq("id", reminderId)
}

function formatReminderBody(remindBefore: string, eventTitle: string): string {
  const interval = remindBefore.toLowerCase().trim()

  switch (interval) {
    case "0 seconds":
    case "00:00:00":
      return `${eventTitle} is starting now`
    case "15 minutes":
    case "00:15:00":
      return `${eventTitle} starts in 15 minutes`
    case "1 hour":
    case "01:00:00":
      return `${eventTitle} starts in 1 hour`
    case "1 day":
    case "1 days":
    case "1 day 00:00:00":
      return `${eventTitle} is tomorrow`
    case "7 days":
    case "7 day":
    case "7 days 00:00:00":
      return `${eventTitle} is in 1 week`
    default:
      return `Reminder: ${eventTitle} is coming up`
  }
}

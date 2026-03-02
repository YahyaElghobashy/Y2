# T403: Push Notification Edge Function — Build Plan

## Overview
Supabase Edge Function that delivers push notifications to recipient devices via the Web Push API. Called after a notification row is inserted into the `notifications` table, this function fetches all registered push subscriptions for the recipient and sends the notification payload to each device.

## Files to Create

| # | Path | Purpose |
|---|---|---|
| 1 | `supabase/functions/send-notification/index.ts` | Edge Function: JWT auth, fetch notification, send Web Push to all subscriptions, update status |
| 2 | `supabase/functions/send-notification/index.test.ts` | Deno tests with mocked webpush and Supabase client |

## Files to Modify

| # | Path | Change |
|---|---|---|
| 1 | `docs/TASK_LOG.md` | Add T403 row |

## Dependencies

### Runtime (Deno imports)
- `https://deno.land/std@0.168.0/http/server.ts` — `serve()`
- `https://esm.sh/@supabase/supabase-js@2` — `createClient()`
- `npm:web-push` — `webpush.sendNotification()`, `webpush.setVapidDetails()`

### Database Tables (from T401 — 003_notifications.sql)
- **`notifications`** — columns: `id`, `sender_id`, `recipient_id`, `title`, `body`, `emoji`, `type`, `status`, `metadata`, `created_at`
- **`push_subscriptions`** — columns: `id`, `user_id`, `subscription` (jsonb), `device_name`, `created_at`, `updated_at`
- **`daily_send_limits`** — NOT used by this function (limits enforced by caller T402)

### Environment Variables (Supabase Secrets)
- `VAPID_PUBLIC_KEY` — base64url VAPID public key
- `VAPID_PRIVATE_KEY` — base64url VAPID private key
- `VAPID_SUBJECT` — contact URI (mailto:)
- `SUPABASE_URL` — auto-injected
- `SUPABASE_SERVICE_ROLE_KEY` — auto-injected, used for all DB operations

## Design Decisions

1. **Service role client only** — RLS blocks the sender from reading recipient push subscriptions, so all DB operations use the service role key
2. **`Promise.allSettled()`** — send to all devices in parallel; one 410 must not abort others
3. **Idempotent** — if notification `status` is already `'delivered'`, return 200 without resending
4. **410 cleanup** — silently delete stale push subscriptions (device unsubscribed from browser)
5. **Body truncation** — truncate `body` to 200 chars before payload serialization (Web Push 4KB limit)
6. **No daily limit checks** — this function is a delivery primitive; T402 validates limits before calling

## Request/Response Contract

### Request
```
POST /functions/v1/send-notification
Authorization: Bearer <jwt>
Content-Type: application/json

{ "notification_id": "uuid", "recipient_id": "uuid" }
```

### Response (200)
```json
{ "success": true, "delivered": 2, "failed": 0 }
```

### Error Responses
- 400: missing fields
- 401: no/invalid JWT
- 403: sender_id mismatch
- 404: notification not found
- 500: unhandled error

## Test Cases (Deno.test)

1. Returns 400 when request body is missing `notification_id`
2. Returns 400 when request body is missing `recipient_id`
3. Returns 404 when notification row does not exist
4. Returns 403 when `sender_id` on notification does not match JWT sub
5. Returns 200 with `{ warning: "no_subscriptions" }` when recipient has no subscriptions
6. Calls `webpush.sendNotification()` once per subscription row
7. Uses `Promise.allSettled()` — a 410 does not prevent other deliveries
8. Deletes push_subscription row when Web Push returns 410
9. Sets notification `status` to `'delivered'` when at least one succeeds
10. Sets notification `status` to `'failed'` when all fail
11. Returns 200 and skips sending when notification `status` is already `'delivered'`

## Edge Cases Handled

- **Already delivered** — early return 200 (idempotent)
- **No subscriptions** — mark as `'failed'`, return warning
- **Partial failure** — at least one success = `'delivered'`
- **All 410s** — all subscriptions cleaned up, status = `'failed'`
- **Malformed subscription endpoint** — caught per-subscription, continues to next
- **Body > 200 chars** — truncated before serialization
- **VAPID keys missing** — `setVapidDetails()` throws at startup, visible in function logs

## Potential Issues

- **Cold starts** — first invocation after idle is slower; doesn't affect correctness
- **`npm:web-push` in Deno** — uses the npm compatibility layer; tested working with Supabase Edge Functions runtime
- **No `delivered_at` column** — the T401 schema doesn't include a `delivered_at` column on `notifications`, so we only update `status`. If the task description mentions `delivered_at`, we skip it since the actual schema is the source of truth.

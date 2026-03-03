# T402 Build Plan — Push Service + useNotifications Hook

## Overview

Three files providing client-side notification infrastructure: type definitions, push subscription management, and a React hook that exposes notification state and actions to UI components (T404–T406).

---

## Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `src/lib/types/notification.types.ts` | Type definitions for notification domain |
| 2 | `src/lib/services/push-service.ts` | Web Push API + Supabase subscription management |
| 3 | `src/lib/hooks/use-notifications.ts` | React hook: state + actions for notification system |
| 4 | `src/__tests__/lib/services/push-service.test.ts` | Tests for push service |
| 5 | `src/__tests__/lib/hooks/use-notifications.test.ts` | Tests for useNotifications hook |

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `src/lib/types/database.types.ts` | Add `notifications`, `daily_send_limits`, `push_subscriptions` table types |
| 2 | `docs/COMPONENT_REGISTRY.md` | Register new types, service, and hook |

---

## Dependencies on Existing Components

| Import | From | Used In |
|--------|------|---------|
| `getSupabaseBrowserClient` | `@/lib/supabase/client` | push-service.ts, use-notifications.ts |
| `useAuth` | `@/lib/providers/AuthProvider` | use-notifications.ts |
| `Profile` | `@/lib/types/user.types` | Type reference for partner |
| `Database` | `@/lib/types/database.types` | Table row types |

---

## Design Tokens Referenced

This task is logic-only — no UI components. No design tokens needed.

---

## Implementation Details

### 1. database.types.ts additions

Add three table definitions matching the T401 schema:

- `notifications` — id, sender_id, receiver_id, title, body, emoji, status, send_type, created_at
- `daily_send_limits` — id, user_id, date, free_sends_used, bonus_sends_used, bonus_sends_available
- `push_subscriptions` — id, user_id, endpoint, keys (Json), user_agent, created_at

### 2. notification.types.ts

Export types derived from database.types.ts Row types:
- `PushPermissionState` — union: 'granted' | 'denied' | 'default' | 'unsupported'
- `NotificationStatus` — union: 'pending' | 'delivered' | 'failed'
- `Notification` — from database Row
- `DailyLimit` — from database Row
- `UseNotificationsReturn` — hook return shape

### 3. push-service.ts

Four exported functions:
- `isPushSupported()` — checks window, serviceWorker, PushManager, Notification
- `getPushPermission()` — returns PushPermissionState
- `subscribeToPush(userId)` — requests permission, subscribes via PushManager, upserts to Supabase
- `unsubscribeFromPush(userId)` — unsubscribes and deletes from Supabase

Private helper: `urlBase64ToUint8Array(base64String)` for VAPID key conversion.

### 4. use-notifications.ts

"use client" hook. Uses `useAuth()` for user/partner. Key state:
- `notifications[]`, `dailyLimit`, `isLoading`, `error`

Derived values via `useMemo`:
- `freeSendsRemaining`, `bonusSendsRemaining`, `remainingSends`, `canSend`

Constants: `FREE_SENDS_PER_DAY = 2`

Actions:
- `loadData()` — parallel fetch of notifications + daily_send_limits on mount
- `refreshLimits()` — re-fetches daily_send_limits only
- `sendNotification(title, body, emoji?)` — guards, inserts, invokes Edge Function, refreshes

Edge case guards:
- `isSending` ref for double-tap prevention
- Partner null check
- `canSend` check before any Supabase call
- Optimistic row removal on failure

---

## Test Cases

### push-service.test.ts

1. `isPushSupported()` returns `false` in jsdom (no PushManager)
2. `getPushPermission()` returns `'unsupported'` when isPushSupported is false
3. `getPushPermission()` returns `'default'` when Notification.permission is 'default'
4. `subscribeToPush()` returns null when permission is 'denied'
5. `subscribeToPush()` upserts to Supabase when granted with mock subscription
6. `unsubscribeFromPush()` calls unsubscribe() and deletes from Supabase
7. `unsubscribeFromPush()` returns false when no active subscription

### use-notifications.test.ts

1. `isLoading` is true on mount, false after data loads
2. `notifications` populated from mocked Supabase response
3. `canSend` is true when remainingSends > 0
4. `canSend` is false when both free and bonus exhausted
5. `remainingSends` equals formula: (FREE_SENDS_PER_DAY - free_used) + (bonus_available - bonus_used)
6. `sendNotification` calls insert then functions.invoke
7. `sendNotification` sets error when canSend is false
8. `sendNotification` removes optimistic row on insert failure
9. `sendNotification` sets error when partner is null
10. `refreshLimits` re-fetches only daily_send_limits

---

## Potential Issues / Edge Cases

- **database.types.ts is a placeholder** — must add notification tables manually since `supabase gen types` hasn't been run. Follow the existing pattern exactly.
- **jsdom has no PushManager/Notification** — tests for push-service must mock or test the negative path
- **VAPID key assertion** — uses `!` non-null assertion intentionally; missing key = deployment error
- **No daily_send_limits row** — PGRST116 error must be caught and treated as all-zeroes
- **Functions.invoke typing** — Supabase client types may not know about Edge Functions; use the invoke method directly

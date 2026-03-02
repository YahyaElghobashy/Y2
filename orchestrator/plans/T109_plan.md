# T109 Build Plan — /us Relationship Module Shell

## Overview
Create the `/us` page with a 4-tab relationship module (Notes, Coupons, CoYYns, Send). Each tab shows a beautiful EmptyState. Tab switching uses Framer Motion layoutId for the sliding copper underline and AnimatePresence for crossfade content.

---

## Files to Create

### 1. `src/components/relationship/RelationshipTabs.tsx`
- **Type:** Client component (`"use client"`)
- **Purpose:** Tab bar + tab content container with 4 tabs
- **Dependencies:**
  - `framer-motion` → `motion`, `AnimatePresence`
  - `lucide-react` → `MessageCircle`, `Ticket`, `Coins`, `Bell`
  - `@/components/shared/EmptyState`
  - `@/lib/utils` → `cn`
- **State:** `useState<"notes" | "coupons" | "coyyns" | "send">("notes")`

### 2. `src/app/us/page.tsx`
- **Type:** Default export page (still uses client components via imports)
- **Purpose:** `/us` route page composing PageHeader + RelationshipTabs
- **Dependencies:**
  - `@/components/shared/PageHeader`
  - `@/components/animations` → `PageTransition`
  - `@/components/relationship/RelationshipTabs`

### 3. `src/__tests__/app/us/page.test.tsx`
- **Type:** Vitest + React Testing Library test
- **Purpose:** Tests for UsPage + RelationshipTabs behavior

---

## Design Tokens Referenced

| Token | Usage |
|---|---|
| `--text-secondary` (#8C8279) | Inactive tab text |
| `--accent-primary` (#C4956A) | Active tab text + underline |
| `--border-subtle` | Tab bar bottom border |
| `--text-muted` (#B5ADA4) | EmptyState icons |
| `--text-primary` (#2C2825) | EmptyState titles |
| `--bg-primary` (#FBF8F4) | Page background (via AppShell) |

## Animation Specs
- Tab underline: `layoutId="us-tab-indicator"`, 250ms ease-out `[0.25, 0.1, 0.25, 1]`
- Tab content crossfade: `AnimatePresence mode="wait"`, opacity 0→1→0, 200ms
- Page entrance: `PageTransition` (fade+slide up, 250ms)

---

## Component Architecture

```
UsPage
├── PageTransition (animation wrapper)
│   ├── PageHeader (title="Us", backHref="/")
│   └── RelationshipTabs
│       ├── Tab Bar (4 tabs with layoutId indicator)
│       └── Tab Content (AnimatePresence)
│           └── EmptyState (per-tab content)
```

---

## Tab Configuration

| Key | Icon | Label | EmptyState Title | EmptyState Subtitle | CTA |
|---|---|---|---|---|---|
| notes | MessageCircle | Notes | "No notes yet" | "Write your first love note" | "Write a note" |
| coupons | Ticket | Coupons | "No coupons yet" | "Create one for your partner" | "Create coupon" |
| coyyns | Coins | CoYYns | "CoYYns wallet empty" | "Start earning together" | — |
| send | Bell | Send | "Send a notification" | "Surprise your partner with a message" | — |

---

## Test Cases

1. Page renders with PageHeader showing "Us"
2. PageHeader back button links to "/"
3. All 4 tabs are visible (Notes, Coupons, CoYYns, Send)
4. Default active tab is "Notes"
5. Clicking "Coupons" tab changes the visible content
6. EmptyState renders for each tab with appropriate title
7. Each tab's EmptyState has unique copy (not all the same)

---

## Edge Cases Handled

- **Rapid tab switching:** AnimatePresence `mode="wait"` with unique keys per tab
- **Deep link to /us:** Always defaults to "Notes" tab (client state)
- **Tab width:** `flex-1` ensures equal width regardless of text length
- **RTL:** Using `gap` and `flex` (logical properties), `px-6` is symmetric

---

## Potential Issues

- `Ticket` icon from lucide-react — need to verify it exists. Fallback: `TicketIcon` or `Tag`.
- The marketplace page at `src/app/us/marketplace/page.tsx` uses `"use client"` directly — the new `us/page.tsx` should NOT conflict with it since Next.js treats them as separate routes.

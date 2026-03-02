# T109 Build Plan — /us Relationship Module Shell

## Overview
Create the `/us` page with a 4-tab relationship module (Notes, Coupons, CoYYns, Send). Each tab shows a beautiful EmptyState. Tab switching uses Framer Motion layoutId for the sliding copper underline and AnimatePresence for crossfade content.

---

## Files to Create/Modify

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/components/relationship/RelationshipTabs.tsx` | Tab bar + content container with 4 tabs |
| Create | `src/app/us/page.tsx` | /us route page shell |
| Create | `src/__tests__/app/us/page.test.tsx` | Tests for UsPage + RelationshipTabs |
| Modify | `docs/COMPONENT_REGISTRY.md` | Register RelationshipTabs |
| Modify | `docs/TASK_LOG.md` | Log T109 completion |

---

## Dependencies on Existing Components

| Import | From | Usage |
|--------|------|-------|
| `PageHeader` | `@/components/shared/PageHeader` | "Us" title + back to "/" |
| `PageTransition` | `@/components/animations` | Page entrance animation |
| `EmptyState` | `@/components/shared/EmptyState` | Tab content empty states |
| `cn` | `@/lib/utils` | Conditional class merging |
| `motion, AnimatePresence` | `framer-motion` | Tab underline slide + content crossfade |
| `MessageCircle, Ticket, Coins, Bell` | `lucide-react` | Tab icons (16px) + empty state icons (48px) |

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
│       ├── Tab Bar (4 buttons with flex-1, layoutId indicator)
│       └── Tab Content (AnimatePresence mode="wait")
│           └── EmptyState (per-tab content)
```

### RelationshipTabs
- `"use client"` — uses useState for active tab
- State: `useState<"notes" | "coupons" | "coyyns" | "send">("notes")`
- Tab bar: 4 equal-width `<button>` elements (flex-1), icon + label side-by-side (gap-1.5)
- Icon 16px, label 13px DM Sans font-medium
- Underline: `motion.div` with `layoutId="us-tab-indicator"`, 2px height, accent-primary bg
- Content: `AnimatePresence mode="wait"` wrapping `motion.div` with key={activeTab}
- Each tab shows EmptyState with tab-specific content

---

## Tab Configuration

| Key | Icon | Label | EmptyState Title | EmptyState Subtitle | CTA |
|---|---|---|---|---|---|
| notes | MessageCircle | Notes | "No notes yet" | "Write your first love note" | "Write a note" (no-op) |
| coupons | Ticket | Coupons | "No coupons yet" | "Create one for your partner" | "Create coupon" (no-op) |
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

- `Ticket` icon from lucide-react — verified it exists in lucide-react
- The marketplace page at `src/app/us/marketplace/page.tsx` is a nested route — no conflict
- No i18n directory exists yet — hardcoding English (consistent with all other pages)
- No motion.ts utility file — defining EASE_OUT locally (consistent with EmptyState, PageTransition)

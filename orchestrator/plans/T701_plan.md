# T701: Marketplace Shell — Build Plan

## Overview
Create the `/us/marketplace` page — the CoYYn storefront with Shop and Challenges tabs. This is a client component with local tab state, static shop items, and stub placeholders for ItemCard (T702) and ChallengeCard (T705) components.

---

## Files to Create

### 1. `src/app/us/marketplace/page.tsx` (NEW)
The main Marketplace page. `"use client"` — uses `useState` for tab switching, Framer Motion for animations.

### 2. `src/__tests__/app/us/marketplace/page.test.tsx` (NEW)
Tests for the Marketplace page covering all required test cases.

---

## Files to Modify

### 3. `docs/COMPONENT_REGISTRY.md`
Add Marketplace page entry under a new "Marketplace Module" section.

### 4. `docs/TASK_LOG.md`
Log T701 completion.

---

## Dependencies on Existing Components

| Component | Import Path | Usage |
|---|---|---|
| PageTransition | `@/components/animations` | Wraps entire page content for fade+slide entry |
| PageHeader | `@/components/shared/PageHeader` | Top bar with back nav + right action slot |
| EmptyState | `@/components/shared/EmptyState` | Challenges tab empty state |
| StaggerList | `@/components/animations` | Stagger shop items and challenge cards |
| cn | `@/lib/utils` | Conditional class merging |

### Missing Dependencies (T302 useCoyyns, T304 CoyynsBadge)
These are referenced in the task but **do not exist yet** in the codebase. Strategy:
- Create a minimal inline `CoyynsBadge` as a simple span inside this page file (not a separate component — that's T304's job)
- Hardcode a balance value (1250) since useCoyyns (T302) doesn't exist yet
- When T302/T304 land, this page will be updated to import them

### Missing Dependencies (T702 ItemCard, T705 ChallengeCard)
- ChallengeCard (T705) **already exists** at `components/relationship/ChallengeCard.tsx`
- ItemCard (T702) does not exist yet — use inline stub cards as specified in the task

---

## Design Tokens Referenced

### Colors (all via Tailwind classes mapped to `--color-*` CSS variables)
- `bg-bg-primary` — page background (#FBF8F4)
- `bg-bg-elevated` — card surfaces (#FFFFFF)
- `text-text-primary` — active tab label, headings (#2C2825)
- `text-text-secondary` — inactive tab label, descriptions (#8C8279)
- `text-text-muted` — placeholder text (#B5ADA4)
- `text-accent-primary` — tab underline, prices, CTAs (#C4956A)
- `bg-accent-primary` — tab underline indicator (#C4956A)
- `bg-accent-soft` — icon backgrounds (#E8D5C0)
- `border-border-subtle` — card borders (rgba(44,40,37,0.08))

### Typography
- Tab labels: `font-body` (DM Sans), 15px, font-medium
- Card titles: `font-body`, font-semibold
- Price badge: `font-mono` (JetBrains Mono)
- Page header title: handled by PageHeader (Playfair Display)

### Spacing
- Page: `px-5 pt-4 pb-24` (standard page layout)
- Cards: `p-5`, `rounded-2xl`
- Card gap: `gap-3`
- Tab bar height: `h-11` (44px)

### Shadows
- Cards: `shadow-[0_2px_12px_rgba(44,40,37,0.06)]` (soft shadow)

### Animation
- `EASE_OUT = [0.25, 0.1, 0.25, 1]`
- Tab content: fade only, 150ms, `AnimatePresence mode="wait"`
- Tab underline: `layoutId="marketplace-tab-indicator"`, 250ms
- Card hover: `whileHover={{ scale: 1.02 }}`, 200ms
- Card tap: `whileTap={{ scale: 0.98 }}`, 200ms

---

## Implementation Details

### Tab Architecture
```tsx
type MarketplaceTab = "shop" | "challenges"
const [activeTab, setActiveTab] = useState<MarketplaceTab>("shop")
```

Tab bar is a flex container with two buttons. The active tab gets a `motion.div` underline with `layoutId="marketplace-tab-indicator"` for smooth sliding (same pattern as BottomNav's `layoutId="bottomnav-indicator"`).

Tab content uses `AnimatePresence mode="wait"` with `motion.div key={activeTab}` that fades in/out (opacity only, 150ms).

### Shop Items (Static V1)
```tsx
type ShopItem = {
  id: string
  icon: string      // Lucide icon name
  name: string
  description: string
  price: number | null
  available: boolean
}
```

Two items: "Extra Notifications" (25 CoYYns, available) and "Coming Soon" (null price, unavailable).

### CoyynsBadge Stub
Simple inline element showing coin emoji + formatted balance. Will be replaced by T304 import later.

### Zero Balance Behavior
When balance is 0, available items get `opacity-50 pointer-events-none`.

### Back Navigation
Use PageHeader with `backHref="/us"`. The task mentions `router.back()` but PageHeader only supports `backHref` (a Link). Using `backHref="/us"` satisfies the test requirement.

---

## Test Cases

File: `src/__tests__/app/us/marketplace/page.test.tsx`

1. Page renders without crashing
2. PageHeader renders with title "Marketplace"
3. CoyynsBadge is present in the header area (test for coin display)
4. "Shop" and "Challenges" tab labels are visible
5. Shop tab is active by default (check for underline indicator)
6. Clicking "Challenges" tab switches the active content area
7. Shop tab content includes at least one item card placeholder
8. Challenges tab with empty data shows an EmptyState component
9. Back button is present and links toward `/us`
10. No hardcoded color hex values in the component source (file read test)

---

## Potential Issues / Edge Cases

1. **CoyynsBadge/useCoyyns don't exist** — handled with inline stub
2. **ChallengeCard exists but task says to stub** — will use ChallengeCard from T705 for Challenges tab since it's already built, but with no data the EmptyState renders instead
3. **AnimatePresence in tests** — need to mock framer-motion properly since AnimatePresence can cause issues in test environments
4. **File source test for hex values** — need to read the actual file content in the test and scan for hex patterns; must ensure all colors use Tailwind token classes
5. **`font-[family-name:var(--font-body)]` vs `font-body`** — existing components use the verbose `font-[family-name:var(--font-body)]` syntax. The BottomNav and layout.tsx use `font-body` directly. I'll follow the BottomNav/layout pattern using `font-body`, `font-mono`, `font-display` since Tailwind v4 maps these via `@theme inline`.

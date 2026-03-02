# T108: Home Dashboard — Build Plan

## Files to Create

### 1. `src/components/home/HomeGreeting.tsx`
- Time-aware greeting using Playfair Display
- Date formatted with `date-fns` `format()`
- Greeting logic: 12am–5am → "Good night", 5am–12pm → "Good morning", 12pm–5pm → "Good afternoon", 5pm–9pm → "Good evening", 9pm–12am → "Good night"
- Props: `name?: string` (defaults to "Yahya")

### 2. `src/components/home/WidgetSlot.tsx`
- Placeholder card for future live widgets
- Props: `label?: string`, `className?: string`
- 100px height, centered muted text

### 3. `src/__tests__/components/home/HomeGreeting.test.tsx`
- Renders greeting with default name "Yahya"
- Renders date in readable format (contains month name)
- Accepts custom name prop

### 4. `src/__tests__/app/page.test.tsx`
- Page renders without crashing
- Greeting contains "Good" and "Yahya"
- Date text present with current month
- All 4 QuickActionCards render (Us, Health, Spirit, Ops labels)
- At least 2 WidgetSlot elements render
- QuickActionCards link to correct routes

## Files to Modify

### 5. `src/app/page.tsx`
- Replace placeholder with full Home dashboard
- Imports: PageTransition, HomeGreeting, QuickActionCard, WidgetSlot, Lucide icons
- Layout: Greeting → 2×2 grid → Widget slots
- "use client" directive (PageTransition uses Framer Motion)

## Dependencies on Existing Components

| Component | Path | Import |
|---|---|---|
| PageTransition | `components/animations/PageTransition.tsx` | `@/components/animations` |
| QuickActionCard | `components/home/QuickActionCard.tsx` | `@/components/home/QuickActionCard` |
| cn | `lib/utils.ts` | `@/lib/utils` |

## External Dependencies

| Package | Already in package.json? |
|---|---|
| `date-fns` | Yes (^4.1.0) |
| `framer-motion` | Yes (^12.34.3) |
| `lucide-react` | Yes (^0.575.0) |

## Design Tokens Referenced

| Token | Usage |
|---|---|
| `--font-display` (Playfair Display) | Greeting text |
| `--font-body` (DM Sans) | Date line |
| `--color-text-primary` (#2C2825) | Greeting text |
| `--color-text-secondary` (#8C8279) | Date text |
| `--color-text-muted` (#B5ADA4) | Widget slot label |
| `--color-bg-elevated` (#FFFFFF) | Widget slot background |
| `--shadow-soft` | Widget slot shadow |
| `--color-border-subtle` | Widget slot border |

## Spacing/Layout

- Page horizontal padding: `px-5` (design system says 20px)
- Greeting: `px-5 pt-4 pb-4`
- Grid: `grid grid-cols-2 gap-4 px-5 mt-2`
- Widget slots: `flex flex-col gap-4 px-5 mt-6`

## Test Cases

### HomeGreeting.test.tsx
1. Renders with default name "Yahya"
2. Renders formatted date (contains current month)
3. Accepts custom name prop

### page.test.tsx
1. Renders without crashing
2. Greeting text contains "Good"
3. Greeting text contains "Yahya"
4. Date text present and formatted
5. All 4 QuickActionCards render
6. At least 2 WidgetSlots render
7. QuickActionCards link to /us, /health, /spirit, /ops

## Potential Issues / Edge Cases

- **Midnight edge case**: 12am–5am = "Good night", not "Good morning"
- **Test time sensitivity**: Tests must not depend on current hour — mock `Date` for greeting tests
- **Framer Motion in tests**: Need to mock or let it render in jsdom
- **date-fns format**: Use `format(new Date(), "EEEE, MMMM d")` for "Monday, March 2"
- **RTL-ready**: Use `ps-5 pe-5` instead of `px-5` — BUT existing codebase uses `px-5` throughout (AppShell, QuickActionCard), so follow existing convention for consistency
- **No i18n files exist yet**: The task says text goes in i18n, but no i18n system is set up. Will hardcode strings for now (consistent with all other Phase 1 components)

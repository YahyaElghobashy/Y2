# T102: PageHeader — Build Plan

## Files to Create

1. `src/components/shared/PageHeader.tsx` — the component
2. `src/__tests__/components/shared/PageHeader.test.tsx` — tests

## Files to Modify

1. `docs/COMPONENT_REGISTRY.md` — mark PageHeader as ✅
2. `docs/TASK_LOG.md` — add T102 entry

## Dependencies on Existing Components

- `cn()` from `@/lib/utils` — conditional class merging
- `next/link` — for back button navigation (no router.back())
- `framer-motion` — for `whileTap` on back button
- `lucide-react` — `ChevronLeft` icon (24px, strokeWidth 1.75)

## Design Tokens Referenced

- `text-text-primary` — title color
- `text-text-secondary` — back icon color
- `font-display` — Playfair Display for title (set via heading global rule in globals.css)
- Spacing: `px-6 py-3` (24px horizontal, 12px vertical)
- Back icon: 24px, `text-text-secondary`
- Title: 20px (`text-xl`), `font-bold`, `font-display`
- No border, no shadow, transparent background

## Component API

```tsx
type PageHeaderProps = {
  title: string
  backHref?: string
  rightAction?: React.ReactNode
  className?: string
}
```

## Layout Strategy

Three-column flex layout with `items-center justify-between`:
- Left slot: back button (Link + ChevronLeft) or empty spacer — `min-w-[40px]`
- Center slot: title — `flex-1 text-center truncate`
- Right slot: rightAction or empty spacer — `min-w-[40px]`

When no backHref and no rightAction: left-aligned title with just padding (no spacers).

## Animation

- Back button: `whileTap={{ scale: 0.9 }}` via Framer Motion `motion.div` wrapper

## Test Cases

1. Renders title text correctly
2. Back button appears when `backHref` is provided
3. Back button does NOT appear when `backHref` is omitted
4. Back button links to the correct href
5. Right action renders when provided
6. Right action does NOT render when omitted
7. Title has the `truncate` CSS class
8. Accepts and applies className prop

## Edge Cases

- Very long title → handled by `truncate` class (ellipsis, single line)
- No back + no right action → simple left-aligned heading
- RTL: using standard flex + text classes; logical properties not needed here since layout is symmetric with spacers

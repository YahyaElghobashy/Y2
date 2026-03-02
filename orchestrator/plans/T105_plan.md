# T105: EmptyState — Build Plan

## Files to Create

| File | Purpose |
|---|---|
| `src/components/shared/EmptyState.tsx` | Reusable empty state component |
| `src/__tests__/components/shared/EmptyState.test.tsx` | Test suite |

## Files to Modify

| File | Change |
|---|---|
| `docs/COMPONENT_REGISTRY.md` | Update EmptyState row from 📋 to ✅ with full props |
| `docs/TASK_LOG.md` | Add T105 completion row |

## Dependencies (imports)

- `next/link` — for Link rendering when `actionHref` is provided
- `framer-motion` — for `motion.button` hover animation (scale 1.02)
- `@/components/animations` — `FadeIn` wrapper for soft entrance
- `@/lib/utils` — `cn()` for conditional class merging

## Design Tokens Referenced

| Token | Usage |
|---|---|
| `--text-muted` (#B5ADA4) | Icon color |
| `--text-primary` (#2C2825) | Title color |
| `--text-secondary` (#8C8279) | Subtitle color |
| `--accent-primary` (#C4956A) | CTA button background |
| `--accent-hover` (#B8865C) | CTA button hover state |
| `--shadow-soft` | CTA button hover shadow |
| `--font-body` (DM Sans) | All text (title, subtitle, button) |

## Component Implementation Notes

- `"use client"` directive needed (uses FadeIn which uses framer-motion)
- Type: `type EmptyStateProps` (per coding standards, prefer `type` over `interface`)
- Named export only (no default export)
- CTA button: if `actionHref` → render as `Link`, else if `onAction` → render as `button`
- Both `actionHref` and `onAction` → prefer `actionHref` (Link)
- CTA hover: use `motion.button` / wrapping motion div for `whileHover={{ scale: 1.02 }}`
- Wrap everything in `<FadeIn>` from animations barrel export
- Icon passed as ReactNode — no size/color enforcement (caller provides styled icon)

## Test Cases

1. Renders icon element (check for SVG in DOM)
2. Renders title text
3. Renders subtitle when provided
4. Does NOT render subtitle when omitted
5. Renders CTA button when actionLabel provided
6. CTA button links to actionHref when provided (check `<a>` tag with href)
7. CTA button fires onAction callback when clicked
8. Does NOT render button when no actionLabel
9. Accepts className prop

## Edge Cases Handled

- No subtitle → skip subtitle element, button spacing adjusts naturally
- No actionLabel → no button rendered at all
- Both actionHref and onAction → prefer actionHref (Link)
- Long subtitle → `max-w-[240px] text-center` handles wrapping
- Short container → `min-h-[300px]` ensures meaningful height

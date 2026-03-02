# T106: QuickActionCard — Build Plan

## Files to Create

| File | Purpose |
|---|---|
| `src/components/home/QuickActionCard.tsx` | The component |
| `src/__tests__/components/home/QuickActionCard.test.tsx` | Tests |

## Files to Modify

| File | Change |
|---|---|
| `docs/COMPONENT_REGISTRY.md` | Add QuickActionCard to Home Module section |
| `docs/TASK_LOG.md` | Add T106 entry |

## Dependencies on Existing Components

- `next/link` — wraps the card for navigation
- `framer-motion` — `motion.div` for press/hover animation
- `@/lib/utils` — `cn()` for conditional class merging
- No dependency on other Y2 components (self-contained)

## Design Tokens Referenced

| Token | Usage |
|---|---|
| `--color-bg-elevated` (#FFFFFF) | Card background |
| `--color-accent-soft` (#E8D5C0) | Icon circle background |
| `--color-accent-primary` (#C4956A) | Icon color |
| `--color-text-primary` (#2C2825) | Label color |
| `--color-text-secondary` (#8C8279) | Description color |
| `--shadow-soft` (0 2px 12px rgba(44,40,37,0.06)) | Card shadow |
| `--shadow-medium` (0 4px 24px rgba(44,40,37,0.10)) | Hover shadow |
| `--font-body` (DM Sans) | Label + description font |
| `rounded-xl` (12px) | Card border radius (per task spec — note: design system says cards use rounded-2xl/16px, but task explicitly says rounded-xl/12px) |

## Animation

- `whileHover={{ scale: 1.02 }}` — shadow deepens to `--shadow-medium`
- `whileTap={{ scale: 0.98 }}` — card pushes in
- Transition: `{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }` (per task spec)
- EASE_OUT constant defined locally as typed tuple

## Component Structure

```
Link (href) → wraps entire card
  └── motion.div (visual card container)
       ├── div.icon-circle (40×40 rounded-full bg-accent-soft)
       │    └── {icon} (20px, text-accent-primary)
       ├── p.label (15px, font-semibold, text-primary, mt-3)
       └── p.description (12px, text-secondary, mt-0.5, truncate)
```

## Test Cases

1. Renders the icon (SVG present in DOM)
2. Renders the label text
3. Renders the description text
4. Links to the correct href (anchor tag with correct href attribute)
5. Accepts className prop (merged onto outer element)
6. Card has white background (bg-elevated class present)
7. Card has rounded corners (rounded-xl class present)

## Edge Cases Handled

- Long description → `truncate` class (text-overflow: ellipsis)
- Long label → `truncate` class just in case
- RTL → using standard Tailwind spacing (p-5, mt-3), no left/right needed since content is start-aligned by default
- No borders — shadow only per task spec
- "use client" directive needed for framer-motion

## Potential Issues

- The task spec says `rounded-xl` (12px) but the design system says cards use `rounded-2xl` (16px). Following the task spec exactly.
- Shadow values use raw CSS since Tailwind v4 custom shadow tokens are applied via `shadow-[var(...)]` syntax, matching the existing EmptyState pattern.

# T705 — ChallengeCard Component

## Summary

A card component for the Relationship module that displays a challenge between the two users (Yahya & Yara). Shows title, stakes, status badge, participant initials, and accept/decline action buttons for pending challenges.

## Files to Create

| File | Purpose |
|---|---|
| `src/components/relationship/ChallengeCard.tsx` | Main component |
| `src/__tests__/components/relationship/ChallengeCard.test.tsx` | Tests |

## Files to Modify

| File | Change |
|---|---|
| `docs/COMPONENT_REGISTRY.md` | Add ChallengeCard entry under Relationship Module |

## Dependencies (Imports)

- `framer-motion` — `motion` for card hover/tap + button animations
- `@/lib/utils` — `cn()` for conditional classes
- `@/components/animations` — `FadeIn` for soft entrance
- `lucide-react` — `Trophy`, `Check`, `X` icons for status/actions

## Props Design

```typescript
type ChallengeStatus = "pending" | "active" | "completed" | "declined"

type Participant = {
  name: string
  initial: string
}

type ChallengeCardProps = {
  title: string
  stakes: string
  status: ChallengeStatus
  participants: Participant[]
  onAccept?: () => void
  onDecline?: () => void
  className?: string
}
```

- `onAccept`/`onDecline` only relevant when `status === "pending"`
- Accept/Decline buttons hidden for non-pending statuses

## Design Tokens Referenced

| Token | Usage |
|---|---|
| `--color-bg-elevated` | Card background |
| `--color-text-primary` | Title text |
| `--color-text-secondary` | Stakes text |
| `--color-text-muted` | Timestamp, metadata |
| `--color-accent-primary` | Accept button bg, active status badge |
| `--color-accent-soft` | Participant initials bg |
| `--color-border-subtle` | Card border |
| `--shadow-soft` (inline) | Card shadow `0 2px 12px rgba(44,40,37,0.06)` |
| `--shadow-medium` (inline) | Card hover shadow `0 4px 24px rgba(44,40,37,0.10)` |

### Status Badge Colors (inline, matching DESIGN_SYSTEM.md semantics)

| Status | Background | Text |
|---|---|---|
| `pending` | `#FFF8E8` (warning-soft) | `#D4A04A` (warning) |
| `active` | `#E8F0F8` (info-soft) | `#6B9EC4` (info) |
| `completed` | `#E8F5E8` (success-soft) | `#7CB67C` (success) |
| `declined` | `#FDE8E8` (error-soft) | `#C27070` (error) |

## Border Radius

- Card: `rounded-2xl` (16px)
- Status badge: `rounded-lg` (8px)
- Participant initials: `rounded-full`
- Buttons: `rounded-xl` (12px)

## Animation

- Card: `whileHover={{ scale: 1.02 }}`, shadow deepens, `whileTap={{ scale: 0.98 }}`
- Accept/Decline buttons: `whileTap={{ scale: 0.95 }}`
- Easing: `EASE_OUT = [0.25, 0.1, 0.25, 1]`
- Duration: 0.2s

## Component Layout

```
┌─────────────────────────────────────┐
│ [Trophy Icon]  Title      [Badge]   │
│                                     │
│ Stakes text here                    │
│                                     │
│ [Y] [H]  participants              │
│                                     │
│ (if pending:)                       │
│ [✓ Accept]        [✕ Decline]       │
└─────────────────────────────────────┘
```

## Test Cases

1. Renders title text
2. Renders stakes text
3. Renders correct status badge text for each status
4. Renders participant initials
5. Renders Accept button when status is "pending"
6. Renders Decline button when status is "pending"
7. Does NOT render Accept/Decline buttons when status is "active"
8. Does NOT render Accept/Decline buttons when status is "completed"
9. Fires onAccept callback when Accept button clicked
10. Fires onDecline callback when Decline button clicked
11. Accepts className prop

## Potential Issues / Edge Cases

- Status badge colors are inline since semantic CSS vars (`--success`, etc.) are not in globals.css yet — use hardcoded values matching DESIGN_SYSTEM.md
- Accept/Decline should only show for `pending` status
- Buttons should be disabled-safe (no double-click issues at component level — parent handles loading state)
- RTL: use `ps`, `pe`, `ms`, `me` logical properties

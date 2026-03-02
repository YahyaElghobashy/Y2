# T110: /health — Health Module Shell

## Files to Create

1. **`src/app/health/page.tsx`** — Health page shell with empty state
2. **`src/__tests__/app/health/page.test.tsx`** — Tests for the health page

## Files to Modify

3. **`docs/COMPONENT_REGISTRY.md`** — Add Health page entry under Health Module
4. **`docs/TASK_LOG.md`** — Log T110 completion

## Dependencies (existing components)

| Component | Path | Usage |
|---|---|---|
| PageTransition | `@/components/animations` | Page-level fade+slide entrance |
| PageHeader | `@/components/shared/PageHeader` | "Health" title + back arrow to `/` |
| EmptyState | `@/components/shared/EmptyState` | Warm placeholder with icon, title, subtitle |
| Activity (icon) | `lucide-react` | Health/wellness themed icon for empty state |

## Design Tokens Referenced

- Page background: `bg-bg-primary` (via AppShell, already applied)
- Content padding: `px-6 py-8` (horizontal page padding + generous vertical)
- EmptyState uses internally: `--text-muted` (icon), `--text-primary` (title), `--text-secondary` (subtitle)
- PageHeader uses internally: `--text-secondary` (back icon), `--text-primary` (title), Playfair Display font

## Implementation Notes

- The health page is a **Server Component** (no `"use client"` needed) since it has no interactivity, state, or event handlers.
  - Wait — PageTransition uses `framer-motion` and is `"use client"`. PageHeader is also `"use client"`. EmptyState is `"use client"`. Since these are all client components imported into a server component page, the page itself can remain a server component (Next.js default export).
  - Actually, looking at the marketplace page pattern, it uses `"use client"` at the page level. But that page has state (`useState`). The health page has none, so it can be a plain server component with client component children.
  - **Decision**: Keep as default server component (no `"use client"` directive). Next.js 15 handles client component children in server component parents correctly.

- Copy follows task spec exactly:
  - Title: "Your wellness, tracked"
  - Subtitle: "Fitness goals, health reminders, and wellness insights — all in one place"
  - No mention of period tracker

- Icon size: `48` per task spec (note: design system says 24px for empty states, but task spec explicitly says 48 — follow task spec)

## Test Cases

File: `src/__tests__/app/health/page.test.tsx`

1. Renders without crashing
2. PageHeader shows "Health"
3. PageHeader back button links to "/"
4. EmptyState is visible with title text "Your wellness, tracked"
5. Activity icon is rendered (SVG in DOM)

## Potential Issues

- None expected — this is a straightforward shell page using 3 well-tested components
- The page has zero interactivity, no data fetching, no state — minimal surface area for bugs

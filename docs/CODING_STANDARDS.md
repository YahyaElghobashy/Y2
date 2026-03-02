# Y2 Coding Standards

## TypeScript

- Strict mode always (`"strict": true` in tsconfig)
- Prefer `type` over `interface` for component props
- Export types from `lib/types/[module].types.ts`
- Never use `any` — use `unknown` and narrow, or define proper types
- Use `satisfies` operator for type-safe object literals

## Component Structure

Every component file follows this order:

```tsx
// 1. Imports (external → internal → types → styles)
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "./types";

// 2. Types (if not imported)
type Props = { ... };

// 3. Constants (animation variants, configs)
const variants = { ... };

// 4. Component
export function ComponentName({ prop1, prop2 }: Props) {
  // hooks first
  // derived state
  // handlers
  // return JSX
}

// 5. No default export on components (named exports only)
// Exception: page.tsx files (Next.js requires default export)
```

## Import Order

```
1. React / Next.js
2. External libraries (framer-motion, zustand, etc.)
3. shadcn/ui components (@/components/ui/*)
4. App components (@/components/*)
5. Hooks (@/lib/hooks/*)
6. Utilities (@/lib/*)
7. Types
8. Relative imports (./)
```

Always use `@/` path alias, never relative paths beyond one level (`./` is fine, `../../` is not).

## Naming

- Components: `PascalCase` — `DailyCheckIn.tsx`
- Hooks: `use-kebab-case` — `use-prayer-times.ts`
- Utilities: `camelCase` — `formatDate.ts`
- Types: `PascalCase` — `type UserProfile = { ... }`
- Constants: `UPPER_SNAKE_CASE` — `const MAX_RETRY = 3`
- CSS variables: `--kebab-case` — `--bg-primary`
- Route folders: `kebab-case` — `daily-check-in/`
- Event handlers: `handle` prefix — `handleSubmit`, `handleToggle`

## Error Handling

- API calls: always wrap in try/catch, show user-friendly error via toast
- Form validation: Zod schemas, show inline errors
- Never `console.log` in production code — use a `logger` utility if needed
- Empty states: always design for them, never show blank screens

## Accessibility

- All interactive elements must be keyboard accessible
- All images need `alt` text
- Use semantic HTML (`nav`, `main`, `section`, `article`, `button`)
- Never use `div` as a button — use `<Button>` or `<button>`
- Color contrast: minimum 4.5:1 for body text, 3:1 for large text
- Focus states: visible focus ring using `--accent-glow`

## Performance

- Images: use `next/image` with proper width/height
- Dynamic imports: `next/dynamic` for heavy components not needed on first paint
- React.memo: only when profiling shows re-render issues, not preemptively
- Bundle: keep page bundles under 100KB JS (check with `next build` output)

## Testing

- Framework: Vitest + React Testing Library
- Test files: `__tests__/ComponentName.test.tsx` next to the component
- Test what users see and do, not implementation details
- Every component needs at minimum: renders without crashing, key interactions work
- Snapshot tests: NO. They break constantly and test nothing meaningful.

## Git

- Branch: `main` for stable, `hayah/overnight-[date]` for orchestrator runs
- Commits: conventional commits — `feat(health): add water tracker component`
- Never commit: `node_modules`, `.env*`, `token.json`, `client_secret.json`
- PR descriptions: what changed, why, any manual steps needed

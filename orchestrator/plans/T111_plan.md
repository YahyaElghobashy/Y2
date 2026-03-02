# T111: /spirit — Spiritual Module Shell

## Overview
Create the Spirit page shell at `/spirit`. Follows the exact same pattern as T110 (Health page shell): PageTransition + PageHeader + EmptyState. The page communicates reverence and calm — copy says what's coming without "coming soon" language.

## Files to Create

### 1. `src/app/spirit/page.tsx`
- Server Component (default export for Next.js)
- Imports: PageTransition, PageHeader, EmptyState, Sun icon
- Layout: PageTransition wrapping PageHeader ("Spirit", back to "/") + EmptyState
- EmptyState: Sun icon at 48px, title "Your daily practice", subtitle naming prayer/Quran/azkar

### 2. `src/__tests__/app/spirit/page.test.tsx`
- Mirror structure of health page tests
- Test cases:
  - Renders without crashing
  - PageHeader shows "Spirit"
  - Back link points to "/"
  - EmptyState title "Your daily practice" visible
  - EmptyState subtitle text visible
  - Sun SVG icon rendered in DOM

## Dependencies (existing components)
- `@/components/animations` → `PageTransition` (✅ built)
- `@/components/shared/PageHeader` → `PageHeader` (✅ built)
- `@/components/shared/EmptyState` → `EmptyState` (✅ built)
- `lucide-react` → `Sun` icon

## Design Tokens Referenced
- No direct token references in page.tsx — tokens are handled by PageHeader and EmptyState internally
- Page container: `px-6 py-8` (consistent with Health page pattern)

## Docs to Update
- `docs/COMPONENT_REGISTRY.md` — add SpiritPage to Spiritual Module section
- `docs/TASK_LOG.md` — add T111 entry

## Potential Issues
- None anticipated — this is a direct mirror of the Health page pattern with different copy and icon

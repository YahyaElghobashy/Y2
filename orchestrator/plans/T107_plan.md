# T107: AppShell — Build Plan

## Files to Create
- `src/components/shared/AppShell.tsx` — the shell component
- `src/__tests__/components/shared/AppShell.test.tsx` — tests

## Files to Modify
- `src/app/layout.tsx` — wrap `{children}` with `<AppShell>`
- `docs/COMPONENT_REGISTRY.md` — register AppShell
- `docs/TASK_LOG.md` — log completion

## Dependencies (imports)
- `BottomNav` from `@/components/shared/BottomNav`

## Design Tokens Referenced
- `bg-bg-primary` (#FBF8F4) — warm cream background on outer container
- `min-h-[100dvh]` — dynamic viewport height for mobile
- `pb-24` (96px) — bottom padding to clear BottomNav (64px nav + breathing room)

## Component API
```tsx
type AppShellProps = {
  children: React.ReactNode
}
```

Simple wrapper: `"use client"` (because BottomNav uses hooks), renders `<div>` with bg + min-height, `<main>` with bottom padding, and `<BottomNav />`.

## Test Cases
1. Renders children content
2. BottomNav is present in rendered output
3. Main content area has `pb-24` class
4. Outer container has `min-h-[100dvh]` class
5. Background color class `bg-bg-primary` is applied

## Layout Integration
- Remove `min-h-screen bg-bg-primary` from `<body>` in layout.tsx (AppShell handles it)
- Wrap `{children}` with `<AppShell>`
- Keep font variables and `text-text-primary font-body antialiased` on body

## Edge Cases
- Short content: `min-h-[100dvh]` ensures full viewport fill
- Long content: scrolls freely, nav stays fixed, `pb-24` prevents overlap
- No horizontal padding on shell — pages add their own

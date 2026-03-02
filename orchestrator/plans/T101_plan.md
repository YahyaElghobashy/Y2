# T101: BottomNav — Build Plan

## Files to Create

| File | Purpose |
|---|---|
| `src/components/shared/BottomNav.tsx` | The BottomNav component |
| `src/__tests__/components/shared/BottomNav.test.tsx` | Tests for BottomNav |

## Files to Modify

| File | Change |
|---|---|
| `docs/COMPONENT_REGISTRY.md` | Mark BottomNav as ✅ Built and tested |

## Dependencies (Existing)

| Import | From |
|---|---|
| `cn()` | `@/lib/utils` |
| `motion` | `framer-motion` |
| `Link` | `next/link` |
| `usePathname` | `next/navigation` |
| Lucide icons: `House`, `Heart`, `Activity`, `Sun`, `CheckSquare` | `lucide-react` |

## Design Tokens Referenced

| Token | CSS Variable | Usage |
|---|---|---|
| bg-elevated | `--color-bg-elevated` (#FFFFFF) | Nav background |
| text-secondary | `--color-text-secondary` (#8C8279) | Inactive icon + label |
| accent-primary | `--color-accent-primary` (#C4956A) | Active icon + label + indicator |
| border-subtle | `--color-border-subtle` (rgba(44,40,37,0.08)) | Top border |
| font-body | `--font-body` (DM Sans) | Tab labels |

## Animation Spec

- **Indicator slide**: Framer Motion `layoutId="bottomnav-indicator"`, 250ms, ease-out cubic `[0.25, 0.1, 0.25, 1]`
- **Tab press**: `whileTap={{ scale: 0.95 }}`, `transition={{ duration: 0.1 }}`
- No bounce, no spring, no overshoot

## Component Structure

```
<nav> (fixed bottom-0, z-50, bg-elevated, border-top, shadow)
  <div> (flex, justify-around, items-center, h-16)
    {tabs.map(tab => (
      <Link> (flex-1)
        <motion.div whileTap={{ scale: 0.95 }}>
          <div> (flex flex-col items-center gap-1)
            <div> (relative)
              <Icon /> (20px, color conditional)
              {isActive && <motion.div layoutId="bottomnav-indicator" />} (copper bar)
            </div>
            <span> (11px, font-medium, color conditional)
          </div>
        </motion.div>
      </Link>
    ))}
  </div>
  <div> (safe area padding: pb-[max(env(safe-area-inset-bottom),8px)])
</nav>
```

## Route Matching Logic

| Tab | Path | Match rule |
|---|---|---|
| Home | `/` | `pathname === "/"` |
| Us | `/us` | `pathname.startsWith("/us")` |
| Health | `/health` | `pathname.startsWith("/health")` |
| Spirit | `/spirit` | `pathname.startsWith("/spirit")` |
| Ops | `/ops` | `pathname.startsWith("/ops")` |

Non-matching paths (e.g. `/settings`) → no tab highlighted.

## Test Cases

1. Renders exactly 5 tab items
2. Each tab has correct label text (Home, Us, Health, Spirit, Ops)
3. Each tab links to the correct route (`/`, `/us`, `/health`, `/spirit`, `/ops`)
4. Active tab has accent color styling when pathname matches
5. Inactive tabs have secondary color styling
6. All 5 Lucide icons render (SVG elements in DOM)
7. Renders without crashing when pathname is `/`
8. Renders without crashing when pathname is `/us`

## Edge Cases

- **Non-nav route** (e.g. `/settings`): No tab gets active state — handled by route matching logic that only matches the 5 defined paths
- **Browser back/forward**: Active state is reactive via `usePathname()`, not click state
- **Rapid switching**: `layoutId` handles animation interpolation natively
- **iPhone SE (320px)**: 5 tabs in flex justify-around fit at 64px each — verified by design
- **Safe area**: `env(safe-area-inset-bottom)` with 8px fallback for non-PWA browsers

## Potential Issues

1. Tailwind v4 may not support arbitrary `env()` in `pb-[...]` — will test. Fallback: inline style.
2. Need to verify Lucide icon names match the latest lucide-react version in package.json.
3. `layoutId` requires `AnimatePresence` parent — will verify if needed or if layoutId works standalone.

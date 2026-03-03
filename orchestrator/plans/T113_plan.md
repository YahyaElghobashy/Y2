# T113: /settings — The Control Room

## Files to Create

| File | Purpose |
|---|---|
| `src/components/shared/SettingsRow.tsx` | Reusable settings row component |
| `src/app/settings/page.tsx` | Settings page with profile card, sections, log out |
| `src/__tests__/components/shared/SettingsRow.test.tsx` | SettingsRow unit tests |
| `src/__tests__/app/settings/page.test.tsx` | Settings page integration tests |

## Files to Modify

| File | Change |
|---|---|
| `docs/COMPONENT_REGISTRY.md` | Add SettingsRow + SettingsPage entries |
| `docs/TASK_LOG.md` | Add T113 completion row |

## Dependencies on Existing Components

- `PageTransition` from `@/components/animations` — page entrance animation
- `PageHeader` from `@/components/shared/PageHeader` — "Settings" title + back to `/`
- `cn()` from `@/lib/utils` — conditional class merging
- `Link` from `next/link` — for SettingsRow href navigation

## Design Tokens Referenced

| Token | Tailwind class | Usage |
|---|---|---|
| `--bg-primary` | `bg-bg-primary` | Page background (via AppShell) |
| `--bg-elevated` | `bg-bg-elevated` | Profile card background |
| `--bg-secondary` | `bg-bg-secondary` | Active press state on rows |
| `--text-primary` | `text-text-primary` | Labels, profile name |
| `--text-secondary` | `text-text-secondary` | Icons, email, subtitles |
| `--text-muted` | `text-text-muted` | Section headers, chevrons, right-side values |
| `--accent-primary` | `text-accent-primary` | Avatar initial text |
| `--accent-soft` | `bg-accent-soft` | Avatar circle background |
| `--border-subtle` | `border-border-subtle` | Row separators, profile card border |
| `--shadow-soft` | `shadow-soft` | Profile card shadow |

## Lucide Icons Used

- `User` — Profile row
- `Bell` — Notifications row
- `Palette` — Theme row
- `Smartphone` — App Version row
- `Heart` — Made with love row
- `LogOut` — Log Out button
- `ChevronRight` — Row navigation indicator

## Component Architecture

### SettingsRow
- Props: `icon, label, subtitle?, href?, onClick?, rightElement?, destructive?, showChevron?`
- Wrapper: `Link` if href, `button` if onClick, `div` otherwise
- showChevron defaults: `true` when href/onClick, `false` when only rightElement
- Destructive mode: red-500 text on icon + label
- Press feedback: `active:bg-bg-secondary` transition
- RTL: use `ms-3` (not ml-3), `me-auto`, logical properties

### Settings Page
- Wrapped in `PageTransition`
- `PageHeader` with title="Settings", backHref="/"
- Profile card: hardcoded Yahya/yahya@email.com
- 3 sections (Account, Appearance, About) with uppercase muted headers
- Log Out button: standalone red-bordered button at bottom
- All non-functional (Phase 1 placeholders)

## Test Cases

### SettingsRow Tests (6 tests)
1. Renders icon and label
2. Shows ChevronRight when href is provided
3. Shows rightElement when provided (no chevron)
4. Applies destructive (red) styling when destructive=true
5. Renders as Link when href provided
6. Calls onClick when clicked

### Settings Page Tests (7 tests)
1. Page renders with PageHeader "Settings"
2. Profile card shows placeholder name "Yahya"
3. All section headers render ("Account", "Appearance", "About")
4. At least 5 SettingsRow items render (User, Bell, Palette, Smartphone, Heart icons)
5. Log Out button is present with red text
6. "Made with" row shows "for Yara"
7. App version row shows "1.0.0"

## Potential Issues / Edge Cases

- SettingsRow needs to handle three wrapper types (Link/button/div) cleanly
- No `border-b` on last row in each section — use `last:border-b-0` or `divide-y`
- RTL: all spacings must use logical properties (ms/me/ps/pe)
- The page is `"use client"` because PageTransition uses framer-motion
- Log Out is NOT a SettingsRow — it's a standalone button element
- Profile card avatar uses first initial of hardcoded name

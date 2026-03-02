# Y2 Component Registry

> This file is updated after every successful build task. Claude Code reads this to know what already exists. Do not create duplicate components.

## Status Legend
- ✅ Built and tested
- 🔨 In progress
- 📋 Planned
- ❌ Failed (needs rebuild)

---

## UI Base (shadcn)

| Component | Status | Path | Notes |
|---|---|---|---|
| Button | ✅ | `components/ui/button.tsx` | Installed via shadcn CLI. CVA variants: default, destructive, outline, secondary, ghost, link. Sizes: default, xs, sm, lg, icon variants. |
| Input | ✅ | `components/ui/input.tsx` | Installed via shadcn CLI. Standard input with focus ring, aria-invalid styling. |
| Label | ✅ | `components/ui/label.tsx` | Installed via shadcn CLI. Radix Label primitive with disabled state handling. |
| AlertDialog | ✅ | `components/ui/alert-dialog.tsx` | Installed via shadcn CLI. Radix AlertDialog with Header/Footer/Title/Description/Action/Cancel sub-components. |
| Dialog | 📋 | `components/ui/dialog.tsx` | |
| Card | 📋 | `components/ui/card.tsx` | |
| Toggle | 📋 | `components/ui/toggle.tsx` | |
| Tabs | 📋 | `components/ui/tabs.tsx` | |
| Toast | 📋 | `components/ui/toast.tsx` | |

## Animation Wrappers

| Component | Status | Path | Props |
|---|---|---|---|
| PageTransition | ✅ | `components/animations/PageTransition.tsx` | `children, className?` — Page-level fade+slide wrapper. Fades in (opacity 0→1) with subtle slide up (y 8→0). Duration 250ms, ease-out deceleration. Respects `prefers-reduced-motion`. |
| FadeIn | ✅ | `components/animations/FadeIn.tsx` | `children, delay?, duration?, className?` — Simple opacity fade wrapper. Configurable delay (default 0) and duration (default 0.3s). Respects `prefers-reduced-motion`. |
| StaggerList | ✅ | `components/animations/StaggerList.tsx` | `children, staggerDelay?, className?` — Staggered list entrance. Children appear sequentially with configurable delay (default 0.05s). Each item fades+slides (y 6→0). Returns null for 0 children. Respects `prefers-reduced-motion`. |
| Barrel Export | ✅ | `components/animations/index.ts` | Re-exports PageTransition, FadeIn, StaggerList for clean imports. |
| SlideUp | 📋 | `components/animations/SlideUp.tsx` | `children, delay?` |
| ScaleIn | 📋 | `components/animations/ScaleIn.tsx` | `children, delay?` |

## Shared Components

| Component | Status | Path | Props |
|---|---|---|---|
| BottomNav | ✅ | `components/shared/BottomNav.tsx` | Fixed bottom nav with 5 tabs (Home, Us, Health, Spirit, Ops). Uses `usePathname()` for active state, Framer Motion `layoutId` for sliding copper indicator, `whileTap` for press feedback. iOS safe area aware. |
| PageHeader | ✅ | `components/shared/PageHeader.tsx` | `title, backHref?, rightAction?, className?` — Page identity header with optional back navigation and right action slot. Uses Playfair Display title, ChevronLeft back icon with Framer Motion `whileTap` press feedback. Three-column balanced layout with spacers. |
| LoadingSkeleton | ✅ | `components/shared/LoadingSkeleton.tsx` | `variant: "card" \| "list-item" \| "header" \| "full-page", count?, className?` — Warm-toned skeleton placeholders with CSS `animate-pulse`. Card (120px with icon/title/subtitle shapes), list-item (repeatable rows with avatar/text shapes), header (title+subtitle bars), full-page (header + 3 cards). Server Component, no JS animation. |
| EmptyState | ✅ | `components/shared/EmptyState.tsx` | `icon: ReactNode, title: string, subtitle?: string, actionLabel?: string, actionHref?: string, onAction?: () => void, className?` — Centered empty placeholder with icon, title, optional subtitle, and optional copper CTA button (Link or button). Wrapped in FadeIn for soft entrance. min-h-[300px]. 9 tests passing. |
| AppShell | ✅ | `components/shared/AppShell.tsx` | `children: ReactNode` — Root layout shell wrapping all pages. Warm cream background (`bg-bg-primary`), `min-h-[100dvh]` for mobile viewport, `pb-24` content padding to clear BottomNav. Renders BottomNav fixed at bottom. Integrated into `app/layout.tsx`. 5 tests passing. |
| SettingsRow | ✅ | `components/shared/SettingsRow.tsx` | `icon: ReactNode, label: string, subtitle?: string, href?: string, onClick?: () => void, rightElement?: ReactNode, destructive?: boolean, showChevron?: boolean` — Reusable settings list row. Renders as Link (href), button (onClick), or div. Auto-shows ChevronRight for actionable rows. Destructive mode for red styling. Press feedback via active:bg-bg-secondary. 6 tests passing. |
| ProfileSetupOverlay | ✅ | `components/shared/ProfileSetupOverlay.tsx` | `userId: string, initialName?: string, onComplete: () => void` — Full-screen overlay for first-time profile setup. RHF+Zod name validation (1-50 chars), avatar upload to Supabase Storage (5MB limit), Framer Motion scaleIn/fadeOut animations with AnimatePresence. Appears when profile.display_name is empty/"User". 13 tests passing. |
| ProfileEditForm | ✅ | `components/shared/ProfileEditForm.tsx` | `profile: { id, display_name, email, avatar_url }, onSave: () => void, onCancel: () => void` — Inline profile editor with avatar upload, RHF+Zod name validation (1-40 chars), initials fallback. Framer Motion height:0→auto expand animation. Used in Settings page. 8 tests passing. |
| CoyynsBadge | ✅ | `components/shared/CoyynsBadge.tsx` | `balance?: number, size?: "sm" \| "md", className?` — Inline CoYYns balance pill badge. Shows coin icon + formatted balance in a soft rounded-full pill (accent-soft bg). If `balance` prop provided, displays directly without hook call; if omitted, reads from `useCoyyns()` automatically. Size variants: sm (~24px) and md (~28px, default). Loading state: pulse placeholder. Null balance fallback: "—". Hover: scale(1.02) via Framer Motion. Display-only, not interactive. 14 tests passing. |
| LoadingPulse | 📋 | `components/shared/LoadingPulse.tsx` | — |
| UserGreeting | 📋 | `components/shared/UserGreeting.tsx` | — |

## Home Module

| Component | Status | Path | Props |
|---|---|---|---|
| QuickActionCard | ✅ | `components/home/QuickActionCard.tsx` | `icon: ReactNode, label: string, description: string, href: string, className?` — Module doorway card for 2×2 home grid. Warm icon circle (40px, accent-soft bg), bold label, truncated description. Framer Motion whileHover scale(1.02) + shadow deepen, whileTap scale(0.98). Wrapped in next/link. 7 tests passing. |
| HomeGreeting | ✅ | `components/home/HomeGreeting.tsx` | `name?: string` — Time-aware greeting (Good morning/afternoon/evening/night) with user name in Playfair Display 28px bold. Date line formatted via date-fns ("EEEE, MMMM d"). Greeting logic: 12am–5am night, 5am–12pm morning, 12pm–5pm afternoon, 5pm–9pm evening, 9pm–12am night. 9 tests passing. |
| WidgetSlot | ✅ | `components/home/WidgetSlot.tsx` | `label?: string, className?` — Placeholder card for future live widgets (CoYYns balance, cycle tracker). 100px height, centered muted text, elevated bg with border and soft shadow. Server Component compatible. |

## Relationship Module

| Component | Status | Path | Props |
|---|---|---|---|
| ChallengeCard | ✅ | `components/relationship/ChallengeCard.tsx` | `title: string, stakes: string, status: "pending" \| "active" \| "completed" \| "declined", participants: { name: string, initial: string }[], onAccept?: () => void, onDecline?: () => void, className?` — Challenge card with trophy icon, color-coded status badge (pending/warning, active/info, completed/success, declined/error), overlapping participant initial avatars, and conditional Accept/Decline buttons for pending status. Framer Motion whileHover scale(1.02) + shadow deepen, whileTap scale(0.98). 15 tests passing. |
| CoyynsWallet | ✅ | `components/relationship/CoyynsWallet.tsx` | `onAdd?: () => void, onSpend?: () => void, className?` — Self-contained CoYYns wallet display card. Internally calls `useCoyyns()` for balance/stats and `useAuth()` for partner identity. Animated balance counter via Framer Motion `useMotionValue`/`useTransform`/`animate()` (600ms easeOut count-up). Shows coin icon, formatted balance (JetBrains Mono 40px, accent-primary), "CoYYns" label, lifetime earned/spent stats, partner balance row, and Add (outline) / Spend (filled) action buttons. Loading state: shimmer placeholders with animate-pulse. Error state: "Couldn't load wallet" with Retry button. Card entrance: opacity+y fade (350ms). 12 tests passing. |
| CoyynsHistory | ✅ | `components/relationship/CoyynsHistory.tsx` | `transactions?: CoyynsTransaction[], limit?: number, compact?: boolean, className?` — Scrollable transaction history list for CoYYns activity. Accepts transactions as prop or auto-fetches via `useCoyyns()` hook. Each row shows directional icon (TrendingUp/TrendingDown in tinted 32px container), description (truncated, DM Sans 14px), category + relative time subtitle (12px muted), and right-aligned amount in JetBrains Mono with +/− prefix (success/error colors). StaggerList entrance animation (40ms stagger). EmptyState with Coins icon when no transactions. LoadingSkeleton (3 list-item rows) during hook loading. Compact mode reduces row padding and font size for card embedding. 14 tests passing. |
| AddCoyynsForm | ✅ | `components/relationship/AddCoyynsForm.tsx` | `open: boolean, onClose: () => void, onSuccess?: () => void` — Bottom sheet form for earning CoYYns. Portal to document.body for z-index over BottomNav. AnimatePresence backdrop (bg-black/30 fade) + sheet (slide up from y:100%). RHF+Zod validation: amount (1–10,000 integer, JetBrains Mono 48px centered with copper underline on focus), description (1–200 chars, textarea 3 rows with live char count). Submit calls `useCoyyns().addCoyyns()`, shows sonner toast on success, resets form + calls onClose/onSuccess. Root error display on failure. X button + backdrop click to close. Body scroll lock while open. 10 tests passing. |
| SpendCoyynsForm | ✅ | `components/relationship/SpendCoyynsForm.tsx` | `open: boolean, onClose: () => void, onSuccess?: () => void, prefilledAmount?: number, prefilledDescription?: string, prefilledCategory?: string` — Bottom sheet form for spending CoYYns. Same portal+animation pattern as AddCoyynsForm. Balance-aware: shows current balance at top, dynamic Zod schema with max(balance), real-time "Insufficient CoYYns" warning via `watch("amount")` with red border + disabled button. Prefilled values via `reset()` on open. Category defaults to "manual". Submit calls `useCoyyns().spendCoyyns()` with category. Body scroll lock while open. 11 tests passing. |

## Health Module

| Component | Status | Path | Props |
|---|---|---|---|
| HealthPage | ✅ | `app/(main)/health/page.tsx` | Server Component page shell. PageTransition + PageHeader ("Health", back to `/`) + EmptyState with Activity icon. Warm copy: "Your wellness, tracked". No interactivity. 6 tests passing. |

## Spiritual Module

| Component | Status | Path | Props |
|---|---|---|---|
| SpiritPage | ✅ | `app/(main)/spirit/page.tsx` | Server Component page shell. PageTransition + PageHeader ("Spirit", back to `/`) + EmptyState with Sun icon. Contemplative copy: "Your daily practice". No interactivity. 6 tests passing. |

## Settings Module

| Component | Status | Path | Props |
|---|---|---|---|
| SettingsPage | ✅ | `app/(main)/settings/page.tsx` | Client Component. Uses useAuth() for real profile data. PageTransition + PageHeader + profile card (avatar/name/email from auth). ProfileEditForm inline expand on "Profile" row click. AlertDialog confirmation on Log Out → signOut(). LoadingSkeleton when profile is null. 7 tests passing. |

## Ops Module

| Component | Status | Path | Props |
|---|---|---|---|
| OpsPage | ✅ | `app/(main)/ops/page.tsx` | Server Component page shell. PageTransition + PageHeader ("Ops", back to `/`) + EmptyState with CheckSquare icon. Practical copy: "Life, organized". No interactivity. 6 tests passing. |

## Auth Infrastructure

| Component | Status | Path | Notes |
|---|---|---|---|
| AuthProvider | ✅ | `lib/providers/AuthProvider.tsx` | Context provider with user/profile/partner state from Supabase onAuthStateChange. useAuth() hook. signOut with /login redirect. profileNeedsSetup boolean. refreshProfile() method. 11 tests passing. |
| LoginPage | ✅ | `app/(auth)/login/page.tsx` | RHF+Zod login form. Supabase signInWithPassword. Framer Motion entrance. Error states + loading spinner. 13 tests passing. |
| AuthLayout | ✅ | `app/(auth)/layout.tsx` | Minimal layout for auth pages — no AppShell, no BottomNav. |
| MainLayout | ✅ | `app/(main)/layout.tsx` | Protected route layout with AppShell + ProfileSetupOverlay when needed. |
| Middleware | ✅ | `middleware.ts` | Next.js Edge middleware. Redirects unauthenticated users to /login, authenticated /login→/. Fail-open on errors. 11 tests passing. |
| user.types.ts | ✅ | `lib/types/user.types.ts` | Profile type (from database.types.ts Row), AuthContextType interface. |

## Hooks / Data Layer

| Hook | Status | Path | API |
|---|---|---|---|
| useCoyyns | ✅ | `lib/hooks/use-coyyns.ts` | `useCoyyns() → { wallet, partnerWallet, transactions, isLoading, error, addCoyyns, spendCoyyns, refreshWallet }` — Client-side data layer for CoYYns feature. Three parallel initial fetches (user wallet, partner wallet, last 50 transactions). Realtime subscription on `coyyns_wallets` for live sync. `addCoyyns(amount, description, category?)` validates positive integer, inserts earn transaction. `spendCoyyns(amount, description, category?)` checks balance before inserting spend transaction. Auth-safe: returns inert state when user is null. 13 tests passing. |

## Types

| Type File | Status | Path | Exports |
|---|---|---|---|
| coyyns.types.ts | ✅ | `lib/types/coyyns.types.ts` | `CoyynsWallet`, `CoyynsTransaction` — derived from `database.types.ts` Row types for `coyyns_wallets` and `coyyns_transactions` tables. |
| user.types.ts | ✅ | `lib/types/user.types.ts` | `Profile`, `AuthContextType` — Profile type from database.types.ts, AuthContextType interface. |

## Scripts / Infrastructure

| Script | Status | Path | Notes |
|---|---|---|---|
| screenshot.mjs | ✅ | `scripts/screenshot.mjs` | Puppeteer headless screenshot capture. Args: url (default localhost:3000), output (default /tmp/y2-audit-home.png). Viewport 375×812 (iPhone). waitUntil networkidle0. Full-page screenshot. No npm dependency — uses npx cached puppeteer. |
| visual-audit.sh | ✅ | `scripts/visual-audit.sh` | Bash wrapper: builds app if needed, starts next start on port 3099, waits for server (max 15s), calls screenshot.mjs, kills server. Args: $1=route (default /), $2=output path. 7 tests passing. |

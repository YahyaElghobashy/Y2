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
| GradientDivider | ✅ | `components/ui/GradientDivider.tsx` | `className?, glow?: boolean` — Decorative gradient line divider using warm mineral palette. Optional glow effect via box-shadow. Renders as a styled `<hr>`. |

## Animation Wrappers

| Component | Status | Path | Props |
|---|---|---|---|
| PageTransition | ✅ | `components/animations/PageTransition.tsx` | `children, className?` — Page-level fade+slide wrapper. Fades in (opacity 0→1) with subtle slide up (y 8→0). Duration 250ms, ease-out deceleration. Respects `prefers-reduced-motion`. |
| FadeIn | ✅ | `components/animations/FadeIn.tsx` | `children, delay?, duration?, className?` — Simple opacity fade wrapper. Configurable delay (default 0) and duration (default 0.3s). Respects `prefers-reduced-motion`. |
| StaggerList | ✅ | `components/animations/StaggerList.tsx` | `children, staggerDelay?, className?` — Staggered list entrance. Children appear sequentially with configurable delay (default 0.05s). Each item fades+slides (y 6→0). Returns null for 0 children. Respects `prefers-reduced-motion`. |
| HayahGradient | ✅ | `components/animations/HayahGradient.tsx` | `className?` — Ambient flowing gradient background. Pure CSS `@keyframes` animation (25s cycle, GPU-composited via `will-change: background-position`). Three layered `radial-gradient` blobs at low opacity using warm mineral palette (#E8D5C0 35%, #F5F0E8 50%, #C4956A 6%). `position: fixed; inset: 0; z-index: 0; pointer-events: none; aria-hidden="true"`. Renders in AppShell and AuthLayout. Respects `prefers-reduced-motion: reduce` (animation: none). Zero JS cost — no Framer Motion. |
| Barrel Export | ✅ | `components/animations/index.ts` | Re-exports PageTransition, FadeIn, StaggerList, HayahGradient for clean imports. |
| SlideUp | 📋 | `components/animations/SlideUp.tsx` | `children, delay?` |
| ScaleIn | 📋 | `components/animations/ScaleIn.tsx` | `children, delay?` |

## Shared Components

| Component | Status | Path | Props |
|---|---|---|---|
| BottomNav | ✅ | `components/shared/BottomNav.tsx` | Fixed bottom nav with 5 tabs (Home, Us, 2026, Me, More). Center 2026 tab elevated (-translate-y-1.5, 28px icon, always-copper accent). Uses `usePathname()` for active state, Framer Motion `layoutId` for sliding copper indicator, `whileTap` for press feedback. iOS safe area aware. (V2: TF10) |
| HorizontalTabBar | ✅ | `components/shared/HorizontalTabBar.tsx` | `tabs: { label, href }[], layoutId?, className?` — Reusable route-based horizontal tab bar. Uses `usePathname()` for active detection, copper 2px underline with Framer Motion `layoutId`, `overflow-x-auto` with hidden scrollbar, sticky top-0. Auto-scrolls active tab into view on mount. (V2: T115) |
| PageHeader | ✅ | `components/shared/PageHeader.tsx` | `title, backHref?, rightAction?, className?` — Page identity header with optional back navigation and right action slot. Uses Playfair Display title, ChevronLeft back icon with Framer Motion `whileTap` press feedback. Three-column balanced layout with spacers. |
| LoadingSkeleton | ✅ | `components/shared/LoadingSkeleton.tsx` | `variant: "card" \| "list-item" \| "header" \| "full-page", count?, className?` — Warm-toned skeleton placeholders with CSS `animate-pulse`. Card (120px with icon/title/subtitle shapes), list-item (repeatable rows with avatar/text shapes), header (title+subtitle bars), full-page (header + 3 cards). Server Component, no JS animation. |
| EmptyState | ✅ | `components/shared/EmptyState.tsx` | `icon: ReactNode, title: string, subtitle?: string, actionLabel?: string, actionHref?: string, onAction?: () => void, className?` — Centered empty placeholder with icon, title, optional subtitle, and optional copper CTA button (Link or button). Wrapped in FadeIn for soft entrance. min-h-[300px]. 9 tests passing. |
| AppShell | ✅ | `components/shared/AppShell.tsx` | `children: ReactNode` — Root layout shell wrapping all pages. Warm cream background (`bg-bg-primary`), `min-h-[100dvh]` for mobile viewport, `pb-24` content padding to clear BottomNav. Renders BottomNav fixed at bottom. Integrated into `app/layout.tsx`. 5 tests passing. |
| SettingsRow | ✅ | `components/shared/SettingsRow.tsx` | `icon: ReactNode, label: string, subtitle?: string, href?: string, onClick?: () => void, rightElement?: ReactNode, destructive?: boolean, showChevron?: boolean` — Reusable settings list row. Renders as Link (href), button (onClick), or div. Auto-shows ChevronRight for actionable rows. Destructive mode for red styling. Press feedback via active:bg-bg-secondary. 6 tests passing. |
| ProfileSetupOverlay | ✅ | `components/shared/ProfileSetupOverlay.tsx` | `userId: string, initialName?: string, onComplete: () => void` — Full-screen overlay for first-time profile setup. RHF+Zod name validation (1-50 chars, **rejects whitespace-only** via trim≥2, trims before save), avatar upload to Supabase Storage (5MB limit), Framer Motion scaleIn/fadeOut animations with AnimatePresence. **Fallback only**: MainLayout renders it solely when onboarding is already complete but display_name is still empty/"User" (the onboarding ProfileStep is the primary path). 15 tests passing. |
| Avatar | ✅ | `components/shared/Avatar.tsx` | `src?: string \| null, name?: string \| null, size?: "sm" \| "md" \| "lg" \| "xl", className?` — Reusable avatar component with 4 sizes (sm=24, md=32, lg=48, xl=80). Renders `<img>` from src with onError fallback. Initials fallback: first char of each word (max 2), accent-soft bg with accent-primary text. "?" when no name or src. 14 tests passing. |
| ProfileEditForm | ✅ | `components/shared/ProfileEditForm.tsx` | `profile: { id, display_name, email, avatar_url }, onSave: () => void, onCancel: () => void` — Inline profile editor using Avatar component + uploadAvatar() for image processing (center-crop 400x400, WebP 80%). RHF+Zod name validation (1-40 chars). Framer Motion height:0→auto expand animation. Used in More page. 8 tests passing. |
| CoyynsBadge | ✅ | `components/shared/CoyynsBadge.tsx` | `balance?: number, size?: "sm" \| "md", className?` — Inline CoYYns balance pill badge. Shows coin icon + formatted balance in a soft rounded-full pill (accent-soft bg). If `balance` prop provided, displays directly without hook call; if omitted, reads from `useCoyyns()` automatically. Size variants: sm (~24px) and md (~28px, default). Loading state: pulse placeholder. Null balance fallback: "—". Hover: scale(1.02) via Framer Motion. Display-only, not interactive. 14 tests passing. |
| DailyBonusToast | ✅ | `components/shared/DailyBonusToast.tsx` | `className?` — "+5 Daily bonus!" toast notification. Shows when `useDailyBonus().justClaimed` is true. Framer Motion slide-down (y:-40→0) with coin pulse animation (scale 1→1.2→1). Auto-dismisses after 3000ms via setTimeout. Fixed positioning with safe-area-inset-top. Uses bg-bg-elevated, border-border-subtle, text-text-primary design tokens. 6 tests passing. |
| InstallPrompt | ✅ | `components/shared/InstallPrompt.tsx` | — Captures `beforeinstallprompt` for Chromium install, iOS share sheet instructions fallback. 3s delayed show, 30-day localStorage dismiss cooldown. Subtle banner above BottomNav. 13 tests passing. |
| PillTabBar | ✅ | `components/shared/PillTabBar.tsx` | `tabs: { key, label }[], activeKey: string, onTabChange: (key) => void, className?` — Animated pill-shaped tab bar with Framer Motion `layoutId` indicator. Copper-filled active pill slides between tabs. Replaces underline-style tabs in several pages. |
| LoadingPulse | 📋 | `components/shared/LoadingPulse.tsx` | — |
| UserGreeting | 📋 | `components/shared/UserGreeting.tsx` | — |

## Home Module

| Component | Status | Path | Props |
|---|---|---|---|
| QuickActionCard | ✅ | `components/home/QuickActionCard.tsx` | `icon: ReactNode, label: string, description: string, href: string, className?` — Module doorway card for 2×2 home grid. Warm icon circle (40px, accent-soft bg), bold label, truncated description. Framer Motion whileHover scale(1.02) + shadow deepen, whileTap scale(0.98). Wrapped in next/link. 7 tests passing. |
| HomeGreeting | ✅ | `components/home/HomeGreeting.tsx` | `className?` — Time-aware greeting using `useAuth()` for dynamic profile name (fallback "there"). Playfair Display 28px bold. Date via date-fns ("EEEE, MMMM d"). Greeting logic: 12am–5am night, 5am–12pm morning, 12pm–5pm afternoon, 5pm–9pm evening, 9pm–12am night. 9 tests passing. |
| CoyynsWidget | ✅ | `components/home/CoyynsWidget.tsx` | `className?` — Compact CoYYns card for home dashboard. Shows CoyynsBadge balance, 3 recent transactions with +/− prefixes and earn/spend color coding, "See all →" footer link. Wrapped in `next/link` to `/us` with `motion.div` whileTap scale(0.99). Loading: LoadingSkeleton list-item ×3. Empty: "Start earning CoYYns together". 12 tests passing. |
| WidgetSlot | ✅ | `components/home/WidgetSlot.tsx` | `label?: string, className?` — Placeholder card for future live widgets (CoYYns balance, cycle tracker). 100px height, centered muted text, elevated bg with border and soft shadow. Server Component compatible. |
| HomeCycleWidget | ✅ | `components/home/HomeCycleWidget.tsx` | `className?` — Thin cycle tracker widget for home dashboard. Uses `useCycle()`, returns null if no config/loading. Shows "Cycle Tracker" header with Day X phase label, wraps `CycleInsightCard compact` in `Link` to `/me/body` with motion.div whileTap. Follows CoyynsWidget card pattern. 6 tests passing. |
| HomeCouponInbox | ✅ | `components/home/HomeCouponInbox.tsx` | `className?` — Stacked gift cards widget for home dashboard. Uses `useCoupons().receivedCoupons` filtered to active. Returns null if empty. Background layers with static rotate(2deg/-2deg) CSS, front card shows emoji+title, copper count badge (top-right), copper glow pulse for pending approvals. Wrapped in `Link` to `/us/coupons`. 5 tests passing. |
| FeelingGenerousCTA | ✅ | `components/home/FeelingGenerousCTA.tsx` | `className?` — Warm speech-bubble CTA card. "Feeling generous?" display text + subtitle + Gift icon (copper). CSS `:before` triangle tail. Links to `/create-coupon`. whileHover scale(1.02), whileTap scale(0.98). 4 tests passing. |
| HomeMarketplaceRow | ✅ | `components/home/HomeMarketplaceRow.tsx` | `className?` — Horizontal scroll row of marketplace items for home dashboard. Uses `useMarketplace()` for items + `useCoyyns()` for balance. Renders horizontal `MarketplaceItemCard` variants in `overflow-x-auto` scroll container. Integrates `PurchaseConfirmModal` for inline purchasing. "Shop →" link to `/us/marketplace`. Loading: MarketplaceItemCardSkeleton row. Returns null when no items. 7 tests passing. |
| MoodStrip | ✅ | `components/home/MoodStrip.tsx` | `className?` — Horizontal strip of 4 at-a-glance indicator chips. Chips: CoYYns balance (Coins icon → /us/coyyns), active coupons count (Gift icon → /us/coupons), calendar placeholder (CalendarDays icon → /us/calendar), pings remaining (Bell icon → /us/ping). Uses `useCoyyns`, `useCoupons`, `useNotifications`. Loading: 4 skeleton pills. Graceful degradation: shows 0 or em dash when data unavailable. 15 tests passing. |
| HomeCountdownWidget | ✅ | `components/home/HomeCountdownWidget.tsx` | `className?` — Milestone countdown widget. Uses `useCalendar().milestones` to show nearest milestone with title, formatted date, and days-until count. Gold accent (#DAA520) border + Star icon. "Today!" for same-day, singular/plural "day(s)". Returns null when loading or no milestones. Links to `/us/calendar?date=YYYY-MM-DD`. 12 tests passing. |
| HomeCalendarPeek | ✅ | `components/home/HomeCalendarPeek.tsx` | `className?` — Upcoming events peek widget. Uses `useCalendar().upcomingEvents`, shows next 3 events with category-colored date badges, titles, formatted times. "Coming Up" + "See All" header. Empty state with "Add Event" CTA. Returns null when loading. 17 tests passing. |
| HomePrayerWidget | ✅ | `components/home/HomePrayerWidget.tsx` | `className?` — Mini prayer dashboard widget for home. 5 mini circles (w-5 h-5), copper fill for completed prayers, "X/5 prayers today" summary text. Wrapped in `Link` to `/me/soul` with `motion.div whileTap`. Returns null when loading or no data. Uses `usePrayer()` hook. 11 tests passing. |
| StatusIndicatorCard | ✅ | `components/home/StatusIndicatorCard.tsx` | `icon: ReactNode, label: string, value: string \| number, accentColor?: string, className?` — Reusable at-a-glance status card with `border-l-4` accent, circular icon container, label/value pair. Used across home dashboard widgets for consistent metric display. |
| HomeGameWidget | ✅ | `components/home/HomeGameWidget.tsx` | `className?` — Home page game widget. Shows active session card with resume CTA when a game is in progress, or next scheduled game with mode icon and countdown. Returns null when no active session and no upcoming schedule. Uses useGameEngine for active session detection. |

## Relationship Module

| Component | Status | Path | Props |
|---|---|---|---|
| ChallengeCard | ✅ | `components/relationship/ChallengeCard.tsx` | `title: string, stakes: string, status: "pending" \| "active" \| "completed" \| "declined", participants: { name: string, initial: string }[], onAccept?: () => void, onDecline?: () => void, className?` — Challenge card with trophy icon, color-coded status badge (pending/warning, active/info, completed/success, declined/error), overlapping participant initial avatars, and conditional Accept/Decline buttons for pending status. Framer Motion whileHover scale(1.02) + shadow deepen, whileTap scale(0.98). 15 tests passing. |
| MarketplaceItemCard | ✅ | `components/relationship/MarketplaceItemCard.tsx` | `item: MarketplaceItem, balance: number, onBuy?: () => void, variant?: "horizontal" \| "vertical", className?` — Dual-variant marketplace item card. Horizontal variant: compact row for scroll lists. Vertical variant: full card for grid layouts. Three purchase states: affordable (interactive), unaffordable (opacity-70 disabled), coming soon (opacity-60 badge). Price pill with coin emoji + JetBrains Mono. Framer Motion spring buy animation. Exports `MarketplaceItemCardSkeleton` for loading states. 14 tests passing. |
| PurchaseConfirmModal | ✅ | `components/relationship/PurchaseConfirmModal.tsx` | `item: MarketplaceItem, balance: number, isOpen: boolean, onClose: () => void, onConfirmed?: () => void` — Bottom sheet purchase confirmation modal. Balance breakdown (Cost/Balance/After). Input field for `requires_input` items (e.g. custom theme name). Uses `useMarketplace().createPurchase` for purchase records. Disabled when unaffordable. Portal + AnimatePresence. Sonner toast feedback. 21 tests passing. |
| CreateChallengeForm | ✅ | `components/relationship/CreateChallengeForm.tsx` | `open: boolean, onClose: () => void, onSuccess?: () => void` — Bottom sheet form for creating challenges. Emoji quick-pick (10 options), title/description/stakes/deadline fields. RHF+Zod validation (title required, stakes 1-1000, future deadline). Supabase insert to challenges table. Portal + AnimatePresence. 16 tests passing. |
| ClaimWinDialog | ✅ | `components/relationship/ChallengeResolution.tsx` | `challenge: Challenge, open: boolean, onClose: () => void, onClaimed?: () => void` — Dialog for claiming challenge win. Sets status to pending_resolution. Waiting state with pulsing trophy + "Waiting for [Partner]…". Cancel claim reverts to active. Realtime subscription for partner confirmation. Portal + AnimatePresence. 9 tests passing. |
| ConfirmResultDialog | ✅ | `components/relationship/ChallengeResolution.tsx` | `challenge: Challenge, open: boolean, onClose: () => void, onConfirmed?: () => void, onDisputed?: () => void` — Dialog for confirming/disputing challenge results. Only shown to non-claimant. Balance breakdown with partial transfer warning (amber). Confirm Win: transfers CoYYns via spendCoyyns+addCoyyns. Dispute: reverts to active. Portal + AnimatePresence. 10 tests passing. |
| NotificationBuilder | ✅ | `components/relationship/NotificationBuilder.tsx` | `className?, onBuyMore?: () => void` — Notification composition form with emoji picker, title/body fields (RHF+Zod validation), live preview card, and integrated SendLimitIndicator. Passes `onBuyMore` to SendLimitIndicator. Calls `useNotifications().sendNotification()`. Loading/success/error states. 7 tests passing. |
| SendLimitIndicator | ✅ | `components/relationship/SendLimitIndicator.tsx` | `remainingSends: number, bonusSends?: number, onBuyMore?: () => void, className?` — Visual daily send limit indicator. Row of colored dots (success→warning→error as remaining decreases), text count, "Buy more" link when exhausted. Pure presentational. 7 tests passing. |
| CouponCard | ✅ | `components/relationship/CouponCard.tsx` | `coupon: Coupon, onPress?: () => void, compact?: boolean, className?` — Gift-style coupon card with category color badge, status indicator dot (Active/Pending/Used/Expired), creator label, surprise-hidden state. Compact mode for list embedding. Pending approval copper glow pulse. FadeIn on mount. 11 tests passing. |
| CoyynsWallet | ✅ | `components/relationship/CoyynsWallet.tsx` | `onAdd?: () => void, onSpend?: () => void, className?` — Self-contained CoYYns wallet display card. Internally calls `useCoyyns()` for balance/stats and `useAuth()` for partner identity. Animated balance counter via Framer Motion `useMotionValue`/`useTransform`/`animate()` (600ms easeOut count-up). Shows coin icon, formatted balance (JetBrains Mono 40px, accent-primary), "CoYYns" label, lifetime earned/spent stats, partner balance row, and Add (outline) / Spend (filled) action buttons. Loading state: shimmer placeholders with animate-pulse. Error state: "Couldn't load wallet" with Retry button. Card entrance: opacity+y fade (350ms). 12 tests passing. |
| CoyynsHistory | ✅ | `components/relationship/CoyynsHistory.tsx` | `transactions?: CoyynsTransaction[], limit?: number, compact?: boolean, className?` — Scrollable transaction history list for CoYYns activity. Accepts transactions as prop or auto-fetches via `useCoyyns()` hook. Each row shows directional icon (TrendingUp/TrendingDown in tinted 32px container), description (truncated, DM Sans 14px), category + relative time subtitle (12px muted), and right-aligned amount in JetBrains Mono with +/− prefix (success/error colors). StaggerList entrance animation (40ms stagger). EmptyState with Coins icon when no transactions. LoadingSkeleton (3 list-item rows) during hook loading. Compact mode reduces row padding and font size for card embedding. 14 tests passing. |
| AddCoyynsForm | ✅ | `components/relationship/AddCoyynsForm.tsx` | `open: boolean, onClose: () => void, onSuccess?: () => void` — Bottom sheet form for earning CoYYns. Portal to document.body for z-index over BottomNav. AnimatePresence backdrop (bg-black/30 fade) + sheet (slide up from y:100%). RHF+Zod validation: amount (1–10,000 integer, JetBrains Mono 48px centered with copper underline on focus), description (1–200 chars, textarea 3 rows with live char count). Submit calls `useCoyyns().addCoyyns()`, shows sonner toast on success, resets form + calls onClose/onSuccess. Root error display on failure. X button + backdrop click to close. Body scroll lock while open. 10 tests passing. |
| SpendCoyynsForm | ✅ | `components/relationship/SpendCoyynsForm.tsx` | `open: boolean, onClose: () => void, onSuccess?: () => void, prefilledAmount?: number, prefilledDescription?: string, prefilledCategory?: string` — Bottom sheet form for spending CoYYns. Same portal+animation pattern as AddCoyynsForm. Balance-aware: shows current balance at top, dynamic Zod schema with max(balance), real-time "Insufficient CoYYns" warning via `watch("amount")` with red border + disabled button. Prefilled values via `reset()` on open. Category defaults to "manual". Submit calls `useCoyyns().spendCoyyns()` with category. Body scroll lock while open. 11 tests passing. |
| BuyExtraPingModal | ✅ | `components/ping/BuyExtraPingModal.tsx` | `open: boolean, onClose: () => void, onPurchased: () => void` — Bottom sheet modal for buying extra pings (10 CoYYns each). Uses `useCoyyns().spendCoyyns()` + `useNotifications().purchaseBonusSend()`. Shows price badge, current balance, disabled state when insufficient funds, loading spinner during purchase. Portal + AnimatePresence. 8 tests passing. |
| PingHistory | ✅ | `components/ping/PingHistory.tsx` | `className?` — Chat-bubble style notification history feed. Sent pings right-aligned (accent-soft bg), received left-aligned (bg-elevated). Status icons (Check/CheckCheck). Date grouping headers (Today/Yesterday/date). Uses `useNotifications()` internally. Loading skeleton + EmptyState. 8 tests passing. |
| CustomPingComposer | ✅ | `components/ping/CustomPingComposer.tsx` | `className?` — Free-text ping input with send button. Max 200 chars with count at 150+. Uses `useNotifications().sendNotification("Ping", message)`. Disabled when `!canSend` (shows lock icon). Clears on success. Enter key sends. 8 tests passing. |
| PingTabContent | ✅ | `components/ping/PingTabContent.tsx` | — Wrapper assembling all Ping sub-components: PushPermissionPrompt, SendLimitIndicator, NotificationBuilder (with onBuyMore), divider, CustomPingComposer, PingHistory, BuyExtraPingModal. Manages modal open state. |
| CouponHistory | ✅ | `components/coupons/CouponHistory.tsx` | `className?` — Merged coupon history list. Dedupes myCoupons+receivedCoupons, filters terminal statuses (redeemed/rejected/expired), sorts by activity date desc, groups by month (date-fns). IntersectionObserver infinite scroll (20/page). Compact CouponCards with activity labels + timestamps. Month divider sticky headers. EmptyState when empty. 10 tests passing. |
| RedeemConfirmModal | ✅ | `components/coupons/RedeemConfirmModal.tsx` | `open, coupon, mode: "redeem" \| "approve" \| "deny", onClose, onConfirm?` — Bottom sheet confirmation modal. Portal + AnimatePresence pattern. 3 modes: redeem (calls redeemCoupon), approve (calls approveCoupon), deny (textarea for reason, calls rejectCoupon). Coupon preview with emoji+title. Body scroll lock. Sonner toast feedback. 10 tests passing. |
| RedeemStampAnimation | ✅ | `components/coupons/RedeemStampAnimation.tsx` | `visible, onComplete?, className?` — Enhanced multi-stage REDEEMED stamp overlay. Appear at 2x scale → accelerating slam → x-axis shake (±3px) → copper-red REDEEMED imprint (rotated -5deg) → 8 radiating ink splatter dots. Respects prefers-reduced-motion (instant display). role="status" for a11y. 17 tests passing. |
| CouponSendAnimation | ✅ | `components/coupons/CouponSendAnimation.tsx` | `visible, onComplete, className?` — Full-screen paper airplane animation overlay. Multi-stage: fold (400ms) → lift → flight arc to top-right → 12 deterministic particles (copper/gold) → "Sent!" text. `useReducedMotion()` bypass. Timer cleanup. z-50. 16 tests passing. |
| CouponReceiveAnimation | ✅ | `components/coupons/CouponReceiveAnimation.tsx` | `visible, couponTitle, couponId, onOpen, onDismiss, className?` — Letter envelope descend + bounce overlay. Backdrop warm overlay, coupon title display, "Open" (copper) + "Save for Later" (ghost) buttons. Backdrop click = dismiss. Body scroll lock. `useReducedMotion()` bypass. 20 tests passing. |

## Coupons Module (Pages)

| Component | Status | Path | Props |
|---|---|---|---|
| CouponWalletPage | ✅ | `app/(main)/us/coupons/page.tsx` | Client Component. 3 pill tabs (For Me/I Made/History) with Framer Motion layoutId. "For Me": receivedCoupons filtered active+pending. "I Made": myCoupons with "Needs Your Attention" section for pendingApprovals (copper-left border). "History": CouponHistory component. Pull-to-refresh (touch handlers, 60px threshold). Loading skeleton. 10 tests passing. |
| CouponDetailPage | ✅ | `app/(main)/us/coupons/[id]/page.tsx` | Client Component. Dynamic route. States: loading/error/404. Photo (16:9 next/image), emoji+title+description, category+status badges, creator info, expiry countdown (formatDistanceToNow). Role-based actions: recipient+active→Redeem, creator+pending→Approve/Deny. REDEEMED stamp overlay. RedeemConfirmModal integration. Reveal button for creator surprise coupons. 12 tests passing. |
| CreateCouponPage | ✅ | `app/(main)/create-coupon/page.tsx` | Client Component. 4-step wizard orchestrator. Step 1: emoji+title+description+category (RHF+Zod). Step 2: expiry toggle+date, surprise toggle. Step 3: photo upload (OffscreenCanvas resize, 5MB max). Step 4: preview+send (paper-airplane animation). Uploads to Supabase Storage coupon-images bucket. Step indicator (4 dots). AnimatePresence transitions. 8 tests passing. |
| StackedPreviewCard | ✅ | `components/coupons/StackedPreviewCard.tsx` | `coupons: Coupon[], className?` — Three stacked coupon preview cards with CSS depth/offset effect. Shows top coupon front with two behind at slight rotation/offset to convey stack. Used in coupon wallet overview. |

## Health Module

| Component | Status | Path | Props |
|---|---|---|---|
| HealthPage | ✅ | `app/(main)/health/page.tsx` | Redirect to `/me`. (V2: T116 — consolidated into Me page) |
| CycleDayWidget | ✅ | `components/health/CycleDayWidget.tsx` | `className?` — Current cycle day + phase display with SVG progress arc. Shows day number, phase (active/break), days remaining. PMS window amber glow warning. Pulls data from `useCycle()` hook, only renders when config exists. 7 tests passing. |
| CycleConfigForm | ✅ | `components/health/CycleConfigForm.tsx` | `open: boolean, onClose: () => void, onSuccess?: () => void, initialConfig?: CycleConfig` — Bottom sheet form for pill cycle configuration (start date, active days, break days, PMS warning days). RHF+Zod validation, portal with AnimatePresence. Upserts via `useCycle().updateConfig()`. 8 tests passing. |
| CycleCalendarView | ✅ | `components/health/CycleCalendarView.tsx` | `className?` — Month calendar view with phase-colored day cells (copper=active, rose=break, amber=PMS). Today copper ring highlight, past days dimmed. Month navigation with animated transitions. Phase projection from config using date-fns. 9 tests passing. |
| CycleInsightCard | ✅ | `components/health/CycleInsightCard.tsx` | `className?, compact?: boolean` — Contextual advice card based on cycle phase. 7 message variants keyed by phase+phaseDay+daysUntilPMS. Phase icons (sun/cloud/moon). Warm, care-advice tone. Only renders when cycle_config exists (Yahya-only). Compact mode: p-3, smaller icon/text, title inline with message. 6 tests passing. |
| BodyPage | ✅ | `app/(main)/me/body/page.tsx` | Client Component. CycleDayWidget hero, CycleInsightCard, expandable CycleCalendarView (toggle button), gear icon → CycleConfigForm modal. Setup CTA EmptyState when no config. Real FitnessView (weight log) always visible for the authed user. Uses `useCycle()` + `useFitness()`. |
| FitnessView | ✅ | `components/health/FitnessView.tsx` | `history: WeightLog[], goalKg?: number (default 85), isLoading?, onLog?, onDelete?` — Presentational weight-tracking section for Me·Body. Hero with latest weight + goal-progress bar (oldest→goal baseline) + delta-since-last (teal when losing, terracotta when gaining) + token-styled SVG `Sparkline`. Quick-add form (number weight + date, validated 1–999.99, default today, max=today) → `onLog`. History list (newest first) with per-row delete → `onDelete`. Callbacks default to no-ops so `/preview` is inert. Token-only styling. `computeWeightTrend` derives all stats. Exports `FITNESS_MOCK`. 10 tests passing. |

## Spiritual Module

| Component | Status | Path | Props |
|---|---|---|---|
| SpiritPage | ✅ | `app/(main)/spirit/page.tsx` | Redirect to `/me`. (V2: T116 — consolidated into Me page) |
| PrayerTracker | ✅ | `components/spiritual/PrayerTracker.tsx` | `className?` — 5 prayer circles (w-11 h-11) with Arabic labels (فجر، ظهر، عصر، مغرب، عشاء) + English, copper fill on completion, ripple effect on toggle. `aria-pressed` a11y. Uses `usePrayer()` hook. Loading skeleton state. Error message display. 15 tests passing. |
| QuranTracker | ✅ | `components/spiritual/QuranTracker.tsx` | `className?` — Quran reading tracker card. Pages read / daily goal display, "+" increment button, copper progress bar (300ms width transition), monthly total. Uses `useQuran()` hook. Loading skeleton. Error state. 15 tests passing. |
| AzkarCounter | ✅ | `components/spiritual/AzkarCounter.tsx` | `className?` — Azkar counter with morning/evening toggle pills (layoutId sliding indicator), 120px circular tap area with count/target, completion ripple via AnimatePresence, reset button. Uses `useAzkar()` hook. Loading skeleton. Error state. 20 tests passing. |
| SoulPage | ✅ | `app/(main)/me/soul/page.tsx` | Client Component. Full spiritual practice page: PrayerTracker → QuranTracker → AzkarCounter with dividers. "Daily Verse / Hadith — coming soon" placeholder. PageHeader with back to /me. 9 tests passing. |

## Shared List Module

| Component | Status | Path | Props |
|---|---|---|---|
| QuickAddInput | ✅ | `components/list/QuickAddInput.tsx` | `onAdd: (title: string) => void, placeholder?: string, className?` — Sticky input with Plus button. Enter-to-add, trims whitespace, clears on submit, button disabled when empty. 13 tests passing. |
| ListItemCard | ✅ | `components/list/ListItemCard.tsx` | `item: ListItem, subItems?: ListItem[], isOwn: boolean, onToggle, onDelete, onAddSubItem?, className?` — List item with circle checkbox (copper fill), title (strikethrough when done), CoYYns badge, creator dot (Y/P), expand/collapse sub-items with AnimatePresence, sub-item add input, delete button. 18 tests passing. |
| SharedListPage | ✅ | `app/(main)/us/list/page.tsx` | Client Component. List selector tabs, QuickAddInput, active items via StaggerList, collapsible completed section, create new list flow, EmptyState for no lists/empty list. Uses `useSharedList()` hook. 17 tests passing. |

## Rituals Module

| Component | Status | Path | Props |
|---|---|---|---|
| RitualCard | ✅ | `components/rituals/RitualCard.tsx` | `ritual: Ritual, isLogged: boolean, partnerLogged: boolean, onLog: (id) => void, className?` — 40px emoji circle with accent-soft bg, title, cadence pill (Daily/Weekly/Monthly), CoYYns reward badge, personal single dot / shared dual overlapping dots (copper when logged, heart when both done). Tap-to-log when not logged. 12 tests passing. |
| CreateRitualForm | ✅ | `components/rituals/CreateRitualForm.tsx` | `open: boolean, onClose: () => void, onSubmit: (data) => void` — Bottom sheet portal with emoji quick-pick (10 emojis), title input, description textarea, cadence 3-pill selector, shared toggle (switch), CoYYns reward number input, "Create Ritual" submit button. Portal + AnimatePresence. 14 tests passing. |
| HomeRitualsWidget | ✅ | `components/home/HomeRitualsWidget.tsx` | `className?` — Horizontal row of ritual emoji circles (copper fill when logged), title labels, "X/Y completed" summary, "See All" link to /me/rituals. Returns null when loading or no rituals. Uses `useRituals()` hook. 10 tests passing. |
| RitualsPage | ✅ | `app/(main)/me/rituals/page.tsx` | Client Component. PageHeader with Plus button, grouped by cadence (daily/weekly/monthly sections), StaggerList for RitualCards, EmptyState when no rituals, CreateRitualForm modal, Monthly Letter CTA + LetterCard history. Uses `useRituals()` + `useAuth()`. 11 tests passing. |
| MonthlyLetterComposer | ✅ | `components/rituals/MonthlyLetterComposer.tsx` | `open, partnerName, onClose, onSend, onUploadPhoto?, className?` — Full-screen writing overlay (cream #FBF8F4 bg). Serif textarea, "Dear [Partner]," greeting, optional photo upload, character count. "Send" button (copper, disabled when empty). X close button. Portal-level z-50. 15 tests passing. |
| LetterCard | ✅ | `components/rituals/LetterCard.tsx` | `content, date, authorName, photoUrl?, className?` — Envelope aesthetic card with cream bg, double border, envelope emoji, formatted date (MMMM yyyy), first-line preview (60 char truncate), author name. Tap to expand: full-content overlay dialog with photo, close button, backdrop dismiss. 14 tests passing. |
| HomeLetterPrompt | ✅ | `components/home/HomeLetterPrompt.tsx` | `className?` — Monthly letter CTA widget for home dashboard. Only shows on 1st of month. "It's letter day!" + "Write a note to [Partner]". Links to /me/rituals. Uses `useAuth()` for partner name. Returns null on non-1st days. 5 tests passing. |

## Calendar Module

| Component | Status | Path | Props |
|---|---|---|---|
| EventCategoryBadge | ✅ | `components/calendar/EventCategoryBadge.tsx` | `category: EventCategory, variant: "dot" \| "pill", className?` — Category badge with two variants. Dot: 8px colored circle. Pill: rounded label with 10% opacity background. Colors from `calendar-constants.ts`. `aria-label` on dots. 18 tests passing. |
| GoogleCalendarConnect | ✅ | `components/calendar/GoogleCalendarConnect.tsx` | `className?` — Google Calendar connect/disconnect toggle. Uses `useAuth()` for profile data, checks `google_calendar_connected_at`. Connect: redirects to Google OAuth. Disconnect: nulls token columns via `disconnectGoogleCalendar()`. 10 tests passing. |
| EventDotCalendar | ✅ | `components/calendar/EventDotCalendar.tsx` | `events: CalendarEvent[], selectedDate?: Date, onDateSelect?: (date: Date) => void, className?` — Month grid calendar with colored event dots per day. Weekday headers, today highlight (copper ring), date selection. Up to 3 category-colored dots per cell. Month/year navigation. |
| EventCard | ✅ | `components/calendar/EventCard.tsx` | `event: CalendarEvent, className?` — Event detail card with colored category badge (via EventCategoryBadge), time display, title, and optional description. Soft border, rounded corners, tap interaction. |

## Settings Module

| Component | Status | Path | Props |
|---|---|---|---|
| SettingsPage | ✅ | `app/(main)/settings/page.tsx` | Redirect to `/more`. (V2: T117 — consolidated into More page) |
| MorePage (Settings) | ✅ | `app/(main)/more/page.tsx` | The real Settings screen. Constitution reskin (TB-system): header "Settings", warm profile poster (paper gradient + golden-hour wash + texture-parchment, Display name, Hand-font "paired with…"), Account/Preferences/Data/About sections via `SettingsRow`, Skin row "Adaptive ☀️/🌙", Language "English · العربية" (coming soon), Hand-font "made with love, for Yara · Hayah حياة" footer, `skin-aware` root, destructive actions on `var(--destructive)`. Inline ProfileEditForm + ChangePasswordForm; unpair/clear-cache/logout AlertDialogs. |
| NotificationsPage | ✅ | `app/(main)/more/notifications/page.tsx` | Push notification settings sub-page. Toggle push on/off, permission status banners (unsupported/denied/default/granted), registered device list with remove. Uses `usePushSettings` hook. 12 tests passing. |
| PermissionBanner | ✅ | `components/settings/PermissionBanner.tsx` | `variant: "info" \| "warning" \| "success", icon: ReactNode, title: string, description: string, className?` — Reusable status banner with semantic background colors. |
| GoogleDriveConnect | ✅ | `components/settings/GoogleDriveConnect.tsx` | `className?` — Google Drive connect/disconnect toggle. Mirrors GoogleCalendarConnect pattern. Checks `google_drive_connected_at`. Shares OAuth flow with Calendar. 6 tests passing. |
| StorageInfo | ✅ | `components/settings/StorageInfo.tsx` | Storage usage display using `navigator.storage.estimate()`. Shows progress bar with used/quota. Graceful fallback when unavailable. 6 tests passing. |

## Ops Module

| Component | Status | Path | Props |
|---|---|---|---|
| OpsPage | ✅ | `app/(main)/ops/page.tsx` | Redirect to `/more`. (V2: T117 — consolidated into More page) |

## Marketplace Module

| Component | Status | Path | Props |
|---|---|---|---|
| MarketplacePage | ✅ | `app/(main)/us/marketplace/page.tsx` | Client Component. Two-tab marketplace (Shop/Challenges). Shop tab now also renders an **Active** section (ActivePurchaseCard list from useActivePurchases — incoming + outgoing, resolves live, wired to completePurchase/declinePurchase) and a collapsible **Purchase History** disclosure (PurchaseHistoryItem list from usePurchaseHistory). Item grid + PurchaseConfirmModal + CreateChallengeForm. Uses useCoyyns() for balance-aware affordability. 18 tests passing. |
| ActivePurchaseCard | ✅ | `components/marketplace/ActivePurchaseCard.tsx` | `{ purchase, onAcknowledge, onComplete, onDecline, className? }` — Renders purchase cards by effect_type: task_order (description + deadline + Mark Complete), veto (movie/activity + Got it), wildcard (request + accept/decline), dnd_timer (SVG ring countdown, auto-completes via `onExpire` when the timer runs out), extra_ping (bonus message + dismiss). Target sees action buttons whenever the purchase is non-terminal (`pending` OR `active`) so it never sticks; buyer view is read-only. 27 tests passing. |
| PurchaseHistoryItem | ✅ | `components/marketplace/PurchaseHistoryItem.tsx` | `{ purchase, className? }` — Compact past-purchase row: item icon + name, "You sent"/"From your partner" + date, status badge (Completed/Declined/Expired) with `data-status`. Used in the marketplace Purchase History disclosure. 6 tests passing. |
| useActivePurchases | ✅ | `lib/hooks/use-active-purchases.ts` | Hook. Queries purchases WHERE target_id/buyer_id = user AND status IN (pending, active) with marketplace_items join. Realtime subscription (needs migration 038). Actions: acknowledgePurchase (→active), completePurchase (→completed + completed_at), declinePurchase (→declined). Optimistic updates. 15 tests passing. |
| usePurchaseHistory | ✅ | `lib/hooks/use-purchase-history.ts` | Hook. Queries terminal purchases (status IN completed/declined/expired) for both partners with marketplace_items join, ordered by completed_at desc. Realtime subscription so a resolved purchase drops into history live. Auth-safe inert state. 6 tests passing. |

## Media Module (TF07)

| Component | Status | Path | Props |
|---|---|---|---|
| uploadMedia | ✅ | `lib/media-upload.ts` | Utility. `uploadMedia({ file, userId, bucket, sourceTable, sourceColumn, sourceRowId, maxWidth?, maxHeight? })` → `{ url, mediaId }` or `{ error }`. Validates type (image/*) + size (<5MB), compresses to WebP via OffscreenCanvas, uploads to Supabase Storage, inserts media_files tracking row. 21 tests passing. |
| media-export | ✅ | `supabase/functions/media-export/index.ts` | Edge Function. Daily cron: queries active media_files older than 7 days, downloads from Storage, uploads to Google Drive (Y2-Media/{table}/{YYYY-MM}/), updates status to 'exported', deletes Storage copy. Batch size 10, failure isolation per file. 8 tests passing. |
| media-proxy | ✅ | `supabase/functions/media-proxy/index.ts` | Edge Function. On-demand proxy: `?id={media_file_id}&key={MEDIA_PROXY_KEY}`. Fetches from Google Drive via OAuth token refresh, streams with Cache-Control: max-age=2592000. 10 tests passing. |
| MediaImage | ✅ | `components/shared/MediaImage.tsx` | `{ mediaId?, fallbackUrl?, alt, className?, aspectRatio?, fill?, width?, height?, objectFit?, placeholder?, onLoad?, onError? }` — Tier-aware image component. Resolves mediaId via media_files: active→Storage URL, exported→proxy URL. Shimmer/blur loading placeholder, error state with retry button, lazy loading. Falls back to fallbackUrl when lookup fails or no mediaId. 17 tests passing. |

## V2 Navigation (TF10, T115, T116, T117)

| Component | Status | Path | Props |
|---|---|---|---|
| 2026 Vision Board | ✅ | `app/(main)/2026/page.tsx` | Server Component. EmptyState placeholder with Sparkles icon. "Your 2026 vision board is coming soon". |
| /us Layout | ✅ | `app/(main)/us/layout.tsx` | Server Component. Wraps children with PageHeader("Us") + HorizontalTabBar (CoYYns, Coupons, Calendar, Ping). |
| /us CoYYns Tab | ✅ | `app/(main)/us/coyyns/page.tsx` | Client Component. Full challenges + bounties dashboard. Sections: CoyynsWallet (now wired — `onAdd`/`onSpend` open AddCoyynsForm/SpendCoyynsForm bottom sheets that persist earn/spend via useCoyyns), CoyynsHistory (compact, limit=5), Challenges (pending + active cards, New button → CreateChallengeForm), Bounties (active BountyCards, New button → CreateBountyForm), History (collapsible). Modals: AddCoyynsForm, SpendCoyynsForm, ChallengeAcceptFlow, ChallengeResolveFlow, ChallengeWinAnimation, BountyClaimFlow. 19 tests passing. |
| /us Calendar Tab | ✅ | `app/(main)/us/calendar/page.tsx` | Client Component. Month EventDotCalendar with swipe gestures + Today button, inline selected-day events list (`selected-day-events` / `empty-day` CTA — tapping an event card routes to `/us/calendar/edit/{id}`), DayDetailSheet on day tap, "Coming Up" list (next 3, also routes to edit), FAB → create with selected date. Uses `useCalendar` + `useAuth`. Loading skeleton + error/retry states. 22 tests passing. |
| /us Ping Tab | ✅ | `app/(main)/us/ping/page.tsx` | Client Component. Wraps PingTabContent from ping module. |
| Me Page | ✅ | `app/(main)/me/page.tsx` | Client Component. Body/Soul dual-section landing. Two large navigation cards with stagger animation. |
| Soul Page | ✅ | `app/(main)/me/soul/page.tsx` | Client Component. Full spiritual practice dashboard: PrayerTracker → QuranTracker → AzkarCounter with dividers. Future placeholder for Daily Verse/Hadith. 9 tests passing. |
| More Page | ✅ | `app/(main)/more/page.tsx` | Client Component. Utility drawer: Profile card, Account, Preferences, About, Logout with AlertDialog. |
| About Hayah Page | ✅ | `app/(main)/more/about/page.tsx` | Server Component. Why Hayah? + Built with intention sections. |

## Challenges Module (P8)

| Component | Status | Path | Props |
|---|---|---|---|
| ChallengeAcceptFlow | ✅ | `components/challenges/ChallengeAcceptFlow.tsx` | `{ challenge, open, onClose, onAccepted?, onDeclined? }` — Portal dialog for accepting/declining pending challenges. Balance breakdown with insufficient funds warning. Two-step decline confirmation. Uses useCoyyns + useChallenges hooks. 16 tests passing. |
| ChallengeResolveFlow | ✅ | `components/challenges/ChallengeResolveFlow.tsx` | `{ challenge, open, onClose, onResolved? }` — Multi-state portal dialog: claim (I Won!), waiting (pulsing clock), confirm (Confirm/Dispute), disputed (shows note). Realtime subscription for status changes. Dispute textarea. 16 tests passing. |
| ChallengeWinAnimation | ✅ | `components/challenges/ChallengeWinAnimation.tsx` | `{ open, isWinner, amount, onComplete? }` — Winner: trophy + confetti (20 particles, copper/gold) + counter animation (0→amount). Loser: frown + wobble + negative amount. prefers-reduced-motion: skip particles, 800ms timeout. 16 tests passing. |

## Bounties Module (P8)

| Component | Status | Path | Props |
|---|---|---|---|
| BountyCard | ✅ | `components/bounties/BountyCard.tsx` | `{ bounty, pendingClaim?, onClaim? }` — Gift icon + title + reward pill + trigger description. Recurring badge (info colors), Claim Pending badge (amber). "I did it!" button (non-creator, no pending claim). 13 tests passing. |
| CreateBountyForm | ✅ | `components/bounties/CreateBountyForm.tsx` | `{ open, onClose, onCreated? }` — Bottom sheet form. Title + trigger description + reward stepper (min 1, max 1000, step 5) + recurring toggle. RHF + Zod validation. Calls useBounties().createBounty(). 17 tests passing. |
| BountyClaimFlow | ✅ | `components/bounties/BountyClaimFlow.tsx` | `{ bounty, claim, open, onClose, onConfirmed?, onDenied? }` — Portal dialog. Creator view: Review Claim + Confirm & Pay / Deny buttons. Claimer view: waiting message. 15 tests passing. |

## Pairing Module

| Component | Status | Path | Props |
|---|---|---|---|
| InviteCodeDisplay | ✅ | `components/pairing/InviteCodeDisplay.tsx` | `code: string | null, className?` — Shows user's 6-char invite code in 32px monospace copper text. Copy button copies pairing link (via generatePairingLink). Share button (navigator.share with clipboard fallback). Loading skeleton when code is null. 9 tests passing. |
| PairPartnerForm | ✅ | `components/pairing/PairPartnerForm.tsx` | `onPaired: (partnerName: string) => void` — Code entry form with 6-char uppercase input (auto-uppercase, alphanumeric filter, maxLength 6). Calls `supabase.rpc('pair_partners', { my_id, partner_code })`. States: idle, loading, error (shake + message). On success it hands the partner name up via `onPaired(partner_name)` and unmounts (returns null) — the parent page/step owns the shared keepsake celebration + refreshProfile/redirect. 15 tests passing. |
| PairingCelebration | ✅ | `components/pairing/PairingCelebration.tsx` | `{ variant?: 'seal'\|'girih'\|'weave'\|'ink', nameA, nameB, onDone, sound? }` — Shared "Seal" keepsake celebration (CSS-module riso art + WebAudio thunk/chime). Renders via `createPortal` to body. Tap-to-skip then tap to exit; "Enter Hayah →" button fires `onDone`. Honors prefers-reduced-motion (reveals instantly, no audio). Single source of truth used by /pair, /pair/[code], and onboarding PairingStep. 7 tests passing. |
| PairingNudge | ✅ | `components/pairing/PairingNudge.tsx` | _(no props)_ — Dismissible banner encouraging unpaired users to connect (CTA → /pair). Session-persisted dismissal (`sessionStorage`). Rendered by MainLayout for onboarding-complete, unpaired users only — pairing is never hard-gated. 4 tests passing. |
| QRCodeDisplay | ✅ | `components/pairing/QRCodeDisplay.tsx` | `code: string | null, className?` — Renders invite code as QR code (200x200, copper #C4956A on cream #FBF8F4). Dynamic import of `qrcode` lib. Shows code text, Copy Link + Share buttons. Loading skeleton when null. 12 tests passing. |
| QRCodeScanner | ✅ | `components/pairing/QRCodeScanner.tsx` | `onScan: (code: string) => void, className?` — "Scan QR Code" button opens fullscreen overlay. Camera via getUserMedia (environment facing). Primary: BarcodeDetector API, fallback: jsQR (dynamic import). Viewfinder with corner markers. Error state for denied camera. 9 tests passing. |
| PairCodePage | ✅ | `app/(main)/pair/[code]/page.tsx` | Deep link handler. Unauthenticated → stores code in sessionStorage → redirects to login. Authenticated + unpaired → auto-calls pair_partners RPC. Authenticated + paired → shows "Already paired". On success plays the shared `PairingCelebration` keepsake; a `startedRef` makes the mount decision once so the post-pair `refreshProfile()` can't flip the screen to "Already paired" — redirect home is gated until "Enter Hayah". 14 tests passing. |
| PairPage | ✅ | `app/(main)/pair/page.tsx` | Full-screen pairing flow. Heart icon header, QRCodeDisplay, "or" divider, QRCodeScanner, "or" divider, PairPartnerForm. Redirects to home if already paired. 8 tests passing. |
| pairing-link | ✅ | `lib/pairing-link.ts` | `generatePairingLink(code) → URL`, `parsePairingCode(url) → code\|null`, `storePendingPairCode(code)`, `consumePendingPairCode() → code\|null`. SessionStorage bridge for unauthenticated deep link flow. 15 tests passing. |

## Public Event Portal (`/e/[slug]`)

| Component | Status | Path | Props |
|---|---|---|---|
| portal-themes | ✅ | `lib/portal-themes.ts` | `THEME_PRESETS` (5: `elegant_gold` [locked default], `hayah_warm`, `garden_romance`, `minimalist`, `midnight_blue`) + `THEME_PRESET_META`, `resolveTheme`, `generatePortalCSSVariables`, `getGoogleFontsUrl`. **`hayah_warm`** (TB-system) is the Constitution's public-theme expression — terracotta #C8552B / amber #F2A93B / paper #F7EFE3 / ink #2A2018 + Fraunces + Space Grotesk; selectable in PortalCreationWizard. 19 tests passing. |
| PortalThemeProvider | ✅ | `components/events/public/PortalThemeProvider.tsx` | `themeConfig, children` — resolves the host-chosen preset and injects `--portal-*` CSS vars + Google Fonts link. Theme-driven; all public portal chrome (nav, sections, PasswordGate, layout) reads these vars. |
| PortalNotFound | ✅ | `app/e/[slug]/not-found.tsx` | Warm 404 — paper ground + golden-hour wash + lantern-dusk scene, Display heading, Fraunces subline, terracotta Go-Home pill. Constitution tokens (TB-system reskin). |

## Event Portal Builder (`/us/events`) — W2

| Component | Status | Path | Notes |
|---|---|---|---|
| portal-seed | ✅ | `lib/portal-seed.ts` | Pure row builders (`buildTemplatePageRows`, `buildSectionRowsForPage`, `buildSubEventRows`) + seeders (`seedPortalFromTemplate`, `seedPortalSubEvents`). Turns a chosen template into `portal_pages` + `portal_sections` rows (slug→id keyed) and persists wizard sub-events (empty date/time → null). 13 tests. |
| useEventPortal.createPortalFromWizard | ✅ | `lib/hooks/use-event-portal.ts` | Wizard create path: inserts `event_portals` (with `template_id`), then seeds pages/sections + sub-events. Returns the portal even if seeding fails (error surfaced). |
| PortalEditor (Add Page) | ✅ | `components/events/PortalEditor.tsx` | Added `+ Page` button + bottom-sheet form (title + optional emoji) → `createPage` with deduped slug; new page becomes active. Section editors wired via `getSectionEditor`. |
| Portal edit route | ✅ | `app/(main)/us/events/[portalId]/edit/page.tsx` | Renders `PortalEditor` with `renderSectionEditor` from `SECTION_EDITOR_REGISTRY`; Preview opens `/e/[slug]`. Reachable from PortalDashboard "Edit Portal". |

## Auth Infrastructure

| Component | Status | Path | Notes |
|---|---|---|---|
| AuthProvider | ✅ | `lib/providers/AuthProvider.tsx` | Context provider with user/profile/partner state from Supabase onAuthStateChange. useAuth() hook. signOut with /login redirect. profileNeedsSetup boolean. refreshProfile() method. 11 tests passing. |
| LoginPage | ✅ | `app/(auth)/login/page.tsx` | RHF+Zod login form. Supabase signInWithPassword. Framer Motion entrance. Error states + loading spinner. 13 tests passing. |
| AuthLayout | ✅ | `app/(auth)/layout.tsx` | Minimal layout for auth pages — no AppShell, no BottomNav. |
| MainLayout | ✅ | `app/(main)/layout.tsx` | Protected route layout with AppShell. **Skippable onboarding guard**: redirects users with no `onboarding_completed_at` to `/onboarding` (forwards deep-link `?code=`); never loops (skip stamps completion). Pairing is NOT hard-gated — renders `PairingNudge` for onboarding-complete, unpaired users. `ProfileSetupOverlay` shown only as a post-onboarding fallback (onboarding complete but name missing). |
| Middleware | ✅ | `middleware.ts` | Next.js Edge middleware. Redirects unauthenticated users to /login, authenticated /login→/. Fail-open on errors. 11 tests passing. |
| user.types.ts | ✅ | `lib/types/user.types.ts` | Profile type (from database.types.ts Row), AuthContextType interface. |

## Hooks / Data Layer

| Hook | Status | Path | API |
|---|---|---|---|
| useCoyyns | ✅ | `lib/hooks/use-coyyns.ts` | `useCoyyns() → { wallet, partnerWallet, transactions, isLoading, error, addCoyyns, spendCoyyns, refreshWallet }` — Client-side data layer for CoYYns feature. Three parallel initial fetches (user wallet, partner wallet, last 50 transactions). Realtime subscription on `coyyns_wallets` for live sync. `addCoyyns(amount, description, category?)` validates positive integer, inserts earn transaction. `spendCoyyns(amount, description, category?)` checks balance before inserting spend transaction. Auth-safe: returns inert state when user is null. 13 tests passing. |
| useNotifications | ✅ | `lib/hooks/use-notifications.ts` | `useNotifications() → { notifications, dailyLimit, canSend, remainingSends, isLoading, error, sendNotification, purchaseBonusSend, refreshLimits }` — Notification sending with daily limits (2 free + bonus sends). Optimistic insert with rollback on failure. After the DB insert, `sendNotification` calls the atomic `consume_send(p_user_id)` RPC (migration 040) to debit the quota server-side (free first, then purchased bonus); if it raises `send_limit_reached` (P0001) the inserted row is deleted, the optimistic row is removed, and the push is NOT sent — closes the prior bug where the 2/day limit was checked in the UI but never actually consumed in the DB (sends were effectively unlimited). Then invokes `send-notification` edge function. `purchaseBonusSend()` upserts daily_send_limits to increment bonus_sends_available. Double-tap prevention via `isSending` ref. Auth-safe: inert state when user is null. 17 tests passing. |
| useCycle | ✅ | `lib/hooks/use-cycle.ts` | `useCycle() → { config, logs, currentDay, currentPhase, pmsWindow, periodLikelihood, isLoading, error, updateConfig, addLog, refreshCycle }` — Pill cycle tracking with phase calculations. Dual-layer privacy: profile null guard + owner_id comparison. Derived computations: currentDay, phase (active/break), PMS window (days 21-28), period likelihood. Upsert config, insert logs. Auth-safe: null return for non-owners. 14 tests passing. |
| useCoupons | ✅ | `lib/hooks/use-coupons.ts` | `useCoupons() → { myCoupons, receivedCoupons, pendingApprovals, isLoading, error, createCoupon, redeemCoupon, approveCoupon, rejectCoupon, revealSurprise, refreshCoupons }` — Full coupon CRUD lifecycle with realtime subscription. Status guards on all mutations. Surprise reveal with coupon_history logging. Auth-safe: inert state when user is null. 8 tests passing. |
| useMarketplace | ✅ | `lib/hooks/use-marketplace.ts` | `useMarketplace() → { items, purchases, isLoading, error, createPurchase, refreshItems, refreshPurchases }` — Client-side data layer for marketplace. Fetches active marketplace_items and user purchases. `createPurchase(itemId, effectPayload?)` spends CoYYns → inserts purchase (status pending) → awaits the `process-purchase` edge function (applies effect + pushes to partner). On edge-fn failure it does NOT swallow: writes an in-app notification row to the partner + activates the purchase so it stays actionable. Auth-safe inert state. 10 tests passing. |
| useDailyBonus | ✅ | `lib/hooks/use-daily-bonus.ts` | `useDailyBonus() → { claimed: boolean, justClaimed: boolean }` — Daily login bonus hook. On mount, checks coyyns_transactions for today's `daily_bonus` category (UTC date boundaries). If none exists, inserts +5 earn transaction. `hasChecked` ref prevents duplicate calls across re-renders. Silent error handling (bonus is non-critical). Auth-safe: returns inert `{false, false}` when user is null. 6 tests passing. |
| usePrayer | ✅ | `lib/hooks/use-prayer.ts` | `usePrayer() → { today, togglePrayer, completedCount, isLoading, error }` — Prayer tracking hook. Fetches today's prayer_log via `.maybeSingle()`, upserts new row if none exists. `togglePrayer(name)` optimistic flip + rollback on error. `completedCount` via useMemo counting true values. Auth-safe: inert state when user null. 11 tests passing. |
| usePrayerTimes | ✅ | `lib/hooks/use-prayer-times.ts` | `usePrayerTimes() → { times, rows, next, countdown, needsLocation, detectLocation, setLocation, isSaving, error }` — Location-based prayer TIMES (factual, computed by the `adhan` library — never fabricated). Reads `profile.latitude/longitude/prayer_method/timezone`, computes the 5 daily prayers + sunrise + live next-prayer countdown (1s tick). `detectLocation()` uses `navigator.geolocation`; `setLocation(lat,lng)` is the manual fallback; both persist via `profiles.update().eq("id",user.id)` (+ device timezone) then `refreshProfile()`. `needsLocation` true when no coords saved → UI shows a prompt. Auth-safe. 9 tests passing. |
| prayer/compute | ✅ | `lib/prayer/compute.ts` | Pure (no React/Supabase) prayer-time math over the `adhan` lib. `computePrayerTimes(lat,lng,method?,date?)`, `getNextPrayer(...)` (rolls to tomorrow's Fajr after Isha), `resolveMethod` (defaults to Egyptian = Egyptian General Authority of Survey), `formatPrayerTime`, `formatCountdown`. 12 tests passing. |
| useQuran | ✅ | `lib/hooks/use-quran.ts` | `useQuran() → { today, logPages, monthlyTotal, dailyGoal, setDailyGoal, isLoading, error }` — Quran reading tracker hook. Fetches today + monthly logs. `logPages(pages)` optimistic increment. `setDailyGoal(goal)` rejects < 1. `monthlyTotal` via useMemo. Auth-safe: inert state when user null. 12 tests passing. |
| useCalendar | ✅ | `lib/hooks/use-calendar.ts` | `useCalendar() → { events, upcomingEvents, milestones, isLoading, error, createEvent, updateEvent, deleteEvent, refreshEvents, getEventsForMonth }` — Calendar data hook. Fetches events from Supabase, derives upcomingEvents (>= today) and milestones (category=milestone). Full CRUD (create/update/delete) with creator_id guard; `updateEvent` does a Supabase `.update().eq(id)` then refetches, fire-and-forget Google Calendar sync + shared-event partner notification. Realtime subscription. Auth-safe: inert state when user null. 28 tests passing (hooks/use-calendar) + 14 (lib/hooks/use-calendar). |
| useAzkar | ✅ | `lib/hooks/use-azkar.ts` | `useAzkar() → { session, sessionType, increment, reset, setTarget, switchType, isLoading, error, justCompleted }` — Azkar counter hook. Morning/evening session switching. `increment()` optimistic update. `justCompleted` fires once per target reach via ref. 3-column upsert conflict (user_id, date, session_type). Auth-safe: inert state when user null. 14 tests passing. |
| useChallenges | ✅ | `lib/hooks/use-challenges.ts` | `useChallenges() → { activeChallenges, pendingChallenges, historyChallenges, isLoading, error, createChallenge, acceptChallenge, declineChallenge, claimVictory, confirmVictory, disputeChallenge, refreshChallenges }` — V2 challenge hook with stake escrow. createChallenge: spendCoyyns → insert pending_acceptance. acceptChallenge: spendCoyyns → update active. confirmVictory: RPC resolve_challenge_payout (stakes×2). declineChallenge: RPC refund_challenge_stake. Realtime subscription. Auth-safe. 16 tests passing. |
| useNewCouponDetection | ✅ | `lib/hooks/use-new-coupon-detection.ts` | `useNewCouponDetection() → { newCoupon, showAnimation, onAnimationComplete, onSaveForLater }` — Detects newly received coupons since last_seen (localStorage). Checks on mount + visibilitychange. Triggers CouponReceiveAnimation overlay in main layout. onAnimationComplete/onSaveForLater update last_seen and dismiss. Auth-safe. 11 tests passing. |
| useRituals | ✅ | `lib/hooks/use-rituals.ts` | `useRituals() → { rituals, todayRituals, logs, isLoading, error, logRitual, isLoggedThisPeriod, partnerLoggedThisPeriod, createRitual, deleteRitual, uploadRitualPhoto }` — Ritual tracking hook with period key calculation (daily/weekly/monthly), optimistic log insert, CoYYns reward on log, Map-based period lookup. Realtime subscription on ritual_logs. Photo upload to `ritual-images` bucket. Auth-safe: inert state when user null. 19 tests passing. |
| useSharedList | ✅ | `lib/hooks/use-shared-list.ts` | `useSharedList() → { lists, list, items, completedItems, isLoading, error, addItem, addSubItem, toggleComplete, deleteItem, reorderItems, createList, deleteList, selectList }` — Shared list hook with full CRUD, realtime subscription on list_items, optimistic updates with rollback. CoYYns reward on completing partner's item. 7-day auto-archive filter. Auth-safe: inert state when user null. 19 tests passing. |
| useBounties | ✅ | `lib/hooks/use-bounties.ts` | `useBounties() → { activeBounties, pendingClaims, isLoading, error, createBounty, claimBounty, confirmClaim, denyClaim, refreshBounties }` — Standing bounties hook. createBounty: insert (reward > 0). claimBounty: insert claim. confirmClaim: RPC confirm_bounty_claim → pays claimer. denyClaim: update status=denied. Realtime on bounties + bounty_claims. Auth-safe. 13 tests passing. |
| useSnap | ✅ | `lib/hooks/use-snap.ts` | `useSnap() → { todaySnap, partnerTodaySnap, snapFeed, isLoading, error, isWindowOpen, windowTimeRemaining, submitSnap, reactToSnap, loadMore, hasMore }` — Full snap data hook. submitSnap UPDATEs existing placeholder row (not INSERT). Uses uploadMedia with bucket "snap-photos", maxWidth 1200. Window detection from snap_schedule. Cairo timezone. Realtime on snaps table. 15 tests passing. |
| useMood | ✅ | `lib/hooks/use-mood.ts` | `useMood() → { todayMood, partnerMood, isLoading, error, setMood }` — Mood tracking hook. Fetches mood_log for today (Cairo tz) for user + partner. setMood uses .upsert() with onConflict: 'user_id,mood_date'. Optimistic updates with rollback. Realtime subscription for partner mood changes. 15 tests passing. |
| useGarden | ✅ | `lib/hooks/use-garden.ts` | `useGarden() → { gardenDays, recentFlowers, isLoading, error, recordOpened }` — Garden data hook. recordOpened upserts today's row (yahya_opened/yara_opened based on display_name). When both opened + no flower, picks random from 12 emojis. Race-safe: UPDATE WHERE flower_type IS NULL with retry fallback. Realtime on garden_days. 14 tests passing. |
| useFoodJournal | ✅ | `lib/hooks/use-food-journal.ts` | `useFoodJournal() → { visits, isLoading, error, stats, addVisit, updateVisit, toggleBookmark, addRating, getMyRating, getPartnerRating, addPhotos, removePhoto, getPhotos, getPreferenceDot, getVisitById, filterByCuisine }` — Food journal data hook. Fetches food_visits + food_ratings + food_photos from Supabase. Derived stats (totalVisits, uniquePlaces, avgOverall, topCuisine, returnSpots, bookmarkedCount). getVisitById returns VisitWithRatings join. getPreferenceDot computes vibe masking per rating dimension. filterByCuisine filters visits by cuisine type array. Realtime subscription on food_visits. Auth-safe: inert state when user null. 17 tests passing. |

| usePushSettings | ✅ | `lib/hooks/use-push-settings.ts` | `usePushSettings() → { permissionState, isSubscribed, isLoading, devices, currentEndpoint, error, togglePush, removeDevice, refreshDevices }` — Push notification settings hook. Checks browser Push API + permission state. Fetches device list from push_subscriptions. togglePush calls subscribeToPush/unsubscribeFromPush from push-service.ts. removeDevice deletes from DB + unsubscribes browser if current device. Auth-safe. 7 tests passing. |

## Types

| Type File | Status | Path | Exports |
|---|---|---|---|
| coyyns.types.ts | ✅ | `lib/types/coyyns.types.ts` | `CoyynsWallet`, `CoyynsTransaction` — derived from `database.types.ts` Row types for `coyyns_wallets` and `coyyns_transactions` tables. |
| user.types.ts | ✅ | `lib/types/user.types.ts` | `Profile`, `AuthContextType` — Profile type from database.types.ts, AuthContextType interface. |
| notification.types.ts | ✅ | `lib/types/notification.types.ts` | `PushPermissionState`, `NotificationStatus`, `Notification`, `DailyLimit`, `UseNotificationsReturn` — Push permission states, notification/daily limit Row types from database.types.ts. |
| health.types.ts | ✅ | `lib/types/health.types.ts` | `CycleConfig`, `CycleLog`, `CyclePhase`, `CycleMood`, `UseCycleReturn` — Cycle tracker types from database.types.ts Row types. |
| relationship.types.ts | ✅ | `lib/types/relationship.types.ts` | `CouponCategory`, `CouponStatus`, `Coupon`, `CreateCouponData`, `UseCouponsReturn` — Love coupon types with full status enum and creation data shape. |
| calendar.types.ts | ✅ | `lib/types/calendar.types.ts` | `CalendarEvent`, `CalendarEventInsert`, `CalendarEventUpdate`, `EventCategory`, `EventRecurrence`, `UseCalendarReturn`, `EVENT_CATEGORIES`, `EVENT_RECURRENCES` — Calendar event types from database.types.ts. Category/recurrence union types. |
| spiritual.types.ts | ✅ | `lib/types/spiritual.types.ts` | `PrayerLog`, `QuranLog`, `AzkarSession` (+ Insert/Update variants), `PrayerName`, `AzkarSessionType`, `PRAYER_NAMES`, `AZKAR_SESSION_TYPES` — Spiritual practice types derived from database.types.ts. |
| rituals.types.ts | ✅ | `lib/types/rituals.types.ts` | `Ritual`, `RitualInsert`, `RitualLog`, `RitualLogInsert`, `Cadence` — Ritual and ritual log types derived from database.types.ts. Cadence union type (daily/weekly/monthly). |
| shared-list.types.ts | ✅ | `lib/types/shared-list.types.ts` | `SharedList`, `ListItem`, `ListType`, `UseSharedListReturn` — Shared list and list item types derived from database.types.ts. ListType union type. |
| challenges.types.ts | ✅ | `lib/types/challenges.types.ts` | `Challenge`, `ChallengeInsert`, `ChallengeUpdate`, `ChallengeStatus`, `Bounty`, `BountyInsert`, `BountyUpdate`, `BountyClaim`, `BountyClaimInsert`, `BountyClaimStatus`, `CreateChallengeData`, `CreateBountyData`, `UseChallengesReturn`, `UseBountiesReturn` — V2 challenge + bounty types from database.types.ts. |
| snap.types.ts | ✅ | `lib/types/snap.types.ts` | `Snap`, `SnapInsert`, `SnapSchedule`, `REACTION_EMOJIS` — Snap and snap schedule types derived from database.types.ts. Reaction emoji union type. |
| mood.types.ts | ✅ | `lib/types/mood.types.ts` | `MoodLog`, `Mood`, `MOODS`, `MOOD_EMOJI` — Mood log type from database.types.ts. 6 mood values (good/calm/meh/low/frustrated/loving) with emoji map. |
| food-journal.types.ts | ✅ | `lib/types/food-journal.types.ts` | `FoodVisit`, `FoodVisitInsert`, `FoodRating`, `FoodRatingInsert`, `FoodPhoto`, `FoodPhotoInsert`, `CuisineType`, `CUISINE_TYPES`, `CUISINE_LABELS`, `RATING_DIMENSIONS`, `RatingDimensionKey`, `PhotoType`, `PHOTO_TYPES`, `PHOTO_TYPE_LABELS`, `PreferenceDotColor`, `FoodStats`, `VisitWithRatings` — Food journal types from database.types.ts. 17 cuisine types, 9 rating dimensions, 5 photo types. |

## Services

| Service | Status | Path | API |
|---|---|---|---|
| push-service | ✅ | `lib/services/push-service.ts` | `isPushSupported(), getPushPermission(), subscribeToPush(userId), unsubscribeFromPush(userId)` — Web Push API wrapper. VAPID key subscription via PushManager. Stores subscription JSON in Supabase `push_subscriptions`. Delete+insert pattern for subscription updates. 9 tests passing. |
| google-calendar | ✅ | `lib/google-calendar.ts` | `getGoogleAuthUrl(), disconnectGoogleCalendar(supabase, userId)` — Google OAuth URL builder with env-based client_id + redirect_uri. Disconnect nulls token columns in profiles. 8 tests passing. |
| google-drive | ✅ | `lib/google-drive.ts` | `disconnectGoogleDrive(supabase, userId)` — Disconnect Google Drive by nulling `google_drive_refresh_token` and `google_drive_connected_at` on profiles. Mirrors disconnectGoogleCalendar pattern. |
| calendar-constants | ✅ | `lib/calendar-constants.ts` | `EVENT_CATEGORY_CONFIG`, `getCategoryColor(cat)`, `getCategoryLabel(cat)` — 4-category color config (date_night=#B87333, milestone=#DAA520, reminder=#9CA3AF, other=#4A4543) with Heart/Star/Bell/Calendar icons. 10 tests passing. |
| avatar-upload | ✅ | `lib/avatar-upload.ts` | `uploadAvatar(file: File, userId: string) → { url } \| { error }` — Validates image type/size (5MB max), center-crops to 400x400 via OffscreenCanvas, exports as WebP 80% quality, uploads to Supabase Storage `avatars/${userId}.webp` with cache-busting URL. 13 tests passing. |
| notification-router | ✅ | `lib/notification-router.ts` | `getRouteForNotification(type?, payload?) → string` — Maps notification types to target routes for SW click handler and in-app routing. Handles coupon_received/redeemed/approved (with coupon_id), ping, challenge_created/claimed, purchase_received, daily_bonus. Default → `/`. 11 tests passing. |

## Vision Board Module (P10)

| Component | Status | Path | Props |
|---|---|---|---|
| VisionItemCard | ✅ | `components/vision-board/VisionItemCard.tsx` | `{ item: VisionItem, onToggleAchieved?, onRemove?, readOnly?, className? }` — 140x140px vision item card. MediaImage or text fallback. Achieved: copper ring-2 + animated checkmark badge. whileTap scale 0.98 when interactive. 16 tests passing. |
| CategorySection | ✅ | `components/vision-board/CategorySection.tsx` | `{ category: CategoryWithItems, onAddItem?, onToggleAchieved?, onRemoveItem?, readOnly?, className? }` — Category header (icon+name+count) + horizontal scroll of VisionItemCards + "+" add button. readOnly hides add. 15 tests passing. |
| AddVisionItemForm | ✅ | `components/vision-board/AddVisionItemForm.tsx` | `{ categoryId, categories, onSave, onClose }` — Bottom sheet (portal+AnimatePresence). Photo upload, title (required), description (300 chars), category dropdown. |
| VisionBoardWizard | ✅ | `components/vision-board/VisionBoardWizard.tsx` | `{ onComplete }` — 4-step wizard: title+theme → category chips (8 suggested+custom) → hero banner upload → preview+"Start Adding Items". AnimatePresence step transitions. |
| VisionBoardPage | ✅ | `app/(main)/2026/page.tsx` | Board switcher (layoutId animated), hero banner (16:9 MediaImage/gradient), category sections, eval prompt, wizard empty state. 26 tests passing. |
| useVisionBoard | ✅ | `lib/hooks/use-vision-board.ts` | `useVisionBoard() → { myBoard, partnerBoard, categories, evaluations, activeBoard, switchBoard, currentBoard, hasEvaluatedThisMonth, createBoard, setHeroBanner, addCategory, removeCategory, reorderCategories, addItem, toggleAchieved, removeItem, submitEvaluation, getEvaluations }` — Full CRUD with realtime subscription on vision_items. uploadMedia for images. 24 tests passing. |
| vision-board.types.ts | ✅ | `lib/types/vision-board.types.ts` | `VisionBoard`, `VisionCategory`, `VisionItem`, `MonthlyEvaluation`, `CategoryScore`, `CategoryWithItems`, `EvaluationWithScores`, `ActiveBoard` |
| EvaluationSlider | ✅ | `components/vision-board/EvaluationSlider.tsx` | `{ label, value, onChange, icon?, min?, max?, showNote?, onNoteChange?, note?, className? }` — Custom 1-10 range slider with score labels (Needs work/Getting there/On track/Strong/Excellent). Optional note toggle. 21 tests passing. |
| EvaluatePage | ✅ | `app/(main)/2026/evaluate/page.tsx` | Month header, per-category sliders with notes, category average, overall score, reflection textarea (1000 chars), already-evaluated guard, submit with router.push("/2026"). 20 tests passing. |
| ScoreChart | ✅ | `components/vision-board/ScoreChart.tsx` | `{ data, onSelectMonth?, selectedMonth?, className? }` — Custom SVG line chart. 12-month x-axis, 1-10 y-axis. Copper line for self, gray dashed for partner. Clickable dots with selection. 15 tests passing. |
| EvaluationHistory | ✅ | `components/vision-board/EvaluationHistory.tsx` | `{ evaluations, categoryNames?, className? }` — ScoreChart wrapper + selected month detail breakdown (overall score, category bars, reflection). AnimatePresence transitions. 15 tests passing. |
| HomeEvaluationPrompt | ✅ | `components/home/HomeEvaluationPrompt.tsx` | `{ className? }` — Dashboard card. Shows from 28th of month if board exists, not evaluated, not dismissed within 3 days (localStorage). Links to /2026/evaluate. 17 tests passing. |

## Wishlist Module (P14)

| Component | Status | Path | Props |
|---|---|---|---|
| WishlistItemCard | ✅ | `components/wishlist/WishlistItemCard.tsx` | `{ item, isOwnList, onClaim?, onUnclaim?, onMarkPurchased?, onDelete?, userId? }` — Card with image/emoji fallback, title, description, price badge, category chip, priority pill. Own list: edit/delete buttons. Partner list: ClaimBadge. CRITICAL: no claim indicators on own list. 18 tests passing. |
| AddWishlistItemForm | ✅ | `components/wishlist/AddWishlistItemForm.tsx` | `{ open, onClose, onSubmit, extractUrlMetadata }` — Bottom sheet (portal+AnimatePresence). URL auto-fill on paste/blur. Fields: url, title*, price+currency, 9 category chips, 3 priority radio, description. Zod-like validation. 16 tests passing. |
| ClaimBadge | ✅ | `components/wishlist/ClaimBadge.tsx` | `{ item, userId, onClaim, onUnclaim, onMarkPurchased }` — 3 states: unclaimed (Gift icon), claimed by me (Lock icon, accent-primary), purchased (Check icon, success). 7 tests passing. |
| WishlistPage | ✅ | `app/(main)/us/wishlist/page.tsx` | Two tabs (My/Partner's Wishlist) with motion layoutId. Price total badge. Category + priority filters. Collapsible purchased section. FAB → AddWishlistItemForm (my tab only). 16 tests passing. |
| useWishlist | ✅ | `lib/hooks/use-wishlist.ts` | `useWishlist() → { myItems (claim masked!), partnerItems, myTotal, partnerTotal, isLoading, addItem, removeItem, updateItem, claimItem, unclaimItem, markPurchased, extractUrlMetadata }` — CRITICAL: claimed_by always null on myItems. Realtime subscription. 31 tests passing. |
| wishlist.types.ts | ✅ | `lib/types/wishlist.types.ts` | `Wishlist`, `WishlistItem`, `AddWishlistItemData`, `UrlMetadata`, `WISHLIST_CATEGORIES` (9), `WISHLIST_PRIORITIES` (3) with derived types. |
| url-metadata | ✅ | `supabase/functions/url-metadata/index.ts` | Edge function. POST `{ url }` → `{ title, description, image, price, currency }`. JWT auth, 5s timeout, regex OG extraction. |
| 024_wishlist.sql | ✅ | `supabase/migrations/024_wishlist.sql` | Tables: wishlists + wishlist_items. RLS: owner CRUD, partner read + update claim/purchase. Auto-create trigger + backfill. |

## Food Journal Module (P12)

| Component | Status | Path | Props |
|---|---|---|---|
| RestaurantSearch | ✅ | `components/food/RestaurantSearch.tsx` | `{ onSelect: (data: { placeName, placeId, address, lat, lon }) => void, className? }` — Restaurant search with two modes: Nominatim API search (300ms debounce, proper User-Agent header, result list with AnimatePresence) and manual fallback (free-text place name + address). GPS auto-capture on mount. Result items show name + address. placeId formatted as `nominatim:{osm_type}:{osm_id}`. Loading spinner, no-results state, error handling. 15 tests passing. |
| FoodPhotoCapture | ✅ | `components/food/FoodPhotoCapture.tsx` | `{ onNext: (photos: { file, type }[]) => void, onBack: () => void, className? }` — Photo capture step with 2 required slots (food_plate, partner_eating) and optional extras with type selector (5 types excluding required). File input with accept="image/*", preview via createObjectURL, remove with revokeObjectURL cleanup. Next disabled until both required photos captured. Back button navigation. 17 tests passing. |
| GradientSlider | ✅ | `components/food/GradientSlider.tsx` | `{ value, onChange, min?, max?, step?, label?, description?, gradient?, className? }` — Reusable 1-10 slider with gradient track (4 variants: warm/cool/vibrant/muted), snap-to-integer, haptic feedback via navigator.vibrate, thumb with value tooltip. Copper-accented track fill. 11 tests passing. |
| VibeCard | ✅ | `components/food/VibeCard.tsx` | `{ value, onChange, className? }` — Special vibe dimension card with animated gradient border, sparkle particle effects, glow shadow. Wraps GradientSlider with vibrant gradient. Decorative "vibe" aesthetic for the overall experience rating. |
| RatingCarousel | ✅ | `components/food/RatingCarousel.tsx` | `{ onSubmit: (scores: Record<RatingDimensionKey, number>) => void, onBack: () => void, initialScores?, className? }` — 9-dimension swipe carousel for food ratings. Dot navigation with active indicator, per-dimension GradientSlider cards, VibeCard for vibe dimension, 3x3 summary grid with tap-to-edit, overall average display, submit button (disabled until all 9 scored). 16 tests passing. |
| PreferenceDot | ✅ | `components/food/PreferenceDot.tsx` | `{ color: PreferenceDotColor, label?: string, showTooltip?, className? }` — 3-color preference indicator dot: match (green), close (amber), different (rose). Tap to show/hide tooltip with label. Proper aria-labels for accessibility. 10 tests passing. |
| RatingReveal | ✅ | `components/food/RatingReveal.tsx` | `{ myScores, partnerScores, onClose, onReplay?, className? }` — Staggered 8+1 row animation revealing both partners' ratings per dimension. Vibe dimension gets special suspense phase (delayed reveal). Per-row match message (match/close/different). Overall score with vibe label. Close and replay controls. prefers-reduced-motion support (instant reveal). 12 tests passing. |
| FoodMap | ✅ | `components/food/FoodMap.tsx` | `{ visits, onPinTap?, className? }` — Leaflet map with OpenStreetMap tiles, warm CSS filter overlay, CircleMarker pins colored by cuisine type, FitBounds to auto-frame all pins. Handles empty state gracefully. |
| MapPinCard | ✅ | `components/food/MapPinCard.tsx` | `{ visit, onClose, className? }` — Bottom sheet card triggered on map pin tap. AnimatePresence slide-up with backdrop. Displays place name, cuisine, score, visit count. Dismiss on backdrop click or close button. |
| VisitListItem | ✅ | `components/food/VisitListItem.tsx` | `{ visit, onClick?, className? }` — Horizontal visit card with MapPin icon, cuisine pill, score badge, visit date. Compact row layout for list view. |
| OurTablePage | ✅ | `app/(main)/our-table/page.tsx` | — Map/list toggle view, 3 filter types (cuisine dropdown, high score toggle, return spots toggle), FAB for new visit, MapPinCard on pin tap, VisitListItem cards in list mode, loading skeleton, empty state. 23 tests passing. |
| VisitDetailPage | ✅ | `app/(main)/our-table/[visitId]/page.tsx` | — Photo gallery, rating bars per dimension, overall score badge, notes auto-save, return history with score trends, share card generation, rate CTA, replay reveal overlay. 24 tests passing. |
| MiniMap | ✅ | `app/(main)/our-table/[visitId]/MiniMap.tsx` | `{ lat, lng, className? }` — Small Leaflet map with warm CSS filter, dragging disabled. Used in visit detail page for location context. |

## Snap Module (P9)

| Component | Status | Path | Props |
|---|---|---|---|
| CameraCapture | ✅ | `components/snap/CameraCapture.tsx` | `className?` — Full-screen camera component with states: camera/preview/uploading/done/error. getUserMedia with facingMode toggle, 300s countdown timer (mm:ss), capture → preview → "Use This"/"Retake" (one retake only). Optional caption (100 chars). Desktop fallback: file input. Cleanup stops MediaStream tracks on unmount. 11 tests passing. |
| SnapCard | ✅ | `components/snap/SnapCard.tsx` | `{ snap, className? }` — Photo card with MediaImage, avatar overlay (32px), caption gradient scrim, timestamp, "Late" badge (created_at > window_opened_at + 300s). Tap to expand full-screen. 15 tests passing. |
| SnapReaction | ✅ | `components/snap/SnapReaction.tsx` | `{ snap, onReact, className? }` — 5 emoji reaction buttons (❤️😂😍🔥🥺). One per snap, changeable. Updates partner's snap reaction_emoji. Scale animation on select. 11 tests passing. |
| HomeSnapWidget | ✅ | `components/home/HomeSnapWidget.tsx` | `className?` — Conditional rendering from useSnap(): window open+not snapped → timer CTA → /snap/capture, already snapped → "Snapped!" → /snap, no window → null. 12 tests passing. |
| SnapCapturePage | ✅ | `app/(main)/snap/capture/page.tsx` | Thin page wrapper for CameraCapture. |
| SnapFeedPage | ✅ | `app/(main)/snap/page.tsx` | Client Component. Groups snaps by snap_date. Both snapped → side-by-side. One snapped → single centered. Date headers. 14-day initial load + infinite scroll. CoYYns reward when both snap same day. Empty state. 15 tests passing. |
| CameraModeSelector | ✅ | `components/snap/CameraModeSelector.tsx` | `modes: string[], activeMode: string, onModeChange: (mode: string) => void, className?` — Horizontal mode picker (e.g. Photo/Video/Boomerang). Animated copper dot indicator via Framer Motion `layoutId` slides beneath the active mode label. |

## Mood Module (P9)

| Component | Status | Path | Props |
|---|---|---|---|
| MoodPicker | ✅ | `components/mood/MoodPicker.tsx` | `className?` — 6 emoji mood buttons (44px circles): good/calm/meh/low/frustrated/loving. Copper bg on selected with scale pulse. Optional note input on first set. Uses useMood(). 13 tests passing. |
| PartnerMoodIndicator | ✅ | `components/home/PartnerMoodIndicator.tsx` | `className?` — "[Partner] is feeling [emoji] today". Returns null if no partner mood. Tap shows note card via AnimatePresence. Uses useMood() + useAuth(). 12 tests passing. |

## Garden Module (P9)

| Component | Status | Path | Props |
|---|---|---|---|
| SharedGarden | ✅ | `components/garden/SharedGarden.tsx` | `{ compact?: boolean, className? }` — CSS grid (8 cols, 36px cells) of flowers. Staggered grow-in animation. Blank = neither opened, 🌱 = partial, flower emoji = both opened. Compact: last 8 flowers (no heading). Full: all days with heading. Uses useGarden(). 14 tests passing. |
| GardenPage | ✅ | `app/(main)/garden/page.tsx` | Page wrapper with PageTransition + SharedGarden (full mode). |

## Shared Components

| Component | Status | Path | Props |
|---|---|---|---|
| DaysTogetherCounter | ✅ | `components/shared/DaysTogetherCounter.tsx` | `{ variant?: "full" \| "compact", className? }` — Pure client computation from useAuth().profile.paired_at. Math.floor((now - paired_at) / 86_400_000). Full: card with "Day N together on Hayah", copper number. Compact: number + Heart icon. CountUp animation via Framer Motion animate() + sessionStorage guard. 13 tests passing. |
| MediaImage | ✅ | `components/shared/MediaImage.tsx` | `{ mediaId?, fallbackUrl?, alt, className?, aspectRatio?, fill?, width?, height?, objectFit?, placeholder?, onLoad?, onError? }` — Tier-aware image component. Resolves mediaId via media_files: active→Storage URL, exported→proxy URL. Shimmer/blur loading placeholder, error state with retry button, lazy loading. Falls back to fallbackUrl when lookup fails or no mediaId. 17 tests passing. |

## Onboarding Module (P15)

| Component | Status | Path | Props |
|---|---|---|---|
| OnboardingShell | ✅ | `components/onboarding/OnboardingShell.tsx` | `{ stepIndex, totalSteps, currentStep, canSkip, onSkip, children }` — Animated gradient background (20s CSS keyframe cycle cream/copper/gold), 3px copper progress bar (Framer Motion animated width), optional skip button during tour steps. prefers-reduced-motion: static bg. |
| StepTransition | ✅ | `components/onboarding/StepTransition.tsx` | `{ stepKey, direction, children }` — AnimatePresence mode="wait" wrapper with direction-aware slide (forward=up, back=down). 300ms ease-out. |
| WelcomeStep | ✅ | `components/onboarding/steps/WelcomeStep.tsx` | `{ onContinue }` — Staggered 4.5s animation: Arabic "حَيَاة" (Amiri font, copper, scale+fade T=0.8s) → "Hayah" (T=1.8s) → tagline (T=2.5s) → philosophy (T=3.2s) → "Begin →" button (T=4.0s). useReducedMotion: instant text, 1s button delay. Double-click prevention. 11 tests passing. |
| ProfileStep | ✅ | `components/onboarding/steps/ProfileStep.tsx` | `{ onContinue, onBack }` — Progressive reveal: greeting → name input (auto-focus, copper glow) → avatar (at name ≥ 2 chars) → Continue. Supabase Storage avatar upload. 16 tests passing. |
| PairingStep | ✅ | `components/onboarding/steps/PairingStep.tsx` | `{ onContinue, onSkip, initialCode? }` — Two states: UNPAIRED (reuses InviteCodeDisplay, QRCodeDisplay, PairPartnerForm) and CELEBRATION. Realtime subscription on profiles for partner detection. On pair, plays the shared `components/pairing/PairingCelebration` keepsake (variant "seal"); onboarding only advances when the user taps "Enter Hayah" (`onDone → onContinue`), so it never unmounts mid-animation. "Continue alone" skip. Deep link code forwarding via initialCode. 13 tests passing. |
| _(removed)_ PairingCelebration | — | ~~`components/onboarding/steps/PairingCelebration.tsx`~~ | Deleted — de-duped into the single shared keepsake `components/pairing/PairingCelebration.tsx` (see Pairing Module). |
| SpotlightOverlay | ✅ | `components/onboarding/SpotlightOverlay.tsx` | `{ target, targetRect, currentIndex, totalTargets, onNext, onBack, onDismiss, lastButtonText?, lastButtonClassName? }` — Fixed z-[9999] overlay, SVG mask spotlight hole (rect/circle/pill), pulse ring, tooltip card with step dots/Next/Back. Custom last-step button text/style. 14 tests passing. |
| BottomNavPreview | ✅ | `components/onboarding/BottomNavPreview.tsx` | `{ highlightLabel? }` — Display-only bottom nav for tour steps. Imports NAV_TABS from BottomNav, renders same visual but inert (div not Link, pointer-events-none, aria-hidden). Highlights specified tab with accent color + indicator bar. 9 tests passing. |
| TourStep | ✅ | `components/onboarding/steps/TourStep.tsx` | `{ config: TourStepConfig, onNext, onBack }` — Reusable tour step. Renders BottomNavPreview, auto-starts useSpotlight after 150ms, renders SpotlightOverlay when active. TourStepConfig: tabLabel, selector, shape, padding, tooltipPosition, title, description, pulseTarget, stepNumber, totalTourSteps, isFirst/isLast flags. 7 tests passing. |
| TourHomeStep | ✅ | `components/onboarding/steps/TourHomeStep.tsx` | `{ onNext, onBack }` — Tour config: nav-tab-home, circle, "Your daily dashboard…", step 1/5, isFirst=true. 7 tests passing. |
| TourUsStep | ✅ | `components/onboarding/steps/TourUsStep.tsx` | `{ onNext, onBack }` — Tour config: nav-tab-us, circle, "The fun zone…", step 2/5. 6 tests passing. |
| Tour2026Step | ✅ | `components/onboarding/steps/Tour2026Step.tsx` | `{ onNext, onBack }` — Tour config: nav-tab-2026, pill shape, "Your shared vision board…", step 3/5. 6 tests passing. |
| TourMeStep | ✅ | `components/onboarding/steps/TourMeStep.tsx` | `{ onNext, onBack }` — Tour config: nav-tab-me, circle, "Your personal space…", step 4/5. 5 tests passing. |
| TourMoreStep | ✅ | `components/onboarding/steps/TourMoreStep.tsx` | `{ onNext, onBack }` — Tour config: nav-tab-more, circle, "Settings, preferences…", step 5/5, isLast=true, lastButtonText="Finish Tour →", copper glow. pulseTarget=false. 8 tests passing. |
| ReadyStep | ✅ | `components/onboarding/steps/ReadyStep.tsx` | `{ onComplete }` — Personalized launch screen. User + partner avatars (lg, copper ring border), "Welcome home, {name}", paired subtitle with partner name or solo "Your space is ready." Mini confetti (15 particles, copper colors) only if paired. "Let's begin →" button after 1s delay, exit animation (scale+fade 300ms), double-click prevention. 17 tests passing. |

### Onboarding Hooks

| Hook | Status | Path | Returns |
|---|---|---|---|
| useOnboarding | ✅ | `lib/hooks/use-onboarding.ts` | `{ currentStep, stepIndex, totalSteps, direction, isComplete, canSkip, goNext, goBack, completeOnboarding, skipOnboarding, isLoading }` — 9-step state machine persisted to profiles.onboarding_step. 22 tests passing. |
| useSpotlight | ✅ | `lib/hooks/use-spotlight.ts` | `{ isActive, currentIndex, totalTargets, currentTarget, targetRect, start, next, back, dismiss }` — DOM querySelector-based spotlight targeting with ResizeObserver, scroll lock, debounced resize. 13 tests passing. |

### Onboarding Types

| Type | Path | Exports |
|---|---|---|
| onboarding.types.ts | `lib/types/onboarding.types.ts` | `ONBOARDING_STEPS`, `OnboardingStep`, `TOUR_STEPS`, `StepDirection`, `UseOnboardingReturn` |
| SpotlightTarget | `lib/hooks/use-spotlight.ts` | `SpotlightShape`, `SpotlightTarget`, `UseSpotlightReturn` |

### Onboarding Routes

| Route | Path | Notes |
|---|---|---|
| /onboarding | `app/(main)/onboarding/page.tsx` | Step router. Layout: fixed full-screen z-40. Guard in (main)/layout.tsx redirects if onboarding_completed_at is null. BottomNav hidden. |

## Ping Module

| Component | Status | Path | Props |
|---|---|---|---|
| ChatBubble | ✅ | `components/ping/ChatBubble.tsx` | `message: string, isSent: boolean, timestamp?: string, className?` — Sent/received chat bubble with directional styling (sent: copper bg, right-aligned; received: elevated bg, left-aligned). Rounded corners with tail direction. Framer Motion entrance animation (fade + slide from direction). |
| PingLimitDots | ✅ | `components/ping/PingLimitDots.tsx` | `remaining: number, total: number, className?` — Visual copper dot indicator showing remaining ping sends. Filled dots for remaining, outline dots for used. Horizontal flex row. |

## Wheel Module

| Component | Status | Path | Props |
|---|---|---|---|
| EliminationPills | ✅ | `components/wheel/EliminationPills.tsx` | `options: { label, eliminated }[], onEliminate?: (label) => void, className?` — Animated flex-wrap pills for active vs eliminated options. Active pills: solid copper bg. Eliminated: muted/strikethrough with Framer Motion exit (scale + opacity out). `AnimatePresence` for smooth removal transitions. |

## Game Module (Together Time)

| Component | Status | Path | Props |
|---|---|---|---|
| GameHomePage | ✅ | `app/(main)/game/page.tsx` | Page component — 3 game mode cards (check_in, deep_dive, date_night) with claymorphism UI. Active session resume card. Question Bank navigation. Framer Motion staggered entrance. |
| CheckInSetup | ✅ | `components/game/CheckInSetup.tsx` | Setup wizard for Alignment Check-In mode. 8 category grid, question count slider (5-15), relationship pulse slider (1-10), open discussion toggle. Creates session with CheckInConfig. |
| DeepDiveSetup | ✅ | `components/game/DeepDiveSetup.tsx` | Setup for Deep Dive mode. Single focus category selection (radio), question count slider (5-15), difficulty preference pills (multi-select: Light/Medium/Deep). No-pressure messaging card. |
| DateNightSetup | ✅ | `components/game/DateNightSetup.tsx` | 3-step wizard for Date Night Game. Step 1: category grid + questions-per-category. Step 2: dares toggle, heat level, wildcard count, truth-or-dare. Step 3: custom questions toggle + game preview summary. |
| PartnerAuthoredSetup | ✅ | `components/game/PartnerAuthoredSetup.tsx` | Partner card authoring screen. Up to 5 secret questions + 3 dares with heat levels. HIDDEN badge. Polls for partner completion (3s interval). Waiting state with pulse animation. |
| AlignmentBar | ✅ | `components/game/AlignmentBar.tsx` | `{ myValue, partnerValue, min?, max?, className? }` — Scale visualization bar showing answer comparison between partners. Renders two position markers on a gradient track. Alignment badges: aligned (green), close (amber), talk_about_it (rose) based on value distance. |
| AlignmentReveal | ✅ | `components/game/AlignmentReveal.tsx` | `{ myAnswer, partnerAnswer, questionType, className? }` — Side-by-side answer reveal for scale, open-text, and choice answers after both partners submit. AlignmentBar for scale questions, text comparison for open-text, choice highlight for multiple-choice. AnimatePresence staggered reveal. |
| CheckInPlayScreen | ✅ | `components/game/CheckInPlayScreen.tsx` | `{ session, className? }` — Full Mode 1 (Alignment Check-In) play screen. Three phases: answering (question + input), waiting (partner pulse), reveal (AlignmentReveal). Progress bar with question count. Pause menu overlay with resume/abandon. Uses useGameEngine for round management. |
| DeepDivePlayScreen | ✅ | `components/game/DeepDivePlayScreen.tsx` | `{ session, className? }` — Calm Mode 2 (Deep Dive) play screen. Journal toggle for private notes. No scoring or alignment comparison. Fade-in question transitions. Reflective UI with muted tones. Single-player pacing (no waiting phase). |
| GameCard | ✅ | `components/game/GameCard.tsx` | `{ question, isFlipped?, onFlip?, partnerAuthored?, className? }` — 3D flip card for Date Night mode. CSS perspective transform with front/back faces. Partner-authored cards get rose-tinted border glow. Tap to flip with spring animation. |
| DareCard | ✅ | `components/game/DareCard.tsx` | `{ dare, heatLevel, coyynsStake?, onComplete?, onSkip?, className? }` — Dare-specific 3D flip card with heat level gradients (mild=warm, medium=orange, spicy=red). CoYYns stakes display. Complete/Skip action buttons. Inherits GameCard flip mechanics. |
| TruthCard | ✅ | `components/game/TruthCard.tsx` | `{ question, onAnswer?, className? }` — Truth card shown after choosing Truth in Truth-or-Dare. Optional response textarea for typed answers. No CoYYns stakes (truth is free). Clean card aesthetic without heat gradients. |
| DateNightPlayScreen | ✅ | `components/game/DateNightPlayScreen.tsx` | `{ session, className? }` — Full Mode 3 (Date Night Game) play screen. Dark ambient background. Truth-or-dare choice prompt. GameCard/TruthCard/DareCard rendering based on choice. Live scoreboard. Card flip animations. Partner-authored card integration. |
| GameComplete | ✅ | `components/game/GameComplete.tsx` | `{ session, mode, className? }` — Mode-specific completion screen. CheckInComplete variant: overall alignment percentage, per-category alignment bars, talk-about-it highlights. DateNightComplete variant: final scores, crown for winner, dare completion stats. Confetti animation. Share/replay CTAs. |
| DeepDiveComplete | ✅ | `components/game/DeepDiveComplete.tsx` | `{ session, className? }` — Calm completion screen for Deep Dive mode. Exploration summary (questions explored, time spent). Journal excerpt previews. No numbers or scores. Warm reflective tone. "Return to space" CTA. |
| AnswerTrajectory | ✅ | `components/game/AnswerTrajectory.tsx` | `{ history, questionId?, className? }` — Custom SVG line chart for answer history over time. Scale answer trajectories with partner comparison lines. Text answer timeline with date markers. Copper line for self, muted for partner. Responsive width. |
| GameScheduleSettings | ✅ | `components/game/GameScheduleSettings.tsx` | `{ className? }` — Schedule configuration panel. Mode selection (check_in/deep_dive/date_night). Recurrence picker (daily/weekly/custom). Day-of-week selector grid. Time picker. Notification toggle. Saves to game_schedules table. |
| ContributeForm | ✅ | `components/game/ContributeForm.tsx` | `{ open, onClose, onSubmit?, className? }` — Bottom sheet form for contributing custom questions to the question bank. Mode selector, category picker, question text input, optional follow-up. 5 CoYYns cost with balance check. Portal + AnimatePresence. |

## Game Hooks

| Hook | Status | Path | Notes |
|---|---|---|---|
| useGameEngine | ✅ | `lib/hooks/use-game-engine.ts` | Core 3-mode session engine. Session lifecycle (create/start/pause/resume/complete/abandon). Round generation + management. Partner-authored content. Realtime subscriptions. Answer history. Active session detection. **`completeSession()` now credits the local player's earned CoYYns into the real wallet** — appends a `coyyns_transactions` earn row (category `game`, metadata.session_id) so the atomic balance trigger applies it; idempotent (guards on prior-completion + existing session credit) so re-runs never double-credit. |

## Game Routes (Part 2)

| Route | Status | Path | Notes |
|---|---|---|---|
| /game/check-in/play | ✅ | `app/(main)/game/check-in/play/page.tsx` | Client Component. Wraps CheckInPlayScreen with active session from useGameEngine. Redirects to /game if no active check_in session. |
| /game/deep-dive/play | ✅ | `app/(main)/game/deep-dive/play/page.tsx` | Client Component. Wraps DeepDivePlayScreen with active session from useGameEngine. Redirects to /game if no active deep_dive session. |
| /game/date-night/play | ✅ | `app/(main)/game/date-night/play/page.tsx` | Client Component. Wraps DateNightPlayScreen with active session from useGameEngine. Redirects to /game if no active date_night session. |
| /game/check-in/complete | ✅ | `app/(main)/game/check-in/complete/page.tsx` | Client Component. Wraps GameComplete with mode="check_in". Shows alignment results. Redirects to /game if no completed session. |
| /game/deep-dive/complete | ✅ | `app/(main)/game/deep-dive/complete/page.tsx` | Client Component. Wraps DeepDiveComplete. Shows exploration summary. Redirects to /game if no completed session. |
| /game/date-night/complete | ✅ | `app/(main)/game/date-night/complete/page.tsx` | Client Component. Wraps GameComplete with mode="date_night". Shows scores and crown. Redirects to /game if no completed session. |
| /game/schedule | ✅ | `app/(main)/game/schedule/page.tsx` | Client Component. PageHeader + GameScheduleSettings. Configure recurring game sessions with mode, day, and time preferences. |
| /game/bank | ✅ | `app/(main)/game/bank/page.tsx` | Client Component. QuestionBankPage — inline component with search input, mode filter pills (all/check_in/deep_dive/date_night), question cards with category badges, ContributeForm FAB. |

## Scripts / Infrastructure

| Script | Status | Path | Notes |
|---|---|---|---|
| screenshot.mjs | ✅ | `scripts/screenshot.mjs` | Puppeteer headless screenshot capture. Args: url (default localhost:3000), output (default /tmp/y2-audit-home.png). Viewport 375×812 (iPhone). waitUntil networkidle0. Full-page screenshot. No npm dependency — uses npx cached puppeteer. |
| visual-audit.sh | ✅ | `scripts/visual-audit.sh` | Bash wrapper: builds app if needed, starts next start on port 3099, waits for server (max 15s), calls screenshot.mjs, kills server. Args: $1=route (default /), $2=output path. 7 tests passing. |

## Decide Together (selector suite — D0 foundation)

> Net-new, additive suite. Each game is a self-contained module at `components/decide/games/<id>/index.tsx` default-exporting a `SelectorGame`. Registry imports every game; D1–D5 only replace their own stub. Contract frozen in `components/decide/contract.ts`.

| Component | Status | Path | Notes |
|---|---|---|---|
| SelectorGame contract | ✅ | `components/decide/contract.ts` | The suite contract (HANDOVER). `SelectorGame` `{id,label,arabicLabel,whenToUse,kind,asset,Component}`, `DecideOption`, `DecideResult`, `SelectorKind` = binary\|many\|weigh\|playful, `SelectorGameProps` `{options,onResult}`. Frozen. |
| registry | ✅ | `components/decide/registry.ts` | Imports the 5 game modules; exports `GAMES`, `GAMES_BY_ID`, `getGame`, `gamesForKind`. Re-exports the contract. |
| decider (THE DECIDER) | ✅ | `components/decide/decider.ts` | Pure meta-picker. `classifyKind`/`recommendTool`: description + option count → best tool (binary→rps, many→wheel, weigh→proscons, playful→dice). 36 tests. |
| DecideHub | ✅ | `components/decide/DecideHub.tsx` | Props-driven hub (View). Hero, "Let fate decide", selector grid, The Decider, recent decisions, setup→play→result game-runner modal + Celebration. Exports `DECIDE_MOCK`. 10 tests. |
| TheDecider | ✅ | `components/decide/TheDecider.tsx` | The Decider card — describe + options → live recommendation + alternatives + auto-run. 11 tests. |
| OptionInput | ✅ | `components/decide/OptionInput.tsx` | Add/remove/weight options + presets (controlled). `showWeights`, `min`/`max`. 16 tests. |
| Result | ✅ | `components/decide/Result.tsx` | Decided-outcome panel — wax-seal stamp, winner, summary, replay/done, saved flag. |
| DecisionHistory | ✅ | `components/decide/DecisionHistory.tsx` | Recent decisions list (you/partner, time-ago, per-tool, owner clear). Loading + empty states. |
| shared/random | ✅ | `components/decide/shared/random.ts` | Pure helpers: `uid`, `makeOption`, `weightedPick`, `shuffle`, `winnerSummary` (injectable rng). 22 tests. |
| shared/primitives | ✅ | `components/decide/shared/primitives.tsx` | Riso `RisoBurst` (reduced-motion aware) + WebAudio `playDecideSound`/`useDecideSound` + `haptic`. SSR-safe, fail-silent. |
| games/wheel (stub) | 🔨 | `components/decide/games/wheel/index.tsx` | STUB → D1. kind many. Working weighted-pick placeholder. |
| games/dice (stub) | 🔨 | `components/decide/games/dice/index.tsx` | STUB → D2. kind playful. |
| games/rps (stub) | 🔨 | `components/decide/games/rps/index.tsx` | STUB → D3. kind binary. |
| games/proscons (stub) | 🔨 | `components/decide/games/proscons/index.tsx` | STUB → D4. kind weigh (respects option weights). |
| games/bonus (stub) | 🔨 | `components/decide/games/bonus/index.tsx` | STUB → D5. kind playful (8-ball / fate). |

## Decide Hooks

| Hook | Status | Path | Notes |
|---|---|---|---|
| useDecisions | ✅ | `lib/hooks/use-decisions.ts` | Couple-shared `decision_history` CRUD via RLS. Fetch (newest first) + realtime INSERT/DELETE + optimistic `saveDecision({kind,toolId,options,result})` + owner `clearDecision`. Inert no-user return. 7 tests. |

## Decide Routes

| Route | Status | Path | Notes |
|---|---|---|---|
| /decide | ✅ | `app/(main)/decide/page.tsx` | Client Component. Wires `useDecisions` + `useAuth` into `DecideHub`. |
| /preview/decide | ✅ | `app/preview/decide/page.tsx` | Public mock — `DecideHub` + `DECIDE_MOCK` + `BottomNav` in a phone frame. Listed in the preview gallery (Us). |

## Travels

| Component | Status | Path | Notes |
|---|---|---|---|
| TravelsView | ✅ | `components/travels/TravelsView.tsx` | Props-driven list (View). Header + status-ordered trip posters (PosterCard cover hero, status chip, hosted "Trip site" badge, dates, CompanionStack). EmptyState + loading skeletons. Optional `onLogTravel`/`onOpenTrip` (omitted in /preview → inert). Exports `TRAVELS_MOCK`. |
| TripDetailView | ✅ | `components/travels/TripDetailView.tsx` | Single-trip detail (View). Cover hero, dates, companions, italic summary. Hosted → "Open the trip" links to `/travels/<id>/site` (the gated serve route — `hosted_path` is a bundle folder KEY, not a URL). Native → photos area (v2 TODO). Owner-only `onDelete`; native `onAddPhoto`. Exports `TRIP_DETAIL_HOSTED_MOCK`/`TRIP_DETAIL_NATIVE_MOCK`. |
| CompanionStack | ✅ | `components/travels/CompanionStack.tsx` | Overlapping avatar row for a trip's companions (free-form people, initial-on-sand fallback). Presentational, safe with empty list. |
| LogTravelForm | ✅ | `components/travels/LogTravelForm.tsx` | Bottom-sheet create form (portal). Cover upload, title/destination/dates, status + kind chips, hosted bundle-key field, summary, companion rows. `onSubmit(LogTravelSubmit = CreateTripData & {coverFile?})` (upload happens on the page). |
| format | ✅ | `components/travels/format.ts` | `formatDateRange(start,end)` — collapses same-month/day, single-bound, empty. |

## Travels Hooks

| Hook | Status | Path | Notes |
|---|---|---|---|
| useTrips | ✅ | `lib/hooks/use-trips.ts` | Couple-shared `trips` + `trip_companions` via RLS (own + partner-read). Fetch (newest first) + realtime trips INSERT/UPDATE/DELETE + companions INSERT/DELETE. `createTrip`→id (with inline companions), `updateTrip`, `deleteTrip` (cascade), `addCompanion`, `removeCompanion`, `getTrip`. Inert no-user return. 17 tests. |

## Travels Routes

| Route | Status | Path | Notes |
|---|---|---|---|
| /travels | ✅ | `app/(main)/travels/page.tsx` | Client Component. `useTrips`→`TravelsView`; create flow = createTrip → uploadMedia(`trip-covers`) → updateTrip(cover_image); open → router push `/travels/<id>`. 6 tests. |
| /travels/[tripId] | ✅ | `app/(main)/travels/[tripId]/page.tsx` | `getTrip(id)`→`TripDetailView`; owner-only delete → back to /travels; skeleton while loading, not-found state. Native photo gallery = v2 TODO. 6 tests. |
| /travels/[tripId]/site/[[...path]] | ✅ | `app/(main)/travels/[tripId]/site/[[...path]]/route.ts` | Auth-gated static-file server (nodejs, force-dynamic) for hosted-trip bundles under `content/trips/<hosted_path>/`. 401 no-session, 404 not-found/not-hosted, path-traversal guard, default doc `UK Trip.dc.html`, correct Content-Type, `Cache-Control: private, max-age=3600`. Mirrors `api/media/[id]`. 14 tests. |
| /preview/travels | ✅ | `app/preview/travels/page.tsx` | Public mock — `TravelsView` + `TRAVELS_MOCK` (inert). In the preview gallery (Travels). |
| /preview/travels/hosted, /native | ✅ | `app/preview/travels/{hosted,native}/page.tsx` | Public mocks — `TripDetailView` + hosted/native mock (inert). In the preview gallery (Travels). |
| /preview/travels/map | ✅ | `app/preview/travels/map/page.tsx` | Public mock (CLIENT — `WORLD_MAP_MOCK` carries a Map + fn, not RSC-serializable) — `WorldMapView` + `WORLD_MAP_MOCK` (inert). In the preview gallery (Travels). |

## Travels — World Map (migration 053)

| Item | Status | Path | Notes |
|---|---|---|---|
| 053 schema | ✅ | `supabase/migrations/053_travels_world_map.sql` | `country_visits` (one row per visit instance — hybrids derive in app code; owner CRUD + partner-read + partner UPDATE scoped to `partner_note` by a column-scope trigger mirroring 047) + `country_pins` (≤3/owner via BEFORE-INSERT trigger, `unique(owner,country)`, owner CRUD + partner-read). Notifications CHECK += `travel_pin_match`. Realtime on both. Applied live + recorded. **7/7 live RLS proof passed**. |
| useWorldMap | ✅ | `lib/hooks/use-world-map.ts` | Loads `country_visits`+`country_pins`+upcoming trips (own+partner via RLS) + realtime `world_map_realtime`. Derives `countries` (aggregate Map), `myPins`/`partnerPins`/`mutualPins`/`mutualDetails`/`ourNextTrip`, `visitsFor`. THROW-contract mutations: `addVisit`/`updateVisit`/`deleteVisit`/`addPartnerNote`/`addPin`(≤3 guard)/`removePin`. New mutual match → direct `travel_pin_match` notification (NO send-quota). 11 tests. |
| country-status (pure) | ✅ | `lib/travels/country-status.ts` | No-React logic: `aggregateCountries`, `mutualPins`/`mutualPinDetails`, `ourNextTrip`, `statusFill`/`depthOpacity`/`statusSummary` + `STATUS_VISUALS` registry (token names only). 18 tests. |
| world-map data | ✅ | `lib/data/{world-countries-110m.json,iso-country-codes.ts}` | Committed offline TopoJSON (world-atlas 110m) + numeric→ISO map (249 countries), generated by `scripts/fetch-world-atlas.mjs`. |
| WorldMap | ✅ | `components/travels/WorldMap.tsx` | Client SVG choropleth (`geoNaturalEarth1` + topojson, computed once). Per-status gradient/pattern fills, depth via fill-opacity, hybrid solo-dot, pins at centroids, full a11y (role/label/keyboard). 5 tests. |
| WorldMapView | ✅ | `components/travels/WorldMapView.tsx` | Presentational hero (dynamic-imports WorldMap ssr:false): map + tooltip + detail sheet + legend + OurNextTrip + Log-visit CTA. Optional callbacks default demo. Exports `WORLD_MAP_MOCK`. 6 tests. |
| Tooltip/DetailSheet/Legend/PinBadge/OurNextTrip/LogVisitForm | ✅ | `components/travels/*.tsx` | Hover popup · click bottom-sheet (visit timeline, memorable/recommendation, partner-note add) · legend · SVG pin glyphs · "Our Next Adventure" card (used on Home too) · log-visit bottom-sheet (together/solo toggle, THROW-aware). LogVisitForm 4 tests. |
| /travels (map hero) | ✅ | `app/(main)/travels/page.tsx` | `WorldMapView` (useWorldMap) ABOVE the trip list; pin toggle = add/remove, "Start planning" → upcoming `trips` row. |
| Home highlight | ✅ | `app/(main)/page.tsx` + `components/home/HomeView.tsx` | `OurNextTrip` peek card on Home when a mutual pin exists (fed from `useWorldMap`). |

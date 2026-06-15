# Hayah UI/UX Redesign — Task Queue Plan

## Context

**Problem:** 21 Stitch design mockups (13 new + 8 from a previous batch) define the target visual identity for every major Hayah page. The current codebase (172 components, 42 routes) has a solid design system but needs refinement to match these mockups precisely.

**Key Gaps Identified:**
1. **2 missing fonts**: Lora (serif captions/subtitles) and Plus Jakarta Sans (nav/display text)
2. **Color token additions**: Pink primary `#ec1349` for certain screens, copper gradient token
3. **New CSS patterns**: Underline inputs, pill tabs, lined-paper textarea, chat bubbles
4. **Auth pages**: Login needs redesign; signup and email verification pages need creation
5. **Page-specific visual refinements**: Each of the 21 Stitch screens requires moderate visual polish
6. **New reusable components**: PillTabBar, ChatBubble, EventDotCalendar, WheelSVG, PasswordStrengthDots, etc.
7. **21st.dev components**: Recommend only SpiralAnimation + SparklesEffect (most others overlap with existing implementations)

**Approach:** 70 tasks across 15 phases (PU1-PU15). Foundation first, then reusable components, then page-by-page redesign, then global polish. All tasks are self-contained for autonomous execution.

**Stitch files location:**
- Batch 1 (8 screens): `/Users/yahyaelghobashy/Downloads/stitch_hayah_home_dashboard/`
- Batch 2 (13 screens): `/tmp/stitch_batch2/stitch_hayah_home_dashboard/`

---

## Phase Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| PU1 | 8 | Foundation — fonts, tokens, CSS patterns, animation utils |
| PU2 | 10 | Components — new reusable UI components |
| PU3 | 4 | Auth — login, signup, email verification |
| PU4 | 5 | Home — dashboard widget refinements |
| PU5 | 6 | Us — CoYYns, coupons, calendar, ping |
| PU6 | 4 | 2026 — vision board |
| PU7 | 4 | Me — landing, body, soul |
| PU8 | 3 | More — settings page |
| PU9 | 4 | Table — our table + rating |
| PU10 | 4 | Wheel — presets + live session |
| PU11 | 4 | Snap — camera + feed |
| PU12 | 3 | Marketplace |
| PU13 | 3 | Onboarding + pairing |
| PU14 | 4 | Global — nav, headers, tabs, empty states |
| PU15 | 4 | Polish — font audit, animation audit, responsive QA, docs |
| **Total** | **70** | |

---

## Dependency Graph

```
PU1-A (TU01,TU02,TU03)  ──> PU2-A (TU09,TU10,TU11,TU18) ──> PU3-A (TU19,TU20)
PU1-B (TU04,TU05,TU06,TU07) ──> PU2-B/C (TU12-TU16) ──> PU5 (TU29,TU31,TU32)
PU1-C (TU08) ──> PU13 (TU61)
PU2-D (TU17) ──> PU10 (TU49,TU50)

PU3-PU13 can run in parallel after their dependencies resolve.
PU14 depends on TU02 but can start after PU1 completes.
PU15 runs last after all other phases complete.
```

---

## PU1 — Foundation (8 tasks)

| ID | Name | Type | Pri | Par Grp | Deps | Files | Implementation Detail | Acceptance Criteria |
|----|------|------|-----|---------|------|-------|----------------------|---------------------|
| TU01 | Import Lora font | setup | 1 | PU1-A | -- | `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/theme.ts`, `docs/DESIGN_SYSTEM.md` | Add `Lora` from `next/font/google`: `subsets: ["latin"]`, `weight: ["400","500","600","700"]`, `style: ["normal","italic"]`, `variable: "--font-serif"`, `display: "swap"`. Add CSS var `--font-serif: 'Lora', serif` to `@theme inline`. Add `.font-serif` utility. Add to theme.ts fonts. | Font loads, `font-serif` class renders Lora italic |
| TU02 | Import Plus Jakarta Sans font | setup | 1 | PU1-A | -- | `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/theme.ts`, `docs/DESIGN_SYSTEM.md` | Add `Plus_Jakarta_Sans` from `next/font/google`: `subsets: ["latin"]`, `weight: ["400","500","600","700","800"]`, `variable: "--font-nav"`, `display: "swap"`. Add CSS var `--font-nav`. Add `.font-nav` utility. | Font renders with `font-nav` class |
| TU03 | Add Stitch color tokens | style | 1 | PU1-A | -- | `src/app/globals.css`, `src/lib/theme.ts` | Add `--color-pink-primary: #ec1349`, `--color-pink-soft: rgba(236,19,73,0.08)`, `--color-pink-hover: #d41042`. Add `--color-copper-gradient: linear-gradient(135deg, #B87333, #D4A574)` to gradients. Verify `--color-accent-copper: #B87333` exists. | New tokens available in CSS and TS |
| TU04 | Add underline input variant CSS | style | 2 | PU1-B | -- | `src/app/globals.css` | `.input-underline`: transparent bg, `border-bottom: 1.5px solid var(--border-subtle)`, no radius, `padding: 12px 0`, focus: `border-bottom-color: var(--accent-copper)` | Bottom-border-only input with copper focus |
| TU05 | Add pill tab CSS pattern | style | 2 | PU1-B | -- | `src/app/globals.css` | `.pill-tab-group`: `flex; bg: rgba(44,40,37,0.05); rounded-full; p: 3px; gap: 2px`. `.pill-tab`: `flex-1; text-center; py-2 px-4; rounded-full; text-[13px] font-semibold`. `.pill-tab-active`: `bg-accent-copper; color: white` | Pill tabs render as rounded segmented control |
| TU06 | Add lined-paper textarea pattern | style | 3 | PU1-B | -- | `src/app/globals.css` | `.textarea-lined`: `background-image: repeating-linear-gradient(transparent, transparent 27px, rgba(184,115,51,0.08) 27px, rgba(184,115,51,0.08) 28px); line-height: 28px; font-family: var(--font-handwritten)` | Textarea shows horizontal ruled lines |
| TU07 | Add chat bubble CSS pattern | style | 3 | PU1-B | -- | `src/app/globals.css` | `.chat-bubble-sent`: `bg-accent-copper; color: white; rounded-2xl; rounded-br-sm; ml-auto`. `.chat-bubble-received`: `bg-bg-soft-cream; rounded-2xl; rounded-bl-sm; mr-auto` | Copper sent, cream received bubble styles |
| TU08 | Create SpiralAnimation + SparklesEffect | setup | 4 | PU1-C | -- | `src/components/animations/SpiralAnimation.tsx`, `src/components/animations/SparklesEffect.tsx` | SpiralAnimation: SVG spiral with `pathLength` 0→1, 1.5s, copper stroke. SparklesEffect: 8-12 `motion.span` particles animating opacity/scale, gold/copper colors, infinite 2-4s | Both components render animated effects |

---

## PU2 — Components (10 tasks)

| ID | Name | Type | Pri | Par Grp | Deps | Files | Implementation Detail | Acceptance Criteria |
|----|------|------|-----|---------|------|-------|----------------------|---------------------|
| TU09 | PillTabBar component | component | 1 | PU2-A | TU05 | `src/components/shared/PillTabBar.tsx` | Props: `tabs: {id, label}[]`, `activeTab`, `onTabChange`. Uses `.pill-tab-group/pill-tab` CSS + Framer Motion `layoutId` for animated sliding pill. Height `h-10` | Animated pill tabs with copper active state |
| TU10 | StitchInput underline variant | component | 1 | PU2-A | TU04 | `src/components/ui/input.tsx` | Add `variant="underline"` prop. Apply `input-underline` class. Add copper line animate-in on focus (width 0→100%, 0.3s) | `<Input variant="underline" />` works |
| TU11 | PasswordStrengthDots | component | 2 | PU2-A | -- | `src/components/auth/PasswordStrengthDots.tsx` | 4 dots, colors by strength level: empty→error→gold→success→copper. `w-2 h-2 rounded-full transition-colors` | Dots fill progressively with password strength |
| TU12 | EventDotCalendar | component | 2 | PU2-B | -- | `src/components/calendar/EventDotCalendar.tsx` | 7-col month grid. Day cells `w-10 h-10 rounded-full`. Today: `border border-accent-copper`. Event dots: `w-1.5 h-1.5 rounded-full` colored by category | Calendar grid with colored event dots |
| TU13 | EventCard with badge | component | 2 | PU2-B | -- | `src/components/calendar/EventCard.tsx` | Props: `title, date, badge?`. Badge variants: Milestone=gold, Copper=copper, Reminder=info. Layout: `flex items-center gap-3 p-3 rounded-xl` | Cards render with colored category badges |
| TU14 | ChatBubble component | component | 2 | PU2-C | TU07 | `src/components/ping/ChatBubble.tsx` | Props: `message, timestamp, direction, emoji?`. Uses chat-bubble CSS. Framer Motion fade-slide entrance | Sent=copper right, received=cream left |
| TU15 | PingLimitDots component | component | 3 | PU2-C | -- | `src/components/ping/PingLimitDots.tsx` | Props: `total, remaining`. Dots `w-2.5 h-2.5 rounded-full`. Active=copper, inactive=parchment. Scale animation on change | Dots visualize remaining pings |
| TU16 | StackedPreviewCard | component | 3 | PU2-D | -- | `src/components/coupons/StackedPreviewCard.tsx` | 3 stacked cards with offset/rotation. Front shows count + "gifts waiting" | Three cards stack with rotation |
| TU17 | WheelSVG component | component | 2 | PU2-D | -- | `src/components/wheel/WheelSVG.tsx` | SVG wheel with colored arc segments, text labels, copper center circle (r=30), pointer triangle, `perspective(800px) rotateX(8deg)` | SVG wheel with 3D perspective. Supersedes canvas wheel |
| TU18 | CopperButton variant | component | 1 | PU2-A | -- | `src/components/ui/button.tsx` | Add `copper` variant: `bg-gradient-to-r from-[#B87333] to-[#D4A574] text-white rounded-full shadow-[0_4px_14px_rgba(184,115,51,0.25)]`. Add `pill` size: `h-12 px-8 text-[15px] rounded-full` | `<Button variant="copper" size="pill">` works |

---

## PU3 — Auth Pages (4 tasks)

| ID | Name | Type | Pri | Par Grp | Deps | Files | Implementation Detail | Acceptance Criteria | Flags |
|----|------|------|-----|---------|------|-------|----------------------|---------------------|-------|
| TU19 | Login page redesign | page | 1 | PU3-A | TU01,02,04,10,18 | `src/app/(auth)/login/page.tsx` | Stitch target: `hayah_login`. Warm gradient header with Arabic حياة (28px). Underline inputs. `<Button variant="copper" size="pill">Sign In</Button>`. Copper glow behind wordmark | Matches hayah_login/screen.png | -- |
| TU20 | Sign Up page (new) | page | 1 | PU3-A | TU01,02,04,10,11,18 | `src/app/(auth)/signup/page.tsx` | Stitch target: `hayah_sign_up`. Same header as login. 4 underline inputs + PasswordStrengthDots. Copper CTA. RHF+Zod validation. Supabase signUp | Matches hayah_sign_up/screen.png | New page |
| TU21 | Email Verification page (new) | page | 2 | PU3-B | TU18 | `src/app/(auth)/verify/page.tsx` | Stitch target: `email_verification`. Centered layout. Floating mail icon with glow + pulse. Resend timer (60s countdown). Copper CTA | Matches email_verification/screen.png | New page |
| TU22 | Auth layout gradient | style | 3 | PU3-B | TU01 | `src/app/(auth)/layout.tsx` | Add warm copper radial glow at top center: `radial-gradient(ellipse 60% 40% at 50% 10%, rgba(184,115,51,0.04) 0%, transparent 70%)` | Subtle warm glow on auth pages | -- |

---

## PU4 — Home Dashboard (5 tasks)

| ID | Name | Type | Pri | Par Grp | Deps | Files | Implementation Detail | Acceptance Criteria |
|----|------|------|-----|---------|------|-------|----------------------|---------------------|
| TU23 | StatusIndicatorCard component | component | 1 | PU4-A | -- | `src/components/home/StatusIndicatorCard.tsx` | `border-left: 4px solid {accentColor}`. Icon in 10%-opacity bg. Title uppercase tracking-wider. Stitch target: `hayah_home_dashboard` status cards | Cards with colored left border accent |
| TU24 | Home page widget ordering/spacing | page | 2 | PU4-A | TU23 | `src/app/(main)/page.tsx` | Wrap prayer/cycle widgets in StatusIndicatorCard (sage/rose). Add "Our Garden" section. Reduce gaps to `gap-3`. Consistent `px-5` | Matches home dashboard Stitch layout |
| TU25 | CoyynsWidget texture refinement | component | 2 | PU4-B | -- | `src/components/home/CoyynsWidget.tsx` | Verify `texture-leather`, `rounded-2xl`, `shadow-warm-md`. Balance: `font-display text-[28px] font-bold text-accent-copper`. Add Coins icon | Leather texture, copper balance, coin icon |
| TU26 | FeelingGenerousCTA perforation | component | 3 | PU4-B | -- | `src/components/home/FeelingGenerousCTA.tsx` | Add right-side perforation. Copper action button. `bg-accent-soft` with `border border-[rgba(184,115,51,0.1)]` | Double-sided perforation, copper CTA |
| TU27 | HomeGreeting font polish | style | 3 | PU4-B | TU01,02 | `src/components/home/HomeGreeting.tsx` | Greeting: `font-nav text-[20px] font-bold`. Subtitle: `font-serif italic text-[14px] text-text-secondary` | Plus Jakarta greeting, Lora subtitle |

---

## PU5 — Us Tab Pages (6 tasks)

| ID | Name | Type | Pri | Par Grp | Deps | Files | Implementation Detail | Acceptance Criteria |
|----|------|------|-----|---------|------|-------|----------------------|---------------------|
| TU28 | CoYYns wallet hero alignment | component | 1 | PU5-A | -- | `src/components/relationship/CoyynsWallet.tsx` | `texture-leather`, `rounded-2xl`. Balance: `font-display text-[32px]`. Add shimmer overlay. Send + History action buttons | Matches hayah_us_playground wallet |
| TU29 | Coupons hub pill tabs + stack | page | 1 | PU5-A | TU09,16 | `src/app/(main)/us/coupons/page.tsx` | Replace tabs with PillTabBar (For Me/I Made/History). Add StackedPreviewCard for gift count | Matches coupons_hub/screen.png |
| TU30 | CouponCard ticket refinement | component | 2 | PU5-B | -- | `src/components/relationship/CouponCard.tsx` | `perforated-edge`. Vertical dashed divider for tear-off stub. Category emoji in stub area. Status badge pill | Ticket-style perforated coupon cards |
| TU31 | Calendar page EventDot + Coming Up | page | 2 | PU5-B | TU12,13 | `src/app/(main)/us/calendar/page.tsx` | EventDotCalendar grid + Coming Up section with EventCards. Stitch target: `shared_calendar` | Matches shared_calendar/screen.png |
| TU32 | Ping tab chat bubbles + lined composer | page | 2 | PU5-C | TU06,07,14,15 | `src/components/ping/PingTabContent.tsx`, `PingHistory.tsx`, `CustomPingComposer.tsx` | ChatBubble for history. Lined-paper textarea. PingLimitDots. Stitch target: `us_ping_tab` | Matches us_ping_tab/screen.png |
| TU33 | Challenges dashed-border style | component | 3 | PU5-C | -- | `src/components/relationship/ChallengeCard.tsx` | Active: `border: 2px dashed var(--accent-copper)`, `bg-[rgba(184,115,51,0.03)]`. Trophy icon top-right | Dashed copper border on active challenges |

---

## PU6 — 2026 Vision Board (4 tasks)

| ID | Name | Type | Pri | Deps | Files | Implementation Detail | Acceptance Criteria |
|----|------|------|-----|------|-------|----------------------|---------------------|
| TU34 | Hero banner gradient | style | 1 | -- | `src/app/(main)/2026/page.tsx` | `linear-gradient(135deg, #B87333 0%, #D4A574 40%, #DAA520 100%)`. White text with text-shadow. Noise texture overlay 5% | Matches 2026_vision_board hero |
| TU35 | Board switcher pills | component | 2 | TU09 | `src/app/(main)/2026/page.tsx` | Replace tabs with PillTabBar. Animated `layoutId="board-switcher"` | Rounded-full pill tabs |
| TU36 | Polaroid vision cards | component | 2 | -- | `src/components/vision-board/CategorySection.tsx` | White bg, `p-2 pb-6`, `shadow-warm-md`. Random rotation `rotate(${random(-3,3)}deg)`. `font-handwritten` captions | Polaroid cards with rotation |
| TU37 | Evaluation CTA refinement | component | 3 | -- | `src/app/(main)/2026/page.tsx` | Copper glow shadow. `font-serif italic` quote. `variant="copper"` button | Copper glow CTA card |

---

## PU7 — Me Landing (4 tasks)

| ID | Name | Type | Pri | Deps | Files | Implementation Detail | Acceptance Criteria |
|----|------|------|-----|------|-------|----------------------|---------------------|
| TU38 | Me landing redesign | page | 1 | TU01,23 | `src/app/(main)/me/page.tsx` | Avatar ring. Body card: `border-l-4 border-l-[#F4A8B8]` min-h-120px. Soul card: `border-l-4 border-l-[#A8B5A0]`. Rituals icon row. Days counter footer. Stitch: `me_landing_page` | Matches me_landing_page/screen.png |
| TU39 | Body page accent | style | 2 | -- | `src/app/(main)/me/body/page.tsx` | Rose `border-l-4`. `min-h-[100px]` cards. Serif italic section titles | Rose accent, serif labels |
| TU40 | Soul page sage accent | style | 2 | -- | `src/app/(main)/spirit/page.tsx` | Sage `border-l-4`. `texture-islamic`. Serif prayer labels. Mono time values | Sage accent, islamic texture |
| TU41 | DaysTogetherCounter serif | component | 3 | TU01 | `src/components/shared/DaysTogetherCounter.tsx` | `font-serif italic`. Number: `font-display text-[20px] font-bold text-accent-copper`. Heart icon between | Lora italic counter with heart |

---

## PU8 — More Settings (3 tasks)

| ID | Name | Type | Pri | Deps | Files | Implementation Detail | Acceptance Criteria |
|----|------|------|-----|------|-------|----------------------|---------------------|
| TU42 | Profile card + paired status | style | 1 | -- | `src/app/(main)/more/page.tsx` | Avatar ring. "Paired with {name}" in copper text with Heart icon. Stitch: `more_settings_page` | Matches more_settings_page/screen.png |
| TU43 | Settings groups in cards | style | 2 | -- | `src/app/(main)/more/page.tsx` | Group labels: `font-nav text-[11px] uppercase tracking-widest`. Groups in `rounded-2xl bg-bg-elevated shadow-warm-sm` | Clean card containers |
| TU44 | About "Our Story" card | component | 3 | TU01 | `src/app/(main)/more/page.tsx` | Heart icon, `font-serif italic` text. Version in `font-mono text-[11px]` | Lora italic about card |

---

## PU9 — Our Table + Rating (4 tasks)

| ID | Name | Type | Pri | Deps | Files | Implementation Detail | Acceptance Criteria |
|----|------|------|-----|------|-------|----------------------|---------------------|
| TU45 | Restaurant cards score badges | component | 1 | -- | `src/components/food/VisitListItem.tsx` | Score badge: `w-8 h-8 rounded-full` (copper>=8, gold>=6, muted<6). Cuisine pill. Visit counter | Circular score badges |
| TU46 | Filter tabs alignment | style | 2 | -- | `src/app/(main)/our-table/page.tsx` | Active: filled copper. Inactive: outline. `rounded-full px-3.5 py-1.5 text-[11px]` | Matches our_table_dashboard |
| TU47 | Rating score + slider refinement | style | 2 | -- | Rating components | Score: `text-[72px] font-display`. Gradient slider track. Thumb: `w-6 h-6 rounded-full border-2 border-accent-copper shadow-glow-copper` | Matches rating_experience |
| TU48 | Summary stats refinement | style | 3 | -- | `src/app/(main)/our-table/page.tsx` | Label: `font-nav text-[10px] uppercase`. Avg: `font-display text-[22px] text-accent-copper` | Nav font label, copper avg |

---

## PU10 — Wheel (4 tasks)

| ID | Name | Type | Pri | Deps | Files | Implementation Detail | Acceptance Criteria |
|----|------|------|-----|------|-------|----------------------|---------------------|
| TU49 | Presets gallery layout | page | 1 | TU17 | `src/app/(main)/wheel/page.tsx` | 2-col grid. Game-box shadow. Dashed create card. Shelf divider. Stitch: `wheel_presets_gallery` | Matches presets gallery |
| TU50 | Live wheel SVG upgrade | page | 1 | TU17 | `src/app/(main)/wheel/[presetId]/page.tsx`, `SpinTheWheel.tsx` | Replace canvas with WheelSVG. SPIN button: copper gradient, `w-16 h-16`. Spin animation: 3s ease-out. Stitch: `live_wheel_session` | SVG wheel with copper SPIN button |
| TU51 | Elimination pills | component | 2 | -- | `src/components/wheel/EliminationPills.tsx` | Scrollable row. Active: `rounded-full px-3 py-1.5 bg-accent-soft`. Eliminated: `bg-bg-parchment line-through opacity-50`. Exit animation | Pills with elimination animation |
| TU52 | Session log section | style | 3 | -- | Wheel page | Numbered rounds. `w-6 h-6 rounded-full bg-accent-soft text-accent-copper`. `font-display` title | Session log below wheel |

---

## PU11 — Snap (4 tasks)

| ID | Name | Type | Pri | Deps | Files | Implementation Detail | Acceptance Criteria |
|----|------|------|-----|------|-------|----------------------|---------------------|
| TU53 | Camera viewfinder + copper shutter | style | 1 | -- | `src/components/snap/CameraCapture.tsx` | Gradient overlay top/bottom. Rule-of-thirds grid. Shutter: `w-[72px] h-[72px]` white ring + copper inner circle. Pulse ring. Stitch: `snap_camera_capture` | Matches camera capture |
| TU54 | Camera mode selector | component | 2 | -- | `src/components/snap/CameraModeSelector.tsx` | Photo/Video/Square. Active: white + copper dot. Inactive: `text-white/60`. `layoutId` animated dot | Mode selector with animated indicator |
| TU55 | Snap feed 2-col + date headers | style | 2 | -- | `src/app/(main)/snap/page.tsx` | Date headers: `font-display text-[15px]` + copper dot. `grid-cols-2 gap-2`. User badge overlay. Stitch: `snap_daily_feed` | Matches snap feed |
| TU56 | Snap reactions floating | component | 3 | -- | `src/components/snap/SnapCard.tsx`, `SnapReaction.tsx` | Emoji in `w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm`. Spring entrance. Streak badge | Floating reaction circles |

---

## PU12 — Marketplace (3 tasks)

| ID | Name | Type | Pri | Deps | Files | Implementation Detail | Acceptance Criteria |
|----|------|------|-----|------|-------|----------------------|---------------------|
| TU57 | Colored emoji backgrounds | component | 1 | -- | `src/components/relationship/MarketplaceItemCard.tsx` | `w-[60px] h-[60px] rounded-full`. Colors by category (food=#FFF3E0, experience=#E8F5E8, etc). Price badge with Coins icon | Matches coyyns_marketplace |
| TU58 | Buy/disabled button states | component | 2 | -- | `MarketplaceItemCard.tsx` | Affordable: copper. Unaffordable: `bg-bg-parchment text-text-muted "Need X more"`. Success flash | Copper buy, disabled need-more |
| TU59 | Marketplace header coin balance | style | 3 | -- | `src/app/(main)/us/marketplace/page.tsx` | Coin badge: `bg-accent-soft/50 rounded-full px-3 py-1`. Title: `font-nav text-[18px]` | Coin badge + nav font title |

---

## PU13 — Onboarding (3 tasks)

| ID | Name | Type | Pri | Deps | Files | Implementation Detail | Acceptance Criteria |
|----|------|------|-----|------|-------|----------------------|---------------------|
| TU60 | Welcome Arabic text sizing | style | 1 | TU01 | `src/components/onboarding/steps/WelcomeStep.tsx` | Arabic: `text-[72px] font-arabic font-bold text-accent-copper`. Copper glow radial. Tagline: `font-serif italic text-[16px]`. Copper pill CTA. Stitch: `welcome_to_hayah` | Matches welcome screen |
| TU61 | Pairing celebration confetti | style | 2 | TU08 | `src/components/onboarding/steps/PairingCelebration.tsx` | Heart: `text-[64px]` pulsing. SparklesEffect behind. 20-30 confetti particles. Copper CTA with glow. Stitch: `partner_pairing_celebration` | Matches pairing celebration |
| TU62 | Ready step polish | style | 3 | TU01 | `src/components/onboarding/steps/ReadyStep.tsx` | `font-display` title. `font-serif italic` subtitle. Feature icons row (5 icons in soft circles). Copper pill CTA | Serif subtitle, icon row |

---

## PU14 — Global (4 tasks)

| ID | Name | Type | Pri | Deps | Files | Implementation Detail | Acceptance Criteria |
|----|------|------|-----|------|-------|----------------------|---------------------|
| TU63 | BottomNav Plus Jakarta labels | style | 1 | TU02 | `src/components/shared/BottomNav.tsx` | All labels: `font-nav text-[11px]`. Active: `font-semibold text-accent-primary`. Inactive: `font-medium text-text-secondary` | Nav labels use Plus Jakarta Sans |
| TU64 | PageHeader font + spacing | component | 1 | TU02 | `src/components/shared/PageHeader.tsx` | Title: `font-nav text-[18px] font-bold`. Sticky with `bg-bg-primary/95 backdrop-blur-sm`. Back chevron: `text-accent-copper` | Plus Jakarta headers with blur |
| TU65 | HorizontalTabBar alignment | component | 2 | TU02 | `src/components/shared/HorizontalTabBar.tsx` | Labels: `font-nav text-[13px]`. Active: `text-accent-copper`. Underline: `h-[2px] bg-accent-copper`. Backdrop blur | Nav font, copper underline |
| TU66 | EmptyState refinement | component | 3 | TU01 | `src/components/shared/EmptyState.tsx` | Icon in `w-16 h-16 rounded-full bg-accent-soft/50`. Title: `font-display`. Subtitle: `font-serif italic`. Copper action button | Serif subtitle, copper action |

---

## PU15 — Polish (4 tasks)

| ID | Name | Type | Pri | Deps | Files | Implementation Detail | Acceptance Criteria |
|----|------|------|-----|------|-------|----------------------|---------------------|
| TU67 | Font consistency audit | style | 1 | TU01,02 | All pages | Audit: display=Playfair, nav=Plus Jakarta, body=DM Sans, serif=Lora, mono=JetBrains, handwritten=Caveat. Fix violations across all 8 main sections | 6-font hierarchy consistent app-wide |
| TU68 | Animation smoothness audit | style | 2 | -- | Animation components, all pages | Max 400ms interactive. Consistent `slideUp` page transitions. `AnimatePresence mode="wait"`. `prefers-reduced-motion` guards | Smooth animations, no jank |
| TU69 | Responsive QA (375px-428px) | style | 2 | All | All pages | No horizontal overflow. Min 12px text. Touch targets 44px+. `pb-24` for bottom nav. No grid squeeze at 375px | No layout breaks |
| TU70 | Design system docs update | style | 3 | All | `docs/DESIGN_SYSTEM.md`, `docs/COMPONENT_REGISTRY.md`, `src/lib/theme.ts` | Add Lora + Plus Jakarta to font docs. Add new tokens. Register all new components (PillTabBar, ChatBubble, EventDotCalendar, WheelSVG, etc.) | Docs current and complete |

---

## Cross-Reference with Existing Task Queue

The existing task queue may have tasks that overlap or conflict:
- **Any existing auth UI tasks** → Superseded by TU19-TU22
- **Any existing coupon card styling tasks** → Superseded by TU30
- **Any existing wheel UI tasks** → Superseded by TU49-TU52
- **Any existing calendar UI tasks** → Superseded by TU31

Note: All TU tasks are `executor: claude-code`. They should be added to a new "UI Redesign" phase section in the Google Sheet.

## Verification

After each phase:
1. `npm run build` — must pass
2. Visual comparison of modified pages against Stitch screenshots
3. Test at 375px viewport width
4. Verify no TypeScript errors
5. After PU15: full responsive QA pass at 375px and 428px

## Critical Files

- `src/app/layout.tsx` — Font imports (TU01, TU02)
- `src/app/globals.css` — CSS tokens & patterns (TU03-TU07)
- `src/components/ui/button.tsx` — Copper variant (TU18)
- `src/components/shared/BottomNav.tsx` — Nav font (TU63)
- `src/app/(auth)/login/page.tsx` — Most visible auth redesign (TU19)
- `src/lib/theme.ts` — Token source of truth (TU03)

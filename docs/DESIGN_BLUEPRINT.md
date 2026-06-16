# Hayah — Full Revamp Wireframe & Art-Direction Spec

## Context

Hayah (formerly Y2) is a private bilingual PWA for one couple (Yahya & Yara). It works ~60–70% but sprawls across 30+ screens with a 23-widget firehose Home, three competing token systems, and no enforced design layer — so it reads as "a portfolio of separate apps," not one soulful product.

This spec is the **art-direction blueprint** for the redesign track. It re-architects the app into **5 coherent worlds**, defines **every screen's content, feel, motion, voice, and assets**, and maps it all onto the locked **Design Constitution** ("Cairo meets Los Santos, run through a risograph press") and the **83-asset cleaned library** in `docs/design/assets/clean/`.

Decisions locked with Yahya (2026-06-15): **re-architect into worlds**; **Home = a calm living-room that perfectly informs and connects everywhere**; **deliver full written spec, execute directly (no prototype)**.

Functionality fixes (Track A) run in parallel and are out of scope here — this is Track B (design). Where a screen is functionally broken (marketplace lifecycle, ping, portal builder, deep-dive finish), the wireframe describes the **intended** state; Track A makes it real.

---

## 1. Global Design System (applies everywhere)

### 1.1 The skin — adaptive, time-aware (resolves dark mode)
Not a toggle. Hayah's ground shifts with the Cairo day/prayer rhythm:
- **Day (Fajr→Asr):** `--paper #F7EFE3` ground, `--sand #EBDDC7` surfaces, golden-hour warmth. Asset: `skins/skin-day-golden`.
- **Dusk (Maghrib):** warms toward clay + amber glow.
- **Night (Isha→):** `--night-bg #191A2C` ground, `--night-card #23263F`, `--lantern #F2A93B` + `--teal-glow #3FB0A8` accents, ember coral. Cinematic "night drive." Asset: `scenes/scene-cairo-skyline-night`.
- Implementation: a `useSkin()` hook computing phase from local time (+ optional prayer-times), driving a `data-skin` attribute on `<html>`; CSS vars swap per phase. Respect `prefers-reduced-motion` (no ambient drift).

### 1.2 The Voice Map (type registers — each has a job)
| Register | Font | Used for |
|---|---|---|
| **Display** (bold-tender) | Bricolage Grotesque 700–800 | Hero greetings, world titles, celebration words |
| **Editorial** (elegant) | Fraunces (soft optical) | Memories, letters, prompts, quotes, du'a |
| **Data** (cold-confident) | Space Grotesk 500–700 | CoYYns, stats, dates, nav labels, system chrome |
| **Hand** (intimate) | Caveat | Pet-name notes, signatures, secret corners |
| **Arabic** | Amiri | Bilingual headings, du'a, RTL |
Rule: ≤2 registers visible per screen unless a moment earns more. Left-aligned default.

### 1.3 Palette (tokens — see `globals.css`, to be enforced via `tailwind.config.ts`)
Grounds: paper `#F7EFE3` · sand `#EBDDC7` · clay `#E4CDAE` · ink `#2A2018` · soft-ink `#6B5D4F`.
Accents (pops only, never fields): terracotta `#C8552B` · amber `#F2A93B` · coral `#E5663C` · teal `#1F8A8A` · indigo `#2B2F5E` · rose `#E0857A`.
**Per-world accent** (the only thing that shifts the warm base):
- Home → golden neutral (adaptive skin leads)
- Us → coral + indigo (alive, playful)
- Treasury → amber + espresso (gold/coin/value)
- Keepsake → teal + rose + sepia (nostalgic)
- Me → Body rose · Soul teal+amber+Islamic geometry · Rituals sage+amber

### 1.4 Motion
~⅔ cinematic-smooth (world→world glides, film-cut page transitions) + ~⅓ alive-responsive (micro-reactions). **Calibrated celebration:** confetti/`backdrops/backdrop-sunburst` + `posters/poster-mabrouk` + `seals/seal-yy-wax` for milestones; a quiet warm glow for everyday acts. Loading = gentle warm pulse (`scenes/scene-lantern-dusk` ambient), never spinners. Easing decelerates; never harsh.

### 1.5 Component language (cards are posters, not boxes)
- **PosterCard** — the base surface: rounded-2xl, warm grain (`textures/texture-paper-cream`), soft shadow, one confident focal point, generous space.
- **PillTabBar** — segmented control, copper-active (reuse existing `PillTabBar`).
- **Coin** — `coins/coin-yy` for any CoYYns figure; `video/anim-coin-spin` on earn.
- **CouponTicket** — perforated ticket (existing `.perforated-edge` + `objects/object-02` love-coupon); `stamps/stamp-redeemed` stamps on redeem.
- **Spot illustrations** — `objects/*` (lantern, vinyl, dice, jasmine, calendar, keepsake box, ribbon-heart, coffee, letter, crescent) as card accents + list-item glyphs.
- **Icons** — `icons/*` (16 riso line icons) for nav + actions. (Not SVG by design — textured raster; a separate flat set only if crisp scaling ever needed.)
- **Dividers / spiritual corners** — `patterns/pattern-zellij-*`, `dividers/divider-arabesque`, `ornaments/ornament-star-*`, `patterns/pattern-mashrabiya-gold`.
- **Empty states** — `scenes/scene-keepsake-open` / `scene-keepsake-teal` + a warm one-line invite, never nagging.
- **Wordmark** — `wordmark/wordmark-set-*` (Hayah حياة) in auth/onboarding/splash.

### 1.6 Navigation model (replaces 5-tab + mascot quick-menu)
**Bottom bar: 4 worlds + center Create.** Labels in Data register, active = world accent, icon-only inactive.
```
[ Home ]   [ Us ]   ( + )   [ Treasury ]   [ Keepsake ]
                     create
```
- **( + ) Create sheet** (replaces mascot arc): Snap · Coupon · Letter · Note→List/Wish · Log mood · Ping. The "fill the keepsake" action.
- **Me** + **Settings** reached from the **Home top-bar** (avatar tap → Me; gear → Settings). Keeps the bar at 4+create and puts self/admin one tap from Home.
- Within a world: a clean **hub** with 2–4 "rooms" → detail screens. World→world = cinematic crossfade; hub→room = slideUp.

---

## 2. New Information Architecture (worlds)

| World | Route | Arabic | Holds (old routes folded in) |
|---|---|---|---|
| **Home** | `/` | الدار | living-room hub + connective tissue |
| **Us** (do together) | `/us` | نحن | Connect (prompts `/us/prompts`, ping `/us/ping`, mood) · Play (games `/game/*`, wheel `/wheel`) · Plan (calendar `/us/calendar`, lists `/us/list`, events `/us/events`+`/e`) · Watch `/us/watch` · Table `/our-table` |
| **Treasury** (love economy) | `/treasury` | الخزينة | Wallet `/us/coyyns` · Coupons `/us/coupons`+`/create-coupon` · Marketplace `/us/marketplace` · Challenges & Bounties · Wishlist `/us/wishlist` |
| **Keepsake** (remember & grow) | `/keepsake` | الذكرى | Snap `/snap` · Garden `/garden` · Vision `/2026` · Letters · Milestones / On-this-day |
| **Me** (self) | `/me` | أنا | Body `/me/body` (cycle/fitness) · Soul `/me/soul` (prayer/quran/azkar) · Rituals `/me/rituals` |
| **System** | — | — | Settings (`/more`,`/settings`) · Auth `/(auth)/*` · Onboarding `/onboarding` · Pair `/pair` · Public portal `/e/[slug]` · Offline |

> Redirects to add: `/us/coyyns|coupons|marketplace|wishlist` → `/treasury/*`; `/snap|garden|2026` → `/keepsake/*`; keep old paths as 301-style `redirect()` so nothing breaks mid-migration.

Per-page template below: **Layout** (top→bottom blocks) · **Feel** (skin · voice · motion · assets) · **States** · **Reuse/old→new**.

---

## 3. HOME — `/` · الدار · "The Living Room"

The opposite of a dashboard: a warm room that greets you, tells you the few things that matter, and is a calm launchpad to everywhere. Replaces the 23-widget stack with **~6 curated, connective blocks**.

**Layout**
1. **Top-bar** — avatar (→ Me) · `wordmark` small · gear (→ Settings) · skin-phase dot (sun/lantern). Data register.
2. **Greeting hero** — time/prayer-aware: Display "Good evening, [pet-name]." + Hand sub-note ("3 new keepsakes this week"). Background = adaptive skin (`skin-day-golden` / `scene-cairo-skyline-night`), faint `texture-paper-cream`. Reuse `HomeGreeting`.
3. **The two of you** — a single calm row: your mood + her mood (live), tap to log/see history. `objects/object-05` crescent / preference dots. Routes to Us›Connect. Reuse `MoodPicker`+`PartnerMoodIndicator` (condensed to one card).
4. **Today's one thing** — a single adaptive PosterCard surfacing the most relevant nudge (a due prompt, an unredeemed coupon, an incoming purchase, a ritual, a countdown). Tap → deep-links to the source. Editorial voice. (Logic: priority-ranked single surface, expand on tap.)
5. **Keepsake peek** — 2–3 recent memories (snap thumb, a letter line in Fraunces, a garden bloom) → Keepsake. `objects/object-11` keepsake box.
6. **Treasury peek** — `coin-yy` + balance (Data) + one live coupon/ticket → Treasury. Small, confident.
7. **Quick rooms** — a tidy 2×2 of world/room shortcuts the user uses most (Play, Plan, Soul, Snap) using `icons/*`. Connective tissue, not a menu dump.

**Feel** — skin: adaptive (the hero literally is the time of day). voice: Display greeting + Data chrome + Fraunces for the "one thing." motion: blocks `slideUp` stagger on open (0.06s); the hero skin drifts slowly (`anim`-grade ambient, reduced-motion safe). assets: `skin-day-golden`, `scene-cairo-skyline-night` (night), `coin-yy`, `object-11`, `texture-paper-cream`.
**States** — first-run (unpaired): hero invites to pair (→ Pair); empty keepsake: `scene-keepsake-open` + "Your story starts here." loading: warm pulse skeletons.
**Reuse/old→new** — slim `src/app/(main)/page.tsx`; keep `HomeGreeting`, `MoodPicker`, `CoyynsWidget` (restyled, condensed); retire the 23-widget stack into their worlds. The remaining widgets (`HomeRitualsWidget`, `HomeCalendarPeek`, `HomePrayerWidget`, `HomeCycleWidget`, `SharedGarden compact`, `DaysTogetherCounter`, `HomeLetterPrompt`, `HomeEvaluationPrompt`, `HomeCountdownWidget`) become the **"Today's one thing"** ranked sources + peeks — not all shown at once.

---

## 4. US — `/us` · نحن · "Together" (do-things-together world)

### 4.0 Us Hub — `/us`
**Layout** — World title (Display نحن/Together) + a calm 5-room grid as PosterCards, each with a spot illo + one-line state: **Connect** (a waiting prompt?), **Play** (resume session?), **Plan** (next event), **Watch** (next up), **Table** (last place). Accent: coral+indigo.
**Feel** — voice Display titles + Data sublines; motion: room cards scale-tap, hub→room slideUp. assets: `objects/object-08` dice (Play), `object-10` calendar (Plan), `object-07` vinyl (Watch), `object-06` coffee (Table), `object-03` note (Connect).
**old→new** — replace `/us` redirect-to-coyyns with this hub (coyyns moves to Treasury).

### 4.1 Connect — `/us/connect` (prompts · ping · mood)
**Layout** — PillTab [Today · History] . **Today:** the daily prompt as an Editorial PosterCard (Fraunces question on warm paper, `texture`), answer composer, reveal-both on submit; streak chip (Data + flame). **Ping:** a warm "send a thought" row (quick affection signals; this is currently a 7-line stub → Track A builds send-flow). **Mood:** both moods + 7-day strip. **History:** searchable, category chips (Deep/Playful/Memory/Dream/Opinion/Challenge), answer-reveal cards.
**Feel** — Editorial-led (intimate). coral accent. celebration: gentle glow + streak tick on submit. assets: `objects/object-04` letter, `divider-arabesque` between today/history.
**Reuse** — `DailyPromptCard`, `PromptAnswerReveal`, `PingTabContent` (rebuild send), `MoodStrip`.

### 4.2 Play — `/us/play` (games hub + wheel)
**Layout** — Hub: **ActiveSessionCard** (resume) if any; 3 **GameModeCards** poster-style (Check-In / Deep Dive / Date Night) with Arabic names + mode color; **Wheel** entry; link to **Question Bank**.
**Feel** — playful, the most "alive" world. coral+indigo, `backdrop-sunburst` flourishes. motion: cards have the 33% alive-responsive bounce. assets: `scenes/scene-game-cards`, `scene-cards-flatlay`, `objects/object-08` dice.
- **Check-In** `/us/play/check-in/{setup,play,complete}` — setup (categories, count, intensity); play (round Q&A both players, alignment scoring); **complete** = alignment summary poster + `seal-yy-wax`.
- **Deep Dive** `/us/play/deep-dive/{setup,play,complete}` — single-topic honesty; **complete screen** (currently empty → Track A) = Editorial recap of answers, no score, `divider-arabesque`.
- **Date Night** `/us/play/date-night/{setup,play,author,complete}` — categories/heat/dares/truth-or-dare; CoYYns stakes (→ Treasury wallet, currently broken → Track A); author = partner-written Qs; complete = playful tally + `poster-mabrouk` on a won round.
- **Bank** `/us/play/bank` — browse/search/filter question bank, contribute form.
- **Wheel** `/us/play/wheel` + `/wheel/[presetId]` — preset gallery, create, spin session (cinematic spin → result `seal`), history. Reuse `PresetCard`, `CreatePresetForm`.
**Feel (games-play screens)** — focused, low-chrome, big Display question, Data progress (X/Y), calibrated win celebration (`backdrop-sunburst` + confetti + `anim-coin-spin` when CoYYns earned).
**Reuse** — `GameModeCard`, `ActiveSessionCard`, `CheckInSetup/PlayScreen`, `DeepDiveSetup/PlayScreen`, `DateNightSetup/PlayScreen`, `ContributeForm`, `useGameEngine`.

### 4.3 Plan — `/us/plan` (calendar · lists · events)
**Layout** — PillTab [Calendar · Lists · Events]. **Calendar:** month grid (`EventDotCalendar`, category dot colors), swipe months, day bottom-sheet, "Coming Up" list, FAB create (+ **edit** — currently TODO → Track A). **Lists:** multi-list selector, quick-add, nested sub-items, completed collapsible. **Events:** portal cards (RSVP/views), Create → **portal builder** (currently dead-ends → Track A: template seeds pages/sections).
**Feel** — logistics but warm; Data-led with Editorial event titles. teal accent. assets: `object-10` calendar, `pattern-zellij-terracotta` month header.
**Reuse** — `EventDotCalendar`, `DayDetailSheet`, `QuickAddInput`, `ListItemCard`, `EventPortalCard`.

### 4.4 Watch — `/us/watch`
**Layout** — stats bar (count · avg · agree%), status tabs (Watchlist/Watching/Watched), type chips, `WatchCard` list, rating bottom-sheet (1–10 + reaction), FAB add (TMDB search). 
**Feel** — cinematic; `object-07` vinyl/film motif, indigo+amber. poster thumbnails. **Reuse** — `WatchCard`, `AddWatchModal`, `RatingSheet`, `useWatchLog`.

### 4.5 Table — `/our-table` (food journal)
**Layout** — Map/List toggle, stats, cuisine/score filter pills, `VisitListItem` / Leaflet markers (visit #), FAB → `/our-table/new` (rate food/ambiance/value), detail `/our-table/[visitId]` (both ratings side-by-side, photos).
**Feel** — warm travelogue; `object-06` coffee, sepia. mid-century-poster framing on place cards. **Reuse** — `FoodMap`, `VisitListItem`, `useFoodJournal`.

---

## 5. TREASURY — `/treasury` · الخزينة · "The Love Economy" (HERO world #2)

The keepsake-box currency. Amber+espresso, gold, coin. This is where "the playful currency of care" lives — Yahya's hero #2.

### 5.0 Treasury Hub — `/treasury`
**Layout** — **Wallet hero**: big `coin-yy` + balance (Display+Data, animated counter), "our shared joy pot" (Fraunces), partner balance, lifetime earned/spent (Data mono), **+Earn / −Spend**. Then room cards: **Coupons**, **Marketplace**, **Challenges & Bounties**, **Wishlist** — each a PosterCard with a spot illo + count.
**Feel** — gold/amber, espresso ground option, `texture-paper-cream`, `backdrop-sunburst` behind balance. motion: balance counts up; `anim-coin-spin` on earn. assets: `coin-yy`, `object-01` YY-coin emblem, `seal-yy-wax`.
**Reuse** — `CoyynsWallet`, `CoyynsHistory`; **old→new** redirect `/us/coyyns`.

### 5.1 Coupons — `/treasury/coupons` (+ create, + `/treasury/coupons/[id]`)
**Layout** — PillTab [For Me · I Made · History]. Stacked-preview "gifts waiting" card; `CouponCard` lists by status (active/pending_approval/redeemed/expired); detail = full ticket. **Create** (`/create-coupon`) 4-step wizard (category→image→expiry/surprise→summary/send).
**Feel** — perforated `CouponTicket` (`object-02`), coral; **redeem celebration**: `stamps/stamp-redeemed` thwacks on + `seal-yy-wax`. Hand-written "from [pet-name]". assets: `stamps/*` (REDEEMED/MABROUK/SEALED/OUR-SECRET/DONE).
**Reuse** — `CouponCard`, `StackedPreviewCard`, `CouponHistory`, `CreateCouponStep1–4`, `useCoupons`.

### 5.2 Marketplace — `/treasury/marketplace`
**Layout** — balance badge; PillTab [Shop · Challenges]; Shop = 2-col `MarketplaceItemCard` grid; buy → `PurchaseConfirmModal` (price, effect, requires-input); **purchase lifecycle** → ActivePurchaseCard on Home/Treasury (currently incomplete → Track A: status transitions for all effects + purchase history + realtime + seed items).
**Feel** — shop-as-poster-stall; amber, `backdrop-sun-smile`. effects: extra_ping/veto/task_order/dnd_timer/wildcard with `objects/*` glyphs.
**Reuse** — `MarketplaceItemCard`, `PurchaseConfirmModal`, `ActivePurchaseCard`, `useMarketplace`.

### 5.3 Challenges & Bounties — `/treasury/challenges`
**Layout** — Challenges (pending→active→history, `ChallengeCard`, create → accept-flow [fix: status `pending_acceptance` not `active`], resolve → `ChallengeWinAnimation` = `backdrop-sunburst`+double-stakes); Bounties (active, claim flow, confirm). RLS fix (Track A) noted.
**Feel** — playful stakes; coral/indigo; `badges/badge-sunburst-*` on win.
**Reuse** — `ChallengeCard`, `CreateChallengeForm`, `ChallengeAccept/ResolveFlow`, `BountyCard`, `BountyClaimFlow`.

### 5.4 Wishlist — `/treasury/wishlist`
**Layout** — tabs [Mine · Partner's], category/priority filters, `WishlistItemCard` (price, priority), claim (partner's), purchased collapsible, FAB add (url-metadata image).
**Feel** — warm catalog; rose+amber; `object-12` ribbon-heart. **Reuse** — `WishlistItemCard`, `AddWishlistItemForm`, `useWishlist`.

---

## 6. KEEPSAKE — `/keepsake` · الذكرى · "Memory & Growth"

The accruing box. Teal+rose+sepia, nostalgic. Snap, garden, vision, letters, milestones.

### 6.0 Keepsake Hub — `/keepsake`
**Layout** — **"On this day"** Editorial hero (a past memory resurfaced, Fraunces) when available; room cards: **Snaps**, **Garden**, **2026 Vision**, **Letters**; **Days-together** counter + next **milestone/countdown**.
**Feel** — sepia warmth, `scene-keepsake-open`, `object-11` box, `texture`. motion: memories fade-in like prints developing. assets: `scene-keepsake-open/teal`, `garden-rooftop`.
**Reuse** — `DaysTogetherCounter`, `HomeCountdownWidget`.

### 6.1 Snaps — `/keepsake/snap` (+ `/snap/capture`)
**Layout** — feed grouped by date (Today/Yesterday/…), side-by-side both-snapped days, `SnapCard` (image, emoji reactions, author), infinite scroll. Capture = camera → resize → upload (Cairo-tz date).
**Feel** — polaroid/pinned (`object`), warm; reactions pop. **Reuse** — `SnapCard`, `useSnap`; capture reached via center **+**.

### 6.2 Garden — `/keepsake/garden`
**Layout** — full bloom field (one flower per day-together), grow/bloom animation, tap for date/notes, month/season filter; `SharedGarden` full.
**Feel** — `scene-garden-rooftop`, `poster-grow-garden`, `video/anim-garden-sway` ambient header, sage+teal. **Reuse** — `SharedGarden`, `useGarden`.

### 6.3 2026 Vision — `/keepsake/vision` (+ `/2026/evaluate`)
**Layout** — board tabs [Mine · Partner's], full-bleed hero + theme tagline, monthly-eval CTA → evaluate, category sections (`CategorySection`) with items/achieved, wizard on first run; evaluate = monthly reflection.
**Feel** — editorial annual-report meets cork-board; `pattern`, amber. **Reuse** — `CategorySection`, `VisionBoardWizard`, `AddVisionItemForm`, `useVisionBoard`.

### 6.4 Letters — `/keepsake/letters`
**Layout** — letter history (Fraunces body, `object-04`, date, author, optional photo); compose monthly letter (`MonthlyLetterComposer`, lined-paper textarea `.textarea-lined` in Caveat). 
**Feel** — most intimate screen: Hand+Editorial, `video/anim-candle-flicker` ambient, `seal-yy-wax` to "seal & send." **Reuse** — `LetterCard`, `MonthlyLetterComposer` (today lives in `/me/rituals` → surface here too).

---

## 7. ME — `/me` · أنا · "Self"

Personal sanctuary. Reached from Home avatar. Three rooms.

### 7.0 Me Hub — `/me`
3 PosterCards: **Body** (rose), **Soul** (teal/amber + Islamic geometry), **Rituals** (sage). Reuse existing `/me/page.tsx` (restyled).

### 7.1 Body — `/me/body` (cycle · fitness)
**Layout (admin/Yahya):** `CycleDayWidget` hero (phase + day), `CycleInsightCard`, expandable `CycleCalendarView`, settings → `CycleConfigForm`. **Fitness (all):** goal card (→85kg) — currently stub. Strict owner-only RLS (keep).
**Feel** — rose accent, calm clinical-warm (NOT clinical-cold), `object-09` jasmine. **Reuse** — `CycleDayWidget`, `CycleInsightCard`, `CycleCalendarView`, `useCycle`.

### 7.2 Soul — `/me/soul`
**Layout** — `PrayerTracker` (5 prayers), `QuranTracker`, `AzkarCounter`, `DailyAyah` (Amiri verse).
**Feel** — most sacred screen: `texture-islamic` + `scene-soul-prayer` header + `video/anim-prayer-light` ambient, `ornament-star-*` corners, `pattern-mashrabiya-gold`. teal+amber, generous stillness. add realtime (Track A). **Reuse** — `PrayerTracker`, `QuranTracker`, `AzkarCounter`, `DailyAyah`.

### 7.3 Rituals — `/me/rituals`
**Layout** — cadence groups (Daily→Weekly→Monthly) of `RitualCard` (icon, log, partner status), monthly-letter CTA (→ Keepsake/Letters), letter history, create FAB.
**Feel** — warm habit-journal; sage+amber; `objects` icons per ritual. **Reuse** — `RitualCard`, `CreateRitualForm`, `MonthlyLetterComposer`, `useRituals`.

---

## 8. SYSTEM screens

### 8.1 Auth — `/(auth)/login · signup · verify · forgot-password`
Reskin to the Constitution: `wordmark` lockup, `bg-parchment`/`skin-day-golden` ground, underline inputs (`.input-underline`), coral CTA, OTP `OtpInput`, password-strength dots. Editorial warmth, calm. Reuse existing flows (working). `/reset-password` stays redirect to forgot.

### 8.2 Onboarding — `/onboarding` (re-enable, **skippable**)
8 steps reskinned: Welcome (Arabic حياة→Hayah reveal, `wordmark` + `anim`), Profile (avatar→riso `avatars` treatment), **Pairing** (QR/scan/code — guide but Skip allowed), 4 world-tours (Home/Us/Treasury+Keepsake/Me — updated to new IA), Ready (`seal-yy-wax` keepsake celebration). Re-enable guard in `(main)/layout.tsx` + migration to NULL `onboarding_completed_at` for re-onboard (Track A). Reuse `OnboardingShell`, step components (update tour content to new worlds).

### 8.3 Pair — `/pair` (+ `/pair/[code]`)
QR display, scanner, manual form, `PairingCelebration` (→ `seal-yy-wax` + `backdrop-sunburst` + confetti). Reuse all pairing components.

### 8.4 Settings — `/settings` (was `/more`)
Profile card (avatar/name/paired), Account (profile/partner/password), Preferences (notifications `/settings/notifications`, Google Calendar/Drive, **skin** = "Adaptive ☀️/🌙" not "Light", Language EN/AR), Data & Storage, About `/settings/about`, Logout. Reskin; wire Language to i18n (Track C). Reuse `ProfileEditForm`, `ChangePasswordForm`, `GoogleCalendarConnect`, `GoogleDriveConnect`, `StorageInfo`.

### 8.5 Public Event Portal — `/e/[slug]/[pageSlug]`
Public, no-auth. `SectionRenderer` renders portal sections; apply Constitution as a **light public theme** (warm, wordmark, but standalone — it's seen by guests). Track A: builder must actually seed pages/sections.

### 8.6 Offline — `/offline`
Warm "you're offline" with `scene-lantern-dusk` + Hand note; lists cached worlds.

---

## 9. Asset → screen map (from `docs/design/assets/clean/`)
- **scenes/**: home-rooftop-iftar→Home hero · cairo-skyline-night→night skin/Home · soul-prayer(-wide)→Me/Soul · garden-rooftop→Keepsake/Garden · coffee-pourover/vinyl→Rituals/Table · cards-flatlay/game-cards→Us/Play · datenight-balcony/rooftop-couple-night→date-night · keepsake-open/teal→empty states · lantern-dusk→loading/offline · rooftop-cups/night→ambient.
- **coins/** coin-yy→Treasury. **seals/** seal-yy-wax→milestones/seal-send. **stamps/**→coupon redeem + celebration words. **badges/**→challenge/ritual wins. **objects/**→card/list glyphs everywhere. **icons/**→nav+UI. **wordmark/**→auth/onboarding/splash. **posters/** mabrouk→celebration · cairo→portal/Table · grow→Garden. **patterns/** zellij+mashrabiya→dividers/spiritual corners. **ornaments/**→Soul corners. **divider/**→section breaks. **textures/**→card grain. **backdrops/** sunburst→celebration. **skins/** day-golden→default ground. **avatars/**→profile/pairing. **video/** candle→Letters · garden-sway→Garden · coin-spin→earn CoYYns · prayer-light→Soul.

---

## 10. Build sequence (Track B execution order) + critical files

> Foundation FIRST — mockups won't hold without enforced tokens.

1. **Token + asset foundation** — create `tailwind.config.ts` (expose all §1.3 tokens + type scale + radii/shadow); load voice-map fonts in `src/app/layout.tsx` via `next/font`; rip out shadcn cold-gray + Stitch-pink from `globals.css`; copy `docs/design/assets/clean/*` → `public/assets/`; add `eslint-plugin-tailwindcss` style-guard (inline styles = layout only). *(This is the root cause fix for "ugly/inconsistent.")*
2. **Shell + nav + skin** — `useSkin()` hook + `data-skin` on `<html>`; rebuild `BottomNav` (4 worlds + Create sheet); `AppShell`/`SectionBackground` apply adaptive skin. Files: `src/app/(main)/layout.tsx`, `src/components/shared/BottomNav.tsx`, new `src/lib/hooks/use-skin.ts`.
3. **Core components** — `PosterCard`, restyle `PillTabBar`, `Coin`, `CouponTicket`, `EmptyState` (with keepsake scenes), `Celebration` (sunburst+stamp+seal), loading pulse. In `src/components/shared|ui`.
4. **HERO screens first** — Home (`src/app/(main)/page.tsx`) → Treasury hub + Wallet/Coupons (`src/app/(main)/treasury/*`, redirects from `us/coyyns|coupons`).
5. **Worlds, one at a time** — Us hub→Connect→Play→Plan→Watch→Table; Keepsake hub→Snap→Garden→Vision→Letters; Me hub→Body→Soul→Rituals.
6. **System** — Auth reskin → Onboarding (re-enable skippable) → Pair → Settings → Portal public theme → Offline.
7. **i18n pass (Track C, parallel)** — route every new string through `src/lib/i18n` + RTL logical props as screens are built (stop the debt growing).

Each screen: build → validate (render + interaction + integration per CLAUDE.md rules 17/18) → visual check against this spec → commit (`feat(design): ...`).

---

## 11. Verification
- **Token enforcement:** grep shows hardcoded hex / shadcn-gray / `#ec1349` count → ~0 in redesigned files; `tailwind.config.ts` exists; lint style-guard passes.
- **Per screen:** open in browser at 375px (+ a tablet width); confirm against the screen's **Feel** line (skin, voice registers present, correct world accent, named assets rendering, motion calm); empty/loading/celebration states exist; RTL flips logically.
- **Nav:** 4 worlds + Create reachable; Me + Settings from Home top-bar; old routes redirect to new world routes; world→world crossfade, hub→room slideUp.
- **Adaptive skin:** force day/dusk/night (mock clock) → grounds + accents swap; `prefers-reduced-motion` kills ambient drift.
- **Assets:** every `public/assets/*` referenced resolves (no 404s); videos autoplay muted loop with poster.
- **Regression:** `npx tsc --noEmit` clean; existing feature tests still pass; the reskinned screens keep their data wiring (hooks unchanged).
- **Living proof:** the moodboard `docs/design/hayah-moodboard.html` sample-screens (Home/coupon/wallet/memory tiles) become the visual acceptance bar — built screens must match or exceed them.

---

## Out of scope (Track A — functionality, parallel)
Marketplace purchase lifecycle · Event-portal builder seeding · Ping send-flow · game→wallet CoYYns transfer · Deep-Dive complete screen data · challenge accept-flow + bounty RLS · calendar edit · prayer/quran realtime · onboarding re-enable migration. The wireframe assumes these land; design is built to receive them.

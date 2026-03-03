"""
Populate the Validation Log with pre-build entries for all completed tasks,
then run tests and record results.

Usage:
  python populate_validation_log.py --populate   # Write pre-build rows
  python populate_validation_log.py --results    # Update post-build results
  python populate_validation_log.py --status     # Print summary
"""

import sys
import os

# Ensure we can import from the orchestrator directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sheets_connector import TaskQueueClient
from datetime import datetime

# ─── TASK VALIDATION DATA ────────────────────────────────────────
# Each entry: task_id -> {milestone, expected, test_type, steps, verification, test_file}

VALIDATION_DATA = {
    # ── Phase 1: Shell & Navigation ──────────────────────────
    "T101": {
        "milestone": "M1-NavShell",
        "expected": "BottomNav renders 5 tab items (Home, Us, Health, Spirit, Ops) with icons and labels. Active tab shows copper slide indicator with Framer Motion layoutId animation. Tapping a tab navigates to the correct route via next/link.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/shared/BottomNav.test.tsx\n   → Expected: all tests passing",
        "verification": "Test file: src/__tests__/components/shared/BottomNav.test.tsx\nComponent: src/components/shared/BottomNav.tsx",
        "test_file": "src/__tests__/components/shared/BottomNav.test.tsx",
    },
    "T102": {
        "milestone": "M1-NavShell",
        "expected": "PageHeader renders page title, optional back button (navigates to parent), and optional right action slot. Balanced layout with consistent spacing.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/shared/PageHeader.test.tsx\n   → Expected: all tests passing",
        "verification": "Test file: src/__tests__/components/shared/PageHeader.test.tsx\nComponent: src/components/shared/PageHeader.tsx",
        "test_file": "src/__tests__/components/shared/PageHeader.test.tsx",
    },
    "T103": {
        "milestone": "M1-UIBase",
        "expected": "PageTransition wraps page content with AnimatePresence fade+translate entrance. FadeIn provides simple opacity animation. StaggerList staggers children with configurable delay. All respect prefers-reduced-motion. Barrel export from animations/index.ts.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/animations/PageTransition.test.tsx\n   → Expected: 14 tests passing",
        "verification": "Test file: src/__tests__/components/animations/PageTransition.test.tsx\nComponents: src/components/animations/",
        "test_file": "src/__tests__/components/animations/PageTransition.test.tsx",
    },
    "T104": {
        "milestone": "M1-UIBase",
        "expected": "LoadingSkeleton renders 4 variants (card, list-item, header, full-page) with CSS-only animate-pulse. Uses warm bg-secondary tones. Server Component compatible.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/shared/LoadingSkeleton.test.tsx\n   → Expected: 8 tests passing",
        "verification": "Test file: src/__tests__/components/shared/LoadingSkeleton.test.tsx\nComponent: src/components/shared/LoadingSkeleton.tsx",
        "test_file": "src/__tests__/components/shared/LoadingSkeleton.test.tsx",
    },
    "T105": {
        "milestone": "M1-UIBase",
        "expected": "EmptyState renders icon, title, subtitle, and optional copper CTA (as Link or button). FadeIn entrance animation. Reusable across all module shells.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/shared/EmptyState.test.tsx\n   → Expected: 9 tests passing",
        "verification": "Test file: src/__tests__/components/shared/EmptyState.test.tsx\nComponent: src/components/shared/EmptyState.tsx",
        "test_file": "src/__tests__/components/shared/EmptyState.test.tsx",
    },
    "T106": {
        "milestone": "M1-HomeDash",
        "expected": "QuickActionCard renders module doorway card with icon circle, label, description. Framer Motion press/hover scale. Wrapped in next/link for navigation.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/home/QuickActionCard.test.tsx\n   → Expected: 7 tests passing",
        "verification": "Test file: src/__tests__/components/home/QuickActionCard.test.tsx\nComponent: src/components/home/QuickActionCard.tsx",
        "test_file": "src/__tests__/components/home/QuickActionCard.test.tsx",
    },
    "T107": {
        "milestone": "M1-NavShell",
        "expected": "AppShell provides root layout with warm cream background, dvh viewport height, pb-24 content padding for BottomNav clearance. Renders BottomNav. Integrated into (main) layout.tsx.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/shared/AppShell.test.tsx\n   → Expected: 5 tests passing",
        "verification": "Test file: src/__tests__/components/shared/AppShell.test.tsx\nComponent: src/components/shared/AppShell.tsx",
        "test_file": "src/__tests__/components/shared/AppShell.test.tsx",
    },
    "T108": {
        "milestone": "M1-HomeDash",
        "expected": "Home page renders HomeGreeting (time-aware greeting + formatted date), 2x2 QuickActionCard grid (Us, Health, Spirit, Ops links), and 2 WidgetSlots. Wrapped in PageTransition.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/home/HomeGreeting.test.tsx src/__tests__/app/page.test.tsx\n   → Expected: 16 tests passing (9 HomeGreeting + 7 page)",
        "verification": "Test files: src/__tests__/components/home/HomeGreeting.test.tsx, src/__tests__/app/page.test.tsx\nPage: src/app/(main)/page.tsx",
        "test_file": "src/__tests__/components/home/HomeGreeting.test.tsx, src/__tests__/app/page.test.tsx",
    },
    "T109": {
        "milestone": "M1-ModuleShells",
        "expected": "/us page renders 4-tab RelationshipTabs (Notes, Coupons, CoYYns, Send) with Framer Motion layoutId sliding copper underline and AnimatePresence crossfade. Each tab shows EmptyState. PageTransition + PageHeader.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/app/us/page.test.tsx\n   → Expected: 10 tests passing",
        "verification": "Test file: src/__tests__/app/us/page.test.tsx\nPage: src/app/(main)/us/page.tsx",
        "test_file": "src/__tests__/app/us/page.test.tsx",
    },
    "T110": {
        "milestone": "M1-ModuleShells",
        "expected": "/health page renders PageTransition + PageHeader + EmptyState with Activity icon. Copy: 'Your wellness, tracked'. No data fetching.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/app/health/page.test.tsx\n   → Expected: 6 tests passing",
        "verification": "Test file: src/__tests__/app/health/page.test.tsx\nPage: src/app/(main)/health/page.tsx",
        "test_file": "src/__tests__/app/health/page.test.tsx",
    },
    "T111": {
        "milestone": "M1-ModuleShells",
        "expected": "/spirit page renders PageTransition + PageHeader + EmptyState with Sun icon. Copy: 'Your daily practice'. No data fetching.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/app/spirit/page.test.tsx\n   → Expected: 6 tests passing",
        "verification": "Test file: src/__tests__/app/spirit/page.test.tsx\nPage: src/app/(main)/spirit/page.tsx",
        "test_file": "src/__tests__/app/spirit/page.test.tsx",
    },
    "T112": {
        "milestone": "M1-ModuleShells",
        "expected": "/ops page renders PageTransition + PageHeader + EmptyState with CheckSquare icon. Copy: 'Life, organized'. No data fetching.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/app/ops/page.test.tsx\n   → Expected: 6 tests passing",
        "verification": "Test file: src/__tests__/app/ops/page.test.tsx\nPage: src/app/(main)/ops/page.tsx",
        "test_file": "src/__tests__/app/ops/page.test.tsx",
    },
    "T113": {
        "milestone": "M1-Settings",
        "expected": "SettingsRow renders reusable row with label, value/description, optional icon, optional chevron. /settings page shows profile card, 3 sections (Account, Appearance, About), Log Out stub, easter egg footer.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/shared/SettingsRow.test.tsx src/__tests__/app/settings/page.test.tsx\n   → Expected: 13 tests passing (6 SettingsRow + 7 page)",
        "verification": "Test files: src/__tests__/components/shared/SettingsRow.test.tsx, src/__tests__/app/settings/page.test.tsx\nComponent: src/components/shared/SettingsRow.tsx\nPage: src/app/(main)/settings/page.tsx",
        "test_file": "src/__tests__/components/shared/SettingsRow.test.tsx, src/__tests__/app/settings/page.test.tsx",
    },

    # ── Phase 2: Auth ────────────────────────────────────────
    "T201": {
        "milestone": "M2-AuthDB",
        "expected": "Migration creates profiles table with 8 columns, set_updated_at trigger, handle_new_user auto-profile trigger, 3 RLS policies (own read, partner read, own update), partner_id index. Seed for Yahya+Yara pair.",
        "test_type": "db-migration",
        "steps": "1) Verify file exists: supabase/migrations/001_auth_profiles.sql\n2) npm run build — should pass with no errors",
        "verification": "Migration: supabase/migrations/001_auth_profiles.sql\nVerification SQL: supabase/tests/",
        "test_file": "N/A",
    },
    "T202": {
        "milestone": "M2-AuthClient",
        "expected": "Supabase client infrastructure: database.types.ts typed, client.ts browser singleton, server.ts per-request server client with async cookies(), middleware.ts updateSession for token refresh.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/lib/supabase/client.test.ts src/__tests__/lib/supabase/middleware.test.ts\n   → Expected: 4 tests passing",
        "verification": "Test files: src/__tests__/lib/supabase/client.test.ts, src/__tests__/lib/supabase/middleware.test.ts\nFiles: src/lib/supabase/client.ts, src/lib/supabase/server.ts, src/lib/supabase/middleware.ts",
        "test_file": "src/__tests__/lib/supabase/client.test.ts, src/__tests__/lib/supabase/middleware.test.ts",
    },
    "T203": {
        "milestone": "M2-AuthFlow",
        "expected": "Login page at /login with RHF+Zod validation, Supabase signInWithPassword, Framer Motion entrance, error states, loading spinner. (auth) route group with minimal layout.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/app/auth/login/page.test.tsx\n   → Expected: 13 tests passing",
        "verification": "Test file: src/__tests__/app/auth/login/page.test.tsx\nPage: src/app/(auth)/login/page.tsx",
        "test_file": "src/__tests__/app/auth/login/page.test.tsx",
    },
    "T204": {
        "milestone": "M2-AuthFlow",
        "expected": "AuthProvider with user/profile/partner state from Supabase onAuthStateChange. useAuth hook with context validation. signOut with /login redirect. profileNeedsSetup boolean + refreshProfile.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/lib/providers/AuthProvider.test.tsx\n   → Expected: 11 tests passing",
        "verification": "Test file: src/__tests__/lib/providers/AuthProvider.test.tsx\nProvider: src/lib/providers/AuthProvider.tsx",
        "test_file": "src/__tests__/lib/providers/AuthProvider.test.tsx",
    },
    "T205": {
        "milestone": "M2-AuthFlow",
        "expected": "Next.js middleware redirects unauthenticated users to /login, authenticated /login users to /. Fail-open on errors. All pages in (main) route group with AppShell layout.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/middleware.test.ts\n   → Expected: 11 tests passing",
        "verification": "Test file: src/__tests__/middleware.test.ts\nMiddleware: src/middleware.ts",
        "test_file": "src/__tests__/middleware.test.ts",
    },
    "T206": {
        "milestone": "M2-AuthUI",
        "expected": "ProfileSetupOverlay with RHF+Zod name validation, avatar upload to Supabase Storage (5MB limit), Framer Motion entry/exit. Shows when display_name is empty/User. Integrated into (main) layout.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/shared/ProfileSetupOverlay.test.tsx\n   → Expected: 13 tests passing",
        "verification": "Test file: src/__tests__/components/shared/ProfileSetupOverlay.test.tsx\nComponent: src/components/shared/ProfileSetupOverlay.tsx",
        "test_file": "src/__tests__/components/shared/ProfileSetupOverlay.test.tsx",
    },
    "T207": {
        "milestone": "M2-AuthUI",
        "expected": "Settings page uses useAuth() for real profile data. AlertDialog sign out confirmation. ProfileEditForm with inline expand, avatar upload, initials fallback. Loading skeleton when profile null.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/shared/ProfileEditForm.test.tsx src/__tests__/app/settings/page.test.tsx\n   → Expected: 15 tests passing (8 + 7)",
        "verification": "Test files: src/__tests__/components/shared/ProfileEditForm.test.tsx, src/__tests__/app/settings/page.test.tsx\nComponent: src/components/shared/ProfileEditForm.tsx",
        "test_file": "src/__tests__/components/shared/ProfileEditForm.test.tsx, src/__tests__/app/settings/page.test.tsx",
    },

    # ── Phase 3: CoYYns ──────────────────────────────────────
    "T301": {
        "milestone": "M3-CoYYnsDB",
        "expected": "Migration creates coyyns_wallets (7 cols, CHECK balance >= 0), coyyns_transactions (8 cols, immutable), handle_coyyn_transaction trigger, 4 RLS policies, compound index. Seed wallets for both users.",
        "test_type": "db-migration",
        "steps": "1) Verify file exists: supabase/migrations/002_coyyns.sql\n2) npm run build — should pass",
        "verification": "Migration: supabase/migrations/002_coyyns.sql\nVerification SQL: supabase/tests/",
        "test_file": "N/A",
    },
    "T302": {
        "milestone": "M3-CoYYnsData",
        "expected": "useCoyyns hook: fetches user/partner wallets + last 50 transactions in parallel. Realtime subscription on coyyns_wallets. addCoyyns (earn, positive int), spendCoyyns (balance check), refreshWallet. Error state management.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/lib/hooks/use-coyyns.test.ts\n   → Expected: 13 tests passing",
        "verification": "Test file: src/__tests__/lib/hooks/use-coyyns.test.ts\nHook: src/lib/hooks/use-coyyns.ts\nTypes: src/lib/types/coyyns.types.ts",
        "test_file": "src/__tests__/lib/hooks/use-coyyns.test.ts",
    },
    "T303": {
        "milestone": "M3-CoYYnsUI",
        "expected": "CoyynsWallet display component showing animated balance with coin icon. Tap interaction for details. Visual representation of wallet state.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/relationship/CoyynsWallet.test.tsx\n   → Expected: all tests passing",
        "verification": "Test file: src/__tests__/components/relationship/CoyynsWallet.test.tsx\nComponent: src/components/relationship/CoyynsWallet.tsx",
        "test_file": "src/__tests__/components/relationship/CoyynsWallet.test.tsx",
    },
    "T304": {
        "milestone": "M3-CoYYnsUI",
        "expected": "CoyynsBadge inline component showing compact balance for headers/nav. Small pill-style display with coin icon and formatted number.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/shared/CoyynsBadge.test.tsx\n   → Expected: all tests passing",
        "verification": "Test file: src/__tests__/components/shared/CoyynsBadge.test.tsx\nComponent: src/components/shared/CoyynsBadge.tsx",
        "test_file": "src/__tests__/components/shared/CoyynsBadge.test.tsx",
    },
    "T305": {
        "milestone": "M3-CoYYnsForms",
        "expected": "AddCoyynsForm: bottom sheet with RHF+Zod validation (amount 1-10000 int, description 1-200 chars with live count). Calls useCoyyns().addCoyyns(), sonner toast on success. Backdrop dismiss + body scroll lock.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/relationship/AddCoyynsForm.test.tsx\n   → Expected: 10 tests passing",
        "verification": "Test file: src/__tests__/components/relationship/AddCoyynsForm.test.tsx\nComponent: src/components/relationship/AddCoyynsForm.tsx",
        "test_file": "src/__tests__/components/relationship/AddCoyynsForm.test.tsx",
    },
    "T306": {
        "milestone": "M3-CoYYnsForms",
        "expected": "SpendCoyynsForm: bottom sheet, balance-aware with dynamic Zod max(balance), 'Insufficient CoYYns' warning, disabled button when over balance. Prefilled values support. Calls useCoyyns().spendCoyyns().",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/relationship/SpendCoyynsForm.test.tsx\n   → Expected: 11 tests passing",
        "verification": "Test file: src/__tests__/components/relationship/SpendCoyynsForm.test.tsx\nComponent: src/components/relationship/SpendCoyynsForm.tsx",
        "test_file": "src/__tests__/components/relationship/SpendCoyynsForm.test.tsx",
    },
    "T307": {
        "milestone": "M3-CoYYnsUI",
        "expected": "CoyynsHistory list showing transactions grouped by date with earn/spend indicators, formatted amounts, and descriptions.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/relationship/CoyynsHistory.test.tsx\n   → Expected: all tests passing",
        "verification": "Test file: src/__tests__/components/relationship/CoyynsHistory.test.tsx\nComponent: src/components/relationship/CoyynsHistory.tsx",
        "test_file": "src/__tests__/components/relationship/CoyynsHistory.test.tsx",
    },
    "T308": {
        "milestone": "M3-CoYYnsHome",
        "expected": "CoyynsWidget: compact card with CoyynsBadge balance pill, 3 most recent transactions with +/- prefix and comma-formatted amounts, 'See all' link to /us. Empty state + loading skeleton. HomeGreeting uses useAuth() for dynamic display_name.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/home/CoyynsWidget.test.tsx src/__tests__/components/home/HomeGreeting.test.tsx src/__tests__/app/page.test.tsx\n   → Expected: 27 tests passing (12 + 9 + 6)",
        "verification": "Test files: src/__tests__/components/home/CoyynsWidget.test.tsx, src/__tests__/components/home/HomeGreeting.test.tsx, src/__tests__/app/page.test.tsx\nComponent: src/components/home/CoyynsWidget.tsx",
        "test_file": "src/__tests__/components/home/CoyynsWidget.test.tsx",
    },

    # ── Phase 4: Push Notifications ──────────────────────────
    "T401": {
        "milestone": "M4-Push",
        "expected": "Migration creates push_subscriptions (6 cols, UNIQUE user+subscription), notifications (10 cols, sender/recipient FKs, immutable), daily_send_limits (6 cols, UNIQUE user+date). get_or_create_daily_limit() function. 9 RLS policies.",
        "test_type": "db-migration",
        "steps": "1) Verify file exists: supabase/migrations/003_notifications.sql\n2) npm run build — should pass",
        "verification": "Migration: supabase/migrations/003_notifications.sql\nVerification SQL: supabase/tests/",
        "test_file": "N/A",
    },
    "T402": {
        "milestone": "M4-Push",
        "expected": "Push service: isPushSupported, getPushPermission, subscribeToPush, unsubscribeFromPush. useNotifications hook: notification list, daily send limits, canSend/remainingSends, sendNotification with optimistic updates + double-tap guard.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/lib/services/push-service.test.ts src/__tests__/lib/hooks/use-notifications.test.ts\n   → Expected: 17 tests passing (7 + 10)",
        "verification": "Test files: src/__tests__/lib/services/push-service.test.ts, src/__tests__/lib/hooks/use-notifications.test.ts\nService: src/lib/services/push-service.ts\nHook: src/lib/hooks/use-notifications.ts",
        "test_file": "src/__tests__/lib/services/push-service.test.ts, src/__tests__/lib/hooks/use-notifications.test.ts",
    },
    "T403": {
        "milestone": "M4-Push",
        "expected": "Supabase Edge Function send-notification/index.ts: JWT auth, sender verification, Web Push via web-push with VAPID. CORS preflight, 410 cleanup, idempotent delivery, Promise.allSettled for multi-device.",
        "test_type": "infra",
        "steps": "1) Verify file exists: supabase/functions/send-notification/index.ts\n2) npm run build — should pass",
        "verification": "Edge function: supabase/functions/send-notification/index.ts\nDeno tests: supabase/functions/send-notification/",
        "test_file": "N/A",
    },

    # ── Phase 5: Cycle Tracker ───────────────────────────────
    "T501": {
        "milestone": "M5-Cycle",
        "expected": "Migration creates cycle_config (9 cols, UNIQUE owner_id, pill config), cycle_logs (7 cols, UNIQUE owner+date, mood CHECK). STRICT OWNER-ONLY RLS. 3 policies on config, 4 on logs. Index on logs(owner_id, date DESC).",
        "test_type": "db-migration",
        "steps": "1) Verify file exists: supabase/migrations/004_cycle_tracker.sql\n2) npm run build — should pass",
        "verification": "Migration: supabase/migrations/004_cycle_tracker.sql\nVerification SQL: supabase/tests/",
        "test_file": "N/A",
    },
    "T502": {
        "milestone": "M5-Cycle",
        "expected": "useCycle hook: fetches cycle_config + cycle_logs, derives currentDay, phase (active/break), daysUntilBreak/Active, isPMSWindow, isPeriodLikely, nextPeriodDate from pill_start_date. Dual-layer privacy: RLS + hook-level owner_id guard.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/lib/hooks/use-cycle.test.ts\n   → Expected: 14 tests passing",
        "verification": "Test file: src/__tests__/lib/hooks/use-cycle.test.ts\nHook: src/lib/hooks/use-cycle.ts\nTypes: src/lib/types/health.types.ts",
        "test_file": "src/__tests__/lib/hooks/use-cycle.test.ts",
    },

    # ── Phase 6: Love Coupons ────────────────────────────────
    "T601": {
        "milestone": "M6-Coupon",
        "expected": "Migration creates coupons (18 cols, full lifecycle), coupon_history (6 cols, immutable audit). 4 CHECK constraints. handle_coupon_created trigger. Surprise coupon RLS: recipient cannot see unrevealed surprises. 5 RLS on coupons, 2 on history.",
        "test_type": "db-migration",
        "steps": "1) Verify file exists: supabase/migrations/005_coupons.sql\n2) npm run build — should pass",
        "verification": "Migration: supabase/migrations/005_coupons.sql\nVerification SQL: supabase/tests/",
        "test_file": "N/A",
    },
    "T602": {
        "milestone": "M6-Coupon",
        "expected": "useCoupons hook: fetches myCoupons/receivedCoupons, derives pendingApprovals. Actions: createCoupon, redeemCoupon, approveCoupon, rejectCoupon, revealSurprise with status guards. Realtime subscription. coupon_history audit log.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/lib/hooks/use-coupons.test.ts\n   → Expected: 8 tests passing",
        "verification": "Test file: src/__tests__/lib/hooks/use-coupons.test.ts\nHook: src/lib/hooks/use-coupons.ts\nTypes: src/lib/types/relationship.types.ts",
        "test_file": "src/__tests__/lib/hooks/use-coupons.test.ts",
    },

    # ── Phase 7: Marketplace (partial) ───────────────────────
    "T705": {
        "milestone": "M7-Market",
        "expected": "ChallengeCard component renders challenge title, stakes, status, participants, and action buttons. Visual representation of marketplace challenges.",
        "test_type": "unit",
        "steps": "1) npm test -- src/__tests__/components/relationship/ChallengeCard.test.tsx\n   → Expected: all tests passing",
        "verification": "Test file: src/__tests__/components/relationship/ChallengeCard.test.tsx\nComponent: src/components/relationship/ChallengeCard.tsx",
        "test_file": "src/__tests__/components/relationship/ChallengeCard.test.tsx",
    },

    # ── Phase 8: Infrastructure ──────────────────────────────
    "T801": {
        "milestone": "M8-Infra",
        "expected": "Screenshot infrastructure: scripts/screenshot.mjs (Puppeteer headless, 375x812, networkidle0, full-page PNG) + scripts/visual-audit.sh (build->start->screenshot->cleanup). npm run screenshot scripts.",
        "test_type": "infra",
        "steps": "1) Verify files exist: scripts/screenshot.mjs, scripts/visual-audit.sh\n2) node scripts/screenshot.mjs --help or verify file is valid JS",
        "verification": "Scripts: scripts/screenshot.mjs, scripts/visual-audit.sh\nTest: scripts/__tests__/screenshot.test.mjs",
        "test_file": "scripts/__tests__/screenshot.test.mjs",
    },
    "T802": {
        "milestone": "M8-Infra",
        "expected": "Visual audit integrated into orchestrator auditor. AUDIT_JSON_SCHEMA gains visual_pass boolean. Audit prompt gains STEP 6 visual check. Audit note includes visual:yes/NO. Screenshot cleanup after every task.",
        "test_type": "infra",
        "steps": "1) Verify orchestrator.py contains 'visual_pass' in AUDIT_JSON_SCHEMA\n2) Verify orchestrator.py contains 'STEP 6' or visual audit step",
        "verification": "File: orchestrator/orchestrator.py (search for visual_pass, screenshot)",
        "test_file": "N/A",
    },

    # ── Phase 9: Orchestrator Tooling ────────────────────────
    "T901": {
        "milestone": "M8-Infra",
        "expected": "Executor column (O) in Task Queue. sheets_connector.py get_eligible_tasks() accepts executor filter. orchestrator.py main loop filters to orchestrator executor.",
        "test_type": "infra",
        "steps": "1) Verify sheets_connector.py get_eligible_tasks has executor parameter\n2) python3 -c \"from sheets_connector import TaskQueueClient; tq=TaskQueueClient(run_id='t'); print(len(tq.get_eligible_tasks(executor='orchestrator')))\"",
        "verification": "File: orchestrator/sheets_connector.py (get_eligible_tasks method)\nFile: orchestrator/orchestrator.py (executor filtering)",
        "test_file": "N/A",
    },
    "T902": {
        "milestone": "M8-Infra",
        "expected": "max_retries_per_task config (default 1). Failed tasks retry with surgical revert + breather. _should_retry checks attempt count, logs TASK_RETRY. _mark_failed includes attempt count.",
        "test_type": "infra",
        "steps": "1) Verify orchestrator.py contains '_should_retry' method\n2) Verify orchestrator.py contains 'max_retries_per_task' or 'TASK_RETRY'",
        "verification": "File: orchestrator/orchestrator.py (search for _should_retry, max_retries)",
        "test_file": "N/A",
    },
    "T903": {
        "milestone": "M8-Infra",
        "expected": "cc_tasks.py CLI: --start marks building, --done marks complete, --fail marks failed, --all shows all tasks, default shows eligible claude-code tasks. Logs MANUAL_START/COMPLETE/FAIL events.",
        "test_type": "infra",
        "steps": "1) python3 orchestrator/cc_tasks.py --help or verify file imports correctly\n2) Verify cc_tasks.py contains '--start' and '--done' and '--fail'",
        "verification": "File: orchestrator/cc_tasks.py",
        "test_file": "N/A",
    },
}


def get_phase_from_task_id(task_id: str) -> str:
    """Extract phase number from task ID."""
    tid = task_id.strip()
    if len(tid) >= 2 and tid[0].upper() == "T" and tid[1].isdigit():
        return tid[1]
    return "?"


def populate_prebuild(tq: TaskQueueClient):
    """Write pre-build validation rows for all completed tasks."""
    existing = tq.get_validated_task_ids()
    print(f"Already validated: {len(existing)} tasks")

    # Get all completed tasks from Task Queue
    all_tasks = tq.get_all_tasks()
    completed = [
        t for t in all_tasks
        if t.get("Status", "").strip() in ("complete", "complete_with_issues")
    ]
    print(f"Completed tasks to validate: {len(completed)}")

    rows_to_add = []
    skipped = []

    for task in completed:
        tid = task.get("Task ID", "").strip()
        if tid in existing:
            skipped.append(tid)
            continue

        vdata = VALIDATION_DATA.get(tid)
        if not vdata:
            print(f"  ⚠️  No validation data for {tid} — skipping")
            skipped.append(tid)
            continue

        phase = get_phase_from_task_id(tid)
        name = task.get("Name", "").strip()
        # Truncate name to first 80 chars for the cell
        short_name = name[:80] if len(name) > 80 else name

        row = [
            tid,                              # A: Task ID
            phase,                            # B: Phase
            short_name,                       # C: Task Name
            vdata["milestone"],               # D: Milestone
            vdata["expected"],                # E: Expected Behavior
            vdata["test_type"],               # F: Test Type
            vdata["steps"],                   # G: Test Steps
            vdata["verification"],            # H: Verification Location
            "documented",                     # I: Pre-Build Status
            "untested",                       # J: Test Result
            "",                               # K: Tested At
            "",                               # L: Tested By
            "",                               # M: Failure Notes
            vdata["test_file"],               # N: Linked Test File
        ]
        rows_to_add.append(row)

    if skipped:
        print(f"  Skipped (already exist or no data): {len(skipped)}")

    if not rows_to_add:
        print("  Nothing to add.")
        return

    print(f"  Adding {len(rows_to_add)} validation rows...")
    # Add in batches of 20 to avoid API limits
    batch_size = 20
    for i in range(0, len(rows_to_add), batch_size):
        batch = rows_to_add[i:i + batch_size]
        tq.batch_add_validation_entries(batch)
        print(f"    Batch {i // batch_size + 1}: {len(batch)} rows written")
        if i + batch_size < len(rows_to_add):
            import time
            time.sleep(1)  # Rate limit respect

    print(f"  ✅ {len(rows_to_add)} pre-build rows added to Validation Log")


def update_results(tq: TaskQueueClient, results: list[dict]):
    """Update post-build results in the Validation Log."""
    print(f"Updating {len(results)} test results...")
    tq.batch_update_validation_results(results)
    print(f"  ✅ {len(results)} results recorded")


def print_status(tq: TaskQueueClient):
    """Print a summary of the Validation Log."""
    if not tq._validation_log:
        print("Validation Log worksheet not found")
        return

    rows = tq._validation_log.get_all_values()
    if len(rows) <= 1:
        print("Validation Log is empty")
        return

    header = rows[0]
    data = rows[1:]

    # Count by result
    results = {}
    for row in data:
        result = row[9] if len(row) > 9 else "unknown"  # Col J
        results[result] = results.get(result, 0) + 1

    print(f"\n{'='*55}")
    print(f"  VALIDATION LOG STATUS")
    print(f"{'='*55}")
    print(f"  Total entries: {len(data)}")
    for status, count in sorted(results.items()):
        emoji = {"pass": "✅", "fail": "❌", "partial": "⚠️", "skip": "⏭️", "untested": "🔲"}.get(status, "❓")
        print(f"  {emoji} {status}: {count}")
    print()

    # List failures
    failures = [row for row in data if len(row) > 9 and row[9] in ("fail", "partial")]
    if failures:
        print("  FAILURES/PARTIAL:")
        for row in failures:
            tid = row[0]
            result = row[9] if len(row) > 9 else "?"
            notes = row[12] if len(row) > 12 else ""
            print(f"    {tid}: {result} — {notes[:80]}")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    tq = TaskQueueClient(run_id="validation-populate")

    if not tq.is_online:
        print("❌ Cannot connect to Google Sheets")
        sys.exit(1)

    if "--populate" in sys.argv:
        populate_prebuild(tq)
    elif "--results" in sys.argv:
        # Results are passed via stdin or updated by the caller
        print("Use update_results() programmatically or pass results via --update-task")
    elif "--update-task" in sys.argv:
        # Usage: --update-task T101 pass [failure_notes]
        idx = sys.argv.index("--update-task")
        task_id = sys.argv[idx + 1]
        result = sys.argv[idx + 2]
        notes = sys.argv[idx + 3] if len(sys.argv) > idx + 3 else ""
        tq.update_validation_result(task_id, result, "claude-code", notes)
        print(f"  ✅ {task_id} → {result}")
    elif "--status" in sys.argv:
        print_status(tq)
    else:
        print("Usage:")
        print("  python populate_validation_log.py --populate        # Write pre-build rows")
        print("  python populate_validation_log.py --update-task T101 pass")
        print("  python populate_validation_log.py --status          # Print summary")

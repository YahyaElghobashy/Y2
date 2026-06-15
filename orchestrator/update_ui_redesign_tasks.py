"""
Batch-add all 70 UI Redesign tasks (TU01-TU70) to the Google Sheet Task Queue.
Statuses are based on verified implementation audit.
"""
import sys
import os
import time

# Run from orchestrator dir for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from sheets_connector import TaskQueueClient

# ── Task definitions with verified statuses ──

TASKS = [
    # PU1 — Foundation (8 tasks) — ALL COMPLETE
    {"id": "TU01", "phase": "PU1", "name": "Import Lora font", "type": "setup", "pri": "1", "par": "PU1-A", "deps": "", "status": "complete", "executor": "claude-code", "files": "layout.tsx, globals.css, theme.ts", "detail": "Lora font imported with 4 weights, italic, --font-serif var", "criteria": "font-serif class renders Lora italic"},
    {"id": "TU02", "phase": "PU1", "name": "Import Plus Jakarta Sans font", "type": "setup", "pri": "1", "par": "PU1-A", "deps": "", "status": "complete", "executor": "claude-code", "files": "layout.tsx, globals.css, theme.ts", "detail": "Plus_Jakarta_Sans imported with 5 weights, --font-nav var", "criteria": "font-nav class renders Plus Jakarta Sans"},
    {"id": "TU03", "phase": "PU1", "name": "Add Stitch color tokens", "type": "style", "pri": "1", "par": "PU1-A", "deps": "", "status": "complete", "executor": "claude-code", "files": "globals.css, theme.ts", "detail": "Pink primary/soft/hover tokens, copper gradient", "criteria": "New tokens available in CSS and TS"},
    {"id": "TU04", "phase": "PU1", "name": "Add underline input CSS", "type": "style", "pri": "2", "par": "PU1-B", "deps": "", "status": "complete", "executor": "claude-code", "files": "globals.css", "detail": ".input-underline with copper focus border-bottom", "criteria": "Bottom-border-only input with copper focus"},
    {"id": "TU05", "phase": "PU1", "name": "Add pill tab CSS pattern", "type": "style", "pri": "2", "par": "PU1-B", "deps": "", "status": "complete", "executor": "claude-code", "files": "globals.css", "detail": ".pill-tab-group/.pill-tab/.pill-tab-active classes", "criteria": "Pill tabs render as rounded segmented control"},
    {"id": "TU06", "phase": "PU1", "name": "Add lined-paper textarea", "type": "style", "pri": "3", "par": "PU1-B", "deps": "", "status": "complete", "executor": "claude-code", "files": "globals.css", "detail": ".textarea-lined with repeating gradient lines", "criteria": "Textarea shows horizontal ruled lines"},
    {"id": "TU07", "phase": "PU1", "name": "Add chat bubble CSS", "type": "style", "pri": "3", "par": "PU1-B", "deps": "", "status": "complete", "executor": "claude-code", "files": "globals.css", "detail": ".chat-bubble-sent (copper) / .chat-bubble-received (cream)", "criteria": "Copper sent, cream received bubble styles"},
    {"id": "TU08", "phase": "PU1", "name": "SpiralAnimation + SparklesEffect", "type": "setup", "pri": "4", "par": "PU1-C", "deps": "", "status": "complete", "executor": "claude-code", "files": "SpiralAnimation.tsx, SparklesEffect.tsx", "detail": "SVG spiral + sparkle particle components", "criteria": "Both render animated effects"},

    # PU2 — Components (10 tasks) — ALL COMPLETE
    {"id": "TU09", "phase": "PU2", "name": "PillTabBar component", "type": "component", "pri": "1", "par": "PU2-A", "deps": "TU05", "status": "complete", "executor": "claude-code", "files": "PillTabBar.tsx", "detail": "Animated pill tabs with layoutId sliding pill", "criteria": "Animated pill tabs with copper active state"},
    {"id": "TU10", "phase": "PU2", "name": "StitchInput underline variant", "type": "component", "pri": "1", "par": "PU2-A", "deps": "TU04", "status": "complete", "executor": "claude-code", "files": "input.tsx", "detail": "variant='underline' added to Input component", "criteria": "<Input variant='underline' /> works"},
    {"id": "TU11", "phase": "PU2", "name": "PasswordStrengthDots", "type": "component", "pri": "2", "par": "PU2-A", "deps": "", "status": "complete", "executor": "claude-code", "files": "PasswordStrengthDots.tsx", "detail": "4 dots colored by strength level", "criteria": "Dots fill progressively with password strength"},
    {"id": "TU12", "phase": "PU2", "name": "EventDotCalendar", "type": "component", "pri": "2", "par": "PU2-B", "deps": "", "status": "complete", "executor": "claude-code", "files": "EventDotCalendar.tsx", "detail": "7-col month grid with category-colored event dots", "criteria": "Calendar grid with colored event dots"},
    {"id": "TU13", "phase": "PU2", "name": "EventCard with badge", "type": "component", "pri": "2", "par": "PU2-B", "deps": "", "status": "complete", "executor": "claude-code", "files": "EventCard.tsx", "detail": "Event card with category badge variants", "criteria": "Cards render with colored category badges"},
    {"id": "TU14", "phase": "PU2", "name": "ChatBubble component", "type": "component", "pri": "2", "par": "PU2-C", "deps": "TU07", "status": "complete", "executor": "claude-code", "files": "ChatBubble.tsx", "detail": "Sent/received chat bubbles with Framer entrance", "criteria": "Sent=copper right, received=cream left"},
    {"id": "TU15", "phase": "PU2", "name": "PingLimitDots component", "type": "component", "pri": "3", "par": "PU2-C", "deps": "", "status": "complete", "executor": "claude-code", "files": "PingLimitDots.tsx", "detail": "Dots showing remaining pings", "criteria": "Dots visualize remaining pings"},
    {"id": "TU16", "phase": "PU2", "name": "StackedPreviewCard", "type": "component", "pri": "3", "par": "PU2-D", "deps": "", "status": "complete", "executor": "claude-code", "files": "StackedPreviewCard.tsx", "detail": "3 stacked offset/rotated cards with gift count", "criteria": "Three cards stack with rotation"},
    {"id": "TU17", "phase": "PU2", "name": "WheelSVG component", "type": "component", "pri": "2", "par": "PU2-D", "deps": "", "status": "complete", "executor": "claude-code", "files": "WheelSVG.tsx", "detail": "SVG wheel with colored segments, 3D perspective", "criteria": "SVG wheel with perspective"},
    {"id": "TU18", "phase": "PU2", "name": "CopperButton variant", "type": "component", "pri": "1", "par": "PU2-A", "deps": "", "status": "complete", "executor": "claude-code", "files": "button.tsx", "detail": "copper variant + pill size added to Button", "criteria": "<Button variant='copper' size='pill'> works"},

    # PU3 — Auth Pages (4 tasks) — ALL COMPLETE
    {"id": "TU19", "phase": "PU3", "name": "Login page redesign", "type": "page", "pri": "1", "par": "PU3-A", "deps": "TU01,TU02,TU04,TU10,TU18", "status": "complete", "executor": "claude-code", "files": "login/page.tsx", "detail": "Arabic header, underline inputs, copper CTA pill", "criteria": "Matches hayah_login Stitch"},
    {"id": "TU20", "phase": "PU3", "name": "Sign Up page", "type": "page", "pri": "1", "par": "PU3-A", "deps": "TU01,TU02,TU04,TU10,TU11,TU18", "status": "complete", "executor": "claude-code", "files": "signup/page.tsx", "detail": "4 underline inputs + PasswordStrengthDots + copper CTA", "criteria": "Matches hayah_sign_up Stitch"},
    {"id": "TU21", "phase": "PU3", "name": "Email Verification page", "type": "page", "pri": "2", "par": "PU3-B", "deps": "TU18", "status": "complete", "executor": "claude-code", "files": "verify/page.tsx", "detail": "Mail icon with glow, resend countdown timer, copper CTA", "criteria": "Matches email_verification Stitch"},
    {"id": "TU22", "phase": "PU3", "name": "Auth layout gradient", "type": "style", "pri": "3", "par": "PU3-B", "deps": "TU01", "status": "complete", "executor": "claude-code", "files": "(auth)/layout.tsx", "detail": "Warm copper radial glow overlay at top", "criteria": "Subtle warm glow on auth pages"},

    # PU4 — Home Dashboard (5 tasks) — PARTIAL
    {"id": "TU23", "phase": "PU4", "name": "StatusIndicatorCard component", "type": "component", "pri": "1", "par": "PU4-A", "deps": "", "status": "pending", "executor": "claude-code", "files": "StatusIndicatorCard.tsx", "detail": "border-left 4px solid accent, icon in 10% bg, uppercase label", "criteria": "Cards with colored left border accent"},
    {"id": "TU24", "phase": "PU4", "name": "Home page widget ordering", "type": "page", "pri": "2", "par": "PU4-A", "deps": "TU23", "status": "pending", "executor": "claude-code", "files": "(main)/page.tsx", "detail": "Prayer/cycle in StatusIndicatorCard, Our Garden section, gap-3", "criteria": "Matches home dashboard Stitch layout"},
    {"id": "TU25", "phase": "PU4", "name": "CoyynsWidget texture refinement", "type": "component", "pri": "2", "par": "PU4-B", "deps": "", "status": "complete_with_issues", "executor": "claude-code", "files": "CoyynsWidget.tsx", "detail": "Uses texture-parchment (not leather), has Coins emoji", "criteria": "Leather texture, copper balance, coin icon"},
    {"id": "TU26", "phase": "PU4", "name": "FeelingGenerousCTA perforation", "type": "component", "pri": "3", "par": "PU4-B", "deps": "", "status": "complete_with_issues", "executor": "claude-code", "files": "FeelingGenerousCTA.tsx", "detail": "Has perforated-edge but no copper action button", "criteria": "Perforation + copper CTA"},
    {"id": "TU27", "phase": "PU4", "name": "HomeGreeting font polish", "type": "style", "pri": "3", "par": "PU4-B", "deps": "TU01,TU02", "status": "complete", "executor": "claude-code", "files": "HomeGreeting.tsx", "detail": "font-nav title, font-serif italic subtitle", "criteria": "Plus Jakarta greeting, Lora subtitle"},

    # PU5 — Us Tab Pages (6 tasks) — MOSTLY PENDING
    {"id": "TU28", "phase": "PU5", "name": "CoYYns wallet hero", "type": "component", "pri": "1", "par": "PU5-A", "deps": "", "status": "pending", "executor": "claude-code", "files": "CoyynsWallet.tsx", "detail": "texture-leather, font-display 32px balance, shimmer, action buttons", "criteria": "Matches hayah_us_playground wallet"},
    {"id": "TU29", "phase": "PU5", "name": "Coupons hub pill tabs + stack", "type": "page", "pri": "1", "par": "PU5-A", "deps": "TU09,TU16", "status": "pending", "executor": "claude-code", "files": "us/coupons/page.tsx", "detail": "Replace inline tabs with PillTabBar + StackedPreviewCard", "criteria": "Matches coupons_hub Stitch"},
    {"id": "TU30", "phase": "PU5", "name": "CouponCard ticket refinement", "type": "component", "pri": "2", "par": "PU5-B", "deps": "", "status": "complete_with_issues", "executor": "claude-code", "files": "CouponCard.tsx", "detail": "Has perforated-edge but no vertical dashed divider", "criteria": "Ticket-style perforated coupon cards"},
    {"id": "TU31", "phase": "PU5", "name": "Calendar page EventDot + Coming Up", "type": "page", "pri": "2", "par": "PU5-B", "deps": "TU12,TU13", "status": "pending", "executor": "claude-code", "files": "us/calendar/page.tsx", "detail": "Currently empty placeholder — needs EventDotCalendar + EventCards", "criteria": "Matches shared_calendar Stitch"},
    {"id": "TU32", "phase": "PU5", "name": "Ping tab chat bubbles + composer", "type": "page", "pri": "2", "par": "PU5-C", "deps": "TU06,TU07,TU14,TU15", "status": "pending", "executor": "claude-code", "files": "PingTabContent.tsx, PingHistory.tsx", "detail": "Replace history with ChatBubble + lined textarea + PingLimitDots", "criteria": "Matches us_ping_tab Stitch"},
    {"id": "TU33", "phase": "PU5", "name": "Challenges dashed-border style", "type": "component", "pri": "3", "par": "PU5-C", "deps": "", "status": "complete", "executor": "claude-code", "files": "ChallengeCard.tsx", "detail": "2px dashed var(--accent-copper) border on active", "criteria": "Dashed copper border on active challenges"},

    # PU6 — 2026 Vision Board (4 tasks) — MOSTLY COMPLETE
    {"id": "TU34", "phase": "PU6", "name": "Hero banner gradient", "type": "style", "pri": "1", "par": "", "deps": "", "status": "complete", "executor": "claude-code", "files": "2026/page.tsx", "detail": "Copper to gold gradient with white text", "criteria": "Matches 2026_vision_board hero"},
    {"id": "TU35", "phase": "PU6", "name": "Board switcher pills", "type": "component", "pri": "2", "par": "", "deps": "TU09", "status": "complete_with_issues", "executor": "claude-code", "files": "2026/page.tsx", "detail": "Uses inline pill tabs, not PillTabBar component", "criteria": "Rounded-full pill tabs"},
    {"id": "TU36", "phase": "PU6", "name": "Polaroid vision cards", "type": "component", "pri": "2", "par": "", "deps": "", "status": "pending", "executor": "claude-code", "files": "CategorySection.tsx", "detail": "White bg, pb-6, shadow, random rotation, handwritten captions", "criteria": "Polaroid cards with rotation"},
    {"id": "TU37", "phase": "PU6", "name": "Evaluation CTA refinement", "type": "component", "pri": "3", "par": "", "deps": "", "status": "complete", "executor": "claude-code", "files": "2026/page.tsx", "detail": "Copper glow, font-serif italic, copper variant button", "criteria": "Copper glow CTA card"},

    # PU7 — Me Landing (4 tasks) — PARTIAL
    {"id": "TU38", "phase": "PU7", "name": "Me landing redesign", "type": "page", "pri": "1", "par": "", "deps": "TU01,TU23", "status": "complete_with_issues", "executor": "claude-code", "files": "me/page.tsx", "detail": "Has border-l-4 + avatar ring but missing rituals row + days counter", "criteria": "Matches me_landing_page Stitch"},
    {"id": "TU39", "phase": "PU7", "name": "Body page accent", "type": "style", "pri": "2", "par": "", "deps": "", "status": "pending", "executor": "claude-code", "files": "me/body/page.tsx", "detail": "Rose border-l-4, min-h-100px cards, serif italic titles", "criteria": "Rose accent, serif labels"},
    {"id": "TU40", "phase": "PU7", "name": "Soul page sage accent", "type": "style", "pri": "2", "par": "", "deps": "", "status": "pending", "executor": "claude-code", "files": "spirit/page.tsx", "detail": "File currently redirects to /me — needs content", "criteria": "Sage accent, islamic texture"},
    {"id": "TU41", "phase": "PU7", "name": "DaysTogetherCounter serif", "type": "component", "pri": "3", "par": "", "deps": "TU01", "status": "complete", "executor": "claude-code", "files": "DaysTogetherCounter.tsx", "detail": "font-serif italic, font-display 20px bold copper number, Heart icon", "criteria": "Lora italic counter with heart"},

    # PU8 — More Settings (3 tasks) — ALL COMPLETE
    {"id": "TU42", "phase": "PU8", "name": "Profile card + paired status", "type": "style", "pri": "1", "par": "", "deps": "", "status": "complete", "executor": "claude-code", "files": "more/page.tsx", "detail": "Paired with Yara in copper text with Heart icon", "criteria": "Matches more_settings_page Stitch"},
    {"id": "TU43", "phase": "PU8", "name": "Settings groups in cards", "type": "style", "pri": "2", "par": "", "deps": "", "status": "complete", "executor": "claude-code", "files": "more/page.tsx", "detail": "font-nav 11px uppercase tracking-widest group labels", "criteria": "Clean card containers"},
    {"id": "TU44", "phase": "PU8", "name": "About Our Story card", "type": "component", "pri": "3", "par": "", "deps": "TU01", "status": "complete", "executor": "claude-code", "files": "more/page.tsx", "detail": "font-serif italic text, font-mono version", "criteria": "Lora italic about card"},

    # PU9 — Our Table + Rating (4 tasks) — PARTIAL
    {"id": "TU45", "phase": "PU9", "name": "Restaurant cards score badges", "type": "component", "pri": "1", "par": "", "deps": "", "status": "pending", "executor": "claude-code", "files": "VisitListItem.tsx", "detail": "Currently h-18px badges, need w-8 h-8 rounded-full copper/gold/muted", "criteria": "Circular score badges"},
    {"id": "TU46", "phase": "PU9", "name": "Filter tabs alignment", "type": "style", "pri": "2", "par": "", "deps": "", "status": "complete", "executor": "claude-code", "files": "our-table/page.tsx", "detail": "Active: filled copper. Inactive: outline. rounded-full", "criteria": "Matches our_table_dashboard"},
    {"id": "TU47", "phase": "PU9", "name": "Rating score + slider refinement", "type": "style", "pri": "2", "par": "", "deps": "", "status": "pending", "executor": "claude-code", "files": "Rating components", "detail": "Score 72px font-display, gradient slider, copper thumb", "criteria": "Matches rating_experience"},
    {"id": "TU48", "phase": "PU9", "name": "Summary stats refinement", "type": "style", "pri": "3", "par": "", "deps": "", "status": "complete", "executor": "claude-code", "files": "our-table/page.tsx", "detail": "font-nav 10px uppercase label, font-display 22px copper avg", "criteria": "Nav font label, copper avg"},

    # PU10 — Wheel (4 tasks) — PARTIAL
    {"id": "TU49", "phase": "PU10", "name": "Presets gallery layout", "type": "page", "pri": "1", "par": "", "deps": "TU17", "status": "pending", "executor": "claude-code", "files": "wheel/page.tsx", "detail": "2-col grid, game-box shadow, dashed create card", "criteria": "Matches presets gallery"},
    {"id": "TU50", "phase": "PU10", "name": "Live wheel SVG upgrade", "type": "page", "pri": "1", "par": "", "deps": "TU17", "status": "complete_with_issues", "executor": "claude-code", "files": "SpinTheWheel.tsx", "detail": "Uses SVG wheel already, but not WheelSVG component", "criteria": "SVG wheel with copper SPIN button"},
    {"id": "TU51", "phase": "PU10", "name": "Elimination pills", "type": "component", "pri": "2", "par": "", "deps": "", "status": "pending", "executor": "claude-code", "files": "EliminationPills.tsx", "detail": "Component does not exist yet", "criteria": "Pills with elimination animation"},
    {"id": "TU52", "phase": "PU10", "name": "Session log section", "type": "style", "pri": "3", "par": "", "deps": "", "status": "pending", "executor": "claude-code", "files": "Wheel page", "detail": "Numbered rounds in copper circles", "criteria": "Session log below wheel"},

    # PU11 — Snap (4 tasks) — PARTIAL
    {"id": "TU53", "phase": "PU11", "name": "Camera viewfinder + copper shutter", "type": "style", "pri": "1", "par": "", "deps": "", "status": "pending", "executor": "claude-code", "files": "CameraCapture.tsx", "detail": "Has 72px shutter but white/grey, not copper. No rule-of-thirds grid", "criteria": "Matches camera capture"},
    {"id": "TU54", "phase": "PU11", "name": "Camera mode selector", "type": "component", "pri": "2", "par": "", "deps": "", "status": "pending", "executor": "claude-code", "files": "CameraModeSelector.tsx", "detail": "Component does not exist yet", "criteria": "Mode selector with animated indicator"},
    {"id": "TU55", "phase": "PU11", "name": "Snap feed 2-col + date headers", "type": "style", "pri": "2", "par": "", "deps": "", "status": "complete", "executor": "claude-code", "files": "snap/page.tsx", "detail": "font-display date headers with copper dots, grid-cols-2 gap-2", "criteria": "Matches snap feed"},
    {"id": "TU56", "phase": "PU11", "name": "Snap reactions floating", "type": "component", "pri": "3", "par": "", "deps": "", "status": "pending", "executor": "claude-code", "files": "SnapReaction.tsx", "detail": "Component exists but not integrated into SnapCard", "criteria": "Floating reaction circles"},

    # PU12 — Marketplace (3 tasks) — PARTIAL
    {"id": "TU57", "phase": "PU12", "name": "Colored emoji backgrounds", "type": "component", "pri": "1", "par": "", "deps": "", "status": "pending", "executor": "claude-code", "files": "MarketplaceItemCard.tsx", "detail": "Currently uses uniform copper bg, needs category-specific colors", "criteria": "Matches coyyns_marketplace"},
    {"id": "TU58", "phase": "PU12", "name": "Buy/disabled button states", "type": "component", "pri": "2", "par": "", "deps": "", "status": "pending", "executor": "claude-code", "files": "MarketplaceItemCard.tsx", "detail": "Need copper affordable + disabled 'Need X more' states", "criteria": "Copper buy, disabled need-more"},
    {"id": "TU59", "phase": "PU12", "name": "Marketplace header coin balance", "type": "style", "pri": "3", "par": "", "deps": "", "status": "complete_with_issues", "executor": "claude-code", "files": "us/marketplace/page.tsx", "detail": "Has CoyynsBadge header but title uses font-body not font-nav", "criteria": "Coin badge + nav font title"},

    # PU13 — Onboarding (3 tasks) — PARTIAL
    {"id": "TU60", "phase": "PU13", "name": "Welcome Arabic text sizing", "type": "style", "pri": "1", "par": "", "deps": "TU01", "status": "complete", "executor": "claude-code", "files": "WelcomeStep.tsx", "detail": "font-arabic text-[72px] font-bold copper, font-serif italic tagline", "criteria": "Matches welcome screen"},
    {"id": "TU61", "phase": "PU13", "name": "Pairing celebration confetti", "type": "style", "pri": "2", "par": "", "deps": "TU08", "status": "complete_with_issues", "executor": "claude-code", "files": "PairingCelebration.tsx", "detail": "Uses custom ConfettiParticle, not SparklesEffect", "criteria": "Matches pairing celebration"},
    {"id": "TU62", "phase": "PU13", "name": "Ready step polish", "type": "style", "pri": "3", "par": "", "deps": "TU01", "status": "pending", "executor": "claude-code", "files": "ReadyStep.tsx", "detail": "Needs font-display title, font-serif subtitle, feature icon row", "criteria": "Serif subtitle, icon row"},

    # PU14 — Global (4 tasks) — ALL COMPLETE
    {"id": "TU63", "phase": "PU14", "name": "BottomNav Plus Jakarta labels", "type": "style", "pri": "1", "par": "", "deps": "TU02", "status": "complete", "executor": "claude-code", "files": "BottomNav.tsx", "detail": "All labels font-nav, active font-semibold, inactive font-medium", "criteria": "Nav labels use Plus Jakarta Sans"},
    {"id": "TU64", "phase": "PU14", "name": "PageHeader font + spacing", "type": "component", "pri": "1", "par": "", "deps": "TU02", "status": "complete", "executor": "claude-code", "files": "PageHeader.tsx", "detail": "Sticky with backdrop-blur-sm, font-nav 18px bold, copper chevron", "criteria": "Plus Jakarta headers with blur"},
    {"id": "TU65", "phase": "PU14", "name": "HorizontalTabBar alignment", "type": "component", "pri": "2", "par": "", "deps": "TU02", "status": "complete", "executor": "claude-code", "files": "HorizontalTabBar.tsx", "detail": "font-nav 13px labels, copper active text, 2px copper underline", "criteria": "Nav font, copper underline"},
    {"id": "TU66", "phase": "PU14", "name": "EmptyState refinement", "type": "component", "pri": "3", "par": "", "deps": "TU01", "status": "complete", "executor": "claude-code", "files": "EmptyState.tsx", "detail": "Icon in w-16 h-16 copper circle, font-display title, font-serif subtitle", "criteria": "Serif subtitle, copper action"},

    # PU15 — Polish (4 tasks) — PARTIAL
    {"id": "TU67", "phase": "PU15", "name": "Font consistency audit", "type": "style", "pri": "1", "par": "", "deps": "TU01,TU02", "status": "complete", "executor": "claude-code", "files": "83+ files", "detail": "292 verbose font declarations cleaned via bulk sed", "criteria": "6-font hierarchy consistent app-wide"},
    {"id": "TU68", "phase": "PU15", "name": "Animation smoothness audit", "type": "style", "pri": "2", "par": "", "deps": "", "status": "pending", "executor": "claude-code", "files": "All animation components", "detail": "Max 400ms interactive, consistent slideUp, prefers-reduced-motion", "criteria": "Smooth animations, no jank"},
    {"id": "TU69", "phase": "PU15", "name": "Responsive QA (375px-428px)", "type": "style", "pri": "2", "par": "", "deps": "", "status": "pending", "executor": "claude-code", "files": "All pages", "detail": "No overflow, min 12px text, 44px touch targets, pb-24 nav", "criteria": "No layout breaks"},
    {"id": "TU70", "phase": "PU15", "name": "Design system docs update", "type": "style", "pri": "3", "par": "", "deps": "", "status": "pending", "executor": "claude-code", "files": "DESIGN_SYSTEM.md, COMPONENT_REGISTRY.md, theme.ts", "detail": "Register new components, add Lora + PJS to docs", "criteria": "Docs current and complete"},
]


def main():
    print("=" * 60)
    print("  UI REDESIGN TASK QUEUE — Google Sheets Bulk Update")
    print("=" * 60)
    print()

    tq = TaskQueueClient(run_id="ui-redesign-update")

    if not tq.is_online:
        print("❌ Sheets unavailable. Aborting.")
        sys.exit(1)

    # Check which TU tasks already exist
    print("📋 Checking existing tasks...")
    all_tasks = tq.get_all_tasks()
    existing_ids = {str(t.get("Task ID", "")).strip() for t in all_tasks}
    print(f"   Found {len(all_tasks)} total tasks in sheet")

    tu_existing = [tid for tid in existing_ids if tid.startswith("TU")]
    print(f"   TU tasks already in sheet: {len(tu_existing)}")

    # Find tasks to add vs update
    to_add = []
    to_update = []
    for task in TASKS:
        if task["id"] in existing_ids:
            to_update.append(task)
        else:
            to_add.append(task)

    print(f"   Tasks to ADD: {len(to_add)}")
    print(f"   Tasks to UPDATE: {len(to_update)}")
    print()

    # Add new tasks
    if to_add:
        print(f"📝 Adding {len(to_add)} new tasks...")
        rows = []
        now = "2026-03-07 12:00:00"
        for t in to_add:
            finished = now if t["status"] in ("complete", "complete_with_issues") else ""
            # Cols: A=ID, B=Phase, C=Name, D=Type, E=Pri, F=ParGrp, G=Deps, H=Status
            # I=Started, J=Finished, K=Duration, L=Builder, M=Auditor, N=Commit
            # O=Executor, P=Notes, Q=Files, R=Detail, S=Criteria, T=Flags
            row = [
                t["id"],        # A - Task ID
                t["phase"],     # B - Phase
                t["name"],      # C - Name
                t["type"],      # D - Type
                t["pri"],       # E - Priority
                t["par"],       # F - Parallel Group
                t["deps"],      # G - Dependencies
                t["status"],    # H - Status
                now if t["status"] != "pending" else "",  # I - Started At
                finished,       # J - Finished At
                "",             # K - Duration
                "",             # L - Builder Output
                "",             # M - Auditor Verdict
                "",             # N - Commit Hash
                t["executor"],  # O - Executor
                "UI Redesign batch — Stitch mockup alignment",  # P - Notes
                t["files"],     # Q - Files
                t["detail"],    # R - Implementation Detail
                t["criteria"],  # S - Acceptance Criteria
                "",             # T - Flags
            ]
            rows.append(row)

        # Batch append
        try:
            ws = tq._task_queue
            ws.append_rows(rows, value_input_option="USER_ENTERED")
            print(f"   ✅ Added {len(rows)} tasks")
        except Exception as e:
            print(f"   ❌ Failed to add tasks: {e}")
            # Try one by one
            for i, row in enumerate(rows):
                try:
                    time.sleep(1)  # rate limit
                    ws.append_row(row, value_input_option="USER_ENTERED")
                    print(f"   ✅ Added {row[0]}")
                except Exception as e2:
                    print(f"   ❌ Failed {row[0]}: {e2}")

    # Update existing tasks
    if to_update:
        print(f"\n🔄 Updating {len(to_update)} existing tasks...")
        for t in to_update:
            try:
                row_num = tq._find_task_row(t["id"])
                if not row_num:
                    print(f"   ⚠️  {t['id']} not found")
                    continue
                # Update status (col H=8)
                tq._task_queue.update_cell(row_num, 8, t["status"])
                time.sleep(0.5)  # rate limit
                print(f"   ✅ {t['id']} → {t['status']}")
            except Exception as e:
                print(f"   ❌ {t['id']}: {e}")
                time.sleep(2)

    # Log the event
    print("\n📝 Logging event...")
    complete_count = sum(1 for t in TASKS if t["status"] == "complete")
    partial_count = sum(1 for t in TASKS if t["status"] == "complete_with_issues")
    pending_count = sum(1 for t in TASKS if t["status"] == "pending")
    tq.log_event(
        "UI_REDESIGN_AUDIT",
        "TU01-TU70",
        f"Bulk status update: {complete_count} complete, {partial_count} partial, {pending_count} pending",
        "—",
        "—",
        "📊"
    )

    print()
    print("=" * 60)
    print(f"  ✅ DONE — {complete_count} complete, {partial_count} partial, {pending_count} pending")
    print("=" * 60)

    # Summary
    print()
    print("Status breakdown:")
    print(f"  ✅ complete:             {complete_count}/70")
    print(f"  ⚠️  complete_with_issues: {partial_count}/70")
    print(f"  ⏳ pending:              {pending_count}/70")


if __name__ == "__main__":
    main()

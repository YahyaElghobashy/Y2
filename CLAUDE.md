# Y2 — Shared Life Ecosystem

A PWA for two users (Yahya & Yara). Built with Next.js 15, shadcn/ui, Tailwind CSS v4, Framer Motion, Supabase.

## Read Before Every Task

Before writing any code, read the relevant docs:

| What you're doing | Read first |
|---|---|
| Any UI work | `docs/DESIGN_SYSTEM.md` |
| Creating components | `docs/DESIGN_SYSTEM.md` + `docs/COMPONENT_REGISTRY.md` |
| Backend / data | `docs/API_CONTRACTS.md` |
| Any code | `docs/CODING_STANDARDS.md` |
| Understanding the app | `docs/ARCHITECTURE.md` |
| Checking what exists | `docs/COMPONENT_REGISTRY.md` + `docs/TASK_LOG.md` |
| Planning/validating a task | `docs/VALIDATION_SUITE.md` + Google Sheets Validation Log |

## Project Rules

1. **Design tokens only** — never hardcode colors, spacing, or font sizes. Use CSS variables from `lib/theme.ts`
2. **One file per component** — in `components/[module]/ComponentName.tsx`
3. **Use `cn()` utility** — from `lib/utils.ts` for conditional Tailwind classes
4. **All user-facing text** — goes in `lib/i18n/` (support English + Arabic)
5. **Framer Motion for all animation** — follow patterns in DESIGN_SYSTEM.md
6. **shadcn/ui as base** — extend and theme, never replace primitives
7. **One concern per function** — small, readable, composable
8. **Tests beside components** — in `__tests__/` adjacent to the component
9. **Conventional commits** — `feat(scope): description` / `fix(scope): description` / `chore(scope): description`
10. **After creating a component** — update `docs/COMPONENT_REGISTRY.md`
11. **After completing a task** — update `docs/TASK_LOG.md`
12. **Never install packages** without checking if they're already in package.json
13. **Mobile-first** — all layouts start from 375px width and scale up
14. **RTL-ready** — use logical properties (ps, pe, ms, me) not left/right in Tailwind
15. **Pre-build validation plan** — Before starting any task, populate the Google Sheets "Validation Log" tab with: expected behavior, test type, test steps, and verification location. Pre-Build Status must be `documented` before writing code. See `docs/VALIDATION_SUITE.md` for full instructions and schema.
16. **Post-build test recording** — After completing a task, run its test steps and record pass/fail/partial in the Validation Log. A task is not complete until its Test Result is recorded. If `fail` or `partial`, fix and re-test before marking done.
17. **Task completion workflow (mandatory)** — After finishing code for a task, follow this sequence **before starting any new task**:
    1. **Local test/validate** — Run the task's test steps locally (unit tests, build, visual check, dev server preview, etc.)
    2. **Update Validation Log** — Record results in the Google Sheets Validation Log (Test Result, Tested At, Tested By, Failure Notes)
    3. **Iterate if needed** — If `fail` or `partial`, fix the code, re-test, and update the Validation Log until `pass`
    4. **Commit & push** — Commit with conventional commit message, push to GitHub
    5. **Update Task Queue** — Set Status to `complete` (or `complete_with_issues`), fill Finished At, Duration, Commit Hash, and Builder Output in the Google Sheets Task Queue
    - ⛔ **Do NOT pick up the next task until all 5 steps are done for the current one.**

## Tech Stack Quick Reference

- **Framework**: Next.js 15 (App Router, Server Components default)
- **UI**: shadcn/ui (Radix primitives) + custom themed components
- **Styling**: Tailwind CSS v4 with CSS variables
- **Animation**: Framer Motion + Motion Primitives library
- **State**: Zustand for client state
- **Forms**: React Hook Form + Zod validation
- **Backend**: Supabase (Postgres, Auth, Realtime, Edge Functions, Storage, Cron)
- **PWA**: Serwist (service worker, offline, push notifications)
- **Hosting**: Vercel
- **Testing**: Vitest + React Testing Library
- **Icons**: Lucide React
- **Fonts**: Playfair Display (display), DM Sans (body), JetBrains Mono (mono)

## File Naming

- Components: `PascalCase.tsx` (e.g., `DailyCheckIn.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Hooks: `use-kebab-case.ts` (e.g., `use-prayer-times.ts`)
- Types: `kebab-case.types.ts` (e.g., `health.types.ts`)
- Pages: `page.tsx` inside route folders (Next.js convention)

## Task Tracker — Google Sheets

The Y2 project uses a Google Sheet as its single source of truth for task tracking. Both the automated orchestrator and manual Claude Code sessions read/write to it.

- **Spreadsheet ID**: `1RmPX9zA0_H2td7XMNqmu0mL9Q9S_W1VbuJ8n-vf06Xs`
- **Auth files**: `orchestrator/client_secret.json` (OAuth client) + `orchestrator/token.json` (cached token)
- **Python connector**: `orchestrator/sheets_connector.py` — use `TaskQueueClient` class for all reads/writes
- **Setup**: `cd orchestrator && pip install gspread google-auth google-auth-oauthlib && python sheets_connector.py` (first run opens browser for OAuth)

### Task Queue Sheet — Column Layout

| Col | Header | Description |
|-----|--------|-------------|
| A | Task ID | e.g. T301, T802 |
| B | Phase | Phase number (1–8) |
| C | Name | Short task name |
| D | Type | component, backend, auth, layout, setup, devops |
| E | Priority | Lower = higher priority |
| F | Parallel Group | Group ID for tasks that can run concurrently |
| G | Dependencies | Comma-separated Task IDs that must complete first |
| H | Status | pending, building, complete, complete_with_issues, failed |
| I | Started At | Timestamp |
| J | Finished At | Timestamp |
| K | Duration (min) | e.g. "8m 23s" |
| L | Builder Output | Last 500 chars of builder stdout |
| M | Auditor Verdict | Structured audit note |
| N | Commit Hash | Git short hash |
| O | Executor | `orchestrator` (automated dev) or `claude-code` (manual CLI) |
| P | V2 Notes | Additional context or notes for the task |
| Q | Files | Key files involved in this task |
| R | Implementation Detail | Technical implementation notes |
| S | Acceptance Criteria | What must be true for the task to be accepted |
| T | Flags | Any flags or tags (e.g. `blocked`, `needs-review`) |

> **Note:** Task Queue has decorative header rows — actual column headers are at **row 4** (not row 1).

### Executor Column

Tasks are assigned to one of two executors:
- **`orchestrator`** — automated overnight builds via `orchestrator.py`. Best for: component development, UI pages, backend migrations, standard code tasks.
- **`claude-code`** — manual CLI sessions (this chat). Best for: infrastructure/CLI tasks, system architecture changes, complex debugging, tasks requiring interactive decisions, bash/shell-heavy work.

The orchestrator automatically skips tasks marked as `claude-code`. When working in this chat, filter for `claude-code` tasks to see what needs manual attention.

### Spreadsheet Tabs

| Tab | Headers Row | Purpose |
|-----|-------------|---------|
| Task Queue | Row 4 | Master task list with status, priority, execution tracking (cols A–T) |
| Validation Log | Row 1 | Per-task: expected behavior, test steps, pass/fail results — see `docs/VALIDATION_SUITE.md` |
| Run Log | Row 3 | Timestamped events from orchestrator and manual runs (Timestamp, Event, Task ID, Details, Duration, Cost Est., Status) |

### Using from Claude Code CLI

```python
# Read tasks
from orchestrator.sheets_connector import TaskQueueClient
tq = TaskQueueClient(run_id="manual")
tasks = tq.get_eligible_tasks(executor="claude-code")  # only manual tasks
all_tasks = tq.get_all_tasks()  # everything

# Update a task
tq.update_task_started("T301")
tq.update_task_result("T301", "complete", duration="12m", commit_hash="abc1234")

# Log an event
tq.log_event("MANUAL_BUILD", "T301", "Built via Claude Code CLI")

# ── Post-task workflow (rule 17) ──
# 1. Run tests locally
# 2. Update Validation Log → Test Result, Tested At, Tested By, Failure Notes
# 3. Iterate until pass
# 4. git commit && git push
# 5. tq.update_task_result(...) → Task Queue status, duration, commit hash
# ⛔ Do NOT start next task until all 5 steps complete
```

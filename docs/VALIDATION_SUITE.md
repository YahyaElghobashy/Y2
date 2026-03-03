# Y2 Validation Requirements & Instructions

> Every task executed by Claude Code on this repo **must** go through a documented validation cycle.
> This ensures nothing ships without tested, logged, and verifiable proof that it works.

---

## The Rule

**Before building any task**, populate the Google Sheets **Validation Log** worksheet with what you expect the task to do, how you'll test it, and where to verify results. **After building**, run the tests, log the outcome. No task is complete until its validation result is recorded.

---

## Validation Log — Google Sheets Worksheet

Create a tab called **"Validation Log"** in the Y2 task tracker spreadsheet (`1RmPX9zA0_H2td7XMNqmu0mL9Q9S_W1VbuJ8n-vf06Xs`).

### Column Schema

| Col | Header | When to Fill | Description |
|-----|--------|-------------|-------------|
| A | **Task ID** | Pre-build | e.g. T301 — must match Task Queue |
| B | **Phase** | Pre-build | 1–8, matches task phase |
| C | **Task Name** | Pre-build | Short name from Task Queue |
| D | **Milestone** | Pre-build | Group ID for batch testing (e.g. "M3-CoYYns") — group 2–4 related tasks |
| E | **Expected Behavior** | Pre-build | Plain language: what should happen when this task's output is exercised |
| F | **Test Type** | Pre-build | One of: `unit` / `integration` / `visual` / `db-migration` / `infra` / `manual` |
| G | **Test Steps** | Pre-build | Numbered, runnable commands or manual check procedures |
| H | **Verification Location** | Pre-build | Exact file paths, npm commands, Supabase Dashboard paths, or URLs to check |
| I | **Pre-Build Status** | Pre-build | Set to `documented` once E–H are filled. Leave `pending` if incomplete. |
| J | **Test Result** | Post-build | `pass` / `fail` / `partial` / `skip` / `untested` |
| K | **Tested At** | Post-build | Timestamp of when tests were actually run |
| L | **Tested By** | Post-build | Who ran it (e.g. `claude-code`, `manual`, `ci`) |
| M | **Failure Notes** | Post-build | Required if result is `fail` or `partial` — what broke, what's missing |
| N | **Linked Test File** | Pre-build | Path to the `__tests__/` file, if one exists or will be created |

---

## Workflow

### Step 1: Pre-Build (before writing any code)

1. Read the task requirements.
2. Open (or create) a row in the Validation Log for this task.
3. Fill columns A–I:
   - **Expected Behavior** (E): Describe what the user/system should see or what state should change. Be specific — not "it works" but "the hook returns `wallet` with `balance >= 0` after mount, and realtime subscription fires on wallet changes."
   - **Test Type** (F): Pick the right type:
     - `unit` — component or hook with Vitest test file
     - `integration` — end-to-end flow across multiple components
     - `visual` — screenshot or manual visual check
     - `db-migration` — SQL/Supabase Dashboard verification
     - `infra` — scripts, config, CLI tools
     - `manual` — requires human interaction (e.g. push notifications on real device)
   - **Test Steps** (G): Write numbered steps anyone can follow. Use exact commands:
     ```
     1) npm test -- src/__tests__/lib/hooks/use-coyyns.test.ts
     2) npm run build — should pass with no errors
     3) Verify realtime subscription in Supabase Dashboard > Realtime Inspector
     ```
   - **Verification Location** (H): Where to look for proof:
     ```
     Test file: src/__tests__/lib/hooks/use-coyyns.test.ts (13 tests)
     Build: npm run build output
     Dashboard: Supabase > Table Editor > coyyns_wallets
     ```
   - **Pre-Build Status** (I): Set to `documented`.
4. **Do not start building until Pre-Build Status = `documented`.**

### Step 2: Build (write the code)

Build the task as normal, following CLAUDE.md rules.

### Step 3: Post-Build (after code is written)

1. Run every test step from column G.
2. Record results in columns J–M:
   - **Test Result** (J): `pass` if all steps succeed, `fail` if any critical step fails, `partial` if some pass and some don't.
   - **Tested At** (K): Current timestamp.
   - **Tested By** (L): Your identifier.
   - **Failure Notes** (M): If not `pass`, describe exactly what failed and why.
3. **A task is not complete until Test Result != `untested`.**

### Step 4: Review

If result is `fail` or `partial`:
- Fix the issues.
- Re-run test steps.
- Update the Test Result and Failure Notes.
- Add a new Tested At timestamp.

---

## Milestone Grouping

Group related tasks into milestones for batch testing. Naming convention: `M{phase}-{ShortName}`.

**Guidelines:**
- 2–4 tasks per milestone
- Tasks in the same milestone should be testable together (shared dependencies)
- DB migration + its hook = same milestone
- UI component + its page integration = same milestone

**Examples:**
- `M3-CoYYns-Data` → T302 (useCoyyns hook), T305 (AddCoyynsForm), T306 (SpendCoyynsForm)
- `M4-Push` → T401 (DB migration), T402 (hook + service), T403 (Edge Function)
- `M2-Auth-Flow` → T203 (Login), T204 (AuthProvider), T205 (Middleware)

When batch testing a milestone, run all test commands together:
```bash
# Example: M3-CoYYns-Data
npm test -- src/__tests__/lib/hooks/use-coyyns.test.ts src/__tests__/components/relationship/AddCoyynsForm.test.tsx src/__tests__/components/relationship/SpendCoyynsForm.test.tsx
```

---

## Test Type Reference

| Type | How to Test | Where to Verify |
|------|-------------|-----------------|
| **unit** | `npm test -- path/to/test.tsx` | Test file output (X tests passing) |
| **integration** | `npm run build` + `npm run dev` + manual flow | Browser at localhost:3000 |
| **visual** | `npm run screenshot` or manual browser check | `/tmp/y2-audit-home.png` or browser |
| **db-migration** | Supabase Dashboard or SQL queries | Supabase > SQL Editor / Table Editor |
| **infra** | Run the script/tool directly | Script output, config files |
| **manual** | Follow documented steps on real device | Device behavior, console logs |

---

## Writing Good Expected Behavior

**Bad**: "The component works."
**Good**: "CoyynsWidget renders a compact card showing the user's CoYYns balance via CoyynsBadge, the 3 most recent transactions with +/- prefix and comma-formatted amounts, and a 'See all' link to /us. Shows loading skeleton when isLoading=true. Shows empty state when transactions=[]."

**Bad**: "Database is set up."
**Good**: "Migration creates coyyns_wallets table with 7 columns and CHECK(balance >= 0), coyyns_transactions table with 8 columns (immutable — no UPDATE/DELETE policies), and a handle_coyyn_transaction trigger that validates type/amount sign and updates wallet balance atomically."

---

## Writing Good Test Steps

Always include:
1. **The exact command** to run (copy-pasteable)
2. **What success looks like** (e.g. "13 tests passing", "build exits 0", "table has 2 rows")
3. **What failure looks like** if relevant (e.g. "if RLS blocks the query, result is empty")

```
Example for a hook task:
1) npm test -- src/__tests__/lib/hooks/use-coyyns.test.ts
   → Expected: 13 tests passing, 0 failures
2) npm run build
   → Expected: exit code 0, no TypeScript errors
3) Check types: grep "coyyns_wallets" src/lib/types/database.types.ts
   → Expected: table type definition present
```

---

## Template for New Tasks

Copy into the Validation Log sheet before building:

| Field | Value |
|-------|-------|
| Task ID | T___ |
| Phase | _ |
| Task Name | ___ |
| Milestone | M_-___ |
| Expected Behavior | [what should happen — be specific] |
| Test Type | unit / integration / visual / db-migration / infra / manual |
| Test Steps | 1) ___ 2) ___ 3) ___ |
| Verification Location | [file paths, commands, URLs] |
| Pre-Build Status | documented |
| Test Result | untested |
| Tested At | |
| Tested By | |
| Failure Notes | |
| Linked Test File | [path or "N/A"] |

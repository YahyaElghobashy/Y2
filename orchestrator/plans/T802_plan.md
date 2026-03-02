# T802: Integrate Visual Audit into Orchestrator — Build Plan

## Files to Modify

| File | Action | Description |
|---|---|---|
| `orchestrator/orchestrator.py` | Modify | All 6 changes (imports, DEFAULTS, schema, prompt, floors, audit note, cleanup) |
| `docs/COMPONENT_REGISTRY.md` | Modify | No new components — this is a Python-only task |
| `docs/TASK_LOG.md` | Modify | Add T802 entry |

## Changes to `orchestrator/orchestrator.py`

### 1. Add `import glob` (top of file, line ~23-32)
- Add `import glob` alongside existing stdlib imports

### 2. Update `DEFAULTS` (lines 40-54)
- `auditor_max_turns`: 60 → 30
- `max_audit_minutes`: 30 → 35
- Append `Bash(npm run screenshot:*)` to `auditor_tools` string

### 3. Update `AUDIT_JSON_SCHEMA` (lines 56-68)
- Add `"visual_pass": {"type": "boolean"}` to properties
- Add `"visual_pass"` to required array

### 4. Add STEP 6 to `build_audit_prompt()` (after line 347)
- Append visual check step after existing STEP 5
- References `npm run screenshot`, Read tool for PNG viewing
- Advisory only — screenshot failures don't block approval

### 5. Update `CONFIG_FLOORS` (line 761)
- `"max_audit_minutes": 3` → `"max_audit_minutes": 5`

### 6. Update structured audit note (lines 950-959)
- Extract `visual_ok = verdict.get("visual_pass", True)`
- Add `visual:{'yes' if visual_ok else 'NO'}` to header pipe-delimited format

### 7. Add screenshot cleanup (after line ~985)
- After task completion logging, clean up `/tmp/y2-audit-*.png` using `glob.glob()`
- Silently ignore `OSError` on removal failures

## Dependencies
- T801 must exist (screenshot.mjs + visual-audit.sh) — already completed ✅
- Uses `glob` stdlib module (no new packages)
- No new components created — purely Python orchestrator changes

## Design Tokens
- N/A — this is a Python infrastructure task, no UI

## Test Cases
1. `python -c "import orchestrator"` — no syntax errors
2. `AUDIT_JSON_SCHEMA` includes `visual_pass` as required boolean
3. `DEFAULTS["auditor_max_turns"]` == 30
4. `DEFAULTS["max_audit_minutes"]` == 35
5. `auditor_tools` contains `Bash(npm run screenshot:*)`
6. `build_audit_prompt()` output contains "STEP 6" and "visual"
7. `CONFIG_FLOORS["max_audit_minutes"]` == 5

## Potential Issues
- The `glob` import is stdlib, zero risk of missing dependency
- Visual check is strictly advisory — `visual_pass` defaults to `True` on failure
- Cleanup uses try/except to handle race conditions on file deletion
- No breaking changes to existing audit flow — STEP 6 is additive only

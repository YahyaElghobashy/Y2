# T801: Visual Audit Infrastructure — Build Plan

## Overview
Create screenshot infrastructure for automated visual auditing of UI components using Puppeteer (via npx, not installed as dependency).

## Files to Create

| File | Purpose |
|---|---|
| `scripts/screenshot.mjs` | Node.js script — Puppeteer headless screenshot capture |
| `scripts/visual-audit.sh` | Bash wrapper — build, start server, screenshot, cleanup |
| `scripts/__tests__/screenshot.test.mjs` | Tests for script validity and executability |

## Files to Modify

| File | Change |
|---|---|
| `package.json` | Add `screenshot` and `screenshot:route` scripts |
| `docs/COMPONENT_REGISTRY.md` | Add scripts section for T801 |
| `docs/TASK_LOG.md` | Add T801 entry |

## Dependencies on Existing Components
- **T107 AppShell** — provides a renderable page at `/` for screenshots
- **T108 Home Dashboard** — provides actual content to screenshot
- No component imports needed — these are standalone scripts

## Design Tokens Referenced
- None — these are infrastructure scripts, not UI components

## Implementation Details

### `scripts/screenshot.mjs`
- Dynamic `import('puppeteer')` (relies on npx cache, not package.json)
- CLI args: `url` (argv[2], default `http://localhost:3000`), `output` (argv[3], default `/tmp/y2-audit-home.png`)
- Viewport: 375×812 (iPhone, mobile-first per CLAUDE.md)
- `waitUntil: 'networkidle0'` for full render
- Full-page screenshot
- Print output path to stdout
- Exit non-zero on any failure (no complex error handling)

### `scripts/visual-audit.sh`
- Args: `$1` = route (default `/`), `$2` = output path (default `/tmp/y2-audit-home.png`)
- Steps:
  1. Build if `.next/` doesn't exist or is stale → `npm run build`
  2. Start `npx next start -p 3099` in background, capture PID
  3. Retry loop: poll `localhost:3099` up to 15s
  4. Call `node scripts/screenshot.mjs http://localhost:3099${ROUTE} ${OUTPUT}`
  5. Kill server PID
  6. Echo output path
- Must be `chmod +x`

### `package.json` additions
```json
"screenshot": "bash scripts/visual-audit.sh",
"screenshot:route": "bash scripts/visual-audit.sh"
```

## Test Cases

### `scripts/__tests__/screenshot.test.mjs`
1. `visual-audit.sh` is executable (has +x permission)
2. `screenshot.mjs` has no syntax errors (can be parsed by Node.js)
3. `screenshot.mjs` file exists and is non-empty
4. `visual-audit.sh` file exists and is non-empty
5. `package.json` contains `screenshot` script entry

## Potential Issues / Edge Cases
- Puppeteer not cached yet → first run will auto-download (~170MB), may take time
- Port 3099 already in use → script will fail (acceptable, no complex error handling per spec)
- No display server on CI → headless mode handles this (Puppeteer defaults to headless)
- `.next/` build cache may be stale → script checks and rebuilds
- macOS may need `--no-sandbox` flag for Puppeteer in some environments

## Constraints Checklist
- [ ] Do NOT add puppeteer to package.json
- [ ] Screenshots go to /tmp/ only
- [ ] Uses `next start` not `next dev`
- [ ] Routes are parameterized, not hardcoded
- [ ] Exit non-zero on failure, no complex error handling

#!/usr/bin/env python3
"""
Y2 Overnight Orchestrator
=========================

Spawns Claude Code instances in headless mode to build the Y2 PWA overnight.
Each task gets a builder (creates code) and an auditor (reviews it).
Everything is committed to Git, logged to Google Sheets, and backed up locally.

Usage:
  python orchestrator.py                    # Run with tasks from Google Sheets
  python orchestrator.py --dry-run          # Preview what would run, don't execute
  python orchestrator.py --task T003        # Run a single specific task
  python orchestrator.py --resume           # Resume from last incomplete task

Requirements:
  - Claude Code CLI installed and authenticated (`claude` command available)
  - Google Sheets authenticated (run sheets_connector.py first)
  - Git repo configured with push access
  - Node.js 18+ and npm available
"""

import subprocess
import json
import sys
import os
import time
import signal
import threading
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from sheets_connector import TaskQueueClient

# ─── CONFIGURATION ───────────────────────────────────────────
# These are defaults. The orchestrator also reads from Google Sheets Config tab.
# Sheet values override these if available.

DEFAULTS = {
    "max_concurrent_builders": 3,
    "max_task_minutes": 15,
    "max_audit_minutes": 10,
    "breather_seconds": 30,
    "max_total_runtime_hours": 6,
    "max_consecutive_failures": 5,
    "builder_max_turns": 30,
    "auditor_max_turns": 50,
    "auto_push": True,
    "run_build_check": True,
    "run_tests": True,
    "allowed_tools": "Read,Write,Edit,Bash(npm:*),Bash(npx:*),Bash(git:*),Bash(mkdir:*),Bash(ls:*),Bash(cat:*)",
    "auditor_tools": "Read,Bash(npm run build),Bash(npm test),Bash(npx:*),Bash(ls:*),Bash(cat:*)",
}


# ─── HELPERS ──────────────────────────────────────────────────

def now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def duration_str(start: datetime, end: datetime) -> str:
    delta = end - start
    total_secs = int(delta.total_seconds())
    if total_secs < 60:
        return f"{total_secs}s"
    mins = total_secs // 60
    secs = total_secs % 60
    return f"{mins}m {secs}s"


def get_git_short_hash(repo_path: str) -> str:
    """Get the current HEAD short hash."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=repo_path, capture_output=True, text=True, timeout=10
        )
        return result.stdout.strip()
    except Exception:
        return "unknown"

# ─── LIVE CLI DISPLAY ─────────────────────────────────────────

class Spinner:
    """
    Animated spinner with elapsed time, shown while Claude Code runs.
    Usage:
        with Spinner("Building T101", task_id="T101"):
            subprocess.run(...)
    """
    FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

    def __init__(self, message: str, task_id: str = ""):
        self.message = message
        self.task_id = task_id
        self._stop = threading.Event()
        self._thread = None
        self._start_time = None
        self._lines_seen = 0

    def _spin(self):
        idx = 0
        while not self._stop.is_set():
            elapsed = int(time.time() - self._start_time)
            mins, secs = divmod(elapsed, 60)
            time_str = f"{mins}m {secs:02d}s" if mins else f"{secs}s"
            frame = self.FRAMES[idx % len(self.FRAMES)]
            status = f"\r  {frame} {self.message} [{time_str}]"
            if self._lines_seen > 0:
                status += f" ({self._lines_seen} actions)"
            # Pad to overwrite previous line
            sys.stdout.write(f"{status:<80}")
            sys.stdout.flush()
            idx += 1
            self._stop.wait(0.12)

    def update_count(self, count: int):
        self._lines_seen = count

    def start(self):
        self._start_time = time.time()
        self._thread = threading.Thread(target=self._spin, daemon=True)
        self._thread.start()

    def stop(self, final_message: str = ""):
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=1)
        # Clear the spinner line
        sys.stdout.write(f"\r{' ' * 80}\r")
        sys.stdout.flush()
        if final_message:
            print(final_message)

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, *args):
        self.stop()


class BuildLogger:
    """
    Captures Claude Code output and extracts meaningful actions for display.
    Parses the streaming output to count tool calls, file writes, etc.
    """

    def __init__(self):
        self.actions = []
        self.files_touched = []
        self.errors = []
        self.total_lines = 0

    def parse_line(self, line: str):
        """Extract meaningful events from a line of Claude Code output."""
        self.total_lines += 1
        lower = line.lower().strip()
        if not lower:
            return

        # Detect file operations
        if any(kw in lower for kw in ["creating file", "wrote to", "created:", "writing"]):
            # Try to extract filename
            for token in line.split():
                if "/" in token and ("src/" in token or "components/" in token or ".tsx" in token or ".ts" in token):
                    clean = token.strip("'\"`,.")
                    if clean not in self.files_touched:
                        self.files_touched.append(clean)
                        self.actions.append(f"📝 {clean}")
                    break
            else:
                self.actions.append(f"📝 {line.strip()[:60]}")

        elif any(kw in lower for kw in ["npm run build", "running build", "next build"]):
            self.actions.append("🔨 Running build...")

        elif any(kw in lower for kw in ["npm test", "running test", "jest"]):
            self.actions.append("🧪 Running tests...")

        elif any(kw in lower for kw in ["error", "failed", "err!"]):
            self.errors.append(line.strip()[:100])

        elif any(kw in lower for kw in ["installing", "npm install", "added"]):
            self.actions.append(f"📦 {line.strip()[:60]}")

        elif "read" in lower and ("claude.md" in lower or "design_system" in lower or "coding_standards" in lower):
            self.actions.append(f"📖 Reading docs...")

        elif "plan" in lower and ("writing" in lower or "creating" in lower):
            self.actions.append(f"📋 Writing build plan...")

    def summary(self) -> str:
        """One-line summary of what happened."""
        parts = []
        if self.files_touched:
            parts.append(f"{len(self.files_touched)} files")
        if self.errors:
            parts.append(f"{len(self.errors)} errors")
        parts.append(f"{len(self.actions)} actions")
        return ", ".join(parts)    

def get_changed_files_count(repo_path: str) -> int:
    """Count files changed since last commit."""
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", "HEAD~1"],
            cwd=repo_path, capture_output=True, text=True, timeout=10
        )
        return len([f for f in result.stdout.strip().split("\n") if f])
    except Exception:
        return 0


# ─── PROMPT BUILDER ───────────────────────────────────────────

def load_project_context(repo_path: str) -> str:
    """Load PROJECT_CONTEXT.md if it exists. This is the soul of the project."""
    context_file = Path(repo_path) / "PROJECT_CONTEXT.md"
    if context_file.exists():
        return context_file.read_text()
    return ""

def load_claude_instructions(repo_path: str) -> str:
    """Load CLAUDE.md if it exists. This is the instructions for the builder."""
    instructions_file = Path(repo_path) / "CLAUDE.md"
    if instructions_file.exists():
        return instructions_file.read_text()
    return ""

def load_task_prompt(task_id: str, repo_path: str) -> str:
    """Load the task-specific prompt from orchestrator/prompts/{task_id}.md."""
    prompt_file = Path(repo_path) / "orchestrator" / "prompts" / f"{task_id}.md"
    if prompt_file.exists():
        return prompt_file.read_text()
    return ""

def load_post_completion_checklist(repo_path: str) -> str:
    """Load the post-completion checklist from orchestrator/post_completion_checklist.md."""
    checklist_file = Path(repo_path) / "orchestrator" / "post_completion_checklist.md"
    if checklist_file.exists():
        return checklist_file.read_text()
    return ""
    
def build_task_prompt(task: dict, repo_path: str) -> str:
    """
    Construct the full prompt for a Claude Code builder.
    Forces a plan-first approach: Claude writes a plan, then executes it.

    Every prompt includes:
    1. PROJECT_CONTEXT.md — the full project vision (loaded once, always present). project_context = load_project_context(repo_path)

    2. Instructions to read CLAUDE.md and supporting docs
    3. The task-specific prompt (from orchestrator/prompts/{task_id}.md)
    4. Post-completion checklist

    """
    task_id = task["Task ID"]
    task_name = task["Name"]
    task_type = task.get("Type", "")

    # Check for a dedicated prompt file
    prompt_file = Path(repo_path) / "orchestrator" / "prompts" / f"{task_id}.md"
    if prompt_file.exists():
        custom_prompt = prompt_file.read_text()
    else:
        custom_prompt = f"""Task: {task_name}
Type: {task_type}
Expected output files: {task.get("Expected Files", "see CLAUDE.md for patterns")}
Test requirements: {task.get("Test Requirements", "component renders, key interactions work")}
"""

    return f"""You are building task {task_id} for the Y2 project.

## PHASE 1: PLAN (do this first, before writing any code)

1. Read CLAUDE.md at the project root. Follow every doc pointer it gives you.
2. Read docs/COMPONENT_REGISTRY.md to see what already exists.
3. Read the task requirements below carefully.
4. Write your build plan to `orchestrator/plans/{task_id}_plan.md` with:
   - Files you will create or modify (exact paths)
   - Dependencies on existing components (imports you'll use)
   - Design tokens you'll reference (colors, radii, animations)
   - Test cases you'll write
   - Potential issues or edge cases
5. Do NOT write any component code until the plan file is saved.

## PHASE 2: BUILD (execute your plan)

6. Create each file one at a time, following your plan.
7. After each file, verify there are no TypeScript errors.
8. Write tests for every component.
9. Run `npm run build` — fix any errors until it passes.
10. Update docs/COMPONENT_REGISTRY.md with any new components.

## PHASE 3: VERIFY

11. Run `npm run build` one final time to confirm zero errors.
12. Do NOT commit — the orchestrator handles git.

## Task Details

{custom_prompt}
"""


def build_audit_prompt(task: dict) -> str:
    """Construct the prompt for the auditor that reviews completed work."""
    task_id = task["Task ID"]
    task_name = task["Name"]
    task_phase = task.get("Phase", "")

    return f"""You are auditing task {task_id} ({task_phase}): {task_name}

Read CLAUDE.md and docs/DESIGN_SYSTEM.md first, then review all recently changed/created files.

AUDIT CHECKLIST:

1. CODE QUALITY
   - Does the code follow docs/CODING_STANDARDS.md?
   - Are TypeScript types correct and specific (no `any`)?
   - Is the code clean, readable, and well-structured?
   - Are imports ordered correctly (React → third-party → internal)?

2. DESIGN SYSTEM COMPLIANCE
   - Does it follow docs/DESIGN_SYSTEM.md exactly?
   - All colors from theme tokens (no hardcoded hex values)?
   - Animations use ease-out deceleration (no bounce, no spring)?
   - Border radii correct (12px cards, 8px buttons, 6px inputs)?
   - Typography correct (Playfair Display for headings, DM Sans for body)?
   - Spacing generous (p-6 not p-4 for cards)?

3. BUILD & TESTS
   - Run: `npm run build` — does it pass with zero errors?
   - Run: `npm test` — do tests pass? (if test runner is configured)
   - Are there TypeScript compilation errors?

4. COMPLETENESS
   - Were all files specified in the task created?
   - Were test files created?
   - Was docs/COMPONENT_REGISTRY.md updated with new components?

5. UX ASSESSMENT
   - Does this feel like it belongs in the Warm Mineral design language?
   - Would this feel warm and intentional to the end user?
   - Are empty states friendly, not generic?

RESPOND WITH EXACTLY THIS JSON FORMAT (no other text, no markdown fences):
{{
  "approved": true or false,
  "build_passes": true or false,
  "tests_pass": true or false,
  "files_created": ["list of new/modified files"],
  "components_built": ["list of component names built"],
  "issues": ["list of specific issues found — empty array if none"],
  "design_compliance": "full/partial/none — how well it follows the design system",
  "summary": "2-3 sentence assessment: what was built, how well, and any concerns"
}}
"""



# ─── CLAUDE CODE RUNNER ───────────────────────────────────────

def run_claude_code(prompt: str, repo_path: str, timeout_minutes: int,
                    max_turns: int, allowed_tools: str,
                    label: str = "") -> dict:
    """
    Run Claude Code in headless mode with live spinner and action logging.

    Returns:
        {
            "status": "complete" | "timeout" | "error",
            "stdout": str,
            "stderr": str,
            "duration_seconds": int,
            "exit_code": int | None,
            "logger": BuildLogger,
        }
    """
    cmd = [
        "claude",
        "-p", prompt,
        "--allowedTools", allowed_tools,
        "--max-turns", str(max_turns),
        "--output-format", "text",
    ]

    prefix = f"{label}" if label else "Claude Code"
    spinner = Spinner(prefix, task_id=label)
    logger = BuildLogger()
    start = datetime.now()

    try:
        # Use Popen for streaming output
        process = subprocess.Popen(
            cmd,
            cwd=repo_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env={**os.environ, "CLAUDE_CODE_HEADLESS": "1"},
        )

        spinner.start()
        stdout_lines = []
        stderr_lines = []

        # Read stdout in a thread so we can also monitor timeout
        def read_stream(stream, line_list, parse=False):
            for line in stream:
                line_list.append(line)
                if parse:
                    logger.parse_line(line)
                    spinner.update_count(len(logger.actions))

        stdout_thread = threading.Thread(
            target=read_stream, args=(process.stdout, stdout_lines, True), daemon=True
        )
        stderr_thread = threading.Thread(
            target=read_stream, args=(process.stderr, stderr_lines, False), daemon=True
        )
        stdout_thread.start()
        stderr_thread.start()

        # Wait with timeout
        try:
            process.wait(timeout=timeout_minutes * 60)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)
            end = datetime.now()
            secs = int((end - start).total_seconds())
            spinner.stop(f"  ⏰ {prefix} TIMEOUT after {timeout_minutes}m ({len(logger.actions)} actions)")
            if logger.actions:
                print(f"     Last actions:")
                for a in logger.actions[-3:]:
                    print(f"       {a}")
            return {
                "status": "timeout",
                "stdout": "".join(stdout_lines),
                "stderr": f"Process killed after {timeout_minutes} minute timeout",
                "duration_seconds": secs,
                "exit_code": None,
                "logger": logger,
            }

        # Process finished
        stdout_thread.join(timeout=2)
        stderr_thread.join(timeout=2)
        end = datetime.now()
        secs = int((end - start).total_seconds())
        dur = duration_str(start, end)
        stdout_full = "".join(stdout_lines)
        stderr_full = "".join(stderr_lines)

        if process.returncode == 0:
            spinner.stop(f"  ✅ {prefix} completed in {dur} — {logger.summary()}")
            if logger.files_touched:
                print(f"     Files: {', '.join(logger.files_touched[:8])}")
                if len(logger.files_touched) > 8:
                    print(f"     ... and {len(logger.files_touched) - 8} more")
            return {
                "status": "complete",
                "stdout": stdout_full,
                "stderr": stderr_full,
                "duration_seconds": secs,
                "exit_code": 0,
                "logger": logger,
            }
        else:
            spinner.stop(f"  ⚠️  {prefix} exited with code {process.returncode} in {dur}")
            if logger.errors:
                print(f"     Errors:")
                for e in logger.errors[-3:]:
                    print(f"       ❌ {e}")
            return {
                "status": "error",
                "stdout": stdout_full,
                "stderr": stderr_full,
                "duration_seconds": secs,
                "exit_code": process.returncode,
                "logger": logger,
            }

    except FileNotFoundError:
        spinner.stop(f"  ❌ 'claude' command not found. Is Claude Code CLI installed?")
        return {
            "status": "error",
            "stdout": "",
            "stderr": "claude CLI not found",
            "duration_seconds": 0,
            "exit_code": None,
            "logger": logger,
        }

    except Exception as e:
        end = datetime.now()
        secs = int((end - start).total_seconds())
        spinner.stop(f"  ❌ {prefix} unexpected error: {e}")
        return {
            "status": "error",
            "stdout": "",
            "stderr": str(e),
            "duration_seconds": secs,
            "exit_code": None,
            "logger": logger,
        }
# ─── GIT OPERATIONS ──────────────────────────────────────────

# ─── GIT OPERATIONS ──────────────────────────────────────────

def git_commit_and_push(repo_path: str, task: dict, auto_push: bool,
                        verdict: dict = None) -> str | None:
    """Stage all changes, commit with descriptive message, optionally push.
    
    The commit message includes: what was built, which files were created,
    which components are now available, and any auditor notes.
    """
    task_id = task["Task ID"]
    task_name = task["Name"]
    task_type = task.get("Type", "feat")
    task_phase = task.get("Phase", "")

    # Map task types to conventional commit prefixes
    prefix_map = {
        "setup": "chore",
        "design": "style",
        "design-system": "style",
        "component": "feat",
        "layout": "feat",
        "backend": "feat",
        "auth": "feat",
        "devops": "ci",
    }
    prefix = prefix_map.get(task_type, "feat")
    
    # Build a rich commit message
    subject = f"{prefix}({task_id.lower()}): {task_name}"
    
    body_lines = [
        f"Phase: {task_phase}",
        f"Task: {task_id} — {task_name}",
        f"Type: {task_type}",
        "",
    ]
    
    if verdict:
        files = verdict.get("files_created", [])
        components = verdict.get("components_built", [])
        summary = verdict.get("summary", "")
        design = verdict.get("design_compliance", "")
        
        if summary:
            body_lines.append(f"What was built: {summary}")
            body_lines.append("")
        if files:
            body_lines.append("Files created/modified:")
            for f in files[:15]:  # cap at 15 to avoid huge commits
                body_lines.append(f"  - {f}")
            body_lines.append("")
        if components:
            body_lines.append("Components now available:")
            for c in components:
                body_lines.append(f"  - {c}")
            body_lines.append("")
        if design:
            body_lines.append(f"Design system compliance: {design}")
    
    body_lines.append("")
    body_lines.append(f"Built by: Y2 Orchestrator (automated)")
    
    full_message = subject + "\n\n" + "\n".join(body_lines)

    try:
        # Check if there are changes to commit
        status = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=repo_path, capture_output=True, text=True, timeout=10
        )
        if not status.stdout.strip():
            print(f"  📭 No changes to commit for {task_id}")
            return None

        # Stage everything
        subprocess.run(["git", "add", "-A"], cwd=repo_path, timeout=10, check=True)

        # Commit
        subprocess.run(
            ["git", "commit", "-m", full_message],
            cwd=repo_path, timeout=30, check=True,
            capture_output=True, text=True,
        )
        commit_hash = get_git_short_hash(repo_path)
        print(f"  📦 Committed: {subject} ({commit_hash})")
        # Push
        if auto_push:
            push_result = subprocess.run(
                ["git", "push"],
                cwd=repo_path, timeout=60,
                capture_output=True, text=True,
            )
            if push_result.returncode == 0:
                print(f"  🚀 Pushed to remote")
            else:
                print(f"  ⚠️  Push failed: {push_result.stderr[:200]}")

        return commit_hash

    except subprocess.CalledProcessError as e:
        print(f"  ❌ Git error: {e}")
        return None
    except Exception as e:
        print(f"  ❌ Git unexpected error: {e}")
        return None


def git_stash_if_dirty(repo_path: str) -> bool:
    """Stash uncommitted changes before audit. Returns True if stashed."""
    try:
        status = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=repo_path, capture_output=True, text=True, timeout=10
        )
        if status.stdout.strip():
            subprocess.run(
                ["git", "stash", "push", "-m", "orchestrator-pre-audit"],
                cwd=repo_path, timeout=10, check=True,
            )
            return True
    except Exception:
        pass
    return False


# ─── PARSE AUDIT RESPONSE ────────────────────────────────────

def parse_audit_response(stdout: str) -> dict:
    """
    Extract the JSON verdict from the auditor's output.
    The auditor is instructed to output only JSON, but Claude sometimes
    wraps it in markdown or adds commentary. This handles all cases.
    """
    # Try direct JSON parse first
    text = stdout.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to find JSON in the output (between { and })
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass

    # Try to find JSON in markdown code block
    for marker in ["```json", "```"]:
        if marker in text:
            block_start = text.index(marker) + len(marker)
            block_end = text.index("```", block_start) if "```" in text[block_start:] else len(text)
            try:
                return json.loads(text[block_start:block_end].strip())
            except (json.JSONDecodeError, ValueError):
                pass

    # Give up — treat as failure with the raw output as context
    print(f"  ⚠️  Could not parse audit JSON. Raw output (first 300 chars):")
    print(f"      {text[:300]}")
    return {
        "approved": False,
        "build_passes": False,
        "tests_pass": False,
        "issues": ["Auditor output was not valid JSON — manual review needed"],
        "summary": text[:200],
    }


# ─── MAIN ORCHESTRATOR ───────────────────────────────────────

class Orchestrator:
    """
    The overnight build manager.

    Reads tasks from Google Sheets, spawns Claude Code builders in sequence
    (with limited parallelism for independent tasks), audits results,
    commits to git, and tracks everything.
    """

    def __init__(self, repo_path: str, dry_run: bool = False, single_task: str = None):
        self.repo_path = os.path.abspath(repo_path)
        self.dry_run = dry_run
        self.single_task = single_task
        self.start_time = datetime.now()
        self.run_id = self.start_time.strftime("%Y-%m-%d_%H%M")

        # Stats
        self.completed = []
        self.failed = []
        self.skipped = []
        self.total_commits = 0
        self.consecutive_failures = 0

        # Connect to sheets
        print()
        print("=" * 60)
        print(f"  Y2 OVERNIGHT ORCHESTRATOR")
        print(f"  Run ID: {self.run_id}")
        print(f"  Repo:   {self.repo_path}")
        print(f"  Mode:   {'DRY RUN' if dry_run else 'LIVE'}")
        if single_task:
            print(f"  Task:   {single_task} only")
        print("=" * 60)
        print()

        self.tq = TaskQueueClient(run_id=self.run_id)

        # Load config (sheets override defaults)
        self.config = {**DEFAULTS}
        if self.tq.is_online:
            try:
                sheet_config = self.tq.get_config()
                self.config.update(sheet_config)
                print(f"📋 Config loaded ({len(sheet_config)} settings from sheet)")
            except Exception as e:
                print(f"⚠️  Could not read config from sheet ({e}), using defaults")
        else:
            print("📋 Using default config (sheets offline)")

        print(f"   Max concurrent: {self.config['max_concurrent_builders']}")
        print(f"   Task timeout:   {self.config['max_task_minutes']}m")
        print(f"   Run timeout:    {self.config['max_total_runtime_hours']}h")
        print(f"   Max failures:   {self.config['max_consecutive_failures']}")
        print()

    def is_safe_to_continue(self) -> bool:
        """Check all guardrails. Returns False if we should stop."""
        # Time limit
        elapsed = datetime.now() - self.start_time
        max_hours = self.config["max_total_runtime_hours"]
        if elapsed > timedelta(hours=max_hours):
            print(f"\n⏰ TOTAL RUNTIME LIMIT ({max_hours}h) REACHED. Stopping.")
            return False

        # Consecutive failure limit
        max_fails = self.config["max_consecutive_failures"]
        if self.consecutive_failures >= max_fails:
            print(f"\n🛑 {max_fails} CONSECUTIVE FAILURES. Something systemic is wrong. Stopping.")
            return False

        return True

    def process_task(self, task: dict):
        """Full pipeline for one task: build → verify → commit → audit (non-blocking)."""
        task_id = str(task["Task ID"]).strip()
        task_name = task["Name"]
        print(f"\n{'─' * 60}")
        print(f"  TASK {task_id}: {task_name}")
        print(f"{'─' * 60}")

        if self.dry_run:
            print(f"  [DRY RUN] Would build: {task_name}")
            print(f"  [DRY RUN] Prompt file: orchestrator/prompts/{task_id}.md")
            return

        task_start = datetime.now()

        # ── 0. Snapshot current state so we can do surgical reverts ──
        try:
            snapshot = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=self.repo_path, capture_output=True, text=True, timeout=10
            )
            pre_build_clean = not snapshot.stdout.strip()
        except Exception:
            pre_build_clean = True

        # ── 1. Mark as building ──
        self.tq.update_task_started(task_id)
        self.tq.log_event("TASK_START", task_id, f"Builder spawned: {task_name}", "—", "—", "🔨")

        # ── 2. Run builder ──
        prompt = build_task_prompt(task, self.repo_path)
        builder_result = run_claude_code(
            prompt=prompt,
            repo_path=self.repo_path,
            timeout_minutes=self.config["max_task_minutes"],
            max_turns=self.config["builder_max_turns"],
            allowed_tools=self.config["allowed_tools"],
            label=f"BUILD {task_id}",
        )

        builder_duration = duration_str(task_start, datetime.now())

        if builder_result["status"] != "complete":
            # Builder failed — surgical revert only files this task touched
            self.tq.update_task_result(
                task_id, "failed",
                duration=builder_duration,
                builder_output=f"Builder {builder_result['status']}: {builder_result['stderr'][:300]}",
            )
            self.tq.log_event(
                "TASK_FAILED", task_id,
                f"Builder {builder_result['status']} after {builder_duration}",
                builder_duration, "—", "❌"
            )
            self.failed.append(task_id)
            self.consecutive_failures += 1
            self._surgical_revert(task_id)
            return

        # ── 3. Verify build passes ──
        print(f"\n  🔨 Verifying build...")
        try:
            build_check = subprocess.run(
                ["npm", "run", "build"],
                cwd=self.repo_path,
                capture_output=True, text=True, timeout=120,
            )
        except subprocess.TimeoutExpired:
            build_check = type('obj', (object,), {'returncode': 1, 'stderr': 'Build timed out after 2min'})()

        if build_check.returncode != 0:
            # Build failed — surgical revert
            print(f"  ❌ Build failed:")
            stderr_tail = build_check.stderr[-400:] if build_check.stderr else "unknown error"
            print(f"     {stderr_tail}")
            self.tq.update_task_result(
                task_id, "failed",
                duration=builder_duration,
                builder_output=f"Build failed: {stderr_tail}",
            )
            self.tq.log_event(
                "BUILD_FAIL", task_id,
                f"npm run build failed after {builder_duration}",
                builder_duration, "—", "❌"
            )
            self.failed.append(task_id)
            self.consecutive_failures += 1
            self._surgical_revert(task_id)
            return

        print(f"  ✅ Build passes")

        # ── 4. Commit (before audit — work is preserved no matter what) ──
        commit_hash = git_commit_and_push(
            self.repo_path, task, self.config.get("auto_push", True)
        )
        if commit_hash:
            self.total_commits += 1
        else:
            commit_hash = "no-changes"

        # ── 5. Run auditor (non-blocking — issues are logged, not reverted) ──
        print(f"\n  🔍 Auditing {task_id} (non-blocking)...")
        self.tq.log_event("AUDIT_START", task_id, "Auditor spawned (non-blocking)", "—", "—", "🔍")

        audit_prompt = build_audit_prompt(task)
        audit_result = run_claude_code(
            prompt=audit_prompt,
            repo_path=self.repo_path,
            timeout_minutes=self.config["max_audit_minutes"],
            max_turns=self.config["auditor_max_turns"],
            allowed_tools=self.config["auditor_tools"],
            label=f"AUDIT {task_id}",
        )

        if audit_result["status"] == "complete":
            verdict = parse_audit_response(audit_result["stdout"])
        else:
            verdict = {
                "approved": True,
                "issues": [f"Auditor {audit_result['status']} — manual review recommended"],
                "summary": f"Auditor did not complete ({audit_result['status']})",
            }

        total_duration = duration_str(task_start, datetime.now())

        # ── 6. Log results (commit already happened — audit is informational) ──
        issues_list = verdict.get("issues", [])
        verdict_summary = verdict.get("summary", "No summary")
        approved = verdict.get("approved", True)

        if not approved:
            issues_str = "; ".join(issues_list)
            status = "complete_with_issues"
            audit_note = f"AUDIT CONCERNS (not reverted): {issues_str}"
            print(f"  ⚠️  Auditor flagged issues (commit preserved):")
            for issue in issues_list[:5]:
                print(f"     • {issue}")
        else:
            status = "complete"
            audit_note = f"Approved: {verdict_summary}"
            if issues_list:
                audit_note += f" (notes: {'; '.join(issues_list)})"

        self.tq.update_task_result(
            task_id, status,
            duration=total_duration,
            builder_output=builder_result["stdout"][-500:] if builder_result["stdout"] else f"Built in {builder_duration}",
            auditor_verdict=audit_note[:500],
            commit_hash=commit_hash or "",
        )
        self.tq.log_event(
            "TASK_COMPLETE", task_id,
            f"{status}: {verdict_summary[:200]}",
            total_duration, "—", "✅" if approved else "⚠️"
        )
        self.completed.append(task_id)
        self.consecutive_failures = 0
        print(f"\n  ✅ {task_id} COMPLETE ({total_duration})")

    def _surgical_revert(self, task_id: str):
        """Revert only files changed by this task — never nuke the whole repo."""
        try:
            # Get list of modified/untracked files
            status = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=self.repo_path, capture_output=True, text=True, timeout=10
            )
            if not status.stdout.strip():
                print(f"  📭 Nothing to revert for {task_id}")
                return

            lines = status.stdout.strip().split("\n")
            modified = []
            untracked = []
            for line in lines:
                flag = line[:2].strip()
                filepath = line[3:].strip()
                # Skip critical files
                if filepath in ("CLAUDE.md", "PROJECT_CONTEXT.md", "package.json",
                                "package-lock.json", "tsconfig.json", "next.config.ts",
                                "next.config.js", "tailwind.config.ts", "tailwind.config.js",
                                ".env.local", ".env.example"):
                    print(f"  🛡️  Protecting {filepath} from revert")
                    continue
                # Skip orchestrator files
                if filepath.startswith("orchestrator/"):
                    print(f"  🛡️  Protecting {filepath} from revert")
                    continue
                # Skip docs
                if filepath.startswith("docs/") and not filepath.startswith("docs/COMPONENT_REGISTRY"):
                    print(f"  🛡️  Protecting {filepath} from revert")
                    continue

                if flag in ("M", "A", "MM", "AM"):
                    modified.append(filepath)
                elif flag == "??":
                    untracked.append(filepath)
                elif flag == "D":
                    modified.append(filepath)  # restore deleted files
                else:
                    modified.append(filepath)

            # Revert modified/staged files
            if modified:
                subprocess.run(
                    ["git", "checkout", "--"] + modified,
                    cwd=self.repo_path, timeout=10
                )
                print(f"  🔙 Reverted {len(modified)} modified file(s)")

            # Remove untracked files (only ones this task likely created)
            if untracked:
                for f in untracked:
                    full_path = Path(self.repo_path) / f
                    if full_path.exists():
                        if full_path.is_file():
                            full_path.unlink()
                        elif full_path.is_dir():
                            import shutil
                            shutil.rmtree(full_path)
                print(f"  🗑️  Removed {len(untracked)} untracked file(s)")

            print(f"  🔙 Surgical revert complete for {task_id}")

        except Exception as e:
            print(f"  ⚠️  Surgical revert failed ({e}), falling back to safe revert")
            # Fallback: only checkout tracked files, never clean
            try:
                subprocess.run(["git", "checkout", "."], cwd=self.repo_path, timeout=10)
                print(f"  🔙 Fallback revert (tracked files only)")
            except Exception:
                print(f"  ❌ Could not revert. Manual cleanup needed.")

    def run(self):
        """Main orchestration loop."""
        self.tq.log_event("RUN_START", "—",
                          f"Orchestrator started. Mode: {'dry-run' if self.dry_run else 'live'}",
                          "—", "—", "🚀")

        # ── Single task mode ──
        if self.single_task:
            all_tasks = self.tq.get_all_tasks()
            task = next((t for t in all_tasks
                        if str(t.get("Task ID", "")).strip() == self.single_task), None)
            if not task:
                print(f"❌ Task {self.single_task} not found in sheet")
                return
            self.process_task(task)
            self.generate_report()
            return

        # ── Full queue mode ──
        iteration = 0
        while self.is_safe_to_continue():
            iteration += 1
            eligible = self.tq.get_eligible_tasks()

            if not eligible:
                pending = self.tq.get_pending_tasks()
                if pending:
                    print(f"\n⏸️  {len(pending)} tasks pending but blocked by dependencies.")
                    print(f"   Completed so far: {self.tq.get_completed_task_ids()}")
                    print(f"   Waiting tasks: {[t['Task ID'] for t in pending]}")

                    # If nothing is running and nothing is eligible, we're stuck
                    print(f"\n🛑 All remaining tasks have unmet dependencies. Stopping.")
                else:
                    print(f"\n🎉 ALL TASKS COMPLETE!")
                break

            # Progress bar
            total_tasks = len(self.completed) + len(self.failed) + len(eligible) + len(self.tq.get_pending_tasks())
            done = len(self.completed)
            bar_width = 30
            filled = int(bar_width * done / max(total_tasks, 1))
            bar = "█" * filled + "░" * (bar_width - filled)
            pct = int(100 * done / max(total_tasks, 1))

            print(f"\n{'═' * 60}")
            print(f"  ITERATION {iteration} — {len(eligible)} eligible task(s)")
            print(f"  Progress: [{bar}] {pct}% ({done}/{total_tasks})")
            print(f"  Completed: {len(self.completed)} | Failed: {len(self.failed)}")
            elapsed = duration_str(self.start_time, datetime.now())
            print(f"  Elapsed: {elapsed}")
            print(f"{'═' * 60}")

            # Process one task at a time (sequential for safety)
            # Parallel mode is possible but sequential is much safer for V1
            task = eligible[0]
            self.process_task(task)

            # Breather between tasks
            breather = self.config["breather_seconds"]
            if breather > 0 and self.is_safe_to_continue():
                print(f"\n  💨 Breathing for {breather}s...")
                time.sleep(breather)

            # Try to reconnect sheets if they went offline
            if not self.tq.is_online:
                print("  🔄 Attempting to reconnect to Google Sheets...")
                self.tq.reconnect()

        self.generate_report()

    def generate_report(self):
        """Generate and display the final overnight report."""
        end_time = datetime.now()
        total_dur = duration_str(self.start_time, end_time)

        print()
        print("=" * 60)
        print("  OVERNIGHT RUN REPORT")
        print("=" * 60)
        print(f"  Run ID:     {self.run_id}")
        print(f"  Started:    {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  Finished:   {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  Duration:   {total_dur}")
        print(f"  Completed:  {len(self.completed)} tasks")
        print(f"  Failed:     {len(self.failed)} tasks")
        print(f"  Commits:    {self.total_commits}")
        print()

        if self.completed:
            print("  ✅ Completed:")
            for tid in self.completed:
                print(f"     {tid}")

        if self.failed:
            print("  ❌ Failed:")
            for tid in self.failed:
                print(f"     {tid}")

        print()
        print(f"  📊 Sheets: {'online' if self.tq.is_online else 'OFFLINE (check local backup)'}")
        print(f"  💾 Backup: orchestrator/reports/run_{self.run_id}.json")
        print("=" * 60)

        # Update sheets report
        summary = f"{len(self.completed)} completed, {len(self.failed)} failed, {self.total_commits} commits"
        issues = ", ".join(self.failed) if self.failed else "None"
        next_steps = "Review failed tasks and re-queue" if self.failed else "Proceed to next phase"

        self.tq.finalize_report(
            started=self.start_time.strftime("%Y-%m-%d %H:%M:%S"),
            finished=end_time.strftime("%Y-%m-%d %H:%M:%S"),
            total_duration=total_dur,
            api_cost="(check usage dashboard)",
            total_commits=self.total_commits,
            files_changed=get_changed_files_count(self.repo_path),
            summary=summary,
            issues=issues,
            next_steps=next_steps,
        )

        self.tq.log_event("RUN_END", "—", summary, total_dur, "—", "🏁")


# ─── ENTRY POINT ──────────────────────────────────────────────

def main():
    # Parse args
    dry_run = "--dry-run" in sys.argv
    single_task = None
    for i, arg in enumerate(sys.argv):
        if arg == "--task" and i + 1 < len(sys.argv):
            single_task = sys.argv[i + 1]

    # Find repo path (assume we're in the orchestrator/ dir or repo root)
    cwd = os.getcwd()
    if os.path.exists(os.path.join(cwd, "CLAUDE.md")):
        repo_path = cwd
    elif os.path.exists(os.path.join(cwd, "..", "CLAUDE.md")):
        repo_path = os.path.abspath(os.path.join(cwd, ".."))
    else:
        # Default: look for ~/Y2
        home_repo = os.path.expanduser("~/Y2")
        if os.path.exists(os.path.join(home_repo, "CLAUDE.md")):
            repo_path = home_repo
        else:
            print("❌ Cannot find Y2 repo. Run from the repo root or orchestrator/ directory.")
            sys.exit(1)

    # Handle Ctrl+C gracefully
    def signal_handler(sig, frame):
        print("\n\n🛑 Interrupted by user. Generating report...")
        # The report will be generated by the finally block or atexit
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    # Run
    orch = Orchestrator(repo_path=repo_path, dry_run=dry_run, single_task=single_task)
    try:
        orch.run()
    except KeyboardInterrupt:
        print("\n🛑 Interrupted. Generating report...")
        orch.generate_report()
    except Exception as e:
        print(f"\n💥 FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        orch.tq.log_event("FATAL_ERROR", "—", str(e)[:500], "—", "—", "💥")
        orch.generate_report()
        sys.exit(1)


if __name__ == "__main__":
    main()

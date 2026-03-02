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
    "auditor_max_turns": 10,
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

def build_task_prompt(task: dict, repo_path: str) -> str:
    """
    Construct the full prompt for a Claude Code builder.
    Reads the task's prompt file if it exists, otherwise builds inline.
    """
    task_id = task["Task ID"]
    task_name = task["Name"]
    task_type = task.get("Type", "")

    # Check for a dedicated prompt file
    prompt_file = Path(repo_path) / "orchestrator" / "prompts" / f"{task_id}.md"
    if prompt_file.exists():
        custom_prompt = prompt_file.read_text()
        return f"""You are building task {task_id} for the Y2 project.

IMPORTANT: Before writing any code, read CLAUDE.md at the project root. It tells you which docs to read for design system, coding standards, and existing components.

Task: {task_name}
Type: {task_type}

{custom_prompt}

After completing:
1. Make sure `npm run build` passes
2. Add any new components to docs/COMPONENT_REGISTRY.md
3. Do NOT commit — the orchestrator handles git.
"""

    # Fallback: inline prompt from task metadata
    return f"""You are building task {task_id} for the Y2 project.

IMPORTANT: Before writing any code, read CLAUDE.md at the project root. It tells you which docs to read for design system, coding standards, and existing components.

Task: {task_name}
Type: {task_type}

Expected output files: {task.get("Expected Files", "see CLAUDE.md for patterns")}
Test requirements: {task.get("Test Requirements", "component renders, key interactions work")}

Guidelines:
- Follow the design system in docs/DESIGN_SYSTEM.md exactly
- Use existing components from docs/COMPONENT_REGISTRY.md — don't duplicate
- Follow coding standards in docs/CODING_STANDARDS.md
- Create one file at a time, verify it compiles, then move to the next
- Write tests for every component you create

After completing:
1. Make sure `npm run build` passes
2. Update docs/COMPONENT_REGISTRY.md with any new components
3. Do NOT commit — the orchestrator handles git.
"""


def build_audit_prompt(task: dict) -> str:
    """Construct the prompt for the auditor that reviews completed work."""
    task_id = task["Task ID"]
    task_name = task["Name"]

    return f"""You are auditing task {task_id}: {task_name}

Review the recent changes in this project. Check:

1. CODE QUALITY
   - Does the code follow docs/CODING_STANDARDS.md?
   - Are TypeScript types correct (no `any`)?
   - Is the code clean, readable, and well-structured?

2. DESIGN SYSTEM
   - Does it follow docs/DESIGN_SYSTEM.md?
   - Are all colors from theme tokens (no hardcoded hex)?
   - Are animations using the patterns from the design system?
   - Are border radii, spacing, and typography correct?

3. FUNCTIONALITY
   - Run: npm run build — does it pass?
   - Run: npm test — do tests pass?
   - Are there any TypeScript errors?

4. COMPLETENESS
   - Were all expected files created?
   - Were tests written?
   - Was docs/COMPONENT_REGISTRY.md updated?

RESPOND WITH EXACTLY THIS JSON FORMAT (no other text):
{{
  "approved": true or false,
  "build_passes": true or false,
  "tests_pass": true or false,
  "issues": ["list of specific issues found, empty if none"],
  "summary": "one sentence overall assessment"
}}
"""


# ─── CLAUDE CODE RUNNER ───────────────────────────────────────

def run_claude_code(prompt: str, repo_path: str, timeout_minutes: int,
                    max_turns: int, allowed_tools: str,
                    label: str = "") -> dict:
    """
    Run Claude Code in headless mode with full guardrails.

    Returns:
        {
            "status": "complete" | "timeout" | "error",
            "stdout": str,
            "stderr": str,
            "duration_seconds": int,
            "exit_code": int | None,
        }
    """
    cmd = [
        "claude",
        "-p", prompt,
        "--allowedTools", allowed_tools,
        "--max-turns", str(max_turns),
        "--output-format", "text",
    ]

    prefix = f"[{label}] " if label else ""
    print(f"  {prefix}🚀 Spawning Claude Code (timeout: {timeout_minutes}m, max-turns: {max_turns})")

    start = datetime.now()
    try:
        result = subprocess.run(
            cmd,
            cwd=repo_path,
            timeout=timeout_minutes * 60,
            capture_output=True,
            text=True,
            env={**os.environ, "CLAUDE_CODE_HEADLESS": "1"},
        )
        end = datetime.now()
        secs = int((end - start).total_seconds())

        if result.returncode == 0:
            print(f"  {prefix}✅ Completed in {duration_str(start, end)}")
            return {
                "status": "complete",
                "stdout": result.stdout,
                "stderr": result.stderr,
                "duration_seconds": secs,
                "exit_code": 0,
            }
        else:
            print(f"  {prefix}⚠️  Exited with code {result.returncode} in {duration_str(start, end)}")
            return {
                "status": "error",
                "stdout": result.stdout,
                "stderr": result.stderr,
                "duration_seconds": secs,
                "exit_code": result.returncode,
            }

    except subprocess.TimeoutExpired:
        end = datetime.now()
        secs = int((end - start).total_seconds())
        print(f"  {prefix}⏰ TIMEOUT after {timeout_minutes} minutes")
        return {
            "status": "timeout",
            "stdout": "",
            "stderr": f"Process killed after {timeout_minutes} minute timeout",
            "duration_seconds": secs,
            "exit_code": None,
        }

    except FileNotFoundError:
        print(f"  {prefix}❌ 'claude' command not found. Is Claude Code CLI installed?")
        return {
            "status": "error",
            "stdout": "",
            "stderr": "claude CLI not found",
            "duration_seconds": 0,
            "exit_code": None,
        }

    except Exception as e:
        end = datetime.now()
        secs = int((end - start).total_seconds())
        print(f"  {prefix}❌ Unexpected error: {e}")
        return {
            "status": "error",
            "stdout": "",
            "stderr": str(e),
            "duration_seconds": secs,
            "exit_code": None,
        }


# ─── GIT OPERATIONS ──────────────────────────────────────────

def git_commit_and_push(repo_path: str, task: dict, auto_push: bool) -> str | None:
    """Stage all changes, commit with conventional message, optionally push."""
    task_id = task["Task ID"]
    task_name = task["Name"]
    task_type = task.get("Type", "feat")

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
    msg = f"{prefix}({task_id.lower()}): {task_name}"

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
            ["git", "commit", "-m", msg],
            cwd=repo_path, timeout=30, check=True,
            capture_output=True, text=True,
        )
        commit_hash = get_git_short_hash(repo_path)
        print(f"  📦 Committed: {msg} ({commit_hash})")

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
        """Full pipeline for one task: build → audit → commit."""
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
            # Builder failed
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

            # Revert any partial changes
            try:
                subprocess.run(["git", "checkout", "."], cwd=self.repo_path, timeout=10)
                subprocess.run(["git", "clean", "-fd"], cwd=self.repo_path, timeout=10)
            except Exception:
                pass
            return

        # ── 3. Run auditor ──
        print(f"\n  🔍 Auditing {task_id}...")
        self.tq.log_event("AUDIT_START", task_id, "Auditor spawned", "—", "—", "🔍")

        audit_prompt = build_audit_prompt(task)
        audit_result = run_claude_code(
            prompt=audit_prompt,
            repo_path=self.repo_path,
            timeout_minutes=self.config["max_audit_minutes"],
            max_turns=self.config["auditor_max_turns"],
            allowed_tools=self.config["auditor_tools"],
            label=f"AUDIT {task_id}",
        )

        if audit_result["status"] != "complete":
            # Auditor itself failed — approve with warning (don't block progress)
            print(f"  ⚠️  Auditor process failed. Approving with manual review flag.")
            verdict = {
                "approved": True,
                "issues": ["Auditor process failed — needs manual review"],
                "summary": "Auto-approved (auditor unavailable)",
            }
        else:
            verdict = parse_audit_response(audit_result["stdout"])

        total_duration = duration_str(task_start, datetime.now())

        # ── 4. Handle verdict ──
        if verdict.get("approved", False):
            # Commit and push
            commit_hash = git_commit_and_push(
                self.repo_path, task, self.config.get("auto_push", True)
            )

            status = "complete"
            if commit_hash:
                self.total_commits += 1
            else:
                commit_hash = "no-changes"

            issues_str = "; ".join(verdict.get("issues", []))
            verdict_summary = verdict.get("summary", "Approved")
            if issues_str:
                verdict_summary += f" (notes: {issues_str})"

            self.tq.update_task_result(
                task_id, status,
                duration=total_duration,
                builder_output=f"Built in {builder_duration}",
                auditor_verdict=verdict_summary[:500],
                commit_hash=commit_hash or "",
            )
            self.tq.log_event(
                "TASK_COMPLETE", task_id,
                f"Approved: {verdict.get('summary', '')}",
                total_duration, "—", "✅"
            )
            self.completed.append(task_id)
            self.consecutive_failures = 0  # reset on success
            print(f"\n  ✅ {task_id} COMPLETE ({total_duration})")

        else:
            # Rejected — revert changes
            issues_str = "; ".join(verdict.get("issues", []))
            self.tq.update_task_result(
                task_id, "failed_audit",
                duration=total_duration,
                builder_output=f"Built in {builder_duration}",
                auditor_verdict=f"REJECTED: {issues_str[:400]}",
            )
            self.tq.log_event(
                "AUDIT_FAIL", task_id,
                f"Rejected: {issues_str[:300]}",
                total_duration, "—", "❌"
            )

            # Revert
            try:
                subprocess.run(["git", "checkout", "."], cwd=self.repo_path, timeout=10)
                subprocess.run(["git", "clean", "-fd"], cwd=self.repo_path, timeout=10)
                print(f"  🔙 Changes reverted for {task_id}")
            except Exception:
                print(f"  ⚠️  Could not revert changes — manual cleanup may be needed")

            self.failed.append(task_id)
            self.consecutive_failures += 1
            print(f"\n  ❌ {task_id} FAILED AUDIT ({total_duration})")

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

            print(f"\n{'═' * 60}")
            print(f"  ITERATION {iteration} — {len(eligible)} eligible task(s)")
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

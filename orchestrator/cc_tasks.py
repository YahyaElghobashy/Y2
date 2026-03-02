#!/usr/bin/env python3
"""
Y2 Task Runner — Claude Code CLI
==================================

Lightweight CLI for managing tasks assigned to claude-code executor.

Usage:
  python cc_tasks.py                        # List eligible claude-code tasks
  python cc_tasks.py --start T902           # Mark task as building
  python cc_tasks.py --done T902            # Mark task as complete
  python cc_tasks.py --done T902 --commit abc1234 --duration "12m 30s"
  python cc_tasks.py --fail T902            # Mark task as failed
  python cc_tasks.py --fail T902 --reason "Dependency issue"
  python cc_tasks.py --all                  # Show all tasks (any executor)
"""

import sys
import argparse
from datetime import datetime

from sheets_connector import TaskQueueClient


def format_table(tasks: list[dict], show_executor: bool = False) -> str:
    """Format tasks as a readable table."""
    if not tasks:
        return "  (no tasks)"

    lines = []
    # Header
    widths = {"Task ID": 8, "Name": 44, "Status": 12, "Pri": 4, "Dependencies": 20}
    if show_executor:
        widths["Executor"] = 14
    header = "  ".join(f"{c:<{w}}" for c, w in widths.items())
    lines.append(f"  {header}")
    lines.append(f"  {'─' * len(header)}")

    for t in tasks:
        task_id = str(t.get("Task ID", "")).strip()
        name = str(t.get("Name", "")).strip()[:42]
        status = str(t.get("Status", "")).strip()
        priority = str(t.get("Priority", "")).strip()
        deps = str(t.get("Dependencies", "")).strip()[:18]
        row = f"  {task_id:<8}{name:<44}{status:<12}{priority:<4}{deps:<20}"
        if show_executor:
            executor = str(t.get("Executor", "")).strip() or "orchestrator"
            row += f"{executor:<14}"
        lines.append(row)

    return "\n".join(lines)


def cmd_list(tq: TaskQueueClient):
    """List eligible claude-code tasks."""
    eligible = tq.get_eligible_tasks(executor="claude-code")
    print(f"\n  Claude Code — Eligible Tasks ({len(eligible)})")
    print(f"  {'=' * 50}")
    print(format_table(eligible))
    print()

    # Also show blocked claude-code tasks
    all_tasks = tq.get_all_tasks()
    cc_pending = [
        t for t in all_tasks
        if str(t.get("Status", "")).strip() == "pending"
        and str(t.get("Executor", "")).strip().lower() == "claude-code"
    ]
    blocked = [t for t in cc_pending if t not in eligible]
    if blocked:
        print(f"  Blocked ({len(blocked)}):")
        for t in blocked:
            deps = str(t.get("Dependencies", "")).strip()
            print(f"    {t['Task ID']}: {t['Name']} (waiting on: {deps})")
        print()


def cmd_all(tq: TaskQueueClient):
    """Show all tasks with executor column."""
    all_tasks = tq.get_all_tasks()
    print(f"\n  All Tasks ({len(all_tasks)})")
    print(f"  {'=' * 50}")
    print(format_table(all_tasks, show_executor=True))

    # Summary
    statuses = {}
    executors = {}
    for t in all_tasks:
        s = str(t.get("Status", "")).strip() or "unknown"
        e = str(t.get("Executor", "")).strip() or "orchestrator"
        statuses[s] = statuses.get(s, 0) + 1
        executors[e] = executors.get(e, 0) + 1

    print(f"\n  Summary:")
    print(f"    By status:   {statuses}")
    print(f"    By executor: {executors}")
    print()


def cmd_start(tq: TaskQueueClient, task_id: str):
    """Mark task as building."""
    tq.update_task_started(task_id)
    tq.log_event("MANUAL_START", task_id, f"Started via cc_tasks.py")
    print(f"  ✅ {task_id} marked as building")


def cmd_done(tq: TaskQueueClient, task_id: str, commit: str = "", duration: str = ""):
    """Mark task as complete."""
    tq.update_task_result(
        task_id, "complete",
        duration=duration,
        commit_hash=commit,
        builder_output="Completed via Claude Code CLI",
    )
    tq.log_event("MANUAL_COMPLETE", task_id, f"Completed via cc_tasks.py (commit: {commit or 'n/a'})")
    print(f"  ✅ {task_id} marked as complete")


def cmd_fail(tq: TaskQueueClient, task_id: str, reason: str = ""):
    """Mark task as failed."""
    tq.update_task_result(
        task_id, "failed",
        builder_output=f"Failed via Claude Code CLI: {reason}" if reason else "Failed via Claude Code CLI",
    )
    tq.log_event("MANUAL_FAIL", task_id, f"Failed via cc_tasks.py: {reason or 'no reason given'}")
    print(f"  ❌ {task_id} marked as failed")


def main():
    parser = argparse.ArgumentParser(
        description="Y2 Task Runner — Claude Code CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--start", metavar="TASK_ID", help="Mark task as building")
    parser.add_argument("--done", metavar="TASK_ID", help="Mark task as complete")
    parser.add_argument("--fail", metavar="TASK_ID", help="Mark task as failed")
    parser.add_argument("--all", action="store_true", help="Show all tasks (any executor)")
    parser.add_argument("--commit", metavar="HASH", default="", help="Git commit hash (with --done)")
    parser.add_argument("--duration", metavar="DUR", default="", help="Duration string (with --done)")
    parser.add_argument("--reason", metavar="TEXT", default="", help="Failure reason (with --fail)")

    args = parser.parse_args()

    tq = TaskQueueClient(run_id="cc-tasks")
    if not tq.is_online:
        print("❌ Cannot connect to Google Sheets. Check credentials.")
        sys.exit(1)

    if args.start:
        cmd_start(tq, args.start)
    elif args.done:
        cmd_done(tq, args.done, commit=args.commit, duration=args.duration)
    elif args.fail:
        cmd_fail(tq, args.fail, reason=args.reason)
    elif args.all:
        cmd_all(tq)
    else:
        cmd_list(tq)


if __name__ == "__main__":
    main()

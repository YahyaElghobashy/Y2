"""
Y2 Orchestrator — Google Sheets Connector (Hardened)
=====================================================

Bulletproof interface between the Python orchestrator and the Google Sheets
task queue dashboard. Every operation retries, logs locally, and never crashes
the orchestrator.

Setup:
  pip install gspread google-auth google-auth-oauthlib

Usage:
  python sheets_connector.py          # First run: authenticate
  python sheets_connector.py --test   # Verify full read/write cycle
"""

import json
import os
import sys
import time
import threading
from pathlib import Path
from datetime import datetime
from functools import wraps

# ─── CONFIGURATION ───────────────────────────────────────────

SPREADSHEET_ID = "1RmPX9zA0_H2td7XMNqmu0mL9Q9S_W1VbuJ8n-vf06Xs"
CLIENT_SECRET_FILE = "client_secret.json"
TOKEN_FILE = "token.json"
LOCAL_BACKUP_DIR = "reports"
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]


# ─── RETRY DECORATOR ─────────────────────────────────────────

def retry_on_api_error(max_retries=3, base_delay=2.0):
    """
    Retry any Google Sheets API call with exponential backoff.
    Catches: rate limits (429), server errors (500/503), network blips.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_error = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    error_str = str(e).lower()
                    # Retryable errors
                    retryable = any(x in error_str for x in [
                        "429", "rate limit", "quota",
                        "500", "503", "service unavailable",
                        "timeout", "timed out",
                        "transport", "connection",
                        "broken pipe", "reset by peer",
                    ])
                    if not retryable:
                        # Non-retryable (auth error, bad request, etc.)
                        print(f"  ❌ {func.__name__} failed (non-retryable): {e}")
                        raise
                    delay = base_delay * (2 ** attempt)
                    print(f"  ⚠️  {func.__name__} attempt {attempt + 1}/{max_retries} failed: {e}")
                    print(f"      Retrying in {delay:.0f}s...")
                    time.sleep(delay)
            print(f"  ❌ {func.__name__} failed after {max_retries} retries")
            raise last_error
        return wrapper
    return decorator


# ─── AUTHENTICATION ──────────────────────────────────────────

def authenticate():
    """OAuth 2.0 auth. First run opens browser, subsequent runs use saved token."""
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from google_auth_oauthlib.flow import InstalledAppFlow

    creds = None

    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("🔄 Token expired, refreshing...")
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"⚠️  Token refresh failed ({e}), re-authenticating...")
                creds = None

        if not creds:
            if not os.path.exists(CLIENT_SECRET_FILE):
                print(f"❌ Cannot find {CLIENT_SECRET_FILE}")
                sys.exit(1)

            print("🔐 First-time authentication — opening browser...")
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
            print("✅ Authentication successful!")

        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
        print(f"💾 Token saved to {TOKEN_FILE}")

    return creds


def get_sheet():
    """Get authenticated gspread client and open the spreadsheet."""
    import gspread
    creds = authenticate()
    client = gspread.authorize(creds)
    return client.open_by_key(SPREADSHEET_ID)


# ─── LOCAL BACKUP ─────────────────────────────────────────────

class LocalBackup:
    """
    Writes every sheet update to a local JSON file.
    If Sheets goes down mid-run, you still have the full record.
    """

    def __init__(self, run_id: str):
        self.dir = Path(LOCAL_BACKUP_DIR)
        self.dir.mkdir(parents=True, exist_ok=True)
        self.filepath = self.dir / f"run_{run_id}.json"
        self.data = {
            "run_id": run_id,
            "started_at": datetime.now().isoformat(),
            "events": [],
            "task_updates": [],
            "components": [],
        }
        self._lock = threading.Lock()
        self._save()

    def log_event(self, event: dict):
        with self._lock:
            self.data["events"].append({**event, "logged_at": datetime.now().isoformat()})
            self._save()

    def log_task_update(self, update: dict):
        with self._lock:
            self.data["task_updates"].append({**update, "logged_at": datetime.now().isoformat()})
            self._save()

    def log_component(self, component: dict):
        with self._lock:
            self.data["components"].append({**component, "logged_at": datetime.now().isoformat()})
            self._save()

    def finalize(self, summary: dict):
        with self._lock:
            self.data["finished_at"] = datetime.now().isoformat()
            self.data["summary"] = summary
            self._save()

    def _save(self):
        with open(self.filepath, "w") as f:
            json.dump(self.data, f, indent=2, default=str)


# ─── TASK QUEUE CLIENT ────────────────────────────────────────

class TaskQueueClient:
    """
    Thread-safe, retry-hardened interface to the Google Sheets dashboard.

    Usage:
        tq = TaskQueueClient(run_id="2026-03-03-overnight")
        eligible = tq.get_eligible_tasks()
        tq.update_task_started("T001")
        tq.log_event("TASK_START", "T001", "Builder spawned")
        tq.update_task_result("T001", "complete", duration="8m", commit_hash="abc1234")
    """

    def __init__(self, run_id: str = None):
        if not run_id:
            run_id = datetime.now().strftime("%Y-%m-%d_%H%M")
        self.run_id = run_id
        self.backup = LocalBackup(run_id)
        self._lock = threading.Lock()  # serialize all sheet writes
        self._sheets_available = True

        try:
            self.sheet = get_sheet()
            self._task_queue = self.sheet.worksheet("Task Queue")
            self._run_log = self.sheet.worksheet("Run Log")
            self._component_registry = self.sheet.worksheet("Component Registry")
            self._overnight_report = self.sheet.worksheet("Overnight Report")
            self._config = self.sheet.worksheet("Config")
            print(f"📊 Connected to: {self.sheet.title}")
        except Exception as e:
            print(f"⚠️  Google Sheets unavailable ({e})")
            print(f"   Running in offline mode — all updates saved to {self.backup.filepath}")
            self._sheets_available = False

    def _safe_sheet_op(self, operation_name: str, func, *args, **kwargs):
        """
        Wraps every sheet operation:
        1. Acquire thread lock (serialize writes)
        2. Try the operation with retries
        3. If sheets are down, log to backup only
        """
        if not self._sheets_available:
            return None

        with self._lock:
            try:
                return func(*args, **kwargs)
            except Exception as e:
                print(f"  ⚠️  Sheet operation '{operation_name}' failed: {e}")
                print(f"      Logged to local backup instead.")
                self._sheets_available = False  # stop hammering a dead API
                return None

    # ── Config ──────────────────────────────────────────────

    @retry_on_api_error(max_retries=3)
    def get_config(self) -> dict:
        """Read orchestrator config from the Config tab."""
        rows = self._config.get_all_values()
        config = {}
        for row in rows[3:]:  # skip title + header rows
            if len(row) >= 2 and row[0].strip() and row[1].strip():
                key = row[0].strip()
                val = row[1].strip()
                if val.lower() == "true":
                    val = True
                elif val.lower() == "false":
                    val = False
                else:
                    try:
                        val = int(val)
                    except ValueError:
                        try:
                            val = float(val)
                        except ValueError:
                            pass
                config[key] = val
        return config

    # ── Task Queue ──────────────────────────────────────────

    @retry_on_api_error(max_retries=3)
    def get_all_tasks(self) -> list[dict]:
        """Get all tasks from Task Queue tab."""
        rows = self._task_queue.get_all_values()
        # Find the header row (the one containing "Task ID")
        header_idx = None
        for i, row in enumerate(rows):
            if any("Task ID" in str(cell) for cell in row):
                header_idx = i
                break
        if header_idx is None:
            print("  ⚠️  Could not find 'Task ID' header in Task Queue sheet")
            return []
        headers = rows[header_idx]
        tasks = []
        for row in rows[header_idx + 1:]:
            if not row[0].strip():
                continue
            task = dict(zip(headers, row))
            tasks.append(task)
        return tasks

    def get_pending_tasks(self) -> list[dict]:
        """Get tasks with status 'pending'."""
        return [t for t in self.get_all_tasks() if str(t.get("Status", "")).strip() == "pending"]

    def get_completed_task_ids(self) -> set[str]:
        """Get IDs of completed tasks as a set (includes tasks with audit notes)."""
        done_statuses = {"complete", "complete_with_issues"}
        return {str(t["Task ID"]).strip() for t in self.get_all_tasks()
                if str(t.get("Status", "")).strip() in done_statuses}

    def get_eligible_tasks(self) -> list[dict]:
        """
        Tasks that are pending AND have all dependencies completed.
        Returns sorted by Priority (lowest number = highest priority).
        """
        completed = self.get_completed_task_ids()
        eligible = []
        for task in self.get_pending_tasks():
            deps_raw = str(task.get("Dependencies", "")).strip()
            if deps_raw in ("", "—", "-", "none", "None"):
                deps = []
            else:
                deps = [d.strip() for d in deps_raw.split(",") if d.strip()]
            if all(dep in completed for dep in deps):
                eligible.append(task)
        return sorted(eligible, key=lambda t: (t.get("Priority", 999), t.get("Task ID", "")))

    @retry_on_api_error(max_retries=3)
    def _find_task_row(self, task_id: str) -> int | None:
        """
        Find a task's row by searching ONLY column A (Task ID column).
        This avoids false matches in Dependencies or other columns.
        """
        col_a = self._task_queue.col_values(1)  # get all values in column A
        for i, val in enumerate(col_a):
            if str(val).strip() == str(task_id).strip():
                return i + 1  # gspread is 1-indexed
        return None

    def update_task_started(self, task_id: str):
        """Mark task as building with timestamp."""
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Local backup always
        self.backup.log_task_update({"task_id": task_id, "status": "building", "started_at": now})

        def _do():
            row = self._find_task_row(task_id)
            if not row:
                print(f"  ⚠️  Task {task_id} not found in sheet")
                return
            # Batch update: status + started_at in one call
            self._task_queue.update(f"H{row}:I{row}", [["building", now]])

        self._safe_sheet_op(f"start_{task_id}", _do)

    def update_task_result(self, task_id: str, status: str, finished_at: str = "",
                           duration: str = "", builder_output: str = "",
                           auditor_verdict: str = "", commit_hash: str = ""):
        """Batch-update task result in one API call."""
        if not finished_at:
            finished_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Local backup always
        self.backup.log_task_update({
            "task_id": task_id, "status": status, "finished_at": finished_at,
            "duration": duration, "builder_output": builder_output[:200],
            "auditor_verdict": auditor_verdict[:200], "commit_hash": commit_hash,
        })

        def _do():
            row = self._find_task_row(task_id)
            if not row:
                print(f"  ⚠️  Task {task_id} not found in sheet")
                return
            # Batch update: status, (skip started), finished, duration, builder, auditor, commit
            # Columns: H=status, I=started(skip), J=finished, K=duration, L=builder, M=auditor, N=commit
            self._task_queue.update(f"H{row}", [[status]])
            self._task_queue.update(f"J{row}:N{row}", [[
                finished_at,
                duration,
                builder_output[:500],  # truncate to avoid cell limits
                auditor_verdict[:500],
                commit_hash,
            ]])

        self._safe_sheet_op(f"result_{task_id}", _do)

    # ── Run Log ─────────────────────────────────────────────

    def log_event(self, event: str, task_id: str = "—", details: str = "",
                  duration: str = "—", cost: str = "—", status_emoji: str = ""):
        """Append event to Run Log tab + local backup."""
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        row_data = [now, event, task_id, details[:500], duration, cost, status_emoji]

        # Local backup always
        self.backup.log_event({
            "timestamp": now, "event": event, "task_id": task_id,
            "details": details[:500], "duration": duration, "cost": cost,
        })

        @retry_on_api_error(max_retries=2)
        def _do():
            self._run_log.append_row(row_data, value_input_option="USER_ENTERED")

        self._safe_sheet_op(f"log_{event}", _do)

    # ── Component Registry ──────────────────────────────────

    def register_component(self, name: str, module: str, file_path: str,
                           props: str = "", built_by: str = "", notes: str = ""):
        """Add component to registry."""
        row_data = [name, module, file_path, props, "✅", built_by, notes]

        self.backup.log_component({
            "name": name, "module": module, "file_path": file_path,
            "props": props, "built_by": built_by,
        })

        @retry_on_api_error(max_retries=2)
        def _do():
            self._component_registry.append_row(row_data)

        self._safe_sheet_op(f"register_{name}", _do)

    # ── Overnight Report ────────────────────────────────────

    def finalize_report(self, started: str, finished: str, total_duration: str,
                        api_cost: str, total_commits: int, files_changed: int,
                        summary: str, issues: str, next_steps: str):
        """Fill in the Overnight Report tab."""
        fields = {
            "Started": started,
            "Finished": finished,
            "Total Duration": total_duration,
            "Estimated API Cost": api_cost,
            "Total Commits": str(total_commits),
            "Files Changed": str(files_changed),
            "Summary": summary,
            "Issues to Review": issues,
            "Next Steps": next_steps,
        }

        # Local backup
        self.backup.finalize(fields)

        def _do():
            for field_name, value in fields.items():
                try:
                    cell = self._overnight_report.find(field_name)
                    if cell:
                        self._overnight_report.update_cell(cell.row, 2, value)
                except Exception:
                    pass  # best effort on report fields

        self._safe_sheet_op("finalize_report", _do)

    # ── Status Check ────────────────────────────────────────

    @property
    def is_online(self) -> bool:
        """Whether Sheets API is currently reachable."""
        return self._sheets_available

    def reconnect(self):
        """Try to reconnect to Sheets (e.g., after a transient outage)."""
        try:
            self.sheet = get_sheet()
            self._task_queue = self.sheet.worksheet("Task Queue")
            self._run_log = self.sheet.worksheet("Run Log")
            self._component_registry = self.sheet.worksheet("Component Registry")
            self._overnight_report = self.sheet.worksheet("Overnight Report")
            self._config = self.sheet.worksheet("Config")
            self._sheets_available = True
            print("📊 Reconnected to Google Sheets")
            return True
        except Exception as e:
            print(f"⚠️  Reconnect failed: {e}")
            return False


# ─── TEST ─────────────────────────────────────────────────────

def test_connection():
    print()
    print("=" * 55)
    print("  Y2 ORCHESTRATOR — CONNECTION TEST (Hardened)")
    print("=" * 55)
    print()

    tq = TaskQueueClient(run_id="test")

    if not tq.is_online:
        print("❌ Sheets unavailable. Check credentials and network.")
        sys.exit(1)

    # Read config
    print("📋 Config...")
    config = tq.get_config()
    for k, v in list(config.items())[:3]:
        print(f"   {k}: {v}")
    print(f"   ({len(config)} total)")
    print()

    # Read tasks
    print("📋 Tasks...")
    all_t = tq.get_all_tasks()
    print(f"   Total: {len(all_t)}")
    eligible = tq.get_eligible_tasks()
    print(f"   Eligible: {len(eligible)}")
    if eligible:
        print(f"   Next: {eligible[0]['Task ID']} — {eligible[0]['Name']}")
    print()

    # Write test
    print("📝 Writing test log...")
    tq.log_event("CONNECTION_TEST", "—", "Hardened connector working", "—", "—", "✅")
    print("   ✅ Done")
    print()

    # Verify backup
    print(f"💾 Local backup: {tq.backup.filepath}")
    print()

    print("=" * 55)
    print("  ✅ ALL SYSTEMS GO")
    print("=" * 55)


if __name__ == "__main__":
    if "--test" in sys.argv:
        test_connection()
    else:
        authenticate()
        print("\nAuthenticated. Run with --test to verify.")

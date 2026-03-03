"""
Deep Supabase Database Validation
===================================

Queries the live remote Supabase database via the Management API and validates
that all migration specs (tables, columns, RLS, policies, triggers, functions,
indexes, seed data) are correctly applied.

Usage:
  python validate_supabase.py          # Run all checks
  python validate_supabase.py --json   # Output JSON summary
"""

import json
import os
import subprocess
import sys
from pathlib import Path

# ─── CONFIG ──────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / ".env.local"
PROJECT_REF_FILE = PROJECT_ROOT / "supabase" / ".temp" / "project-ref"

ACCESS_TOKEN = None
PROJECT_REF = None


def load_config():
    """Load SUPABASE_ACCESS_TOKEN from .env.local and project ref."""
    global ACCESS_TOKEN, PROJECT_REF

    if not ENV_FILE.exists():
        print(f"❌ .env.local not found at {ENV_FILE}")
        sys.exit(1)

    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line.startswith("SUPABASE_ACCESS_TOKEN="):
            ACCESS_TOKEN = line.split("=", 1)[1].strip()

    if not ACCESS_TOKEN:
        print("❌ SUPABASE_ACCESS_TOKEN not found in .env.local")
        sys.exit(1)

    if not PROJECT_REF_FILE.exists():
        print(f"❌ project-ref not found at {PROJECT_REF_FILE}")
        sys.exit(1)

    PROJECT_REF = PROJECT_REF_FILE.read_text().strip()


# ─── API QUERY ───────────────────────────────────────────────

def query_remote(sql: str) -> list[dict]:
    """Execute SQL against the live Supabase DB via Management API."""
    result = subprocess.run(
        [
            "curl", "-s", "-X", "POST",
            f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
            "-H", f"Authorization: Bearer {ACCESS_TOKEN}",
            "-H", "Content-Type: application/json",
            "-d", json.dumps({"query": sql}),
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"❌ curl failed: {result.stderr}")
        return []
    try:
        data = json.loads(result.stdout)
        if isinstance(data, dict) and "error" in data:
            print(f"❌ SQL error: {data['error']}")
            return []
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        print(f"❌ Invalid JSON response: {result.stdout[:200]}")
        return []


# ─── CHECK INFRASTRUCTURE ────────────────────────────────────

class CheckResult:
    def __init__(self, name: str, passed: bool, expected, actual, detail: str = ""):
        self.name = name
        self.passed = passed
        self.expected = expected
        self.actual = actual
        self.detail = detail

    def __repr__(self):
        icon = "✅" if self.passed else "❌"
        msg = f"{icon} {self.name}"
        if not self.passed:
            msg += f" — expected {self.expected}, got {self.actual}"
        if self.detail:
            msg += f" ({self.detail})"
        return msg


results: list[CheckResult] = []


def check(name: str, expected, actual, detail: str = ""):
    r = CheckResult(name, expected == actual, expected, actual, detail)
    results.append(r)
    return r


def check_gte(name: str, minimum, actual, detail: str = ""):
    """Check that actual >= minimum."""
    r = CheckResult(name, actual >= minimum, f">={minimum}", actual, detail)
    results.append(r)
    return r


# ─── TABLE CHECKS ────────────────────────────────────────────

def get_tables() -> list[str]:
    """Get all public schema tables."""
    rows = query_remote(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
    )
    return [r["tablename"] for r in rows]


def get_column_count(table: str) -> int:
    rows = query_remote(
        f"SELECT count(*) as cnt FROM information_schema.columns "
        f"WHERE table_schema = 'public' AND table_name = '{table}';"
    )
    return int(rows[0]["cnt"]) if rows else 0


def get_rls_status(table: str) -> bool:
    rows = query_remote(
        f"SELECT relrowsecurity FROM pg_class "
        f"WHERE relname = '{table}' AND relnamespace = "
        f"(SELECT oid FROM pg_namespace WHERE nspname = 'public');"
    )
    return rows[0]["relrowsecurity"] if rows else False


def get_policy_count(table: str) -> int:
    rows = query_remote(
        f"SELECT count(*) as cnt FROM pg_policies "
        f"WHERE schemaname = 'public' AND tablename = '{table}';"
    )
    return int(rows[0]["cnt"]) if rows else 0


def get_policy_names(table: str) -> list[str]:
    rows = query_remote(
        f"SELECT policyname FROM pg_policies "
        f"WHERE schemaname = 'public' AND tablename = '{table}' "
        f"ORDER BY policyname;"
    )
    return [r["policyname"] for r in rows]


def get_triggers(schema: str = "public") -> list[str]:
    rows = query_remote(
        f"SELECT trigger_name FROM information_schema.triggers "
        f"WHERE trigger_schema = '{schema}' "
        f"GROUP BY trigger_name ORDER BY trigger_name;"
    )
    return [r["trigger_name"] for r in rows]


def get_functions() -> list[str]:
    rows = query_remote(
        "SELECT routine_name FROM information_schema.routines "
        "WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' "
        "ORDER BY routine_name;"
    )
    return [r["routine_name"] for r in rows]


def get_indexes(table: str) -> list[str]:
    rows = query_remote(
        f"SELECT indexname FROM pg_indexes "
        f"WHERE schemaname = 'public' AND tablename = '{table}' "
        f"ORDER BY indexname;"
    )
    return [r["indexname"] for r in rows]


# ─── MIGRATION-SPECIFIC CHECKS ──────────────────────────────

def check_001_auth_profiles():
    """T201: Auth Profiles (001_auth_profiles.sql)"""
    print("\n── T201: Auth Profiles (001) ────────────────────")

    # Table exists with 8 columns
    cols = get_column_count("profiles")
    check("profiles: column count", 8, cols)

    # RLS enabled
    rls = get_rls_status("profiles")
    check("profiles: RLS enabled", True, rls)

    # Policies: 3 from migration 001 + 1 from 006 = 4
    policy_count = get_policy_count("profiles")
    check_gte("profiles: policy count (>=3)", 3, policy_count,
              f"policies: {get_policy_names('profiles')}")

    # Triggers in public schema
    triggers = get_triggers()
    check("profiles: set_updated_at trigger", True,
          "profiles_set_updated_at" in triggers)

    # Functions
    functions = get_functions()
    check("set_updated_at function exists", True,
          "set_updated_at" in functions)
    check("handle_new_user function exists", True,
          "handle_new_user" in functions)

    # Index
    indexes = get_indexes("profiles")
    check("profiles: partner_id index", True,
          "profiles_partner_id_idx" in indexes)

    # Seed data: 2 profiles with bidirectional partner_id
    seed = query_remote(
        "SELECT count(*) as cnt FROM public.profiles "
        "WHERE partner_id IS NOT NULL;"
    )
    seed_count = int(seed[0]["cnt"]) if seed else 0
    check_gte("profiles: seed data (partner-linked >= 2)", 2, seed_count)


def check_002_coyyns():
    """T301: CoYYns (002_coyyns.sql)"""
    print("\n── T301: CoYYns (002) ──────────────────────────")

    # coyyns_wallets: 7 columns
    cols = get_column_count("coyyns_wallets")
    check("coyyns_wallets: column count", 7, cols)
    rls = get_rls_status("coyyns_wallets")
    check("coyyns_wallets: RLS enabled", True, rls)
    policy_count = get_policy_count("coyyns_wallets")
    check("coyyns_wallets: policy count", 2, policy_count)

    # coyyns_transactions: 8 columns (id, user_id, amount, type, category, description, metadata, created_at)
    cols = get_column_count("coyyns_transactions")
    check("coyyns_transactions: column count", 8, cols)
    rls = get_rls_status("coyyns_transactions")
    check("coyyns_transactions: RLS enabled", True, rls)
    policy_count = get_policy_count("coyyns_transactions")
    check("coyyns_transactions: policy count", 2, policy_count)

    # Triggers
    triggers = get_triggers()
    check("coyyns: transaction trigger", True,
          "on_coyyn_transaction_insert" in triggers)
    check("coyyns: wallets updated_at trigger", True,
          "coyyns_wallets_set_updated_at" in triggers)

    # Function
    functions = get_functions()
    check("handle_coyyn_transaction function", True,
          "handle_coyyn_transaction" in functions)

    # Index
    indexes = get_indexes("coyyns_transactions")
    check("coyyns_transactions: user_id+created_at index", True,
          "coyyns_transactions_user_id_created_at_idx" in indexes)

    # Seed: 2 wallets with balance >= 0
    wallets = query_remote(
        "SELECT count(*) as cnt FROM public.coyyns_wallets WHERE balance >= 0;"
    )
    wallet_count = int(wallets[0]["cnt"]) if wallets else 0
    check_gte("coyyns_wallets: seed wallets (>= 2)", 2, wallet_count)


def check_003_notifications():
    """T401: Notifications (003_notifications.sql)"""
    print("\n── T401: Notifications (003) ───────────────────")

    # push_subscriptions: 6 columns
    cols = get_column_count("push_subscriptions")
    check("push_subscriptions: column count", 6, cols)
    rls = get_rls_status("push_subscriptions")
    check("push_subscriptions: RLS enabled", True, rls)
    policy_count = get_policy_count("push_subscriptions")
    check("push_subscriptions: policy count", 4, policy_count)

    # notifications: 10 columns
    cols = get_column_count("notifications")
    check("notifications: column count", 10, cols)
    rls = get_rls_status("notifications")
    check("notifications: RLS enabled", True, rls)
    policy_count = get_policy_count("notifications")
    check("notifications: policy count", 3, policy_count)

    # daily_send_limits: 6 columns (id, user_id, date, free_sends_used, bonus_sends_used, bonus_sends_available)
    cols = get_column_count("daily_send_limits")
    check("daily_send_limits: column count", 6, cols)
    rls = get_rls_status("daily_send_limits")
    check("daily_send_limits: RLS enabled", True, rls)
    policy_count = get_policy_count("daily_send_limits")
    check("daily_send_limits: policy count", 2, policy_count)

    # Function
    functions = get_functions()
    check("get_or_create_daily_limit function", True,
          "get_or_create_daily_limit" in functions)

    # Trigger
    triggers = get_triggers()
    check("push_subscriptions: updated_at trigger", True,
          "push_subscriptions_set_updated_at" in triggers)


def check_004_cycle_tracker():
    """T501: Cycle Tracker (004_cycle_tracker.sql)"""
    print("\n── T501: Cycle Tracker (004) ───────────────────")

    # cycle_config: 9 columns
    cols = get_column_count("cycle_config")
    check("cycle_config: column count", 9, cols)
    rls = get_rls_status("cycle_config")
    check("cycle_config: RLS enabled", True, rls)
    policy_count = get_policy_count("cycle_config")
    check("cycle_config: policy count", 3, policy_count)

    # cycle_logs: 7 columns
    cols = get_column_count("cycle_logs")
    check("cycle_logs: column count", 7, cols)
    rls = get_rls_status("cycle_logs")
    check("cycle_logs: RLS enabled", True, rls)
    policy_count = get_policy_count("cycle_logs")
    check("cycle_logs: policy count", 4, policy_count)

    # Trigger
    triggers = get_triggers()
    check("cycle_config: updated_at trigger", True,
          "cycle_config_set_updated_at" in triggers)

    # Index
    indexes = get_indexes("cycle_logs")
    check("cycle_logs: owner_date index", True,
          "cycle_logs_owner_date_idx" in indexes)


def check_005_coupons():
    """T601: Coupons (005_coupons.sql)"""
    print("\n── T601: Coupons (005) ─────────────────────────")

    # coupons: 18 columns
    cols = get_column_count("coupons")
    check("coupons: column count", 18, cols)
    rls = get_rls_status("coupons")
    check("coupons: RLS enabled", True, rls)
    policy_count = get_policy_count("coupons")
    check("coupons: policy count", 5, policy_count)

    # coupon_history: 6 columns
    cols = get_column_count("coupon_history")
    check("coupon_history: column count", 6, cols)
    rls = get_rls_status("coupon_history")
    check("coupon_history: RLS enabled", True, rls)
    policy_count = get_policy_count("coupon_history")
    check("coupon_history: policy count", 2, policy_count)

    # Triggers
    triggers = get_triggers()
    check("coupons: on_coupon_created trigger", True,
          "on_coupon_created" in triggers)
    check("coupons: updated_at trigger", True,
          "coupons_set_updated_at" in triggers)

    # Function
    functions = get_functions()
    check("handle_coupon_created function", True,
          "handle_coupon_created" in functions)

    # Indexes
    indexes = get_indexes("coupons")
    check("coupons: creator_id index", True,
          "coupons_creator_id_idx" in indexes)
    check("coupons: recipient_id index", True,
          "coupons_recipient_id_idx" in indexes)
    check("coupons: status index", True,
          "coupons_status_idx" in indexes)
    check("coupons: expires_at index", True,
          "coupons_expires_at_idx" in indexes)


def check_006_profiles_insert():
    """Migration 006: profiles insert policy"""
    print("\n── Migration 006: Profiles Insert Policy ───────")

    policies = get_policy_names("profiles")
    check("profiles: own insert policy", True,
          "profiles: own insert" in policies,
          f"policies: {policies}")

    # After 006, should have exactly 4 policies
    check("profiles: total policy count (with 006)", 4, len(policies))


def check_008_fix_partner_read():
    """Migration 008: Fix infinite recursion in partner read RLS policies."""
    print("\n── Migration 008: Fix Partner Read RLS ─────────")

    # 1. get_partner_id() function exists
    functions = get_functions()
    check("get_partner_id function exists", True,
          "get_partner_id" in functions)

    # 2. get_partner_id() is SECURITY DEFINER
    rows = query_remote(
        "SELECT routine_name, security_type "
        "FROM information_schema.routines "
        "WHERE routine_schema = 'public' AND routine_name = 'get_partner_id';"
    )
    sec_type = rows[0]["security_type"] if rows else "MISSING"
    check("get_partner_id: SECURITY DEFINER", "DEFINER", sec_type)

    # 3. profiles: partner read policy references get_partner_id()
    rows = query_remote(
        "SELECT policyname, qual FROM pg_policies "
        "WHERE tablename = 'profiles' AND policyname = 'profiles: partner read';"
    )
    profiles_qual = rows[0]["qual"] if rows else ""
    check("profiles: partner read uses get_partner_id()", True,
          "get_partner_id()" in profiles_qual,
          f"qual: {profiles_qual}")

    # 4. coyyns_wallets: partner read policy references get_partner_id()
    rows = query_remote(
        "SELECT policyname, qual FROM pg_policies "
        "WHERE tablename = 'coyyns_wallets' "
        "AND policyname = 'coyyns_wallets: partner read';"
    )
    wallets_qual = rows[0]["qual"] if rows else ""
    check("coyyns_wallets: partner read uses get_partner_id()", True,
          "get_partner_id()" in wallets_qual,
          f"qual: {wallets_qual}")

    # 5. get_partner_id() is callable without error (returns NULL for service role)
    rows = query_remote("SELECT public.get_partner_id() as partner_id;")
    check("get_partner_id() callable (no recursion)", True,
          len(rows) == 1,
          f"returned: {rows[0]['partner_id'] if rows else 'ERROR'}")


# ─── CROSS-CUTTING CHECKS ───────────────────────────────────

def check_global():
    """Cross-migration checks."""
    print("\n── Global Checks ──────────────────────────────")

    # All 10 expected tables
    tables = get_tables()
    expected_tables = [
        "coupons", "coupon_history",
        "coyyns_transactions", "coyyns_wallets",
        "cycle_config", "cycle_logs",
        "daily_send_limits",
        "notifications",
        "profiles",
        "push_subscriptions",
    ]
    for t in expected_tables:
        check(f"table exists: {t}", True, t in tables)

    check("total public tables", 10, len(tables),
          f"tables: {tables}")

    # All tables have RLS enabled
    all_rls = True
    for t in expected_tables:
        if not get_rls_status(t):
            all_rls = False
            break
    check("all tables: RLS enabled", True, all_rls)

    # Total policy count across all tables
    total_policies = sum(get_policy_count(t) for t in expected_tables)
    # Expected: profiles(4) + coyyns_wallets(2) + coyyns_transactions(2)
    #         + push_subscriptions(4) + notifications(3) + daily_send_limits(2)
    #         + cycle_config(3) + cycle_logs(4) + coupons(5) + coupon_history(2) = 31
    check_gte("total RLS policies (>=30)", 30, total_policies,
              f"counted {total_policies}")

    # Expected functions: set_updated_at, handle_new_user, handle_coyyn_transaction,
    #                     get_or_create_daily_limit, handle_coupon_created = 5
    functions = get_functions()
    check_gte("total public functions (>=5)", 5, len(functions),
              f"functions: {functions}")

    # Expected triggers in public: profiles_set_updated_at, on_coyyn_transaction_insert,
    #   coyyns_wallets_set_updated_at, push_subscriptions_set_updated_at,
    #   cycle_config_set_updated_at, on_coupon_created, coupons_set_updated_at = 7
    triggers = get_triggers()
    check_gte("total public triggers (>=7)", 7, len(triggers),
              f"triggers: {triggers}")


# ─── MAIN ────────────────────────────────────────────────────

def main():
    load_config()
    print(f"🔍 Validating Supabase DB: {PROJECT_REF}")
    print(f"   API: https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query")

    # Quick connectivity check
    test = query_remote("SELECT 1 as ok;")
    if not test:
        print("❌ Cannot connect to Supabase Management API")
        sys.exit(1)
    print("   Connected successfully.\n")

    check_global()
    check_001_auth_profiles()
    check_002_coyyns()
    check_003_notifications()
    check_004_cycle_tracker()
    check_005_coupons()
    check_006_profiles_insert()
    check_008_fix_partner_read()

    # ─── Summary ─────────────────────────────────────────
    print("\n" + "=" * 60)
    passed = [r for r in results if r.passed]
    failed = [r for r in results if not r.passed]

    print(f"  SUPABASE DB VALIDATION SUMMARY")
    print(f"  ✅ Passed: {len(passed)}/{len(results)}")
    if failed:
        print(f"  ❌ Failed: {len(failed)}/{len(results)}")
        print()
        for r in failed:
            print(f"  {r}")

    print("=" * 60)

    # ─── JSON output ─────────────────────────────────────
    if "--json" in sys.argv:
        summary = {
            "total": len(results),
            "passed": len(passed),
            "failed": len(failed),
            "checks": [
                {
                    "name": r.name,
                    "passed": r.passed,
                    "expected": str(r.expected),
                    "actual": str(r.actual),
                    "detail": r.detail,
                }
                for r in results
            ],
        }
        print(json.dumps(summary, indent=2))

    # ─── Per-migration summaries (for Validation Log) ────
    migration_checks = {
        "T201": [r for r in results if "profiles" in r.name.lower()
                 or "set_updated_at" in r.name.lower()
                 or "handle_new_user" in r.name.lower()],
        "T301": [r for r in results if "coyyns" in r.name.lower()
                 or "coyyn_transaction" in r.name.lower()],
        "T401": [r for r in results if any(x in r.name.lower() for x in
                 ["push_sub", "notification", "daily_send", "get_or_create"])],
        "T501": [r for r in results if "cycle" in r.name.lower()],
        "T601": [r for r in results if "coupon" in r.name.lower()],
    }

    print("\n── Per-Migration Summary ───────────────────────")
    for task_id, checks in migration_checks.items():
        task_passed = sum(1 for c in checks if c.passed)
        task_total = len(checks)
        icon = "✅" if task_passed == task_total else "❌"
        print(f"  {icon} {task_id}: {task_passed}/{task_total} checks passed")

    sys.exit(0 if not failed else 1)


if __name__ == "__main__":
    main()

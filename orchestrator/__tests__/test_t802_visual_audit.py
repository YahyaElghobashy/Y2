#!/usr/bin/env python3
"""Tests for T802: Visual Audit Integration into Orchestrator."""

import json
import sys
import os

# Add orchestrator directory to path so we can import the module's top-level constants
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# We only need the constants/functions, not the full runtime (which requires sheets_connector).
# Parse the file and extract what we need via exec with a mock.
import types

# Create a mock sheets_connector so the import succeeds
mock_sheets = types.ModuleType("sheets_connector")
mock_sheets.TaskQueueClient = type("TaskQueueClient", (), {})
sys.modules["sheets_connector"] = mock_sheets

import orchestrator


def test_import_succeeds():
    """orchestrator.py imports without syntax errors."""
    assert orchestrator is not None
    print("  ✅ import orchestrator — OK")


def test_audit_json_schema_has_visual_pass():
    """AUDIT_JSON_SCHEMA includes visual_pass as a required boolean field."""
    schema = json.loads(orchestrator.AUDIT_JSON_SCHEMA)
    assert "visual_pass" in schema["properties"], "visual_pass missing from properties"
    assert schema["properties"]["visual_pass"] == {"type": "boolean"}, "visual_pass should be boolean"
    assert "visual_pass" in schema["required"], "visual_pass missing from required"
    print("  ✅ AUDIT_JSON_SCHEMA includes visual_pass — OK")


def test_defaults_auditor_max_turns():
    """DEFAULTS['auditor_max_turns'] is 30."""
    assert orchestrator.DEFAULTS["auditor_max_turns"] == 30, \
        f"Expected 30, got {orchestrator.DEFAULTS['auditor_max_turns']}"
    print("  ✅ DEFAULTS['auditor_max_turns'] == 30 — OK")


def test_defaults_max_audit_minutes():
    """DEFAULTS['max_audit_minutes'] is 35."""
    assert orchestrator.DEFAULTS["max_audit_minutes"] == 35, \
        f"Expected 35, got {orchestrator.DEFAULTS['max_audit_minutes']}"
    print("  ✅ DEFAULTS['max_audit_minutes'] == 35 — OK")


def test_auditor_tools_has_screenshot():
    """auditor_tools string contains Bash(npm run screenshot:*)."""
    tools = orchestrator.DEFAULTS["auditor_tools"]
    assert "Bash(npm run screenshot:*)" in tools, \
        f"Bash(npm run screenshot:*) not found in auditor_tools: {tools}"
    print("  ✅ auditor_tools contains Bash(npm run screenshot:*) — OK")


def test_build_audit_prompt_has_step6():
    """build_audit_prompt() output contains 'STEP 6' and 'visual'."""
    task = {"Task ID": "T999", "Name": "Test Task"}
    prompt = orchestrator.build_audit_prompt(task, commit_hash="abc123")
    assert "STEP 6" in prompt, "STEP 6 not found in audit prompt"
    assert "visual" in prompt.lower(), "'visual' not found in audit prompt"
    assert "screenshot" in prompt.lower(), "'screenshot' not found in audit prompt"
    print("  ✅ build_audit_prompt() contains STEP 6 + visual — OK")


def test_config_floors_max_audit_minutes():
    """CONFIG_FLOORS['max_audit_minutes'] is 5.

    CONFIG_FLOORS is defined inside __init__, so we check the source directly.
    """
    import ast
    source_path = os.path.join(os.path.dirname(__file__), "..", "orchestrator.py")
    with open(source_path) as f:
        source = f.read()

    # Find CONFIG_FLOORS dict in the source
    assert '"max_audit_minutes": 5' in source, \
        "CONFIG_FLOORS should have max_audit_minutes: 5"
    print("  ✅ CONFIG_FLOORS['max_audit_minutes'] == 5 — OK")


if __name__ == "__main__":
    tests = [
        test_import_succeeds,
        test_audit_json_schema_has_visual_pass,
        test_defaults_auditor_max_turns,
        test_defaults_max_audit_minutes,
        test_auditor_tools_has_screenshot,
        test_build_audit_prompt_has_step6,
        test_config_floors_max_audit_minutes,
    ]

    passed = 0
    failed = 0
    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            print(f"  ❌ {test.__name__}: {e}")
            failed += 1

    print(f"\n{'='*40}")
    print(f"T802 Tests: {passed} passed, {failed} failed")
    if failed:
        sys.exit(1)
    print("All tests passing! ✅")

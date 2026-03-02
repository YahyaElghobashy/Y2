"""
Temporary script to add T801 and T802 to the Google Sheet Task Queue.
Run once, then delete this file.
"""
import sys
from sheets_connector import get_sheet

def main():
    sheet = get_sheet()
    tq = sheet.worksheet("Task Queue")

    # Read headers to match column order
    all_values = tq.get_all_values()
    header_idx = None
    for i, row in enumerate(all_values):
        if any("Task ID" in str(cell) for cell in row):
            header_idx = i
            break
    if header_idx is None:
        print("ERROR: Could not find 'Task ID' header in Task Queue sheet")
        sys.exit(1)

    headers = all_values[header_idx]
    print(f"Headers found at row {header_idx + 1}: {headers}")

    # Check if T801/T802 already exist
    existing_ids = {row[0].strip() for row in all_values[header_idx + 1:] if row[0].strip()}
    for tid in ("T801", "T802"):
        if tid in existing_ids:
            print(f"WARNING: {tid} already exists in sheet, skipping")
            if "T801" in existing_ids and "T802" in existing_ids:
                print("Both tasks already exist. Nothing to do.")
                return

    # Build rows matching header order
    t801_data = {
        "Task ID": "T801",
        "Name": "Visual audit infrastructure — screenshot script + puppeteer",
        "Type": "infra",
        "Phase": "8",
        "Expected Files": "scripts/visual-audit.sh, scripts/screenshot.mjs",
        "Test Requirements": "script runs and produces PNG",
        "Dependencies": "T107",
        "Status": "pending",
        "Priority": "10",
    }

    t802_data = {
        "Task ID": "T802",
        "Name": "Integrate visual audit into orchestrator auditor",
        "Type": "infra",
        "Phase": "8",
        "Expected Files": "orchestrator/orchestrator.py",
        "Test Requirements": "auditor produces visual_pass field",
        "Dependencies": "T801",
        "Status": "pending",
        "Priority": "20",
    }

    def build_row(data: dict) -> list:
        """Build a row list matching the header column order."""
        row = []
        for h in headers:
            row.append(data.get(h, ""))
        return row

    if "T801" not in existing_ids:
        row_t801 = build_row(t801_data)
        print(f"Appending T801: {row_t801}")
        tq.append_row(row_t801, value_input_option="USER_ENTERED")
        print("T801 added successfully")

    if "T802" not in existing_ids:
        row_t802 = build_row(t802_data)
        print(f"Appending T802: {row_t802}")
        tq.append_row(row_t802, value_input_option="USER_ENTERED")
        print("T802 added successfully")

    print("\nDone! Verify in the Google Sheet, then delete this script.")

if __name__ == "__main__":
    main()

"""
Engagement Party — Google Sheets Connector
==========================================
Reuses OAuth credentials from the orchestrator to read/write
the engagement planning spreadsheet.

Usage:
    python engagement_sheet.py --test    # verify connection
    python engagement_sheet.py read Invitees A1:M10
    python engagement_sheet.py read Dashboard A1:Z50
"""
from __future__ import annotations

import json
import sys
import os

# Ensure we can import from the same directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sheets_connector import authenticate

ENGAGEMENT_SPREADSHEET_ID = "1TsinpEpPBvDUE1gL8_IEqR7xGuJ1OBTouO8ul4sRSUI"

SHEETS = [
    "Dashboard", "Invitees", "Removed", "Venue Comparison",
    "Venues", "Vendors", "Other Expenses", "Budget", "Timeline",
]


def get_engagement_sheet():
    """Get authenticated gspread client and open the engagement spreadsheet."""
    import gspread
    creds = authenticate()
    client = gspread.authorize(creds)
    return client.open_by_key(ENGAGEMENT_SPREADSHEET_ID)


def read_range(sheet_name: str, cell_range: str = None):
    """Read a range from the engagement sheet. Returns list of lists."""
    spreadsheet = get_engagement_sheet()
    ws = spreadsheet.worksheet(sheet_name)
    if cell_range:
        return ws.get(cell_range)
    return ws.get_all_values()


def read_cell(sheet_name: str, cell: str):
    """Read a single cell value."""
    spreadsheet = get_engagement_sheet()
    ws = spreadsheet.worksheet(sheet_name)
    return ws.acell(cell).value


def write_range(sheet_name: str, cell_range: str, values: list[list]):
    """Write values to a range."""
    spreadsheet = get_engagement_sheet()
    ws = spreadsheet.worksheet(sheet_name)
    ws.update(cell_range, values, value_input_option="USER_ENTERED")


def append_rows(sheet_name: str, rows: list[list]):
    """Append rows to the bottom of a sheet."""
    spreadsheet = get_engagement_sheet()
    ws = spreadsheet.worksheet(sheet_name)
    ws.append_rows(rows, value_input_option="USER_ENTERED")


def find_next_empty_row(sheet_name: str, column: int = 1) -> int:
    """Find the next empty row in a given column (1-indexed)."""
    spreadsheet = get_engagement_sheet()
    ws = spreadsheet.worksheet(sheet_name)
    col_values = ws.col_values(column)
    return len(col_values) + 1


def test_connection():
    print()
    print("=" * 55)
    print("  ENGAGEMENT SHEET — CONNECTION TEST")
    print("=" * 55)
    print()

    try:
        spreadsheet = get_engagement_sheet()
        print(f"  Connected to: {spreadsheet.title}")
        print()

        # List all worksheets
        worksheets = spreadsheet.worksheets()
        print(f"  Worksheets ({len(worksheets)}):")
        for ws in worksheets:
            print(f"    - {ws.title} ({ws.row_count} rows x {ws.col_count} cols)")
        print()

        # Try reading Dashboard A1
        val = read_cell("Dashboard", "A1")
        print(f"  Dashboard!A1 = {repr(val)}")
        print()

        # Try reading Invitees headers
        headers = read_range("Invitees", "A1:M1")
        if headers:
            print(f"  Invitees headers: {headers[0]}")
        print()

        print("=" * 55)
        print("  ALL GOOD — ready to use")
        print("=" * 55)

    except Exception as e:
        print(f"  ERROR: {e}")
        print()
        print("  Check that the spreadsheet is shared with your Google account")
        sys.exit(1)


if __name__ == "__main__":
    # Change to script directory so token.json / client_secret.json are found
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    if "--test" in sys.argv:
        test_connection()
    elif len(sys.argv) >= 3 and sys.argv[1] == "read":
        sheet_name = sys.argv[2]
        cell_range = sys.argv[3] if len(sys.argv) > 3 else None
        result = read_range(sheet_name, cell_range)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print("Usage:")
        print("  python engagement_sheet.py --test")
        print("  python engagement_sheet.py read <SheetName> [CellRange]")

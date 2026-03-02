#!/bin/bash
# Y2 Overnight Orchestrator — Quick Start
# Run this from the Y2 System root directory

set -e

echo "══════════════════════════════════════════"
echo "  Y2 ORCHESTRATOR — PRE-FLIGHT CHECK"
echo "══════════════════════════════════════════"
echo ""

# Check we're in the right directory
if [ ! -f "CLAUDE.md" ]; then
    echo "❌ CLAUDE.md not found. Run this from the Y2 System root."
    exit 1
fi
echo "✅ In Y2 project root"

# Check Node project exists
if [ ! -f "package.json" ]; then
    echo "❌ No package.json. Run the Claude Code setup prompt first."
    exit 1
fi
echo "✅ Node project exists"

# Check npm build works
echo "🔨 Testing build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build passes"
else
    echo "❌ Build fails. Fix before running orchestrator."
    exit 1
fi

# Check Claude CLI
if ! command -v claude &> /dev/null; then
    echo "❌ 'claude' CLI not found. Install Claude Code first."
    exit 1
fi
echo "✅ Claude Code CLI available"

# Check Python deps
python3 -c "import gspread" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Installing Python dependencies..."
    pip3 install gspread google-auth google-auth-oauthlib
fi
echo "✅ Python dependencies installed"

# Check sheets connection
echo "🔗 Testing Sheets connection..."
cd orchestrator
python3 sheets_connector.py --test
if [ $? -ne 0 ]; then
    echo "❌ Sheets connection failed. Run 'python3 sheets_connector.py' for first auth."
    exit 1
fi
cd ..
echo ""

# Check prompt files exist
PROMPT_COUNT=$(ls -1 orchestrator/prompts/*.md 2>/dev/null | wc -l)
if [ "$PROMPT_COUNT" -eq 0 ]; then
    echo "❌ No prompt files in orchestrator/prompts/"
    exit 1
fi
echo "✅ Found $PROMPT_COUNT prompt files"

# Check git
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo "❌ Not a git repo. Initialize git first."
    exit 1
fi
echo "✅ Git repo active"

# Check .env.local
if [ ! -f ".env.local" ]; then
    echo "⚠️  No .env.local (Supabase won't work until Phase 2)"
fi

echo ""
echo "══════════════════════════════════════════"
echo "  ALL CHECKS PASSED"
echo "══════════════════════════════════════════"
echo ""
echo "Ready to run. Choose:"
echo ""
echo "  Dry run (preview only):"
echo "    python3 orchestrator/orchestrator.py --dry-run"
echo ""
echo "  Full overnight run:"
echo "    python3 orchestrator/orchestrator.py"
echo ""
echo "  Single task test:"
echo "    python3 orchestrator/orchestrator.py --task T101"
echo ""
read -p "Run dry-run now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python3 orchestrator/orchestrator.py --dry-run
fi

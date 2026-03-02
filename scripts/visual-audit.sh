#!/usr/bin/env bash
set -e

ROUTE="${1:-/}"
OUTPUT="${2:-/tmp/y2-audit-home.png}"
PORT=3099
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Build if .next/ doesn't exist
if [ ! -d "$PROJECT_DIR/.next" ]; then
  echo "Building app..."
  npm run build
fi

# Start production server in background
npx next start -p "$PORT" &
SERVER_PID=$!

# Wait for server to accept connections (max 15s)
TRIES=0
MAX_TRIES=30
until curl -s "http://localhost:$PORT" > /dev/null 2>&1; do
  TRIES=$((TRIES + 1))
  if [ "$TRIES" -ge "$MAX_TRIES" ]; then
    echo "Server failed to start within 15s"
    kill "$SERVER_PID" 2>/dev/null || true
    exit 1
  fi
  sleep 0.5
done

# Take screenshot
node "$SCRIPT_DIR/screenshot.mjs" "http://localhost:${PORT}${ROUTE}" "$OUTPUT"

# Cleanup
kill "$SERVER_PID" 2>/dev/null || true

echo "$OUTPUT"

#!/bin/bash
# View latest server logs

LOGS_DIR="./logs"

if [ ! -d "$LOGS_DIR" ]; then
  echo "No logs directory found at $LOGS_DIR"
  exit 1
fi

# Find the most recent log file
LATEST_LOG=$(ls -t "$LOGS_DIR"/*.log 2>/dev/null | head -1)

if [ -z "$LATEST_LOG" ]; then
  echo "No log files found in $LOGS_DIR"
  exit 1
fi

echo "=================================="
echo "Viewing latest log file:"
echo "$LATEST_LOG"
echo "=================================="
echo ""
tail -f "$LATEST_LOG"

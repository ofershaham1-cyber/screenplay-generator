#!/bin/bash
# Simple test runner that starts the dev server separately

echo "Starting dev server..."
npm run dev > /tmp/dev-server.log 2>&1 &
DEV_PID=$!

echo "Waiting for server to be ready..."
sleep 10

echo "Running Playwright tests..."
npx playwright test "$@"
TEST_EXIT_CODE=$?

echo "Stopping dev server..."
kill $DEV_PID 2>/dev/null || true

exit $TEST_EXIT_CODE

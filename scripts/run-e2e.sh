#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "=== Seeding test data ==="
npx tsx scripts/seed-test-data.ts

echo "=== Running Maestro driver shift flow ==="
MAESTRO_EXIT=0
maestro test .maestro/driver/shift-flow.yaml || MAESTRO_EXIT=$?

echo "=== Resetting test data ==="
npx tsx scripts/reset-test-data.ts

if [ $MAESTRO_EXIT -ne 0 ]; then
  echo "Maestro tests failed (exit $MAESTRO_EXIT)"
  exit $MAESTRO_EXIT
fi

echo "=== All E2E tests passed ==="

#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# AdTruck Driver — Demo Launcher
# Usage: pnpm demo
# Opens the app on the iPhone 16e simulator at the login page.
# ─────────────────────────────────────────────────────────
set -euo pipefail

UDID="A4152A57-003A-47D9-8713-D7E0FFB3D04D"
APP_ID="com.adtruck-driver-native.development"
SCHEME="exp+adtruck-driver-native"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

step() { echo -e "${CYAN}▶ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

echo ""
echo -e "${GREEN}AdTruck Driver — Demo Launcher${NC}"
echo "────────────────────────────────"

# ── 1. Boot simulator ────────────────────────────────────
step "Checking simulator..."
SIM_STATE=$(xcrun simctl list devices | grep "$UDID" | grep -oE 'Booted|Shutdown' || true)
if [ "$SIM_STATE" != "Booted" ]; then
  step "Booting iPhone 16e..."
  xcrun simctl boot "$UDID"
fi
open -a Simulator
ok "iPhone 16e ready"

# ── 2. Find or start Metro (must be THIS project) ────────
step "Checking Metro bundler..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
METRO_PORT=""

# Find a Metro process whose command path matches this project directory
for PORT in 8081 8082 8083 8084; do
  PID=$(lsof -nP -iTCP:"$PORT" 2>/dev/null | grep LISTEN | awk '{print $2}' | head -1)
  if [ -n "$PID" ]; then
    CMD=$(ps -p "$PID" -o command= 2>/dev/null || true)
    if echo "$CMD" | grep -q "$PROJECT_DIR"; then
      METRO_PORT=$PORT
      break
    fi
  fi
done

if [ -z "$METRO_PORT" ]; then
  # Find a free port starting from 8081
  for PORT in 8081 8082 8083 8084; do
    if ! lsof -nP -iTCP:"$PORT" 2>/dev/null | grep -q LISTEN; then
      METRO_PORT=$PORT
      break
    fi
  done
  step "Starting Metro on port $METRO_PORT..."
  pnpm start --port "$METRO_PORT" > /tmp/metro-demo.log 2>&1 &
  echo "  Waiting for Metro to be ready..."
  for i in $(seq 1 20); do
    if lsof -nP -iTCP:"$METRO_PORT" 2>/dev/null | grep -q LISTEN; then
      break
    fi
    sleep 1
  done
  ok "Metro started on port $METRO_PORT"
else
  ok "Metro already running on port $METRO_PORT"
fi

# ── 3. Clear app state → login page ─────────────────────
step "Clearing app session (login page)..."
xcrun simctl terminate "$UDID" "$APP_ID" 2>/dev/null || true
APP_DATA=$(xcrun simctl get_app_container "$UDID" "$APP_ID" data 2>/dev/null || true)
if [ -n "$APP_DATA" ]; then
  rm -rf "${APP_DATA:?}/Library/Application Support"
  rm -rf "${APP_DATA:?}/Documents"
fi
ok "Session cleared"

# ── 4. Launch app ────────────────────────────────────────
step "Launching app..."
sleep 1
DEEP_LINK="${SCHEME}://expo-development-client/?url=http%3A%2F%2Flocalhost%3A${METRO_PORT}%3FdisableOnboarding%3D1"
xcrun simctl openurl "$UDID" "$DEEP_LINK"

echo ""
echo -e "${GREEN}────────────────────────────────${NC}"
echo -e "${GREEN}  App is live on iPhone 16e!${NC}"
echo -e "${GREEN}  Login: driver1 / DriverPass123!${NC}"
echo -e "${GREEN}────────────────────────────────${NC}"
echo ""

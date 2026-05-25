#!/bin/bash

SERIAL_PORT="/dev/cu.SLAB_USBtoUART"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== RADAR SYSTEM ==="

# Install bridge deps if needed
if [ ! -d "$PROJECT_DIR/bridge/node_modules" ]; then
  echo "[SETUP] Installing bridge dependencies..."
  cd "$PROJECT_DIR/bridge" && npm install
fi

# Install web deps if needed
if [ ! -d "$PROJECT_DIR/web/node_modules" ]; then
  echo "[SETUP] Installing web dependencies..."
  cd "$PROJECT_DIR/web" && npm install
fi

# Check serial port
if ! ls "$SERIAL_PORT" &>/dev/null; then
  echo "[ERROR] ESP32 not found at $SERIAL_PORT"
  echo "        Plug in the ESP32 and try again."
  exit 1
fi

echo "[OK]    ESP32 found at $SERIAL_PORT"

# Start bridge
echo "[START] Starting bridge..."
cd "$PROJECT_DIR/bridge"
SERIAL_PORT=$SERIAL_PORT node bridge.js &
BRIDGE_PID=$!

# Start web UI
echo "[START] Starting web UI..."
cd "$PROJECT_DIR/web"
npm run dev &
WEB_PID=$!

echo ""
echo "Bridge PID: $BRIDGE_PID"
echo "Web    PID: $WEB_PID"
echo ""
echo "Open: http://localhost:3000"
echo "Press Ctrl+C to stop everything."
echo ""

# Stop both on exit
trap "echo ''; echo '[STOP] Shutting down...'; kill $BRIDGE_PID $WEB_PID 2>/dev/null; exit" INT TERM

wait

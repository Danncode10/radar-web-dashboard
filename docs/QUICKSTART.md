# Quick Start - Running the UI

## Prerequisites
- Node.js 18+
- ESP32 flashed with firmware
- Bridge running (or just to see UI, skip this)

## Step 1: Install Dependencies

```bash
cd web
npm install
```

## Step 2: Start the Dashboard

```bash
npm run dev
```

Expected output:
```
▲ Next.js 14.0.0
  - Local:        http://localhost:3000
```

## Step 3: Open in Browser

```
http://localhost:3000
```

You'll see the radar dashboard. It will show "DISCONNECTED" until the bridge is running.

## To See Live Data (Optional)

You need 3 terminals running:

**Terminal 1 - Flash ESP32:**
- Open `arduino/radar.ino` in Arduino IDE
- Tools → Board → ESP32 Dev Module
- Tools → Port → Your ESP32 port
- Click Upload

**Terminal 2 - Start Bridge:**
```bash
cd bridge
npm install
SERIAL_PORT=/dev/cu.usbmodem14101 npm start
```
(Replace `/dev/cu.usbmodem14101` with your actual port - find it with `ls /dev/cu.*`)

**Terminal 3 - Start Dashboard:**
```bash
cd web
npm run dev
```

Then open http://localhost:3000 to see the radar in action.

## Troubleshooting

**"Cannot find module"?**
```bash
npm install
```

**"Port already in use"?**
```bash
# Find what's using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

**Dashboard won't connect to bridge?**
- Check bridge is running (Terminal 2)
- Verify it says "WebSocket Server ready"
- Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)

That's it! Check WIRING.md for hardware setup.

# Getting Started - Radar System

Welcome! This guide will help you set up and run the Radar System project in 5 steps.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **Arduino IDE** 2.x ([Download](https://www.arduino.cc/en/software))
- **Mac/Linux** with USB port
- **ESP32 DevKit** board
- All hardware components (see [Hardware Guide](./HARDWARE.md))

## Quick Setup (5 minutes)

### Step 1: Install ESP32 Board Support

1. Open Arduino IDE
2. Go to **Preferences** (Arduino IDE → Preferences on Mac, File → Preferences on Linux/Windows)
3. Add this URL to "Additional Boards Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search for "esp32" and install **esp32** by Espressif Systems

### Step 2: Flash ESP32 with Firmware

1. Connect ESP32 to your Mac via USB
2. Open `arduino/radar.ino` in Arduino IDE
3. Select **Tools → Board → esp32 → ESP32 Dev Module**
4. Select **Tools → Upload Speed → 921600**
5. Select **Tools → Port → /dev/cu.*** (your ESP32 port)
6. Click **Upload** button

**Expected Output in Serial Monitor (115200 baud):**
```
READY
0,150.00
2,148.50
4,149.20
...
```

> **Connection Issues?** See [Troubleshooting: ESP32 Connection](./TROUBLESHOOTING.md#esp32-connection-issues)

### Step 3: Install Bridge Dependencies

```bash
cd bridge
npm install
```

### Step 4: Install Web Dashboard Dependencies

```bash
cd web
npm install
```

### Step 5: Run Everything

You'll need **three terminal windows** running simultaneously:

#### Terminal 1 — Serial Bridge

```bash
cd bridge
SERIAL_PORT=/dev/cu.usbmodem14101 npm start
```

Replace `/dev/cu.usbmodem14101` with your actual port (find it with `ls /dev/cu.*`)

Expected output:
```
[HH:MM:SS] [WS    ] Server ready → ws://localhost:8080
[HH:MM:SS] [SERIAL] Connected → /dev/cu.usbmodem14101 @ 115200 baud
[DATA]  0° →  150.00cm
[DATA]  2° →  148.50cm
```

#### Terminal 2 — Next.js Dashboard

```bash
cd web
npm run dev
```

Expected output:
```
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local
```

#### Terminal 3 — Serial Monitor (Optional)

To verify the ESP32 is sending data correctly:

```bash
ls /dev/cu.*  # Find your port
screen /dev/cu.usbmodem14101 115200
# Press Ctrl+A then Ctrl+D to exit
```

### Step 6: Open Dashboard

Open your browser to **http://localhost:3000**

You should see:
- Green military-style radar display
- Sweep line moving from 0° to 180°
- Blips appearing where objects are detected
- Status panel showing connection status, angle, distance

## Wiring Overview

Quick reference (full details in [Hardware Setup](./HARDWARE.md)):

```
ESP32 Pins:
- GPIO 14  → SG90 Servo Signal
- GPIO 26  → HC-SR04 TRIG
- GPIO 27  → HC-SR04 ECHO
- GPIO 32  → LED Anode (with 220Ω resistor)
- 5V       → Servo VCC + Sensor VCC
- GND      → Servo GND + Sensor GND + LED Cathode
```

## What's Next?

- **Customize settings** → See [Configuration Guide](./CONFIGURATION.md)
- **Understand the code** → See [Architecture](./ARCHITECTURE.md)
- **Hit a problem?** → See [Troubleshooting](./TROUBLESHOOTING.md)
- **Deploy to production** → See [Deployment Guide](./DEPLOYMENT.md)

## Need Help?

Check the [Troubleshooting Guide](./TROUBLESHOOTING.md) for common issues, or review the main [README.md](../README.md) for detailed architecture information.

# ◈ RADAR SYSTEM
### Ultrasonic Radar with Real-Time Web Dashboard
**ESP32 · Node.js · Next.js · WebSocket**

> A real-time 2D radar system using an HC-SR04 ultrasonic sensor mounted on an SG90 servo, streaming live scan data to a military-style web dashboard over WebSocket. Built with ESP32 microcontroller for enhanced performance and connectivity.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Software Engineering Concepts](#3-software-engineering-concepts)
4. [Hardware Requirements](#4-hardware-requirements)
5. [Wiring Diagram](#5-wiring-diagram)
6. [Project Structure](#6-project-structure)
7. [Installation & Setup](#7-installation--setup)
8. [Running the Project](#8-running-the-project)
9. [How It Works](#9-how-it-works)
10. [Configuration](#10-configuration)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Project Overview

This project implements a functional radar system across three layers:

| Layer | Technology | Responsibility |
|---|---|---|
| **Hardware** | Arduino + SG90 + HC-SR04 | Physical scan, LED alert |
| **Bridge** | Node.js + SerialPort + ws | Protocol translation |
| **Dashboard** | Next.js + Canvas API | Real-time visualization |

The servo sweeps from **0° to 180°** continuously. At every 2° step, the ultrasonic sensor fires and measures distance. That reading is immediately sent over USB Serial to a Node.js bridge, which rebroadcasts it via WebSocket to any connected browser. The browser renders a live military-style radar using the HTML5 Canvas API.

An **LED on the Arduino** lights up when an object is within 50cm — a hardware-level alert that works independently of the software dashboard.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        HARDWARE LAYER                        │
│                                                             │
│   [SG90 Servo] ──→ sweeps 0°–180°                          │
│   [HC-SR04]    ──→ reads distance at each angle             │
│   [LED]        ──→ alerts when object < 50cm                │
│   [ESP32]      ──→ orchestrates all hardware (GPIO control)│
│         │                                                   │
│         │  USB Serial  "angle,distance\n"  @ 115200 baud    │
└─────────┼───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                        BRIDGE LAYER                          │
│                                                             │
│   bridge.js (Node.js)                                       │
│     ├── SerialPort  ──→ reads raw serial stream             │
│     ├── ReadlineParser ──→ splits by newline                │
│     ├── validates & parses CSV line                         │
│     └── WebSocket Server ──→ broadcasts JSON to all clients │
│                                                             │
│   Payload: { angle: 90, distance: 35.4, timestamp: ... }   │
└─────────────────────────────────────────────────────────────┘
          │
          │  WebSocket  ws://localhost:8080
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│                                                             │
│   Next.js App (localhost:3000)                              │
│     ├── useRadar() hook ──→ manages WS connection & state   │
│     ├── RadarCanvas   ──→ rAF render loop, Canvas API       │
│     ├── DataPanel     ──→ live angle, distance, status      │
│     └── StatusDot     ──→ connection health indicator       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow (one scan step)

```
Arduino writes "90,35.40\n" to Serial
    → bridge.js receives line via ReadlineParser
    → bridge parses → { angle: 90, distance: 35.4, timestamp: 1716600000000 }
    → bridge JSON.stringify() → sends to all WS clients
    → browser WebSocket.onmessage fires
    → useRadar() hook updates sweepAngleRef + detectionsRef
    → requestAnimationFrame loop reads latest refs on next frame
    → Canvas redraws sweep line at 90°, blip at (90°, 35.4cm)
```

---

## 3. Software Engineering Concepts

### 3.1 Producer-Consumer Pattern

The system is built on a clean **producer-consumer** separation:

- **Producer**: Arduino produces raw sensor data
- **Intermediary**: Bridge translates protocols (Serial → WebSocket)
- **Consumer**: Dashboard consumes structured JSON and renders it

This decoupling means you could swap the Arduino for a simulation script, or replace the Next.js frontend with a Python plotter — neither change requires touching the other layers.

### 3.2 Observer Pattern (Event-Driven Architecture)

The bridge and the frontend both use the **Observer pattern**:

```
Bridge (Subject) ────────── broadcasts JSON ──────────→ Browser (Observer)
                     WebSocket event subscription
```

The browser registers a callback (`ws.onmessage`) and gets notified automatically when new data arrives — it never polls. This is identical to how real-time trading platforms, live dashboards, and chat apps work.

### 3.3 Separation of Concerns

Each file has **one job**:

| File | Single Responsibility |
|---|---|
| `radar.ino` | Hardware control only — no networking, no display logic |
| `bridge.js` | Protocol translation only — Serial in, WebSocket out |
| `useRadar()` | Data layer — WebSocket state management |
| `RadarCanvas` | View layer — render loop, Canvas drawing only |
| `DataPanel` | UI layer — display formatted readings |

### 3.4 Reactive State with Refs vs State

The dashboard distinguishes between two types of data:

| Type | Tool | Why |
|---|---|---|
| **High-frequency render data** (sweep angle, blips) | `useRef` | No re-render triggered; Canvas rAF loop reads directly |
| **Low-frequency UI data** (status, alert flag) | `useState` | Needs React re-render to update DOM elements |

Using `useRef` for the Canvas data is a deliberate performance optimization — triggering a React re-render at 30+ fps would be wasteful and cause jank.

### 3.5 Custom Hook Pattern

`useRadar()` is a **custom React hook** that encapsulates:
- WebSocket lifecycle (connect, disconnect, auto-reconnect)
- Data parsing and validation
- State updates

This keeps the Page component clean and testable. If you wanted to unit test the WebSocket logic, you'd test `useRadar()` in isolation.

### 3.6 Coordinate System Transformation

The radar requires a **polar-to-Cartesian transformation** to convert sensor data into canvas pixel positions:

```
Polar input:     angle (degrees), distance (cm)
Cartesian output: x (px), y (px) on HTML Canvas

Formula:
  r   = (distance / MAX_DIST) × RADIUS_PX
  rad = angle × (π / 180)
  x   = CENTER_X − r × cos(rad)
  y   = CENTER_Y − r × sin(rad)

Note: Center is at the bottom of the canvas (CY = canvas height)
      so the semicircle opens upward, matching the servo's sweep.
```

This is the same math used in actual radar systems, GIS mapping, and robotics navigation (SLAM).

### 3.7 Auto-Reconnect Strategy

The WebSocket client implements a **reconnect with delay** strategy:

```javascript
ws.onclose = () => {
  setStatus('RECONNECTING');
  setTimeout(connect, 3000); // retry after 3 seconds
};
```

This means if the bridge restarts (or the Arduino is replugged), the browser automatically reconnects without any user action.

---

## 4. Hardware Requirements

| Component | Quantity | Notes |
|---|---|---|
| **ESP32 DevKit** | 1 | Recommended over Arduino Uno for better performance & WiFi capability |
| SG90 Micro Servo | 1 | The same blue SG90 |
| HC-SR04 Ultrasonic Sensor | 1 | "Ultrasonic Distance Sensor Module" |
| Red/Green LED | 1 | 5mm standard LED |
| 220Ω Resistor | 1 | For the LED current limiting |
| Breadboard | 1 | Half or full size |
| Jumper Wires | ~12 | Male-to-male |
| USB-A to USB-C Cable | 1 | ESP32 to Mac (most ESP32 boards use USB-C) |

**Total estimated cost:** ₱200–400 (most likely already in your kit)

> **Board Selection:** This project is optimized for **ESP32** (recommended). Arduino Uno / Nano support is legacy; pins and timing may differ. Use ESP32 for best results.

---

## 5. Wiring Diagram

### ESP32 Pinout (Recommended)

```
ESP32 DevKit
───────────────────────────────────────────────
GPIO 14 (D14)  ─────────────── SG90 Signal (orange)
GPIO 26 (D26)  ─────────────── HC-SR04 TRIG
GPIO 27 (D27)  ◄── [1kΩ+2kΩ divider] ── HC-SR04 ECHO
GPIO 32 (D32)  ──── [220Ω] ──── LED Anode (+)
VIN (=USB 5V)  ──┬─────────────── SG90 VCC (red)
                └─────────────── HC-SR04 VCC
GND            ──┬─────────────── SG90 GND (brown/black)
                ├─────────────── HC-SR04 GND
                └─────────────── LED Cathode (-)
───────────────────────────────────────────────

HC-SR04: connect by LABEL, not position (pin order varies by module).
  Labels are some order of: VCC | TRIG | ECHO | GND

SG90 wire colors:
  Brown = GND | Red = VCC | Orange = Signal
```

> **Physical setup tip:** Hot-glue or tape the HC-SR04 to the SG90 servo horn so it rotates with the servo. Keep wires loose enough to allow full 0°–180° sweep.

> **⚠️ ECHO needs a voltage divider.** HC-SR04 ECHO outputs 5V, but ESP32 GPIO is only 3.3V-tolerant. Put a 1kΩ (R1) + 2kΩ (R2) divider on the ECHO line — tap GPIO 27 at the R1/R2 junction. The board's 5V pin is labeled **`VIN`** (USB pass-through), not "5V". Full details and a diagram: [docs/WIRING.md](docs/WIRING.md).

> **Note:** GPIO pins can be remapped in firmware. The pins above are the default configuration—adjust in `radar.ino` if needed.

---

## 6. Project Structure

```
radar-project/
│
├── README.md                    ← You are here
│
├── arduino/
│   └── radar.ino                ← Arduino firmware (servo + sensor + LED)
│
├── bridge/
│   ├── package.json             ← Node.js dependencies
│   └── bridge.js                ← Serial-to-WebSocket bridge
│
└── web/                         ← Next.js application
    ├── package.json
    ├── pages/
    │   ├── _app.js              ← Global CSS import
    │   └── index.js             ← Radar dashboard (main page)
    └── styles/
        └── globals.css          ← CRT scanline effect, CSS variables, fonts
```

---

## 7. Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Arduino IDE](https://www.arduino.cc/en/software) 2.x (with ESP32 board support installed)
- Mac with USB-C port
- **ESP32 Setup:** Install ESP32 board definition by adding this URL to Arduino IDE preferences:
  - `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
  - Then go to **Tools → Board → Boards Manager** and install **esp32** by Espressif Systems

### Step 1 — Flash ESP32

1. Open `arduino/radar.ino` in Arduino IDE
2. Select **Tools → Board → esp32 → ESP32 Dev Module** (or your specific ESP32 variant)
3. Select **Tools → Upload Speed → 921600** (faster than Arduino Uno)
4. Select **Tools → Port** → choose your ESP32 port (e.g. `/dev/cu.usbserial-14101` or `/dev/cu.wchusbserial1410`)
5. Click **Upload**
6. Open Serial Monitor at **115200 baud** — you should see `90,35.40` style output

> **Connection Issues?** Some ESP32 boards need the CH340 or CP2102 driver. Download from:
> - [CH340 Driver](https://github.com/WCHSoftware/ch340-driver)
> - [CP2102 Driver](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers)

### Step 2 — Install Bridge Dependencies

```bash
cd bridge
npm install
```

### Step 3 — Install Web Dependencies

```bash
cd web
npm install
```

---

## 8. Running the Project

You need **two terminals** running simultaneously.

### Terminal 1 — Serial Bridge

First, find your Arduino port:
```bash
ls /dev/cu.*
# Look for something like /dev/cu.usbmodem14101
```

Then start the bridge:
```bash
cd bridge
SERIAL_PORT=/dev/cu.usbmodem14101 node bridge.js
```

You should see:
```
[10:32:01] [WS    ] Server ready → ws://localhost:8080
[10:32:02] [SERIAL] Connected → /dev/cu.usbmodem14101 @ 115200 baud
[DATA]  90° →  35.40cm
```

### Terminal 2 — Next.js Dashboard

```bash
cd web
npm run dev
```

Then open **http://localhost:3000** in your browser.

The radar should immediately show the sweep line moving and blips appearing for detected objects.

---

## 9. How It Works

### Arduino Sweep Cycle

```
1. Servo moves to angle (0, 2, 4, ... 178, 180)
2. Wait 30ms for servo to settle
3. Fire TRIG pulse (10µs HIGH)
4. Measure ECHO pulse duration
5. Convert duration → distance: d = (duration × 0.0343) / 2
6. If distance < 50cm → LED ON, else LED OFF
7. Serial.println("angle,distance")
8. Repeat in reverse (180 → 0)
```

### Bridge Data Pipeline

```
SerialPort reads bytes → ReadlineParser buffers until '\n'
→ Validate CSV format (must be 2 parts)
→ parseFloat both values
→ JSON.stringify({ angle, distance, timestamp })
→ wss.clients.forEach → client.send(payload)
```

### Canvas Render Loop

```
requestAnimationFrame(render) runs ~60fps

Each frame:
1. Semi-transparent fill (rgba(0,8,0,0.82)) → creates phosphor persistence
2. Draw 4 range rings (semicircles)
3. Draw 7 angle lines (0°, 30°, 60°... 180°)
4. Draw sweep trail (30° gradient behind sweep line)
5. Draw main sweep line at current angle (from sweepAngleRef)
6. Evict blips older than 5 seconds
7. Draw remaining blips (fade alpha by age)
8. Draw base line + origin dot
```

---

## 10. Configuration

All tuneable constants are in `web/pages/index.js` at the top:

```javascript
const MAX_DIST        = 200;   // cm — maximum sensor range
const ALERT_DIST      = 50;    // cm — LED + red border trigger
const BLIP_LIFETIME   = 5000;  // ms — how long blips stay visible
const SWEEP_TRAIL_DEG = 30;    // degrees of green trail behind sweep
```

On Arduino (`arduino/radar.ino`):

```cpp
const int   SWEEP_STEP      = 2;     // degrees per step (smaller = slower but denser)
const int   STEP_DELAY_MS   = 30;    // ms per step (increase if servo misses steps)
const float ALERT_DISTANCE  = 50.0;  // cm — LED trigger distance
```

---

## 11. Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| ESP32 not showing in Arduino IDE | Missing board definition | Add ESP32 board URL to preferences (see Prerequisites) |
| "Port not found" when uploading | USB driver missing | Install CH340/CP2102 drivers for your ESP32 board |
| Dashboard shows "CONNECTING" | Bridge not running | Start `node bridge.js` in terminal 1 |
| Bridge says "Error: No such file" | Wrong serial port | Run `ls /dev/cu.*` to find correct port |
| No blips showing | HC-SR04 loose / not wired | Check TRIG=GPIO 26, ECHO=GPIO 27 (ESP32 pins) |
| Servo not moving | SG90 not on GPIO 14 | Check wiring, ensure common GND |
| Blips everywhere / noisy | Sensor too close to surface | Minimum reliable range is ~5cm |
| LED never turns on | Check GPIO 32 wiring + resistor | LED needs 220Ω resistor in series |
| "Port is already in use" | Serial Monitor open | Close Serial Monitor before running bridge |
| ESP32 keeps resetting | Power supply issue | Use USB with adequate power (use powered USB hub if needed) |

---

## Built With

- **[ESP32](https://www.espressif.com/en/products/microcontrollers/esp32/overview)** — WiFi-capable 32-bit microcontroller (Recommended)
  - [ESP32 Arduino Core Docs](https://docs.espressif.com/projects/arduino-esp32/en/latest/)
  - [Pin Reference & GPIO Guide](https://github.com/espressif/arduino-esp32/blob/master/variants/esp32/)
- [Arduino](https://www.arduino.cc/) — Microcontroller platform
- [SerialPort (npm)](https://serialport.io/) — Node.js Serial communication
- [ws (npm)](https://github.com/websockets/ws) — WebSocket server
- [Next.js](https://nextjs.org/) — React framework
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) — Hardware-accelerated 2D rendering
- [Share Tech Mono](https://fonts.google.com/specimen/Share+Tech+Mono) — Radar display font

---

*NVSU — College of Information Technology and Engineering*
*Robotics I — Final Project*

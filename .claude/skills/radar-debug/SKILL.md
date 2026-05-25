---
name: radar-debug
description: Diagnose why the radar isn't working by checking the pipeline end to end — ESP32 serial output, the Node bridge, and the web dashboard WebSocket. Use when the user says the radar/dashboard isn't updating, shows DISCONNECTED, has no blips, or "nothing happens".
---

# Radar Pipeline Debug

The data path is: **ESP32 (serial) → bridge.js (WebSocket :8080) → Next.js dashboard (:3000)**.
A failure at any stage looks like "the dashboard is dead." Test each stage in order and
stop at the first one that's broken — that's the culprit.

## Stage 1 — Is the ESP32 sending data?

```bash
ls /dev/cu.*                                   # find the port
arduino-cli monitor -p <PORT> -c baudrate=115200
```
- **See `READY` + `angle,distance` lines** → hardware OK, go to Stage 2.
- **See nothing** → firmware not flashed or wrong port → use the `flash-esp32` skill.
- **See garbage characters** → wrong baud; it must be 115200.
- **Distance always 0 / wildly wrong** → wiring. Check the ECHO **voltage divider**
  (1kΩ+2kΩ) and that TRIG=GPIO26, ECHO=GPIO27. See `docs/WIRING.md`.

> Close the monitor before Stage 2 — the bridge can't open the port while it's held.

## Stage 2 — Is the bridge running and reading serial?

```bash
cd bridge && SERIAL_PORT=<PORT> npm start
```
Expected:
```
[..] [WS    ] Server ready → ws://localhost:8080
[..] [SERIAL] Connected → <PORT> @ 115200 baud
[DATA]  90° →  35.40cm
```
- **"Error: No such file"** → wrong `SERIAL_PORT`.
- **"Port is already in use"** → the serial monitor or another bridge is still open; close it.
- **Connects but no `[DATA]` lines** → Stage 1 isn't actually sending; recheck firmware.

Confirm the port is listening:
```bash
lsof -i :8080
```

## Stage 3 — Is the dashboard connecting?

```bash
cd web && npm run dev      # serves http://localhost:3000
```
Open http://localhost:3000 and check the status panel:
- **CONNECTED + moving sweep** → everything works.
- **DISCONNECTED / RECONNECTING** → bridge (Stage 2) isn't running, or the WebSocket URL
  is wrong. The dashboard connects to `ws://localhost:8080` in `web/pages/index.js`
  (`useRadar` hook). If the bridge runs on another machine, change `localhost` to its IP.
- **CONNECTED but no blips** → bridge is connected to the browser but getting no serial
  data → the problem is really Stage 1/2.

Check the browser console (F12) for WebSocket errors, and the Network tab for the
`ws://localhost:8080` connection.

## Quick reference
| Symptom | Broken stage | First thing to check |
|---|---|---|
| No serial output | 1 (ESP32) | Re-flash via `flash-esp32`, verify port |
| Bridge: "port busy" | 1↔2 | Close serial monitor / other bridge |
| Bridge: no `[DATA]` | 1 | Firmware / wiring (ECHO divider) |
| Dashboard DISCONNECTED | 2 | Is `npm start` running in `bridge/`? |
| Connected, no blips | 1/2 | Serial data not flowing |

Full wiring details: `docs/WIRING.md`. Run instructions: `docs/QUICKSTART.md`.

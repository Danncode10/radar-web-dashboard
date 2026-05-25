---
name: flash-esp32
description: Compile and upload the radar firmware (arduino/radar.ino) to the ESP32 from the command line using arduino-cli, then verify serial output. Use when the user asks to flash, upload, build, or program the ESP32, or says the board has old/no firmware.
---

# Flash ESP32 Radar Firmware

Compiles `arduino/radar.ino` and uploads it to a connected ESP32 using `arduino-cli`
(no need to open the Arduino IDE). Then confirms the board is sending `angle,distance` data.

## Board facts for this project
- **FQBN:** `esp32:esp32:esp32`
- **Sketch:** `arduino/radar.ino` (uses only built-in functions — no extra libraries)
- **Serial baud:** `115200`
- **Expected output:** `READY`, then lines like `90,35.40`

## Step 1 — Make sure arduino-cli is installed

```bash
arduino-cli version || brew install arduino-cli
```

## Step 2 — Install ESP32 board support (first time only)

```bash
arduino-cli config init 2>/dev/null || true
arduino-cli config add board_manager.additional_urls \
  https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
arduino-cli core update-index
arduino-cli core install esp32:esp32
```

## Step 3 — Find the serial port

```bash
arduino-cli board list
# or:
ls /dev/cu.*        # mac  -> e.g. /dev/cu.usbserial-0001 or /dev/cu.usbmodem14101
# Linux: ls /dev/ttyUSB*    Windows: COM3, COM4, ...
```

Save the port; you need it for upload. **Close anything else using the port** (Arduino
IDE Serial Monitor, the running bridge) or the upload/monitor will fail with "port busy".

## Step 4 — Compile

```bash
arduino-cli compile --fqbn esp32:esp32:esp32 arduino
```
A clean compile prints `Sketch uses ... bytes`. Fix any errors before uploading.

## Step 5 — Upload

```bash
arduino-cli upload -p <PORT> --fqbn esp32:esp32:esp32 arduino
```
Replace `<PORT>` with the value from Step 3.
If upload stalls at "Connecting...", hold the **BOOT** button on the ESP32 until it starts.

## Step 6 — Verify serial output

```bash
arduino-cli monitor -p <PORT> -c baudrate=115200
```
You should see `READY` then a stream of `angle,distance` lines. Press `Ctrl+C` to stop.
**Stop the monitor before starting the bridge** — only one program can hold the port.

## Notes
- The firmware does its own servo PWM and echo timing, so no libraries are required.
- If you later switch to the `ESP32Servo` library, install it with
  `arduino-cli lib install ESP32Servo` and re-compile.
- Pin mapping lives at the top of `arduino/radar.ino` (servo 14, TRIG 26, ECHO 27, LED 32).
  If you rewire, update those constants and re-flash.

# Wiring & Components

## What You Need

| Component | Qty | Notes |
|-----------|-----|-------|
| ESP32 DevKit | 1 | WiFi-capable microcontroller |
| SG90 Servo | 1 | Blue servo motor |
| HC-SR04 Sensor | 1 | Ultrasonic distance sensor |
| 5mm LED | 1 | Red or Green |
| 220Ω Resistor | 1 | For LED current limiting |
| Breadboard | 1 | Half or full size |
| Jumper Wires | ~12 | Male-to-male connectors |
| USB Cable | 1 | USB-A to USB-C |

**Total Cost:** ₱200-400

## Wiring Diagram

### Power Connections
```
5V (USB) ─────┬──→ SG90 VCC (red wire)
              └──→ HC-SR04 VCC

GND (USB) ────┬──→ SG90 GND (brown wire)
              ├──→ HC-SR04 GND
              └──→ LED Cathode (black wire)
```

### Signal Connections
```
ESP32 GPIO 14  ─→ SG90 Signal (orange wire)
ESP32 GPIO 26  ─→ HC-SR04 TRIG
ESP32 GPIO 27  ─→ HC-SR04 ECHO
ESP32 GPIO 32  ─→ [220Ω Resistor] ─→ LED Anode (+)
```

## Component Pinouts

### ESP32 DevKit
```
        ESP32 DevKit
    ┌─────────────────┐
    │  GND  ·  · 3V3  │
    │  15   ·  · EN   │
    │  2    ·  · SVP  │
    │  4    ·  · SVN  │
    │  5    ·  · 34   │
    │  18   ·  · 35   │
    │  19   ·  · 32 ◄─ LED
    │  21   ·  · 33   │
    │  3    ·  · 25   │
    │  1    ·  · 26 ◄─ HC-SR04 TRIG
    │  22   ·  · 27 ◄─ HC-SR04 ECHO
    │  23   ·  · 14 ◄─ SG90 Signal
    │  GND  ·  · 12   │
    │  GND  ·  · 13   │
    │  5V   ·  · GND   │
    └─────────────────┘
      ◄─ SG90 VCC + HC-SR04 VCC
      ◄─ SG90 GND + HC-SR04 GND
```

### HC-SR04 Sensor (facing forward)
```
  VCC | TRIG | ECHO | GND
   │    │      │     │
   5V   GPIO26 GPIO27 GND
```

### SG90 Servo (wire colors)
```
Brown (GND)  ─→ GND
Red (VCC)    ─→ 5V
Orange (SIG) ─→ GPIO 14
```

### LED Assembly
```
GPIO 32 ──┬──→ [220Ω Resistor] ──┬──→ LED Anode (long leg)
          │                      │
          └──────────────────────┘

LED Cathode (short leg) ──→ GND
```

## Step-by-Step Wiring

1. **Power Rails** (Breadboard)
   - Connect 5V to positive rail
   - Connect GND to negative rail

2. **Mount Sensor**
   - Hot-glue HC-SR04 to servo horn
   - Keep wires loose (needs to rotate 0-180°)

3. **Connect Servo**
   ```
   Brown  → GND rail
   Red    → 5V rail
   Orange → GPIO 14
   ```

4. **Connect HC-SR04**
   ```
   VCC  → 5V rail
   GND  → GND rail
   TRIG → GPIO 26
   ECHO → GPIO 27
   ```

5. **Connect LED Alert**
   ```
   GPIO 32 ──┬──→ [220Ω] ──→ LED (+) long leg
             │
   GND ──────┴──────────────→ LED (-) short leg
   ```

6. **Verify**
   - No wires touching between signal lines and power
   - All GND connected together
   - Servo signal on GPIO 14
   - Sensor TRIG on GPIO 26, ECHO on GPIO 27
   - LED has 220Ω resistor in series

## Why 220Ω Resistor?

LED needs current limiting to prevent burnout.

**Calculation:**
- LED forward voltage: ~2V
- ESP32 output: 3.3V
- Maximum LED current: 20mA
- Required resistor: (3.3V - 2V) / 20mA = 65Ω minimum
- Use 220Ω for safety margin

**Do NOT skip the resistor** - LED will burn out in seconds.

## Component Specs

| Component | Voltage | Current | Notes |
|-----------|---------|---------|-------|
| ESP32 | 3.3V logic, 5V USB | 80mA | Low power at idle |
| SG90 | 4.8-6V (use 5V) | 50-100mA | Max torque at 5V |
| HC-SR04 | 5V | 15mA | Works at 3.3V but prefer 5V |
| LED | ~2V forward | 20mA | Use 220Ω resistor |
| 220Ω Resistor | Any voltage | - | ¼W power rating |

**Total Current:** ~200-250mA peak (use powered USB hub if needed)

## Testing the Wiring

**With Multimeter:**
```
1. Check 5V supply between VCC and GND → should read 5V
2. Check no shorts between signal lines
3. LED should light when power on (with resistor)
```

**With Arduino Serial Monitor:**
```
1. Flash Arduino firmware
2. Open Serial Monitor (115200 baud)
3. Should see: READY, then "angle,distance" lines
4. Servo should move, LED should light when object near
```

## Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| LED not lighting | Wrong polarity or missing resistor | Check anode (+) to resistor, cathode (-) to GND |
| Servo not moving | GPIO 14 not connected or wrong pin | Verify orange wire to GPIO 14 |
| HC-SR04 not reading | TRIG/ECHO not connected | Check GPIO 26 (TRIG) and 27 (ECHO) |
| ESP32 resets constantly | Power issue | Use powered USB hub |
| No serial output | Firmware not uploaded | Re-upload from Arduino IDE |

That's it! Now see QUICKSTART.md to run the UI.

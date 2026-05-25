# Hardware Setup Guide

Complete wiring diagram and component specifications for the Radar System.

## Bill of Materials (BOM)

| Component | Part | Quantity | Notes |
|-----------|------|----------|-------|
| Microcontroller | ESP32 DevKit | 1 | Recommended (WiFi + better performance) |
| Servo Motor | SG90 Micro Servo | 1 | Blue servo, standard 5g weight |
| Distance Sensor | HC-SR04 Ultrasonic | 1 | Ultrasonic Distance Module |
| Indicator | 5mm LED (Red or Green) | 1 | Standard through-hole |
| Current Limiting | 220Ω Resistor | 1 | 1/4W carbon film |
| Breadboard | Half or Full Size | 1 | For prototyping |
| Jumper Wires | Male-to-Male | ~12-15 | 22AWG dupont connectors |
| USB Cable | USB-A to USB-C | 1 | For ESP32 programming |

**Estimated Total Cost:** ₱200-400 (most components in robotics kit)

## ESP32 Pinout & Wiring

### Complete Pin Mapping

```
╔═══════════════════════════════════════════════════════════════════╗
║                     ESP32 DEV MODULE PINOUT                       ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  GND ─────────────────────────── GND (Common ground)             ║
║  3V3                                                              ║
║  EN                                                               ║
║  SVP                                                              ║
║  SVN                                                              ║
║  GPIO 34                                                          ║
║  GPIO 35                                                          ║
║  GPIO 32 ─────────────────────── LED Anode (+)                  ║
║  GPIO 33                                                          ║
║  GPIO 25                                                          ║
║  GPIO 26 ─────────────────────── HC-SR04 TRIG                   ║
║  GPIO 27 ─────────────────────── HC-SR04 ECHO                   ║
║  GPIO 14 ─────────────────────── SG90 Signal (Orange)           ║
║  GPIO 12                                                          ║
║  GPIO 13                                                          ║
║                                                                   ║
║  5V (USB/VIN) ────┬──────────── SG90 VCC (Red)                  ║
║                   └──────────── HC-SR04 VCC                      ║
║  GND ─────────────┬──────────── SG90 GND (Brown)                ║
║                   ├──────────── HC-SR04 GND                      ║
║                   └──────────── LED Cathode (-)                  ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### GPIO Configuration

| GPIO | Function | Component | Wire Color | Notes |
|------|----------|-----------|-----------|-------|
| 14 | PWM Output | SG90 Servo | Orange | Signal line for servo control |
| 26 | Digital Output | HC-SR04 | Yellow | Trigger pulse (10µs) |
| 27 | Digital Input | HC-SR04 | White | Echo pulse (measures distance) |
| 32 | Digital Output | LED | Yellow | Alert indicator (220Ω resistor required) |
| 5V | Power | Servo + Sensor | Red | VCC for servo and sensor |
| GND | Ground | All | Black | Common ground |

## Wiring Diagram (Breadboard Layout)

### Power Rails
```
┌─ 5V (from USB)
│   ├─ SG90 VCC (red wire)
│   └─ HC-SR04 VCC
│
└─ GND (from USB)
    ├─ SG90 GND (brown wire)
    ├─ HC-SR04 GND
    └─ LED Cathode (black wire)
```

### Signal Connections

```
HC-SR04 Pinout (facing the "eyes"):
  [ VCC | TRIG | ECHO | GND ]
    |     |     |      |
    |     |     |      └─→ GND
    |     |     └─→ GPIO 27 (ECHO)
    |     └─→ GPIO 26 (TRIG)
    └─→ 5V (VCC)

SG90 Servo Wiring:
  Brown (GND)   ─→ GND
  Red (VCC)     ─→ 5V
  Orange (SIG)  ─→ GPIO 14

LED Assembly:
  220Ω Resistor ─→ GPIO 32 ─→ [Red LED Anode]
  [LED Cathode] ─→ GND
```

### Step-by-Step Assembly

1. **Mount HC-SR04 on Servo Horn**
   - Hot-glue or tape the ultrasonic sensor to the servo motor horn
   - Ensure it rotates freely (0°-180°)
   - Leave slack in wires to prevent tension

2. **Connect Power Rails**
   - 5V from ESP32 USB → Positive power rail
   - GND from ESP32 → Negative power rail

3. **Connect Servo**
   - Brown (GND) → GND rail
   - Red (VCC) → 5V rail
   - Orange (Signal) → GPIO 14

4. **Connect HC-SR04**
   - VCC → 5V rail
   - GND → GND rail
   - TRIG → GPIO 26
   - ECHO → GPIO 27

5. **Connect LED Alert**
   - 220Ω Resistor → GPIO 32
   - LED Anode → other end of resistor
   - LED Cathode → GND rail

6. **Verify Connections**
   ```bash
   # Use a multimeter to check:
   - VCC and GND continuity
   - No shorts between signal lines and power
   - Servo signal at GPIO 14 ~1.5V
   ```

## Component Specifications

### ESP32 DevKit
- **Voltage:** 3.3V logic, 5V USB input
- **GPIO Pins:** 3.3V output, max 40mA per pin
- **Upload Speed:** 921600 baud recommended
- **Driver:** CH340 or CP2102 (auto-installed on most Macs)

### SG90 Servo Motor
- **Operating Voltage:** 4.8-6V (use 5V USB)
- **Operating Speed:** ~0.12 sec/60° at 5V
- **Torque:** 1.5kg·cm at 4.8V
- **Pulse Width Range:** 1000-2000µs (0-180°)
- **Frequency:** 50Hz (20ms period)
- **Wire Colors:** Brown=GND, Red=VCC, Orange=Signal

### HC-SR04 Ultrasonic Sensor
- **Operating Voltage:** 5V
- **Trigger Pulse:** 10µs minimum
- **Measurement Range:** 2cm to 400cm
- **Accuracy:** ±3mm
- **Frequency:** 40kHz ultrasonic
- **Response Time:** ~60ms per measurement

### LED & Resistor
- **LED Forward Voltage:** ~2V (Red) or ~2.2V (Green)
- **Forward Current:** 20mA typical
- **Resistor:** 220Ω (¼W)
- **Calculation:** R = (3.3V - 2V) / 20mA = 65Ω (use 220Ω for safety)

## Power Considerations

### Current Draw Estimates
- **ESP32:** ~80mA (WiFi active)
- **SG90 Servo:** ~50-100mA (varying with movement)
- **HC-SR04:** ~15mA (during measurement)
- **LED:** ~20mA (when active)

**Total:** ~200-250mA peak

### USB Power Requirements
- Use a **standard USB 2.0 port** or **powered USB hub** (500mA minimum)
- If ESP32 resets frequently, upgrade to powered hub
- Avoid unpowered USB hubs

## Troubleshooting Hardware

### Servo Not Moving
- Check GPIO 14 connection to signal pin
- Verify 5V supply with multimeter
- Test with Arduino IDE Serial Monitor at 115200 baud

### HC-SR04 Not Reading
- Verify TRIG (GPIO 26) and ECHO (GPIO 27) are connected
- Check sensor is not pointing directly at wall (minimum ~5cm distance)
- Test with basic Arduino distance measurement sketch

### LED Not Lighting
- Check 220Ω resistor is in series (not bypassed)
- Verify LED polarity (anode to resistor, cathode to GND)
- Test LED with independent battery

### ESP32 Not Uploading
- Check USB cable is data-capable (not charging-only)
- Install/update CH340 or CP2102 driver
- Try different USB port
- Hold BOOT button while uploading

## PCB Design Notes (For Production)

If designing a PCB:
- Add 100nF bypass capacitors near ESP32 power pins
- Use 1kΩ pull-up on CH340/CP2102 data lines
- Add ferrite bead on servo power line to reduce noise
- Separate analog (sensor) and digital (servo) ground planes
- Route signal lines away from power lines

## Next Steps

- Flash the firmware: See [GETTING_STARTED.md](./GETTING_STARTED.md)
- Customize pin assignments: See [CONFIGURATION.md](./CONFIGURATION.md)
- Debug connection issues: See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

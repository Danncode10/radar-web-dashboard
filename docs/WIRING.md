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

## System Block Diagram

```mermaid
graph LR
    USB["🔌 USB Power<br/>5V"]
    GND["⏚ Ground"]
    
    ESP32["📱 ESP32<br/>GPIO 14, 26, 27, 32"]
    
    SERVO["⚙️ SG90 Servo<br/>Brown/Red/Orange"]
    SENSOR["📡 HC-SR04<br/>TRIG/ECHO"]
    LED["💡 LED + 220Ω<br/>Red/Green"]
    
    USB -->|5V| SERVO
    USB -->|5V| SENSOR
    GND -->|GND| SERVO
    GND -->|GND| SENSOR
    GND -->|GND| LED
    
    ESP32 -->|GPIO 14| SERVO
    ESP32 -->|GPIO 26| SENSOR
    ESP32 -->|GPIO 27| SENSOR
    ESP32 -->|GPIO 32| LED
```

## Complete Wiring Overview

```mermaid
graph TB
    subgraph Power["⚡ POWER DISTRIBUTION"]
        USB["USB 5V"]
        GROUND["GND"]
    end
    
    subgraph ESP["🎛️ ESP32 CONTROL"]
        GPIO14["GPIO 14<br/>PWM Output"]
        GPIO26["GPIO 26<br/>Digital Output"]
        GPIO27["GPIO 27<br/>Digital Input"]
        GPIO32["GPIO 32<br/>Digital Output"]
    end
    
    subgraph Devices["🔧 DEVICES"]
        SRV["SG90 Servo<br/>Red→5V<br/>Brown→GND<br/>Orange→GPIO14"]
        SNS["HC-SR04 Sensor<br/>VCC→5V<br/>GND→GND<br/>TRIG→GPIO26<br/>ECHO→GPIO27"]
        LEDR["220Ω Resistor"]
        LEDD["LED Light<br/>+→Resistor<br/>-→GND"]
    end
    
    USB -->|5V| SRV
    USB -->|5V| SNS
    GROUND -->|GND| SRV
    GROUND -->|GND| SNS
    GROUND -->|GND| LEDD
    
    GPIO14 -->|Signal| SRV
    GPIO26 -->|Trigger| SNS
    GPIO27 -->|Echo| SNS
    GPIO32 -->|Output| LEDR
    LEDR -->|Current Limited| LEDD
```

## Quick Connection Reference

```mermaid
graph LR
    ESP32["ESP32"]
    
    ESP32 -->|GPIO 14| SERVO["SG90 Servo<br/>(Orange Wire)"]
    ESP32 -->|GPIO 26| TRIG["HC-SR04 TRIG<br/>(Yellow Wire)"]
    ESP32 -->|GPIO 27| ECHO["HC-SR04 ECHO<br/>(White Wire)"]
    ESP32 -->|GPIO 32| RES["220Ω Resistor"]
    
    RES -->|to LED| LED["💡 LED<br/>(Long Leg)"]
    
    style SERVO fill:#ff9999
    style TRIG fill:#ffff99
    style ECHO fill:#99ff99
    style LED fill:#ff6666
    style RES fill:#cc6600
```

## Component Pinouts

### ESP32 DevKit Pins (What You Need to Use)

```mermaid
graph TB
    subgraph ESP32["ESP32 DevKit - Pin Functions"]
        GND["GND - Ground Rail"]
        V5["5V - Power Rail"]
        GPIO14["GPIO 14 - Servo Signal"]
        GPIO26["GPIO 26 - Sensor TRIG"]
        GPIO27["GPIO 27 - Sensor ECHO"]
        GPIO32["GPIO 32 - LED Output"]
    end
    
    GND -->|Connect To| SERVO_GND["Servo Brown Wire"]
    GND -->|Connect To| SENSOR_GND["Sensor GND"]
    GND -->|Connect To| LED_NEG["LED Cathode"]
    
    V5 -->|Connect To| SERVO_VCC["Servo Red Wire"]
    V5 -->|Connect To| SENSOR_VCC["Sensor VCC"]
    
    GPIO14 -->|Connect To| SERVO_SIG["Servo Orange Wire"]
    GPIO26 -->|Connect To| SENSOR_TRIG["Sensor TRIG Pin"]
    GPIO27 -->|Connect To| SENSOR_ECHO["Sensor ECHO Pin"]
    GPIO32 -->|→ 220Ω → LED| LED_POS["LED Anode"]
```

### HC-SR04 Ultrasonic Sensor

```mermaid
graph LR
    HC["HC-SR04 Module<br/>(4 pins, left to right)"]
    
    HC --> VCC["🔴 VCC"]
    HC --> TRIG["🟡 TRIG"]
    HC --> ECHO["⚪ ECHO"]
    HC --> GND["⚫ GND"]
    
    VCC -->|5V| ESP["→ ESP32 5V Rail"]
    TRIG -->|GPIO 26| GPIO26["→ GPIO 26"]
    ECHO -->|GPIO 27| GPIO27["→ GPIO 27"]
    GND -->|Ground| GNDL["→ ESP32 GND Rail"]
```

### SG90 Servo Motor

```mermaid
graph LR
    SERVO["SG90 Servo<br/>(3 wires)"]
    
    SERVO --> BROWN["🟤 Brown"]
    SERVO --> RED["🔴 Red"]
    SERVO --> ORANGE["🟠 Orange"]
    
    BROWN -->|GND| GND_RAIL["→ GND Rail"]
    RED -->|5V| V5_RAIL["→ 5V Rail"]
    ORANGE -->|GPIO 14| GPIO14["→ GPIO 14"]
```

### LED Alert Light

```mermaid
graph LR
    GPIO32["GPIO 32"]
    RES["220Ω<br/>Resistor"]
    LED["💡 LED"]
    GND["GND"]
    
    GPIO32 -->|Signal| RES
    RES -->|Current Limited| LED
    LED -->|Long Leg| LED_LONG["Anode (+)"]
    LED -->|Short Leg| LED_SHORT["Cathode (-)"]
    LED_SHORT -->|connects to| GND
    
    style LED fill:#ff6666
    style RES fill:#cc6600
    style LED_LONG fill:#ff9999
    style LED_SHORT fill:#333333
```

## Step-by-Step Wiring Checklist

```mermaid
graph TD
    STEP1["✅ STEP 1<br/>Set Up Power Rails"] --> STEP2["✅ STEP 2<br/>Mount Sensor on Servo"]
    STEP2 --> STEP3["✅ STEP 3<br/>Connect Servo"]
    STEP3 --> STEP4["✅ STEP 4<br/>Connect Sensor"]
    STEP4 --> STEP5["✅ STEP 5<br/>Connect LED"]
    STEP5 --> VERIFY["✅ VERIFY<br/>All Connections"]
    
    STEP1 --> S1A["Breadboard Positive → 5V<br/>Breadboard Negative → GND"]
    STEP2 --> S2A["Hot-glue HC-SR04<br/>to Servo Horn<br/>(Keep wires loose)"]
    STEP3 --> S3A["Brown → GND<br/>Red → 5V<br/>Orange → GPIO 14"]
    STEP4 --> S4A["VCC → 5V<br/>GND → GND<br/>TRIG → GPIO 26<br/>ECHO → GPIO 27"]
    STEP5 --> S5A["GPIO 32 → 220Ω →<br/>LED(+) Anode<br/>LED(-) → GND"]
    VERIFY --> V1["No floating wires<br/>All GND connected<br/>No shorts between signals"]
    
    style STEP1 fill:#99ff99
    style STEP2 fill:#99ff99
    style STEP3 fill:#99ff99
    style STEP4 fill:#99ff99
    style STEP5 fill:#99ff99
    style VERIFY fill:#ffff99
```

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

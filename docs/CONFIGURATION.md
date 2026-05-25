# Configuration Guide

Customize the Radar System behavior by modifying these settings.

## Arduino Configuration (`arduino/radar.ino`)

### Hardware Pins

Located at the top of the sketch. Modify if your wiring differs:

```cpp
const int SERVO_PIN = 14;      // GPIO pin for servo signal
const int TRIG_PIN = 26;       // GPIO pin for HC-SR04 trigger
const int ECHO_PIN = 27;       // GPIO pin for HC-SR04 echo
const int LED_PIN = 32;        // GPIO pin for alert LED
```

**Changing Pins:**
1. Verify your new pin supports the required function (PWM for servo, etc.)
2. Update the constant above
3. Recompile and upload

### Sweep Behavior

Control how fast the servo sweeps and how many measurements per sweep:

```cpp
const int SWEEP_STEP = 2;      // Degrees per step (1-5 recommended)
                               // Lower = denser scan, slower sweep
                               // Higher = faster sweep, fewer readings

const int STEP_DELAY_MS = 30;  // Milliseconds per step
                               // Lower = faster sweep (min ~20ms)
                               // Higher = slower sweep, more stable readings
```

**Recommended Combinations:**
- Fast (real-time): SWEEP_STEP=4, STEP_DELAY_MS=20 → ~5 sweeps/sec
- Balanced: SWEEP_STEP=2, STEP_DELAY_MS=30 → ~3 sweeps/sec (default)
- Detailed: SWEEP_STEP=1, STEP_DELAY_MS=50 → ~2 sweeps/sec, 180 readings per sweep

### Alert Distance

Distance threshold for LED alert (in centimeters):

```cpp
const float ALERT_DISTANCE = 50.0;  // Centimeters
                                    // LED turns ON when object < 50cm away
                                    // Adjust based on your needs
```

**Common Values:**
- 30cm: Very sensitive (indoor obstacle detection)
- 50cm: Balanced (default)
- 100cm: Long-range alert mode
- 150cm: Perimeter alert

### Serial Communication

Do **not** modify unless troubleshooting:

```cpp
Serial.begin(115200);  // Baud rate (must match bridge config)
```

Supported baud rates: 9600, 19200, 38400, 57600, 115200, 230400

## Bridge Configuration (`bridge/bridge.js`)

### Port Settings

Located near the top of `bridge.js`:

```javascript
const WS_PORT = 8080;           // WebSocket server port
const SERIAL_PORT = process.env.SERIAL_PORT || '/dev/cu.usbmodem14101';
const BAUD_RATE = 115200;       // Must match Arduino config
```

**To Change:**
- Edit the file directly, or
- Set environment variable before running:
  ```bash
  SERIAL_PORT=/dev/cu.usbXXX WS_PORT=9000 npm start
  ```

### Common Serial Ports

| OS | Pattern | Example |
|----|---------|---------|
| **Mac** | `/dev/cu.*` | `/dev/cu.usbmodem14101` |
| **Linux** | `/dev/ttyUSB*` | `/dev/ttyUSB0` |
| **Windows** | `COM*` | `COM3` |

**Find Your Port:**
```bash
# Mac/Linux
ls /dev/cu.* or ls /dev/ttyUSB*

# Windows PowerShell
[System.IO.Ports.SerialPort]::GetPortNames()
```

### Data Validation

Optional: Add stricter validation if you experience noise:

```javascript
// In bridge.js, after parsing angle and distance:
if (angle < 0 || angle > 180) return;  // Skip invalid angles
if (distance < 0 || distance > 400) return;  // Skip out-of-range
```

## Web Dashboard Configuration (`web/pages/index.js`)

Modify these constants at the top of the component:

```javascript
const MAX_DIST = 200;           // Maximum display distance (cm)
                                // Larger = zoom out, see farther
                                // Smaller = zoom in, more detail

const ALERT_DIST = 50;          // Alert threshold (cm)
                                // Matches Arduino ALERT_DISTANCE
                                // When any object < ALERT_DIST, 
                                // display turns red

const BLIP_LIFETIME = 5000;     // How long blips stay visible (ms)
                                // Longer = trails persist
                                // Shorter = cleaner display

const SWEEP_TRAIL_DEG = 30;     // Degrees of green trail behind sweep (°)
                                // Larger = brighter trail
                                // Smaller = cleaner line
```

### Display Tuning Examples

**For Indoor Obstacles (5-50cm):**
```javascript
const MAX_DIST = 100;
const ALERT_DIST = 30;
const BLIP_LIFETIME = 2000;
```

**For Long-Range Perimeter (100-300cm):**
```javascript
const MAX_DIST = 300;
const ALERT_DIST = 150;
const BLIP_LIFETIME = 8000;
```

**For High-Speed Sweeps:**
```javascript
const BLIP_LIFETIME = 1000;  // Short trails
const SWEEP_TRAIL_DEG = 10;  // Minimal trail
```

### WebSocket Server Address

If running bridge on a different machine:

```javascript
// In useRadar hook (line ~29)
const ws = new WebSocket('ws://localhost:8080');
// Change 'localhost' to your IP:
// const ws = new WebSocket('ws://192.168.1.100:8080');
```

## Environment Variables

Set these before running to override defaults:

```bash
# Bridge server
SERIAL_PORT=/dev/cu.usbXXX     # Override serial port
WS_PORT=9000                    # Override WebSocket port

# Web dashboard
NEXT_PUBLIC_WS_URL=ws://server:8080  # Override bridge address
NODE_ENV=production             # Build for production

# Examples:
SERIAL_PORT=/dev/ttyUSB0 npm start    # Linux
WS_PORT=3001 npm start                # Custom port
```

## Performance Tuning

### For Slow/Laggy Dashboard

**Problem:** High CPU usage, dropped frames

**Solutions:**
1. Increase `SWEEP_STEP` (fewer data points)
   ```cpp
   const int SWEEP_STEP = 4;  // was 2
   ```

2. Decrease `BLIP_LIFETIME` (less blips to draw)
   ```javascript
   const BLIP_LIFETIME = 2000;  // was 5000
   ```

3. Reduce canvas size in index.js:
   ```javascript
   <canvas ref={canvasRef} width={600} height={400} />  // was 800x500
   ```

### For Noisy Sensor Data

**Problem:** Erratic distance readings

**Solutions:**
1. Increase `STEP_DELAY_MS` (more stable readings)
   ```cpp
   const int STEP_DELAY_MS = 50;  // was 30
   ```

2. Add moving average filter in Arduino (advanced)
3. Move sensor away from reflective surfaces

## Reset to Defaults

**Arduino:**
```cpp
const int SWEEP_STEP = 2;
const int STEP_DELAY_MS = 30;
const float ALERT_DISTANCE = 50.0;
```

**Bridge:**
```javascript
const WS_PORT = 8080;
const BAUD_RATE = 115200;
```

**Dashboard:**
```javascript
const MAX_DIST = 200;
const ALERT_DIST = 50;
const BLIP_LIFETIME = 5000;
const SWEEP_TRAIL_DEG = 30;
```

## Next Steps

- Deploy to production: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- Troubleshoot issues: See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Understand internals: See [ARCHITECTURE.md](./ARCHITECTURE.md)

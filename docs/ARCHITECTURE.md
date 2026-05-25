# System Architecture

Deep dive into how the Radar System works internally.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     HARDWARE LAYER                          │
│                    (ESP32 DevKit)                           │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   SG90       │  │   HC-SR04    │  │     LED      │     │
│  │   Servo      │  │   Sensor     │  │   Indicator  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                   │            │
│         └─────────────────┴───────────────────┘            │
│                          │                                  │
│              USB Serial @ 115200 baud                       │
│         Sends: "angle,distance\n"                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     BRIDGE LAYER                            │
│                   (Node.js Process)                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ SerialPort   │  │ ReadlineParser│  │ WebSocket    │     │
│  │ Connection   │  │ Line Splitter │  │ Server       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                   │            │
│         └─────────────────┴───────────────────┘            │
│                          │                                  │
│         WebSocket @ ws://localhost:8080                     │
│    Sends: {angle, distance, timestamp}                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 PRESENTATION LAYER                          │
│                  (Next.js Browser)                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ WebSocket    │  │ Canvas Render│  │ Status       │     │
│  │ Client       │  │ Loop (rAF)   │  │ Panel        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                   │            │
│         └─────────────────┴───────────────────┘            │
│                          │                                  │
│          HTTP Rendered at http://localhost:3000             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Sequence

### One Complete Scan Cycle (every 30-50ms)

```
Time  Component       Action
─────────────────────────────────────────────────────────────
t=0   ESP32           Servo at angle 0°
      └─→ Write TRIG  HIGH for 10 microseconds
      └─→ Wait ECHO   Measures ultrasonic response
      └─→ Calculate   distance = (echo_time * 0.0343) / 2
      └─→ Alert LED   ON if distance < 50cm, else OFF
      └─→ Print       "0,150.00\n" to Serial

t=1   Bridge          Receives bytes via SerialPort
      └─→ ReadlineParser buffers until '\n'
      └─→ Parse       Split "0,150.00" on comma
      └─→ Create JSON {angle: 0, distance: 150.00, timestamp: now}
      └─→ Broadcast   Send to all connected WebSocket clients

t=2   Browser         WebSocket.onmessage fires
      └─→ Parse JSON
      └─→ Update     sweepAngleRef.current = 0
      └─→ Store      detectionsRef.current.push({...})
      └─→ No rerender (using useRef, not useState)

t=3   Browser         requestAnimationFrame fires
      └─→ Read       sweepAngleRef, detectionsRef directly
      └─→ Clear      Canvas with semi-transparent fill
      └─→ Draw       Range rings, angle lines
      └─→ Draw       Sweep line at current angle
      └─→ Draw       Blips from recent detections
      └─→ Display    On screen (60fps max)

t=30  ESP32           Servo moves to angle 2°
      └─→ Repeat      Cycle from t=0
```

## Component Breakdown

### Arduino Firmware (`arduino/radar.ino`)

**Responsibilities:**
- Servo PWM control (0-180° sweep)
- Ultrasonic measurement (TRIG pulse, ECHO timing)
- LED alert logic (ON if distance < 50cm)
- Serial data transmission

**Key Functions:**

```cpp
void loop() {
  // 1. Move servo to next angle
  servoWrite(currentAngle);
  
  // 2. Measure distance via ultrasonic
  float distance = measureDistance();
  
  // 3. Control LED alert
  if (distance < ALERT_DISTANCE) {
    digitalWrite(LED_PIN, HIGH);
  }
  
  // 4. Send data: "angle,distance"
  Serial.println(String(currentAngle) + "," + String(distance, 2));
}

void servoWrite(int angle) {
  // PWM pulse: 500-2500µs maps to 0-180°
  int pulseWidth = 500 + (angle * 2000 / 180);
  digitalWrite(SERVO_PIN, HIGH);
  delayMicroseconds(pulseWidth);
  digitalWrite(SERVO_PIN, LOW);
  delayMicroseconds(20000 - pulseWidth);
}

float measureDistance() {
  // Send 10µs trigger pulse
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Measure echo pulse duration
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  
  // Convert to distance: speed of sound = 343m/s
  return (duration * 0.0343) / 2.0;
}
```

### Node.js Bridge (`bridge/bridge.js`)

**Responsibilities:**
- Read serial stream from Arduino
- Parse CSV format (angle,distance)
- Add timestamp and JSON wrap
- Broadcast to WebSocket clients
- Manage client connections

**Key Pipeline:**

```javascript
// 1. SerialPort opens connection
port.on('open', () => {
  // Connected and ready for data
});

// 2. ReadlineParser accumulates bytes until '\n'
parser.on('data', (line) => {
  // Received complete line: "0,150.00"
  
  // 3. Parse CSV
  const [angleStr, distanceStr] = line.trim().split(',');
  const angle = parseFloat(angleStr);
  const distance = parseFloat(distanceStr);
  
  // 4. Validate
  if (isNaN(angle) || isNaN(distance)) return;
  
  // 5. Create structured data
  const data = {
    angle: Math.round(angle),
    distance: parseFloat(distance.toFixed(2)),
    timestamp: Date.now()
  };
  
  // 6. Broadcast to all clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
  
  // 7. Log
  console.log(`[DATA]  ${data.angle}° →  ${data.distance}cm`);
});
```

### Next.js Dashboard (`web/pages/index.js`)

**Responsibilities:**
- WebSocket connection management
- Real-time data state management
- Canvas rendering (60fps)
- UI status display

**Key Patterns:**

#### Custom Hook: `useRadar()`
```javascript
function useRadar() {
  const [status, setStatus] = useState('DISCONNECTED');
  const wsRef = useRef(null);
  const sweepAngleRef = useRef(0);          // High-frequency data
  const detectionsRef = useRef([]);         // Blips history
  
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket('ws://localhost:8080');
      
      ws.onopen = () => setStatus('CONNECTED');
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        sweepAngleRef.current = data.angle;  // Update directly
        detectionsRef.current.push({...});   // No re-render!
      };
      
      ws.onclose = () => {
        setStatus('RECONNECTING');
        setTimeout(connect, 3000);  // Auto-reconnect
      };
    };
    
    connect();
  }, []);
  
  return { status, sweepAngleRef, detectionsRef };
}
```

**Why useRef instead of useState?**
- High-frequency updates (30+ readings/sec)
- `useState` triggers re-render each update → jank at 60fps
- `useRef` updates immediately, only Canvas reads via `requestAnimationFrame`
- Decouples data arrival from rendering frame rate

#### Canvas Render Loop
```javascript
useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  
  const render = () => {
    // 1. Clear with phosphor effect
    ctx.fillStyle = 'rgba(0, 8, 0, 0.82)';
    ctx.fillRect(0, 0, width, height);
    
    // 2. Draw background elements (rings, grid)
    drawRangeRings();
    drawAngleLines();
    
    // 3. Draw sweep trail
    drawSweepTrail(sweepAngleRef.current);
    
    // 4. Draw current sweep line
    drawSweepLine(sweepAngleRef.current);
    
    // 5. Remove old detections & draw blips
    now = Date.now();
    detectionsRef.current = detectionsRef.current.filter(
      d => now - d.timestamp < BLIP_LIFETIME
    );
    
    detectionsRef.current.forEach(detection => {
      drawBlip(detection);
    });
    
    // 6. Schedule next frame
    requestAnimationFrame(render);
  };
  
  render();
}, [sweepAngleRef, detectionsRef]);
```

## Design Patterns

### 1. Producer-Consumer Pattern
- **Producer:** ESP32 (generates sensor data)
- **Intermediary:** Bridge (transforms protocol)
- **Consumer:** Dashboard (visualizes data)
- **Benefit:** Decoupled layers, can swap any component

### 2. Observer Pattern (Event-Driven)
```
Arduino (Producer) ─serial─→ Bridge (Observer)
Bridge (Subject) ─websocket→ Browser (Observer)
Browser ─UI─→ User
```

### 3. Separation of Concerns
| File | Responsibility |
|------|---|
| `radar.ino` | Hardware only |
| `bridge.js` | Protocol translation |
| `useRadar()` | Data layer |
| `RadarCanvas` | Rendering layer |
| `DataPanel` | Status UI |

### 4. Reactive State Management
- **High-frequency:** `useRef` (Canvas data)
- **Low-frequency:** `useState` (UI status)
- **Why:** Avoid re-renders on every sensor reading

### 5. Coordinate Transformation (Polar → Cartesian)
```
Input:  angle (0-180°), distance (0-400cm)
Output: x, y canvas pixels

Formulas:
  r   = (distance / MAX_DIST) × RADIUS_PX
  rad = angle × (π / 180)
  x   = CENTER_X − r × cos(rad)
  y   = CENTER_Y − r × sin(rad)

Note: CENTER_Y = canvas.height (bottom)
      Minus on x for mirror effect
      Sine on y to open upward
```

### 6. Auto-Reconnect Strategy
```javascript
ws.onclose = () => {
  status = 'RECONNECTING';
  setTimeout(connect, 3000);  // Exponential backoff possible
};
```
- Automatically reconnects if bridge crashes/restarts
- No manual page refresh needed
- Transparent to user

## Performance Considerations

### ESP32 Performance
- **Sampling Rate:** ~20-30Hz (depending on STEP_DELAY_MS)
- **ECHO Timing:** 10-30ms per measurement
- **Serial Throughput:** ~150 bytes/sec (115200 baud)

### Bridge Performance
- **Parsing:** <1ms per line
- **Broadcasting:** O(n) where n = client count
- **Typical:** <5ms round-trip from sensor to WebSocket

### Browser Performance
- **rAF Loop:** 60fps target
- **Canvas Draw:** ~5-10ms per frame
- **Memory:** ~5-10MB (grows with blip history)

## Scaling Considerations

### Multiple Dashboards
```javascript
// Each browser client gets full real-time feed
wss.clients.forEach(client => {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  }
});
```

### Remote Bridge
```javascript
// Change localhost to IP address
const ws = new WebSocket('ws://192.168.1.100:8080');
```

### High-Frequency Measurements
- Increase sampling rate: `SWEEP_STEP = 1`
- May need to buffer in bridge if clients lag
- Consider frame dropping for slow clients

## Next Steps

- **Modify behavior:** See [CONFIGURATION.md](./CONFIGURATION.md)
- **Understand hardware:** See [HARDWARE.md](./HARDWARE.md)
- **Troubleshoot:** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

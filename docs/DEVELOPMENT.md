# Development Guide

Guide for developers who want to modify or extend the Radar System.

## Project Structure

```
radar-project/
│
├── arduino/
│   └── radar.ino                # ESP32 firmware
│       ├── Servo control        # servoWrite()
│       ├── Sensor measurement   # measureDistance()
│       └── Serial output        # Serial.println()
│
├── bridge/
│   ├── package.json             # Dependencies
│   └── bridge.js                # Main server
│       ├── SerialPort setup
│       ├── WebSocket server
│       └── Data validation
│
├── web/
│   ├── package.json
│   ├── next.config.js
│   ├── pages/
│   │   ├── _app.js              # Global wrapper
│   │   └── index.js             # Main component
│   │       ├── useRadar()        # WebSocket hook
│   │       ├── RadarCanvas       # Canvas rendering
│   │       └── DataPanel         # Status UI
│   └── styles/
│       └── globals.css          # Styling
│
├── docs/                        # This directory
│   ├── GETTING_STARTED.md
│   ├── HARDWARE.md
│   ├── CONFIGURATION.md
│   ├── TROUBLESHOOTING.md
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT.md          # You are here
│   └── DEPLOYMENT.md
│
└── README.md                    # Project overview
```

## Development Setup

### Prerequisites
- Node.js 18+ (with npm)
- Arduino IDE 2.x
- Text editor (VSCode recommended)
- Basic knowledge of JavaScript, React, and Arduino

### Initial Setup

```bash
# Clone or navigate to project
cd radar-project

# Install all dependencies
cd bridge && npm install && cd ..
cd web && npm install && cd ..

# Flash Arduino
# - Open arduino/radar.ino in Arduino IDE
# - Upload to ESP32
```

## Making Changes

### Arduino Firmware Changes

**File:** `arduino/radar.ino`

**Common Modifications:**

1. **Change Pin Assignment:**
   ```cpp
   const int SERVO_PIN = 14;  // Change to desired GPIO
   // Update wiring diagram when changing pins
   ```

2. **Adjust Sweep Speed:**
   ```cpp
   const int SWEEP_STEP = 2;      // degrees per step
   const int STEP_DELAY_MS = 30;  // ms between steps
   // Lower values = faster, less stable
   // Higher values = slower, more stable
   ```

3. **Change Alert Threshold:**
   ```cpp
   const float ALERT_DISTANCE = 50.0;  // cm
   ```

4. **Add Filtering (e.g., moving average):**
   ```cpp
   float measurements[5];
   float measureDistance() {
     float sum = 0;
     for(int i = 0; i < 5; i++) {
       measurements[i] = getRawDistance();
       sum += measurements[i];
       delay(10);
     }
     return sum / 5.0;
   }
   ```

**Testing:**
```bash
# After uploading, open Serial Monitor in Arduino IDE
# Tools → Serial Monitor (115200 baud)
# Should see: READY, then "angle,distance" lines
```

### Bridge Modifications

**File:** `bridge/bridge.js`

**Common Modifications:**

1. **Change WebSocket Port:**
   ```javascript
   const WS_PORT = 8080;  // Change to desired port
   // Update web/pages/index.js to match
   ```

2. **Add Data Filtering:**
   ```javascript
   parser.on('data', (line) => {
     const [angleStr, distanceStr] = line.trim().split(',');
     const angle = parseFloat(angleStr);
     const distance = parseFloat(distanceStr);
     
     // Add custom validation
     if (angle < 0 || angle > 180) return;
     if (distance < 2 || distance > 400) return;
     
     // ... rest of code
   });
   ```

3. **Add Moving Average:**
   ```javascript
   const recentReadings = [];
   
   parser.on('data', (line) => {
     // ... parsing code
     
     recentReadings.push(distance);
     if (recentReadings.length > 5) recentReadings.shift();
     
     const avgDistance = recentReadings.reduce((a, b) => a + b) / recentReadings.length;
     
     const data = {
       angle,
       distance: avgDistance,
       timestamp: Date.now()
     };
     
     // ... broadcast
   });
   ```

4. **Add Logging to File:**
   ```javascript
   const fs = require('fs');
   const logStream = fs.createWriteStream('radar-log.csv');
   
   logStream.write('timestamp,angle,distance\n');
   
   parser.on('data', (line) => {
     // ... parse
     logStream.write(`${data.timestamp},${data.angle},${data.distance}\n`);
   });
   ```

**Testing:**
```bash
cd bridge
npm start
# Should show [WS], [SERIAL], and [DATA] lines
```

### Dashboard Modifications

**File:** `web/pages/index.js`

**Common Modifications:**

1. **Change Display Parameters:**
   ```javascript
   const MAX_DIST = 200;        // Zoom level
   const ALERT_DIST = 50;       // Alert threshold
   const BLIP_LIFETIME = 5000;  // Trail persistence
   const SWEEP_TRAIL_DEG = 30;  // Visual trail
   ```

2. **Modify Canvas Colors:**
   ```javascript
   // In RadarCanvas component
   ctx.fillStyle = 'rgba(0, 8, 0, 0.82)';  // Background
   ctx.strokeStyle = '#00ff00';              // Rings and lines
   ctx.fillStyle = '#00ff99';                // Blips
   
   // Or change in styles/globals.css
   ```

3. **Add New UI Element:**
   ```javascript
   function DistanceGraph() {
     const [history, setHistory] = useState([]);
     
     useEffect(() => {
       const interval = setInterval(() => {
         if (detectionsRef.current.length > 0) {
           const latest = detectionsRef.current[detectionsRef.current.length - 1];
           setHistory(prev => [...prev, latest.distance].slice(-30));
         }
       }, 100);
       return () => clearInterval(interval);
     }, [detectionsRef]);
     
     return (
       <div className="graph">
         {/* Render sparkline or chart */}
       </div>
     );
   }
   ```

4. **Add Recording Feature:**
   ```javascript
   const [isRecording, setIsRecording] = useState(false);
   const recordingRef = useRef([]);
   
   useEffect(() => {
     if (!isRecording) return;
     
     const interval = setInterval(() => {
       if (detectionsRef.current.length > 0) {
         const latest = detectionsRef.current[detectionsRef.current.length - 1];
         recordingRef.current.push(latest);
       }
     }, 100);
     
     return () => clearInterval(interval);
   }, [isRecording]);
   
   const downloadRecording = () => {
     const csv = recordingRef.current
       .map(d => `${d.angle},${d.distance},${d.timestamp}`)
       .join('\n');
     
     const blob = new Blob([csv], { type: 'text/csv' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `radar-${Date.now()}.csv`;
     a.click();
   };
   ```

**Testing:**
```bash
cd web
npm run dev
# Open http://localhost:3000 in browser
# F12 to check console for errors
```

### Styling Changes

**File:** `web/styles/globals.css`

**Common Modifications:**

1. **Change Color Scheme:**
   ```css
   /* From green to amber */
   .container {
     border-color: #ffaa00;
     box-shadow: 0 0 20px rgba(255, 170, 0, 0.3);
   }
   
   .header h1 {
     color: #ffaa00;
     text-shadow: 0 0 10px #ffaa00;
   }
   ```

2. **Adjust Scan Line Effect:**
   ```css
   body::before {
     background: repeating-linear-gradient(
       0deg,
       rgba(0, 0, 0, 0.3),  /* Darker lines */
       rgba(0, 0, 0, 0.3) 2px,
       transparent 2px,
       transparent 4px    /* Wider gaps */
     );
   }
   ```

3. **Responsive Layout:**
   ```css
   @media (max-width: 800px) {
     .main-content {
       flex-direction: column;
     }
     
     canvas {
       max-width: 100%;
     }
   }
   ```

## Adding Features

### Example: Add Sound Alert

**In `web/pages/index.js`:**

```javascript
function useAudioAlert() {
  const audioRef = useRef(null);
  
  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 1000; // 1000 Hz beep
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    
    audioRef.current = { oscillator, gainNode, audioContext };
  }, []);
  
  return (audioRef) => {
    const { oscillator, gainNode } = audioRef.current;
    oscillator.start();
    setTimeout(() => oscillator.stop(), 200);
  };
}

// In main component:
const playSound = useAudioAlert();

useEffect(() => {
  const now = Date.now();
  const recentAlert = detectionsRef.current.some(
    (d) => now - d.timestamp < 1000 && d.distance < ALERT_DIST
  );
  
  if (recentAlert && !alertMode) {
    playSound();  // Play beep when entering alert
  }
}, [alertMode]);
```

### Example: Add Data Export

**In `bridge/bridge.js`:**

```javascript
const fs = require('fs');
let csvFile = fs.createWriteStream('radar-data.csv');
csvFile.write('timestamp,angle,distance\n');

parser.on('data', (line) => {
  // ... existing parsing ...
  
  csvFile.write(`${data.timestamp},${data.angle},${data.distance}\n`);
});

// Close file gracefully
process.on('SIGINT', () => {
  csvFile.end();
  process.exit(0);
});
```

## Testing & Debugging

### Browser DevTools

```
F12 to open DevTools
```

**Console Tab:**
- Check for JavaScript errors
- Log debugging info:
  ```javascript
  console.log('Sweep angle:', sweepAngleRef.current);
  ```

**Network Tab:**
- Check WebSocket connection
- Look for `ws://localhost:8080` status
- Verify message size and frequency

**Performance Tab:**
- Check CPU usage
- Profile render performance
- Identify bottlenecks

### Arduino Debugging

```cpp
// Add debug output to Serial Monitor
Serial.print("Angle: ");
Serial.println(currentAngle);
Serial.print("Distance (raw): ");
Serial.println(echo_duration);
Serial.print("Distance (cm): ");
Serial.println(distance);
```

### Bridge Debugging

```javascript
// Add verbose logging
console.log('[VERBOSE] Raw line:', line);
console.log('[VERBOSE] Parsed angle:', angle, 'distance:', distance);
console.log('[VERBOSE] Client count:', wss.clients.size);
```

### Simulating Hardware

**Without ESP32 (testing bridge + dashboard):**

```bash
# Create mock data generator
node -e "
  const readline = require('readline');
  let angle = 0;
  setInterval(() => {
    const distance = 100 + Math.random() * 50;
    console.log(\`\${angle},\${distance.toFixed(2)}\`);
    angle = (angle + 2) % 180;
  }, 30);
" | nc localhost 8888
```

Then configure bridge to use mocked port.

## Code Style & Best Practices

### Arduino
- Use consistent brace style (Allman)
- Keep functions under 50 lines
- Use meaningful variable names
- Comment non-obvious logic

```cpp
// Good
const int TRIG_PIN = 26;  // HC-SR04 trigger pin
float distance = measureDistance();

// Avoid
const int tp = 26;        // What is tp?
float d = measureDistance();
```

### JavaScript (Node.js & React)
- Use `const` by default, `let` when needed
- Arrow functions for callbacks
- Destructuring for imports
- Clear naming

```javascript
// Good
const { angle, distance } = data;
wss.clients.forEach((client) => {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
  }
});

// Avoid
var data = { angle: d.a, distance: d.d };
for (let i = 0; i < wss.clients.length; i++) {
  wss.clients[i].send(...);
}
```

### React Components
- One component per file (for larger components)
- Use custom hooks for logic
- Avoid inline object creation in JSX
- Memoize heavy computations

```javascript
// Good
function RadarCanvas({ sweepAngleRef, detectionsRef }) {
  useEffect(() => {
    // Setup
  }, [sweepAngleRef, detectionsRef]);
  
  return <canvas ref={canvasRef} />;
}

// Avoid
function App() {
  return (
    <RadarCanvas 
      config={{ angle: 0, distance: 100 }}  // New object each render
    />
  );
}
```

## Performance Optimization Tips

1. **Reduce re-renders:**
   - Use `useRef` for high-frequency data
   - Memoize components with `React.memo()`
   - Use `useMemo()` for expensive calculations

2. **Optimize rendering:**
   - Lower canvas resolution if needed
   - Reduce brush stroke count
   - Limit blip history size

3. **Reduce data size:**
   - Only send necessary fields
   - Compress if bandwidth is limited
   - Drop old data periodically

4. **Optimize Serial I/O:**
   - Increase `STEP_DELAY_MS` for stability
   - Reduce `SWEEP_STEP` for fewer readings
   - Buffer measurements if needed

## Deployment Considerations

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Production builds
- Docker containerization
- Remote deployment
- Monitoring & logging

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Arduino ESP32 Documentation](https://docs.espressif.com/projects/arduino-esp32/en/latest/)
- [Node.js SerialPort](https://serialport.io/)
- [WebSocket.org](https://www.websocket.org/)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

## Getting Help

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Check browser console (F12)
4. Check bridge terminal output
5. Use `--debug` flag when running Node.js:
   ```bash
   node --debug bridge.js
   ```

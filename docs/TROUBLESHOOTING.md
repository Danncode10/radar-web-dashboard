# Troubleshooting Guide

Common problems and solutions for the Radar System.

## ESP32 Connection Issues

### "Port not found" when uploading

**Symptoms:** Arduino IDE says port doesn't exist or can't connect

**Solutions:**
1. Check USB cable is data-capable (not charging-only)
2. Try different USB port on your computer
3. Restart Arduino IDE
4. Restart your Mac/PC

**For Mac, if still not working:**
```bash
# Install CH340 driver (most common):
# Download from: https://github.com/WCHSoftware/ch340-driver
# Or use Homebrew:
brew install wch-ch34x-usb-serial-driver

# Then restart Mac and reconnect ESP32
```

### ESP32 not showing in Board Manager

**Symptoms:** Can't find ESP32 in Tools → Board list

**Solutions:**
1. Add ESP32 board URL (see [GETTING_STARTED.md](./GETTING_STARTED.md))
2. In Arduino IDE, go to **Boards Manager**
3. Search for "esp32"
4. Install **esp32 by Espressif Systems**
5. Wait for installation to complete
6. Restart Arduino IDE

### Upload fails with "timed out" error

**Symptoms:** Upload starts but fails mid-way

**Solutions:**
1. Hold **BOOT button** while uploading starts
2. Change **Tools → Upload Speed** to 115200 (slower)
3. Use shorter, better-quality USB cable
4. Try powered USB hub instead of direct port

### ESP32 keeps resetting during upload

**Symptoms:** Serial output shows constant reboots

**Solutions:**
1. Power issue: Use powered USB hub (500mA+)
2. Try different USB port
3. Update USB driver
4. Factory reset ESP32:
   ```
   - Click Tools → Erase All Flash Before Sketch Upload (enable)
   - Upload sketch again
   - Disable "Erase All Flash" after successful upload
   ```

## Serial Connection Issues

### "Error: No such file or device" in bridge

**Symptoms:** Bridge crashes with file not found error

**Solutions:**
1. Find correct port:
   ```bash
   ls /dev/cu.*
   ```
2. Verify port exists and use exact name:
   ```bash
   SERIAL_PORT=/dev/cu.usbmodem14101 npm start
   ```
3. Only one process can access serial port:
   ```bash
   # Close Serial Monitor in Arduino IDE first!
   # Or any other process using the port
   ```

### "Port is already in use"

**Symptoms:** Bridge crashes with "port already in use" error

**Solutions:**
1. Close Arduino IDE Serial Monitor
2. Check if bridge is already running:
   ```bash
   lsof -i :8080  # On Mac/Linux
   ```
3. Kill existing process:
   ```bash
   kill -9 <PID>
   ```
4. Wait 5 seconds before restarting bridge

### Bridge connects but gets no data

**Symptoms:** Bridge shows "Connected to /dev/cu.xxx" but no [DATA] lines

**Solutions:**
1. Verify Arduino sketch uploaded successfully
   - Open Serial Monitor in Arduino IDE at 115200 baud
   - Should see: `READY`, then `0,150.00`, etc.
2. Check serial connection in bridge
   - Restarting bridge forces reconnection
3. Verify Arduino firmware is actually running
   - Press ESP32 reset button (small button on board)
   - Should see `READY` in Serial Monitor again

## Dashboard Connection Issues

### Dashboard shows "DISCONNECTED"

**Symptoms:** Browser shows connection status as DISCONNECTED

**Solutions:**
1. Verify bridge is running:
   ```bash
   # Terminal 1 - Is bridge running?
   ps aux | grep bridge
   ```
2. Check bridge is on correct port (default 8080):
   ```bash
   lsof -i :8080
   ```
3. If bridge is running, dashboard should connect automatically
   - Wait 3 seconds (auto-reconnect interval)
   - Check browser console for errors: F12 → Console tab

### Dashboard shows "RECONNECTING"

**Symptoms:** Status flickers between CONNECTING and RECONNECTING

**Solutions:**
1. Bridge crashed or restarted:
   ```bash
   # Check bridge terminal for errors
   # Restart bridge: Ctrl+C, then npm start again
   ```
2. Network issue:
   - Ping bridge: `ping localhost`
   - Check firewall isn't blocking port 8080
3. Multiple dashboard instances competing:
   - Only open **one** http://localhost:3000 tab
   - Close other instances

## Sensor & Hardware Issues

### No blips showing on radar

**Symptoms:** Dashboard connects but no detections appear

**Solutions:**
1. Check HC-SR04 power:
   ```
   - Multimeter: VCC-GND should show 5V
   - Check TRIG and ECHO pins have 0-3.3V pulses
   ```
2. Sensor orientation:
   - HC-SR04 must "see" objects
   - Don't point directly at floor/wall (minimum ~5cm)
   - Try pointing at your hand
3. Verify Arduino TRIG and ECHO pins:
   - Check `arduino/radar.ino`: TRIG_PIN=26, ECHO_PIN=27
   - Verify breadboard connections match wiring diagram

### Servo not moving

**Symptoms:** Radar display shows angle = 0°, servo silent/still

**Solutions:**
1. Check servo power:
   ```
   - Multimeter: 5V between red and brown wires
   - Servo should "buzz" or make noise when powered
   ```
2. Check signal wire:
   - Orange wire should be on GPIO 14
   - Verify in `arduino/radar.ino`
3. Test servo independently:
   - Use Arduino Servo library example
   - Isolate servo from rest of circuit
4. Servo may be damaged:
   - Try rotating horn by hand (should have resistance)
   - Replace if stuck or unresponsive

### LED not alerting

**Symptoms:** LED never lights up, even with objects nearby

**Solutions:**
1. Check LED polarity:
   - Longer leg (anode) → GPIO 32 (through resistor)
   - Shorter leg (cathode) → GND
2. Check resistor:
   - Must be 220Ω (verify with multimeter)
   - Don't skip resistor (will burn LED)
3. Verify alert distance setting:
   ```cpp
   // In arduino/radar.ino:
   const float ALERT_DISTANCE = 50.0;  // Is this reasonable?
   ```
4. Test LED independently:
   - Connect LED + resistor directly to 5V/GND
   - Should light up

### Noisy/erratic distance readings

**Symptoms:** Distance jumps randomly, blips flicker

**Solutions:**
1. HC-SR04 interference:
   - Move away from other electronics
   - Keep away from fluorescent lights
   - Don't point at reflective surfaces directly
2. Increase measurement time:
   ```cpp
   const int STEP_DELAY_MS = 50;  // Increase from 30
   ```
3. Mechanical issues:
   - Check servo horn is secured
   - Ensure HC-SR04 doesn't vibrate
   - Tighten any loose connections

## Dashboard Display Issues

### Dashboard is laggy/slow

**Symptoms:** Sweep line is jerky, high CPU usage

**Solutions:**
1. Close other browser tabs (reduce browser workload)
2. Reduce update frequency:
   ```cpp
   // In Arduino: increase delay
   const int STEP_DELAY_MS = 50;  // was 30
   ```
3. Reduce blip lifetime:
   ```javascript
   // In web/pages/index.js:
   const BLIP_LIFETIME = 2000;  // was 5000
   ```
4. Lower canvas resolution:
   ```javascript
   <canvas ref={canvasRef} width={600} height={400} />
   // was 800x500
   ```

### Dashboard doesn't update but no error

**Symptoms:** Dashboard loads but nothing changes

**Solutions:**
1. Check browser console for errors:
   - F12 → Console tab
   - Look for red error messages
2. Verify WebSocket connection:
   - F12 → Network tab
   - Look for "ws://localhost:8080"
   - Should show "websocket" status
3. Check bridge is sending data:
   ```bash
   # In bridge terminal, should see [DATA] lines every 30-50ms
   # If not, check serial connection first
   ```

### Colors inverted or display issues

**Symptoms:** Dashboard colors wrong or display glitches

**Solutions:**
1. Hard refresh browser:
   - Mac: Cmd+Shift+R
   - Windows/Linux: Ctrl+Shift+R
2. Clear browser cache:
   - F12 → Application → Cache Storage → Clear
3. Check CSS loaded correctly:
   - F12 → Elements → Styles tab
   - Should show `globals.css` styles

## Performance Issues

### High CPU Usage

**Symptoms:** Fan spinning, laptop getting hot

**Solutions:**
1. Reduce canvas render frequency:
   - Cap to 30fps instead of 60fps
   - Edit `web/pages/index.js` requestAnimationFrame loop
2. Reduce brush strokes:
   ```javascript
   const SWEEP_TRAIL_DEG = 10;  // was 30
   ```
3. Close other applications
4. Use Firefox instead of Chrome (sometimes faster)

### Memory Leak

**Symptoms:** Browser becomes slower after running for hours

**Solutions:**
1. Restart browser/dashboard
2. Check for WebSocket reconnect loop:
   - F12 → Console
   - Should NOT see rapid "connection" messages
3. Limit blip history:
   ```javascript
   // Cap maximum number of blips stored
   if (detectionsRef.current.length > 500) {
     detectionsRef.current.shift();
   }
   ```

## Network Issues

### Bridge on different machine (remote)

**Symptoms:** Dashboard can't connect to bridge on another computer

**Solutions:**
1. Find bridge IP address:
   ```bash
   # On bridge machine:
   ifconfig | grep inet
   # Look for: inet 192.168.1.X (or similar)
   ```
2. Update dashboard to connect to remote:
   ```javascript
   // In web/pages/index.js, useRadar hook:
   const ws = new WebSocket('ws://192.168.1.100:8080');
   // Replace 192.168.1.100 with bridge machine IP
   ```
3. Ensure firewall allows port 8080:
   ```bash
   # Mac:
   sudo lsof -i :8080
   ```

## General Debugging

### Check System Logs

**Arduino Serial Monitor:**
```bash
# In Arduino IDE: Tools → Serial Monitor (115200 baud)
# Should show: READY, then angle,distance lines
```

**Bridge Logs:**
```bash
# Watch for [SERIAL] [WS] [DATA] lines
# [SERIAL] lines = data received from Arduino
# [DATA] lines = measurements
# [WS] lines = client connections
```

**Browser Console:**
```
F12 → Console tab
Look for any red error messages
```

### Systematic Debugging

If something doesn't work:

1. **Hardware working?**
   - Open Arduino Serial Monitor
   - Should see READY + distance data

2. **Bridge working?**
   - Check [SERIAL] Connected message
   - Check [DATA] lines appearing

3. **Dashboard working?**
   - Check browser console (F12)
   - Check browser network tab (WebSocket connection)

4. **Wiring correct?**
   - Verify with multimeter
   - Check breadboard connections

If still stuck, check [ARCHITECTURE.md](./ARCHITECTURE.md) to understand data flow.

## Still Stuck?

1. Re-read [GETTING_STARTED.md](./GETTING_STARTED.md)
2. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
3. Review [HARDWARE.md](./HARDWARE.md) for wiring
4. Check main [README.md](../README.md) for background

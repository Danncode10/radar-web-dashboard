const SerialPort = require('serialport');
const ReadlineParser = require('@serialport/parser-readline');
const WebSocket = require('ws');

const WS_PORT = 8080;
const SERIAL_PORT = process.env.SERIAL_PORT || '/dev/cu.usbmodem14101';
const BAUD_RATE = 115200;

// State tracking
let esp32Ready = false;
let pendingCommands = [];
let lastCommandTime = 0;
const COMMAND_DEBOUNCE_MS = 300; // ignore duplicate commands within this window

const timestamp = () => new Date().toLocaleTimeString();

// WebSocket server
const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`[${timestamp()}] [WS    ] Server ready → ws://localhost:${WS_PORT}`);

// Serial port setup — hupcl:false reduces DTR-triggered resets
const port = new SerialPort(SERIAL_PORT, {
  baudRate: BAUD_RATE,
  hupcl: false,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

port.on('open', () => {
  console.log(`[${timestamp()}] [SERIAL] Connected → ${SERIAL_PORT} @ ${BAUD_RATE} baud`);
  console.log(`[${timestamp()}] [SERIAL] Waiting for ESP32 READY...`);

  // Give ESP32 time to boot after DTR reset, then ping it
  setTimeout(() => {
    if (!esp32Ready) {
      port.write('PING\n');
      console.log(`[${timestamp()}] [SERIAL] Sent PING to ESP32`);
    }
  }, 2000);
});

// Broadcast a message to all connected WebSocket clients
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// Send a command to ESP32 (with debounce and ready-check)
function sendToESP32(cmd, value) {
  const now = Date.now();

  // Debounce: ignore rapid duplicate commands
  if (cmd === 'start' || cmd === 'stop') {
    if (now - lastCommandTime < COMMAND_DEBOUNCE_MS) {
      console.log(`[${timestamp()}] [CMD   ] ${cmd.toUpperCase()} debounced (ignored)`);
      return;
    }
    lastCommandTime = now;
  }

  const serialCmd = cmd === 'start' ? 'START\n'
    : cmd === 'stop' ? 'STOP\n'
    : cmd === 'setRange' ? `RANGE:${value}\n`
    : null;

  if (!serialCmd) return;

  if (!esp32Ready) {
    console.log(`[${timestamp()}] [CMD   ] ESP32 not ready — queuing ${cmd.toUpperCase()}`);
    // Only keep the latest start/stop, don't queue duplicates
    if (cmd === 'start' || cmd === 'stop') {
      pendingCommands = pendingCommands.filter(c => c.cmd !== 'start' && c.cmd !== 'stop');
    }
    pendingCommands.push({ cmd, value, serialCmd });
    return;
  }

  port.write(serialCmd);
  console.log(`[${timestamp()}] [CMD   ] ${cmd.toUpperCase()} sent to ESP32`);
}

// Flush pending commands after ESP32 becomes ready
function flushPendingCommands() {
  if (pendingCommands.length === 0) return;
  console.log(`[${timestamp()}] [CMD   ] Flushing ${pendingCommands.length} queued command(s)`);
  pendingCommands.forEach(({ cmd, serialCmd }) => {
    port.write(serialCmd);
    console.log(`[${timestamp()}] [CMD   ] ${cmd.toUpperCase()} sent to ESP32 (from queue)`);
  });
  pendingCommands = [];
}

parser.on('data', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  // Handle READY signal from ESP32
  if (trimmed === 'READY') {
    if (!esp32Ready) {
      console.log(`[${timestamp()}] [SERIAL] ESP32 is READY ✓`);
      esp32Ready = true;
      broadcast({ type: 'status', esp32Ready: true });
      flushPendingCommands();
    }
    return;
  }

  // Parse sensor data: "angle,distance"
  const parts = trimmed.split(',');
  if (parts.length !== 2) return;

  const angle = parseFloat(parts[0]);
  const distance = parseFloat(parts[1]);

  if (isNaN(angle) || isNaN(distance)) return;

  // ESP32 is sending data, so it's definitely ready
  if (!esp32Ready) {
    esp32Ready = true;
    broadcast({ type: 'status', esp32Ready: true });
    console.log(`[${timestamp()}] [SERIAL] ESP32 is READY (detected from data) ✓`);
    flushPendingCommands();
  }

  const data = {
    type: 'data',
    angle: Math.round(angle),
    distance: parseFloat(distance.toFixed(2)),
    timestamp: Date.now(),
  };

  broadcast(data);
  console.log(`[DATA]  ${data.angle}° →  ${data.distance}cm`);
});

port.on('error', (err) => {
  console.error(`[${timestamp()}] [SERIAL] Error:`, err.message);
  esp32Ready = false;
  broadcast({ type: 'status', esp32Ready: false });
  process.exit(1);
});

port.on('close', () => {
  console.log(`[${timestamp()}] [SERIAL] Port closed`);
  esp32Ready = false;
  broadcast({ type: 'status', esp32Ready: false });
});

wss.on('connection', (ws) => {
  console.log(`[${timestamp()}] [WS    ] Client connected (total: ${wss.clients.size})`);

  // Tell the new client the current ESP32 status
  ws.send(JSON.stringify({ type: 'status', esp32Ready }));

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.command === 'start' || data.command === 'stop' || data.command === 'setRange') {
        sendToESP32(data.command, data.value);
      }
    } catch (e) {}
  });

  ws.on('close', () => {
    console.log(`[${timestamp()}] [WS    ] Client disconnected (total: ${wss.clients.size - 1})`);
  });
});

console.log(`[${timestamp()}] [INFO  ] Waiting for serial data...`);

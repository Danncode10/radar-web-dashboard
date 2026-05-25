const SerialPort = require('serialport');
const ReadlineParser = require('@serialport/parser-readline');
const WebSocket = require('ws');
const path = require('path');

const WS_PORT = 8080;
const SERIAL_PORT = process.env.SERIAL_PORT || '/dev/cu.usbmodem14101';
const BAUD_RATE = 115200;

// WebSocket server
const wss = new WebSocket.Server({ port: WS_PORT });

const timestamp = () => new Date().toLocaleTimeString();

console.log(`[${timestamp()}] [WS    ] Server ready → ws://localhost:${WS_PORT}`);

// Serial port setup
const port = new SerialPort(SERIAL_PORT, { baudRate: BAUD_RATE });

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

port.on('open', () => {
  console.log(`[${timestamp()}] [SERIAL] Connected → ${SERIAL_PORT} @ ${BAUD_RATE} baud`);
});

parser.on('data', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  const parts = trimmed.split(',');
  if (parts.length !== 2) return;

  const angle = parseFloat(parts[0]);
  const distance = parseFloat(parts[1]);

  if (isNaN(angle) || isNaN(distance)) return;

  const data = {
    angle: Math.round(angle),
    distance: parseFloat(distance.toFixed(2)),
    timestamp: Date.now(),
  };

  // Broadcast to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });

  console.log(`[DATA]  ${data.angle}° →  ${data.distance}cm`);
});

port.on('error', (err) => {
  console.error(`[${timestamp()}] [SERIAL] Error:`, err.message);
  process.exit(1);
});

wss.on('connection', (ws) => {
  console.log(`[${timestamp()}] [WS    ] Client connected (total: ${wss.clients.size})`);

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.command === 'start') {
        port.write('START\n');
        console.log(`[${timestamp()}] [CMD   ] START sent to ESP32`);
      } else if (data.command === 'stop') {
        port.write('STOP\n');
        console.log(`[${timestamp()}] [CMD   ] STOP sent to ESP32`);
      }
    } catch (e) {}
  });

  ws.on('close', () => {
    console.log(`[${timestamp()}] [WS    ] Client disconnected (total: ${wss.clients.size - 1})`);
  });
});

console.log(`[${timestamp()}] [INFO  ] Waiting for serial data...`);

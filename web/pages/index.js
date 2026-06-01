import { useEffect, useRef, useState } from 'react';

const BLIP_LIFETIME = 3000;
const SWEEP_TRAIL_DEG = 30;

function useRadar() {
  const [status, setStatus] = useState('DISCONNECTED');
  const wsRef = useRef(null);
  const sweepAngleRef = useRef(0);
  const detectionsRef = useRef([]);

  useEffect(() => {
    const connect = () => {
      setStatus('CONNECTING');
      const ws = new WebSocket('ws://localhost:8080');
      ws.onopen = () => setStatus('CONNECTED');
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          sweepAngleRef.current = data.angle;
          detectionsRef.current.push({
            angle: data.angle,
            distance: data.distance,
            timestamp: data.timestamp || Date.now(),
          });
        } catch (err) {}
      };
      ws.onerror = () => setStatus('ERROR');
      ws.onclose = () => { setStatus('RECONNECTING'); setTimeout(connect, 3000); };
      wsRef.current = ws;
    };
    connect();
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, []);

  const sendCommand = (cmd, value) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command: cmd, value }));
    }
  };

  return { status, sweepAngleRef, detectionsRef, sendCommand };
}

function RadarCanvas({ sweepAngleRef, detectionsRef, alertMode, maxDist }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const alertRef = useRef(alertMode);
  const maxDistRef = useRef(maxDist);

  // Update every render so animation loop always sees latest values
  alertRef.current = alertMode;
  maxDistRef.current = maxDist;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animId;

    const setSize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    setSize();

    const ro = new ResizeObserver(setSize);
    ro.observe(container);

    const ctx = canvas.getContext('2d');

    const render = () => {
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H;
      const radius = Math.min(W / 2, H) * 0.92;
      const alert = alertRef.current;
      const maxD = maxDistRef.current;
      const green = alert ? '#ff3333' : '#00ff00';
      const dimGreen = alert ? '#661111' : '#004400';

      // Background
      ctx.fillStyle = alert ? 'rgba(20,8,8,0.85)' : 'rgba(0,8,0,0.85)';
      ctx.fillRect(0, 0, W, H);

      // Range rings + labels
      for (let i = 1; i <= 4; i++) {
        const r = (radius / 4) * i;
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = green;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI, 0, false);
        ctx.stroke();

        // Label on the right side of each ring
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = green;
        ctx.font = '12px "Share Tech Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${Math.round((maxD / 4) * i)}cm`, cx + r * Math.cos((30 * Math.PI) / 180) + 4, cy - r * Math.sin((30 * Math.PI) / 180));
      }

      // Angle lines every 30°
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = green;
      ctx.lineWidth = 1;
      for (let deg = 0; deg <= 180; deg += 30) {
        const rad = (deg * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + radius * Math.cos(rad), cy - radius * Math.sin(rad));
        ctx.stroke();
      }

      // Sweep trail
      const sweepRad = (sweepAngleRef.current * Math.PI) / 180;
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = green;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, sweepRad - (SWEEP_TRAIL_DEG * Math.PI) / 180, sweepRad, false);
      ctx.closePath();
      ctx.fill();

      // Sweep line
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = green;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(sweepRad), cy - radius * Math.sin(sweepRad));
      ctx.stroke();

      // Blips
      const now = Date.now();
      detectionsRef.current = detectionsRef.current.filter(
        (d) => now - d.timestamp < BLIP_LIFETIME
      );
      detectionsRef.current.forEach((det) => {
        if (det.distance <= 0 || det.distance > maxD) return;
        const age = now - det.timestamp;
        ctx.globalAlpha = Math.max(0, 1 - age / BLIP_LIFETIME);
        const rad = (det.angle * Math.PI) / 180;
        const r = (det.distance / maxD) * radius;
        ctx.fillStyle = alert ? '#ff5555' : '#00ff99';
        ctx.beginPath();
        ctx.arc(cx + r * Math.cos(rad), cy - r * Math.sin(rad), 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Base line
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = green;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.stroke();

      // Origin dot
      ctx.globalAlpha = 1;
      ctx.fillStyle = green;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}

function DataPanel({ sweepAngleRef, detectionsRef, status, maxDist, setMaxDist }) {
  const [display, setDisplay] = useState({ angle: 0, distance: -1 });

  useEffect(() => {
    const interval = setInterval(() => {
      if (detectionsRef.current.length > 0) {
        const latest = detectionsRef.current[detectionsRef.current.length - 1];
        setDisplay({ angle: latest.angle, distance: latest.distance });
      }
    }, 100);
    return () => clearInterval(interval);
  }, [detectionsRef]);

  return (
    <div className="data-panel">
      <h2>RADAR STATUS</h2>
      <div className="status-row">
        <span className="label">CONNECTION:</span>
        <span className={`value ${status.toLowerCase()}`}>{status}</span>
      </div>
      <div className="status-row">
        <span className="label">SWEEP ANGLE:</span>
        <span className="value">{sweepAngleRef.current}°</span>
      </div>
      <div className="status-row">
        <span className="label">DISTANCE:</span>
        <span className="value">
          {display.distance > 0 ? `${display.distance.toFixed(1)}cm` : '--'}
        </span>
      </div>
      <div className="status-row">
        <span className="label">DETECTIONS:</span>
        <span className="value">{detectionsRef.current.length}</span>
      </div>
      <div className="status-row">
        <span className="label">MAX RANGE:</span>
        <div className="range-control">
          <input
            type="number"
            className="range-input"
            value={maxDist}
            min={10}
            max={400}
            step={10}
            onChange={(e) => setMaxDist(Math.max(10, Math.min(400, Number(e.target.value))))}
          />
          <span className="value">cm</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { status, sweepAngleRef, detectionsRef, sendCommand } = useRadar();
  const [alertMode, setAlertMode] = useState(false);
  const [running, setRunning] = useState(false);
  const [maxDist, setMaxDist] = useState(30);
  const maxDistRef = useRef(maxDist);
  maxDistRef.current = maxDist;

  const handleStart = () => { sendCommand('start'); setRunning(true); };
  const handleStop = () => { sendCommand('stop'); setRunning(false); };

  useEffect(() => {
    sendCommand('setRange', maxDist);
  }, [maxDist]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const visibleDots = detectionsRef.current.filter(
        (d) => now - d.timestamp < BLIP_LIFETIME && d.distance > 0 && d.distance <= maxDistRef.current
      );
      setAlertMode(visibleDots.length > 0);
    }, 200);
    return () => clearInterval(interval);
  }, [detectionsRef]);

  return (
    <div className={`container ${alertMode ? 'alert' : ''}`}>
      <div className="header">
        <h1>◈ RADAR SYSTEM</h1>
        <p>Real-time 2D Ultrasonic Radar</p>
      </div>

      <div className="main-content">
        <div className="radar-section">
          <RadarCanvas
            sweepAngleRef={sweepAngleRef}
            detectionsRef={detectionsRef}
            alertMode={alertMode}
            maxDist={maxDist}
          />
        </div>

        <div className="info-section">
          <DataPanel
            sweepAngleRef={sweepAngleRef}
            detectionsRef={detectionsRef}
            status={status}
            maxDist={maxDist}
            setMaxDist={setMaxDist}
          />
          <div className="control-panel">
            <button
              className="ctrl-btn start"
              onClick={handleStart}
              disabled={running || status !== 'CONNECTED'}
            >
              ▶ START
            </button>
            <button
              className="ctrl-btn stop"
              onClick={handleStop}
              disabled={!running}
            >
              ■ STOP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

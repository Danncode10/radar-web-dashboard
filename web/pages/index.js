import { useEffect, useRef, useState } from 'react';

const MAX_DIST = 200;
const ALERT_DIST = 50;
const BLIP_LIFETIME = 5000;
const SWEEP_TRAIL_DEG = 30;

// Custom hook for radar WebSocket management
function useRadar() {
  const [status, setStatus] = useState('DISCONNECTED');
  const wsRef = useRef(null);
  const sweepAngleRef = useRef(0);
  const detectionsRef = useRef([]);

  useEffect(() => {
    const connect = () => {
      setStatus('CONNECTING');
      const ws = new WebSocket('ws://localhost:8080');

      ws.onopen = () => {
        setStatus('CONNECTED');
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          sweepAngleRef.current = data.angle;

          // Add detection with timestamp
          detectionsRef.current.push({
            angle: data.angle,
            distance: data.distance,
            timestamp: data.timestamp || Date.now(),
          });
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setStatus('ERROR');
      };

      ws.onclose = () => {
        setStatus('RECONNECTING');
        setTimeout(connect, 3000);
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return { status, sweepAngleRef, detectionsRef };
}

// Canvas radar component
function RadarCanvas({ sweepAngleRef, detectionsRef, alertMode }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height;
    const radius = Math.min(width, height) * 0.4;

    const render = () => {
      // Clear with phosphor effect
      ctx.fillStyle = alertMode ? 'rgba(20, 8, 8, 0.85)' : 'rgba(0, 8, 0, 0.82)';
      ctx.fillRect(0, 0, width, height);

      // Draw range rings
      ctx.strokeStyle = alertMode ? '#661111' : '#00ff00';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;

      for (let i = 1; i <= 4; i++) {
        const r = (radius / 4) * i;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, Math.PI, 0, false);
        ctx.stroke();
      }

      // Draw angle lines
      ctx.globalAlpha = 0.2;
      for (let deg = 0; deg <= 180; deg += 30) {
        const rad = (deg * Math.PI) / 180;
        const x = centerX + radius * Math.cos(rad);
        const y = centerY - radius * Math.sin(rad);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      // Draw sweep trail
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = alertMode ? '#ff3333' : '#00ff00';
      const sweepRad = (sweepAngleRef.current * Math.PI) / 180;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        sweepRad - (SWEEP_TRAIL_DEG * Math.PI) / 180,
        sweepRad,
        false
      );
      ctx.closePath();
      ctx.fill();

      // Draw sweep line
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = alertMode ? '#ff3333' : '#00ff00';
      ctx.lineWidth = 2;
      const endX = centerX + radius * Math.cos(sweepRad);
      const endY = centerY - radius * Math.sin(sweepRad);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Clean up old detections
      const now = Date.now();
      detectionsRef.current = detectionsRef.current.filter(
        (d) => now - d.timestamp < BLIP_LIFETIME
      );

      // Draw blips
      ctx.globalAlpha = 1;
      detectionsRef.current.forEach((detection) => {
        const age = now - detection.timestamp;
        const alpha = Math.max(0.2, 1 - age / BLIP_LIFETIME);
        ctx.globalAlpha = alpha;

        const deg = detection.angle;
        const cm = detection.distance;
        const rad = (deg * Math.PI) / 180;
        const r = (cm / MAX_DIST) * radius;

        const x = centerX + r * Math.cos(rad);
        const y = centerY - r * Math.sin(rad);

        ctx.fillStyle = alertMode ? '#ff5555' : '#00ff99';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw base line
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = alertMode ? '#661111' : '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.stroke();

      // Draw origin dot
      ctx.globalAlpha = 1;
      ctx.fillStyle = alertMode ? '#ff3333' : '#00ff00';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fill();

      requestAnimationFrame(render);
    };

    render();
  }, [sweepAngleRef, detectionsRef, alertMode]);

  return <canvas ref={canvasRef} width={800} height={500} />;
}

// Data panel showing current readings
function DataPanel({ sweepAngleRef, detectionsRef, status }) {
  const [display, setDisplay] = useState({ angle: 0, distance: 0 });

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
        <span className="value">{display.distance.toFixed(1)}cm</span>
      </div>
      <div className="status-row">
        <span className="label">DETECTIONS:</span>
        <span className="value">{detectionsRef.current.length}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const { status, sweepAngleRef, detectionsRef } = useRadar();
  const [alertMode, setAlertMode] = useState(false);

  useEffect(() => {
    // Check if any recent detection is within alert distance
    const now = Date.now();
    const recentAlert = detectionsRef.current.some(
      (d) => now - d.timestamp < 1000 && d.distance < ALERT_DIST
    );
    setAlertMode(recentAlert);
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
          />
        </div>

        <div className="info-section">
          <DataPanel
            sweepAngleRef={sweepAngleRef}
            detectionsRef={detectionsRef}
            status={status}
          />
        </div>
      </div>
    </div>
  );
}

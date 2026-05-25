# Deployment Guide

Guide for deploying the Radar System to production or remote environments.

## Deployment Options

### Option 1: Local Development (Default)

**Recommended for:** Testing, prototyping, single user

**Setup:**
```bash
# Terminal 1 - Bridge
cd bridge
SERIAL_PORT=/dev/cu.usbXXX npm start

# Terminal 2 - Dashboard
cd web
npm run dev

# Access: http://localhost:3000
```

**Pros:** Simple, no configuration needed
**Cons:** Ties up terminals, not scalable

---

### Option 2: Production Build + Process Manager

**Recommended for:** Single deployment, headless server

**Setup:**

1. **Build Next.js for production:**
   ```bash
   cd web
   npm run build
   ```

2. **Install process manager (PM2):**
   ```bash
   npm install -g pm2
   ```

3. **Create PM2 config file** (`ecosystem.config.js`):
   ```javascript
   module.exports = {
     apps: [
       {
         name: 'radar-bridge',
         script: './bridge/bridge.js',
         watch: ['bridge'],
         ignore_watch: ['node_modules', 'logs'],
         env: {
           SERIAL_PORT: '/dev/cu.usbmodem14101',
           WS_PORT: 8080,
           NODE_ENV: 'production'
         }
       },
       {
         name: 'radar-web',
         script: 'npm',
         args: 'run start',
         cwd: './web',
         env: {
           PORT: 3000,
           NODE_ENV: 'production'
         }
       }
     ]
   };
   ```

4. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save          # Save process list
   pm2 startup       # Auto-start on boot
   pm2 logs          # View logs
   pm2 status        # Check status
   ```

5. **Access:**
   - Open `http://localhost:3000`
   - Or forward port if headless

**Pros:** Auto-restart, persistent, logs, easy monitoring
**Cons:** Single machine deployment

---

### Option 3: Docker Containerization

**Recommended for:** Scalable deployment, reproducibility

**Setup:**

1. **Create Bridge Dockerfile** (`bridge/Dockerfile`):
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY bridge.js .
   
   EXPOSE 8080
   
   CMD ["node", "bridge.js"]
   ```

2. **Create Web Dockerfile** (`web/Dockerfile`):
   ```dockerfile
   FROM node:18-alpine as builder
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci
   
   COPY . .
   RUN npm run build
   
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY --from=builder /app/.next ./.next
   COPY --from=builder /app/public ./public
   
   EXPOSE 3000
   
   CMD ["npm", "start"]
   ```

3. **Create docker-compose.yml:**
   ```yaml
   version: '3.8'
   
   services:
     bridge:
       build: ./bridge
       container_name: radar-bridge
       environment:
         - SERIAL_PORT=/dev/ttyUSB0
         - WS_PORT=8080
       ports:
         - "8080:8080"
       devices:
         - /dev/ttyUSB0:/dev/ttyUSB0
       restart: unless-stopped
       depends_on:
         - web
     
     web:
       build: ./web
       container_name: radar-web
       environment:
         - PORT=3000
       ports:
         - "3000:3000"
       restart: unless-stopped
   
   volumes:
     radar_data:
   ```

4. **Build & run:**
   ```bash
   docker-compose build
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   
   # Stop
   docker-compose down
   ```

**Pros:** Reproducible, portable, isolated
**Cons:** Slightly more complex, Docker knowledge needed

---

### Option 4: Remote Deployment (Raspberry Pi / Server)

**Recommended for:** Permanent installation, remote access

**Setup:**

1. **SSH to remote machine:**
   ```bash
   ssh user@radar-server.local
   ```

2. **Clone project:**
   ```bash
   git clone <repo-url> ~/radar-project
   cd ~/radar-project
   ```

3. **Install dependencies:**
   ```bash
   cd bridge && npm install && cd ..
   cd web && npm install && cd ..
   ```

4. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

5. **Create config** (`ecosystem.config.js`):
   ```javascript
   module.exports = {
     apps: [
       {
         name: 'radar-bridge',
         script: './bridge/bridge.js',
         env: {
           SERIAL_PORT: '/dev/ttyUSB0',  // Adjust for RPi
           WS_PORT: 8080
         }
       },
       {
         name: 'radar-web',
         script: 'npm',
         args: 'run start',
         cwd: './web'
       }
     ]
   };
   ```

6. **Start & save:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

7. **Access from client machine:**
   ```bash
   # Find server IP
   ssh user@radar-server.local "hostname -I"
   
   # Open in browser
   http://192.168.1.100:3000
   ```

**Pros:** Permanent setup, remote access, always-on
**Cons:** Need extra hardware, network configuration

---

## Accessing Remote Dashboard

### From Local Network (Same WiFi)

1. **Find server IP:**
   ```bash
   # On server
   hostname -I
   # Example output: 192.168.1.100
   ```

2. **Update dashboard WebSocket address:**
   - Edit `web/pages/index.js`
   - Find line with `ws://localhost:8080`
   - Change to: `ws://192.168.1.100:8080`
   - Rebuild: `npm run build`

3. **Access from browser:**
   ```
   http://192.168.1.100:3000
   ```

### From Different Network (VPN/Tunnel)

1. **Use SSH tunnel:**
   ```bash
   # On local machine
   ssh -L 8080:localhost:8080 user@remote-server.com
   ssh -L 3000:localhost:3000 user@remote-server.com
   ```

2. **Connect to localhost:**
   ```
   http://localhost:3000
   ```

3. **Or use ngrok:**
   ```bash
   # On remote server
   npm install -g ngrok
   ngrok http 3000
   # Use provided URL
   ```

---

## Production Checklist

- [ ] Build Next.js: `npm run build` in `web/`
- [ ] Set `NODE_ENV=production`
- [ ] Use process manager (PM2, systemd, supervisor)
- [ ] Configure firewall (block unnecessary ports)
- [ ] Set up log rotation
- [ ] Monitor disk space
- [ ] Test auto-restart on failure
- [ ] Test auto-startup on system reboot
- [ ] Configure backups for data/logs
- [ ] Set up alerting/monitoring

---

## Performance Tuning for Production

### 1. Optimize Sampling Rate

For production, adjust based on use case:

```cpp
// In arduino/radar.ino
// High-frequency monitoring (real-time):
const int SWEEP_STEP = 1;      // 180 readings per sweep
const int STEP_DELAY_MS = 20;  // ~5 sweeps/sec

// Balanced (default):
const int SWEEP_STEP = 2;      // 90 readings per sweep
const int STEP_DELAY_MS = 30;  // ~3 sweeps/sec

// Low-frequency logging:
const int SWEEP_STEP = 5;      // 36 readings per sweep
const int STEP_DELAY_MS = 50;  // ~1 sweep/sec
```

### 2. Reduce Memory Usage

In `web/pages/index.js`:

```javascript
// Limit blip history
const MAX_BLIPS = 100;

useEffect(() => {
  if (detectionsRef.current.length > MAX_BLIPS) {
    detectionsRef.current = detectionsRef.current.slice(-MAX_BLIPS);
  }
}, []);
```

### 3. Add Data Persistence

Store readings to CSV:

```javascript
// In bridge/bridge.js
const fs = require('fs');
const csv = fs.createWriteStream(`radar-${Date.now()}.csv`);
csv.write('timestamp,angle,distance\n');

parser.on('data', (line) => {
  const [angle, distance] = line.trim().split(',');
  csv.write(`${Date.now()},${angle},${distance}\n`);
});
```

### 4. Monitor Resources

```bash
# Watch CPU & memory
watch -n 1 'ps aux | grep node'

# Monitor disk usage
df -h

# Check process logs
pm2 logs --lines 50
```

---

## Troubleshooting Deployment

### Bridge won't start after reboot

**Check:**
1. Serial port changed (USB ports shift)
   ```bash
   ls /dev/ttyUSB* or ls /dev/cu.*
   ```
2. Update `ecosystem.config.js` with correct port
3. Restart PM2:
   ```bash
   pm2 restart radar-bridge
   ```

### Dashboard won't connect to bridge

**Check:**
1. Bridge is running:
   ```bash
   pm2 status
   ```
2. WebSocket port is open:
   ```bash
   netstat -an | grep 8080
   ```
3. Dashboard WebSocket URL is correct:
   - Edit `web/pages/index.js`
   - Check `ws://` address matches bridge

### High CPU/Memory on remote machine

**Solutions:**
1. Reduce sampling rate (increase STEP_DELAY_MS)
2. Limit blip history (MAX_BLIPS)
3. Reduce canvas update rate (rAF optimization)
4. Use lighter CSS effects

---

## Monitoring & Logging

### With PM2

```bash
# View all logs
pm2 logs

# View specific app
pm2 logs radar-bridge

# Save logs to file
pm2 logs > ~/radar-logs.txt

# Monitor in real-time
pm2 monit
```

### With Docker

```bash
# View logs
docker-compose logs -f

# View specific service
docker-compose logs -f bridge

# Export logs
docker-compose logs > logs.txt
```

### Custom Logging

**Bridge logging to file:**

```javascript
// bridge/bridge.js
const fs = require('fs');
const logFile = fs.createWriteStream('bridge.log', { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  logFile.write(line + '\n');
}

log('Server started');
```

---

## Backup & Recovery

### Backup Configuration

```bash
# Backup entire project
tar -czf radar-backup-$(date +%Y%m%d).tar.gz ~/radar-project

# Backup specific files
cp ecosystem.config.js ecosystem.config.js.backup
cp bridge/bridge.js bridge/bridge.js.backup
```

### Restore from Backup

```bash
# Restore from tar
tar -xzf radar-backup-20240101.tar.gz

# Or restore specific files
cp ecosystem.config.js.backup ecosystem.config.js
```

---

## Scaling Considerations

### Multiple Dashboards

Currently, one bridge serves multiple dashboard clients:
```
Bridge (1) ─── ws:// ─── Dashboard 1
         │             ├─ Dashboard 2
         └─────────────┴─ Dashboard 3 (etc)
```

No changes needed; just access from multiple browsers.

### Multiple Sensors

To monitor multiple radars:

```javascript
// Create separate bridge instances
const bridgeConfigs = [
  { serialPort: '/dev/ttyUSB0', wsPort: 8080 },
  { serialPort: '/dev/ttyUSB1', wsPort: 8081 },
];

bridgeConfigs.forEach(config => {
  startBridge(config);
});
```

---

## Next Steps

- **Set up monitoring:** Ngrok, UptimeRobot, Grafana
- **Add authentication:** Basic auth, OAuth2
- **Enable HTTPS:** Use reverse proxy (nginx, caddy)
- **Database:** Store readings in PostgreSQL/MongoDB
- **Mobile app:** Build React Native companion app

See [DEVELOPMENT.md](./DEVELOPMENT.md) for extending functionality.

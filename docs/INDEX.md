# Documentation Index

Complete guide to all documentation files for the Radar System project.

## Quick Navigation

**New to the project?** Start here:
1. [GETTING_STARTED.md](./GETTING_STARTED.md) — 5-minute setup guide
2. [HARDWARE.md](./HARDWARE.md) — Wiring and components
3. [CONFIGURATION.md](./CONFIGURATION.md) — Customization options

**Stuck?** Check here:
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — Common issues and solutions

**Want to modify code?** Read here:
- [ARCHITECTURE.md](./ARCHITECTURE.md) — How the system works
- [DEVELOPMENT.md](./DEVELOPMENT.md) — Code modification guide

**Deploying to production?** See here:
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Deployment options and setup

---

## Documentation Files

### 📖 [GETTING_STARTED.md](./GETTING_STARTED.md)
**For:** First-time users, quick setup

**Contains:**
- ESP32 board setup in Arduino IDE
- Step-by-step firmware flashing
- Bridge and web dependencies installation
- Running all three components
- Expected outputs and verification

**Time:** 5-10 minutes
**Difficulty:** Beginner

---

### 🔌 [HARDWARE.md](./HARDWARE.md)
**For:** Understanding physical connections, component specs

**Contains:**
- Bill of Materials (BOM) with costs
- Complete ESP32 pinout diagram
- Wiring diagram for all components
- Component specifications and datasheets
- Step-by-step assembly instructions
- Power requirements and troubleshooting
- PCB design notes for production

**Time:** 15-30 minutes reading
**Difficulty:** Intermediate

---

### ⚙️ [CONFIGURATION.md](./CONFIGURATION.md)
**For:** Customizing behavior, tuning performance

**Contains:**
- Arduino firmware settings (pins, sweep speed, alerts)
- Bridge configuration (ports, serial settings)
- Dashboard settings (display, zoom, colors)
- Environment variables
- Performance tuning examples
- Recommended configurations for different use cases

**Time:** 5 minutes to apply changes
**Difficulty:** Beginner-Intermediate

---

### 🐛 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
**For:** Fixing problems, debugging issues

**Contains:**
- ESP32 connection problems and solutions
- Serial connection errors
- Dashboard connectivity issues
- Sensor and hardware failures
- Display performance issues
- Network and remote connection problems
- Systematic debugging methodology

**Time:** Varies by issue
**Difficulty:** All levels

---

### 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md)
**For:** Understanding system design, deep dive into code

**Contains:**
- System architecture overview
- Complete data flow diagrams
- Arduino firmware responsibilities and code
- Node.js bridge design and pipeline
- Next.js dashboard structure and patterns
- Design patterns used (Producer-Consumer, Observer, etc.)
- Coordinate transformations and math
- Performance considerations and scaling

**Time:** 30-45 minutes reading
**Difficulty:** Advanced

---

### 👨‍💻 [DEVELOPMENT.md](./DEVELOPMENT.md)
**For:** Developers who want to modify code

**Contains:**
- Project structure breakdown
- Development environment setup
- Arduino firmware modifications
- Bridge code changes and examples
- Dashboard component modifications
- Adding new features (sound alert, data export, etc.)
- Testing and debugging techniques
- Code style and best practices
- Performance optimization tips

**Time:** Varies by task
**Difficulty:** Advanced

---

### 🚀 [DEPLOYMENT.md](./DEPLOYMENT.md)
**For:** Production deployment and scaling

**Contains:**
- Deployment options (local, PM2, Docker, remote)
- Process manager setup (PM2)
- Docker containerization
- Remote deployment to Raspberry Pi / Server
- Accessing remote dashboard
- Production checklist
- Performance tuning for production
- Monitoring and logging setup
- Backup and recovery procedures
- Scaling considerations

**Time:** 30 minutes per option
**Difficulty:** Advanced

---

## By Use Case

### "I just want to get it running"
→ [GETTING_STARTED.md](./GETTING_STARTED.md)

### "It's not working, help!"
→ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### "I need to wire this up"
→ [HARDWARE.md](./HARDWARE.md)

### "I want to change how it behaves"
→ [CONFIGURATION.md](./CONFIGURATION.md)

### "I need to understand the code"
→ [ARCHITECTURE.md](./ARCHITECTURE.md)

### "I want to modify the code"
→ [DEVELOPMENT.md](./DEVELOPMENT.md)

### "I need to deploy to production"
→ [DEPLOYMENT.md](./DEPLOYMENT.md)

### "What's everything?"
→ This file, then [../README.md](../README.md) for full overview

---

## By Skill Level

### 🟢 Beginner
1. [GETTING_STARTED.md](./GETTING_STARTED.md) — Setup
2. [HARDWARE.md](./HARDWARE.md) — Wiring (assembly section)
3. [CONFIGURATION.md](./CONFIGURATION.md) — Basic tuning

### 🟡 Intermediate
1. [HARDWARE.md](./HARDWARE.md) — Full guide
2. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — Debugging
3. [CONFIGURATION.md](./CONFIGURATION.md) — Advanced tuning
4. [ARCHITECTURE.md](./ARCHITECTURE.md) — First half

### 🔴 Advanced
1. [ARCHITECTURE.md](./ARCHITECTURE.md) — Full guide
2. [DEVELOPMENT.md](./DEVELOPMENT.md) — Code modifications
3. [DEPLOYMENT.md](./DEPLOYMENT.md) — Production setup

---

## By Role

### 🎓 Student / Learner
→ Start with [GETTING_STARTED.md](./GETTING_STARTED.md), then [ARCHITECTURE.md](./ARCHITECTURE.md)

### 🔧 Hardware Engineer
→ [HARDWARE.md](./HARDWARE.md) + [CONFIGURATION.md](./CONFIGURATION.md) (Arduino section)

### 💻 Software Developer
→ [ARCHITECTURE.md](./ARCHITECTURE.md) + [DEVELOPMENT.md](./DEVELOPMENT.md)

### 🚀 DevOps / SysAdmin
→ [DEPLOYMENT.md](./DEPLOYMENT.md) + [DEVELOPMENT.md](./DEVELOPMENT.md) (testing section)

### 🔍 QA / Tester
→ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) + [DEVELOPMENT.md](./DEVELOPMENT.md) (testing section)

---

## File Structure

```
docs/
├── INDEX.md                    ← You are here
├── GETTING_STARTED.md          Quick 5-minute setup
├── HARDWARE.md                 Wiring, components, assembly
├── CONFIGURATION.md            Settings and tuning
├── TROUBLESHOOTING.md          Problems and solutions
├── ARCHITECTURE.md             System design deep-dive
├── DEVELOPMENT.md              Code modification guide
└── DEPLOYMENT.md               Production setup
```

---

## Related Files (Project Root)

- [README.md](../README.md) — Project overview and introduction
- [arduino/radar.ino](../arduino/radar.ino) — Firmware source
- [bridge/bridge.js](../bridge/bridge.js) — Bridge server source
- [web/pages/index.js](../web/pages/index.js) — Dashboard source
- [web/styles/globals.css](../web/styles/globals.css) — Styling

---

## FAQ

### Q: Where do I start?
**A:** [GETTING_STARTED.md](./GETTING_STARTED.md)

### Q: Something's broken, where's the fix?
**A:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### Q: How do I change settings?
**A:** [CONFIGURATION.md](./CONFIGURATION.md)

### Q: How does it work internally?
**A:** [ARCHITECTURE.md](./ARCHITECTURE.md)

### Q: I want to add a feature
**A:** [DEVELOPMENT.md](./DEVELOPMENT.md)

### Q: How do I put this on a server?
**A:** [DEPLOYMENT.md](./DEPLOYMENT.md)

### Q: What's the project about?
**A:** [README.md](../README.md)

---

## Document Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| GETTING_STARTED.md | ✅ Complete | 2026-05-25 |
| HARDWARE.md | ✅ Complete | 2026-05-25 |
| CONFIGURATION.md | ✅ Complete | 2026-05-25 |
| TROUBLESHOOTING.md | ✅ Complete | 2026-05-25 |
| ARCHITECTURE.md | ✅ Complete | 2026-05-25 |
| DEVELOPMENT.md | ✅ Complete | 2026-05-25 |
| DEPLOYMENT.md | ✅ Complete | 2026-05-25 |
| INDEX.md | ✅ Complete | 2026-05-25 |

---

## Tips for Using Documentation

1. **Use Ctrl+F (Cmd+F) to search** within documents for keywords
2. **Click links** to jump between related sections
3. **View the main README** for high-level overview
4. **Check TROUBLESHOOTING** before asking for help
5. **Read ARCHITECTURE** to understand why things are designed a certain way

---

## Contributing to Documentation

To improve these docs:
1. Find inaccuracies or outdated info
2. Test procedures and note what works/fails
3. Add examples or clarifications
4. Submit pull request with changes

---

## External Resources

- [Arduino ESP32 Docs](https://docs.espressif.com/projects/arduino-esp32/en/latest/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Node.js SerialPort](https://serialport.io/)
- [WebSocket Standard](https://www.websocket.org/)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

Last updated: 2026-05-25
For questions or clarifications, refer to the main [README.md](../README.md)

# Cuenect Webfront Offline Remote Controller

Modern React-based mobile and desktop web remote controller for the Cuenect Hologram Stage Viewer Application.

---

## Features

- **Real-Time 3D Model Control**: D-Pad joystick with continuous press motion, zoom in/out, and global release listeners.
- **Control Modes**: Seamlessly switch between **Rotate**, **Pan**, **Spotlight**, and **Magnifier** with automated velocity zeroing.
- **Stereoscopic 3D & Optical Calibration**: Live sliders for IPD, Zero Parallax Distance, FOV, Toe-In convergence, and directional lighting intensity.
- **Video & Image Playback**: Full playback control (Play, Pause, Stop, Seek $\pm 10$s, Volume slider, Mute toggle).
- **Asset Catalog & Custom Playlists**: Instant asset synchronization on connect, custom playlist reordering, and automated timed slideshow loops.
- **Dual Connection Architecture**: Connects seamlessly via Socket.IO and WebSocket (`:9000`) with auto-reconnect and mid-session synchronization.
- **QR Code Scanner**: Integrated camera QR scanner (`html5-qrcode`) for quick pairing.

---

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **UI & Icons**: Lucide React + Vanilla CSS
- **Networking**: `socket.io-client` + native WebSocket
- **Deployment**: Netlify SPA ready (`netlify.toml`) & Progressive Web App (`manifest.json`)

---

## Getting Started

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```

---

## Project Structure

```
src/
├── components/
│   ├── Controller/        # DPad, InteractionModeSelector, ControlPad
│   ├── Settings/          # StereoSettingsModal (optical calibration)
│   ├── Playlist/          # PlaylistBuilder, SlideshowControls
│   ├── Video/             # VideoControls
│   ├── Scanner/           # QRScannerModal
│   └── Header/Navbar/     # Connection status & navigation
├── context/
│   └── StageContext.tsx   # Central stage state, socket listeners & dual-sync
├── services/
│   ├── socketService.ts   # Socket.IO client manager
│   ├── websocket.ts       # Raw WebSocket client manager
│   └── storage.ts         # LocalStorage persistence (IP, config, stereo settings)
└── types/
    └── protocol.ts        # Shared wire DTOs and command contracts
```

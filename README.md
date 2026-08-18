# Cuenect Webfront Offline Remote Controller

Modern React-based mobile and desktop web remote controller for the Cuenect Hologram Stage Viewer Application.

---

## Features

- **Real-Time 3D Model Control**: D-Pad joystick with sub-pixel analog precision, continuous press motion, zoom in/out, and global safety release listeners.
- **Control Modes**: Seamlessly switch between **Rotate**, **Pan**, **Spotlight**, and **Magnifier** with automated velocity zeroing.
- **Stereoscopic 3D & Optical Calibration**: Live sliders for IPD, Zero Parallax Distance, FOV, Toe-In convergence, and directional lighting intensity.
- **Video & Image Playback**: Full playback control (Play, Pause, Stop, Seek $\pm 10$s, Volume slider, Mute toggle).
- **Asset Catalog & Custom Playlists**: Instant asset synchronization on connect, custom playlist reordering, and automated timed slideshow loops.
- **Unified Socket.IO Architecture**: Connects seamlessly via Socket.IO (`:9000`) with auto-reconnect, signature-based deduplication, and mid-session synchronization.
- **QR Code Scanner**: Integrated camera QR scanner (`html5-qrcode`) for quick pairing.

---

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **UI & Icons**: Lucide React + Vanilla CSS
- **Networking**: `socket.io-client`
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
│   ├── Catalog/           # AssetCard, AssetGrid, PlaylistTabs
│   ├── Common/            # Header, Modal, Toast
│   ├── Connection/        # ConnectionModal, QRScannerModal
│   ├── Controller/        # DPad, FullScreenController, ModelControlPanel, VideoControlPanel
│   ├── Playlist/          # PlaylistMakerModal, SlideshowBar
│   └── Settings/          # StageSettingsModal (optical calibration)
├── context/
│   └── StageContext.tsx   # Central stage state & socket listeners
├── hooks/
│   └── useBodyScrollLock.ts
├── services/
│   ├── socketService.ts   # Socket.IO client manager
│   └── storage.ts         # LocalStorage persistence (IP, config, stereo settings)
└── types/
    └── protocol.ts        # Shared wire DTOs and command contracts
```

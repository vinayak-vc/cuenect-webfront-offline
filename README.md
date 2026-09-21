# Cuenect Webfront Offline Remote Controller

Modern React-based mobile and desktop web remote controller for the Cuenect Hologram Stage Viewer Application.

---

## Features

- **Real-Time 3D Model Control**: D-Pad joystick with sub-pixel analog precision, continuous press motion, zoom in/out, and global safety release listeners.
- **Control Modes**: Seamlessly switch between **Rotate**, **Pan**, **Spotlight**, and **Magnifier** with automated velocity zeroing.
- **Projection Modes**: Switch the stage between flat 2D, stereoscopic side-by-side, and the Axiom HOLO device. Selectable from the header on every screen, from the centre of the control pad, and from the More sheet.
- **Stereoscopic 3D & Optical Calibration**: Live sliders for IPD, Zero Parallax Distance, FOV, Toe-In convergence, and directional lighting intensity, grouped with expert parameters behind progressive disclosure.
- **Single-Operator Control Lock**: With several controllers connected the bridge grants stage control to one operator; the rest observe until they request it. Blocked commands are explained rather than silently dropped.
- **Video & Image Playback**: Full playback control (Play, Pause, Stop, Seek $\pm 10$s, Volume slider, Mute toggle).
- **Asset Catalog & Custom Playlists**: Instant asset synchronization on connect, custom playlist reordering, and automated timed slideshow loops.
- **Recent & Favorites**: Locally persisted recently-loaded and favourited assets, surfaced as catalog filters for fast reuse during a live event.
- **Operator Console UX**: Mobile-first navigation (Assets / Playlist / Control / More), a persistent Now-on-Stage bar that opens the controller, a zero-scroll controller screen, and bottom sheets on mobile that become centred dialogs on desktop.
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
│   ├── Settings/          # StageSettingsModal (optical calibration)
│   └── Stage/             # NowOnStage, MoreSheet, ProjectionSheet
├── context/
│   └── StageContext.tsx   # Central stage state, socket listeners, control-lock state
├── hooks/
│   └── useBodyScrollLock.ts
├── styles/
│   ├── tokens.css         # Design tokens (surface, motion, type, spacing scales)
│   ├── system.css         # App shell, asset browser, sheets, sliders, states
│   └── console.css        # Operator console refinements
├── services/
│   ├── socketService.ts   # Socket.IO client manager + stage-control gating
│   └── storage.ts         # LocalStorage persistence (IP, config, stereo settings)
└── types/
    └── protocol.ts        # Shared wire DTOs and command contracts
```

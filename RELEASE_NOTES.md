# Release Notes - Cuenect Webfront Controller

## [1.2.2] - 2026-09-23

### Fixed
- **3D Pan Boundary Clamping & Unity Stage Proportional Matching**:
  - Bound pan translation within Web 3D viewport so the model cannot be dragged off-screen.
  - Scaled normalized pan coordinates ([-1, 1]) directly to Unity Hologram Stage bounds (±9.0 X, ±5.0 Y), matching the motion range of the D-Pad.
  - Eliminated pan jitter in Unity by implementing `Vector3.Lerp` target smoothing in `PanController.Update()`.
- **Reset Teleport / Behind Camera Fix**:
  - Fixed `GameManager.MovableJoystickControl` so reset no longer teleports the active model to `Vector3.zero` (behind camera).
  - Ensured model position, rotation, and framed scale smoothly restore via `PanController.ResetPosition()` to `_initpos`.

---

## [1.2.1] - 2026-09-23

### Fixed
- **3D Gesture Inversion & Sync Alignment**:
  - Inverted horizontal gesture delta (`- dx * rotSpeed`) so swiping right turns the model clockwise / right in both Three.js web preview and Unity Hologram Stage, aligning touch motion with model rotation.
  - Fixed model reset synchronization in `ModelViewer3D.tsx` to explicitly reset both local Three.js transforms and stage transform (`syncModelTransform(0, 0, minScale, 0, 0)`), ensuring the stage model returns to center facing the camera.
  - Aligned reset behavior between Web and Unity so resetting rotation restores the front-facing camera angle (`Euler(0, 180, 0)`).

---

## [1.2.0] - 2026-09-23

### Added
- **Full Progressive Web App (PWA) Capability**:
  - Implemented production Service Worker (`sw.js`) with offline caching of core shell assets (HTML, CSS, JS, favicons, logos).
  - Configured Cache-First with Stale-While-Revalidate caching strategy for static assets, while cleanly bypassing WebSocket, Socket.IO, and live 3D streaming API endpoints.
  - Enhanced `manifest.json` with complete PWA spec properties (`id`, `scope`, `orientation: "portrait-primary"`, `categories`, and app shortcuts).
  - Implemented `pwaService.ts` for automated service worker registration and `beforeinstallprompt` event handling.
  - Added an in-app "Install App" button in `Header.tsx` allowing one-click installation on mobile devices (Android/iOS) and desktop browsers (Chrome, Edge, Safari).

---

## [1.1.0] - 2026-09-23

### Added
- **Hologram Crystal App Icons & Favicons**:
  - Added multi-resolution icons (`favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`).
  - Added luminous hologram brand icon to navigation bar in `Header.tsx`.
  - Updated PWA `manifest.json` and `index.html`.
- **Seamless Auto-Rotation Synchronization**:
  - Synchronized initial 10 deg/sec auto-rotation in `ModelViewer3D.tsx` to match Unity Stage upon 3D model load.
  - Added instant auto-rotation cancellation on user gesture (touch, swipe, mouse wheel) across both web controller and Unity stage (`stopAutoRotate()`), eliminating angular jump offsets.
- **Force-Load Parameter Propagation**:
  - Propagated `forceLoad` flag from `ModelControlPanel.tsx` to `ModelViewer3D.tsx` to include `&force=true` on large model streaming requests.

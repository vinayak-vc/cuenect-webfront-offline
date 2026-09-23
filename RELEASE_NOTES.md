# Release Notes - Cuenect Webfront Controller

## [1.3.0] - 2026-09-23

### Added
- **Natural Multi-Touch 3D Controls (Simultaneous Pan & Zoom)**:
  - 1-Finger Drag (or Left-click drag): Orbit / Rotate Yaw & Pitch (inverted horizontal delta for natural turning).
  - 2-Finger Drag: Smooth Pan within clamped viewport boundaries.
  - 2-Finger Pinch (or Mouse Wheel): Zoom / Scale model smoothly.
  - Simultaneous 2-finger Pan and Pinch: Panning and scaling operate concurrently without conflicting gestures.
- **On-Canvas Floating HUD Controls**:
  - **Quick Mode Chip (`[ ⟳ Orbit | ✥ Pan ]`)**: Top-left on-canvas toggle enabling single-finger / single-thumb panning without navigating menus.
  - **Quick Reset (`↺`)**: Top-right on-canvas floating button to instantly re-center, re-frame, and reset model orientation.
  - **Floating Zoom Pill (`[ + ]` / `[ − ]`)**: Bottom-right on-canvas zoom buttons supporting both single-tap steps and press-and-hold continuous zooming.
  - **Transient Interaction Hint**: Displays gesture guide on initial load, auto-dismissing after 4 seconds or immediately on first touch.
  - **Active Gesture Feedback**: Clear real-time status overlay indicating current gesture (Orbiting, Panning, Scaling, or Panning & Scaling).

### Changed
- **Streamlined Control Layout (`ModelControlPanel.tsx`)**:
  - Moved **Control Surface Selector (`[ 3D View | D-Pad ]`)** to the top of the interface for immediate visibility.
  - Placed compact **Projection & Camera Toolbar** directly below the surface selector.
  - Removed redundant outer `Control Mode` row when 3D View is active, maximizing vertical canvas height on mobile devices and eliminating unnecessary page scrolling.
  - Displayed `D-Pad Direction Mode` specifically above the D-Pad when in classic D-Pad mode.

---

## [1.2.3] - 2026-09-23

### Changed
- **Removed Spotlight and Magnifier from Web Controller Interface**:
  - Removed Spotlight (Light) and Magnifier options from the 3D model control mode selector (`ModelControlPanel.tsx`), streamlining controls to Rotate and Pan.
  - Cleaned up unused icons and mode-switching logic in `ModelControlPanel.tsx` and `ModelViewer3D.tsx`.

---

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

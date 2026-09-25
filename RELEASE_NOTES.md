# Release Notes - Cuenect Webfront Controller

## [1.4.4] - 2026-09-25

### Added
- **System Default View Mode Setting**:
  - Added "System Default View Mode" dropdown selector under Advanced Settings (`Settings -> Advanced`).
  - Allows selecting persistent startup projection mode (`2D`, `SBS`, `HOLO`, `FMAX`) saved on the Unity stage via PlayerPrefs.
  - Normal mode changes from the header or projection drawer remain temporary session switches and do not alter the system default.
- **Unity First-Time Startup Mode Synchronization**:
  - Web now adopts Unity's active mode directly upon connection without pushing cached localStorage modes, ensuring unity and web states are immediately unified on launch.

### Fixed
- **Unified Scale Minimum & Clamp**:
  - Unified scale math across 3D view `+` / `−` buttons, mouse wheel, pinch zoom, and D-Pad zoom relative to the model's framed baseline ($0.25\times$ to $25.0\times$), eliminating discrepancies where mouse scroll and buttons had different minimum scales.
- **Smooth 3D View Pan Drag**:
  - Eliminated jitter during 3D view pan drag by removing the 60fps idle joystick position overwrite in Unity and enforcing clamped normalized coordinates `[-1, 1]`.

---

## [1.4.3] - 2026-09-25

### Changed
- **Unified 3D View and D-Pad Zoom Behavior**:
  - Aligned the 3D View `+` and `-` zoom buttons to use the exact same joystick scale pipeline as the D-Pad (`sendModelJoystick` with direction `Scale`), eliminating scale desync and drift.
- **Unified Pan Mode with Double-Tap Pan Gesture**:
  - Decoupled the 3D view `[ ✥ Pan ]` mode chip from the Unity-side movable action command, operating single-finger pan with the identical smooth translation and camera lerp as the double-tap drag gesture.
- **Removed "Stage" Across Entire Web Application**:
  - Removed all user-facing instances of the word "Stage" from buttons, badges, navigation, modals, sheets, toasts, and descriptions for cleaner, modern branding.
- **Replaced "KMAX" with "FMAX"**:
  - Renamed all UI displays and projection selector options from KMAX to FMAX.
  - Added protocol and parser support for FMAX aliases while maintaining seamless backward compatibility.

---

## [1.4.2] - 2026-09-25

### Changed
- **Expanded Zoom Clamp Range ($0.25\times$ to $25.0\times$)**:
  - Expanded minimum zoom clamp down to `0.25x` (zoom out to 25% of framed baseline scale) and maximum zoom up to `25.0x` across mouse wheel, pinch gesture, and zoom buttons.
  - Aligned with Unity's updated `PanController` scale bounds so models can be freely inspected both at macro overview and high-magnification close-up.

---

## [1.4.1] - 2026-09-24

### Fixed
- **Clean Model Load Scale Initialization**:
  - Ensured `targetScaleRef` is cleanly reset to `1.0` alongside `currentScaleRef` when a new GLB model finishes streaming, preventing stale zoom multipliers from carrying over to newly loaded models.
  - Aligned Web Front D-Pad pan commands with Unity's updated position tracking so direction controls move the stage model smoothly without snapping back.

---

## [1.4.0] - 2026-09-23

### Added
- **Top Expandable Search Bar**:
  - Added a search toggle icon button at the top header actions.
  - Implemented smooth expanding animation revealing an auto-focused search input on both mobile and desktop.
  - Added real-time filtering with clear and close actions.
- **Card-Level Click-to-Load**:
  - Clicking or tapping anywhere on an asset card now loads the model directly onto the hologram stage.
  - Re-labeled the primary button from "Load to Stage" to "Load" for a clean, punchy design.
- **Smooth Scale Lerping (Zero Jitter)**:
  - Added target scale interpolation (`targetScaleRef`) in Three.js `animate()` loop.
  - Eliminates scale stepping and jitter when pressing `+` and `-` zoom buttons or using the mouse wheel/pinch gestures.

---

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

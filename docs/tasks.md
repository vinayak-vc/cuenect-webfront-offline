# Tasks: Cuenect Webfront Offline Controller

| ID | Title | Status | Date | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **W-101** | Install Three.js & types | DONE | 2026-09-22 | Installed `three` and `@types/three`. |
| **W-102** | Protocol metadata fields | DONE | 2026-09-22 | Added `fileSizeBytes`, `triangleCount`, `vertexCount`, `isWebPreviewable` to `AssetInformation` in `src/types/protocol.ts`. |
| **W-103** | Add `getHttpBaseUrl()` | DONE | 2026-09-22 | Exposed `getHttpBaseUrl()` on `StageSocketService` to stream GLBs from the Node.js bridge. |
| **W-104** | Create `ModelViewer3D` | DONE | 2026-09-22 | Three.js WebGL canvas with touch rotate, 2-finger pan, double-tap pan, and pinch zoom. Syncs live to Unity Stage with toggle. |
| **W-105** | Adaptive `ModelControlPanel` | DONE | 2026-09-22 | Integrated 25MB and 250k triangle threshold gating. Falls back to classic D-Pad with informative banner when exceeded. |
| **W-106** | Production Build Verification | DONE | 2026-09-22 | Verified `npm run build` succeeds cleanly. |
| **W-107** | Documentation per `AGENTS.md` | DONE | 2026-09-22 | Created `project-overview.md`, `architecture.md`, `roadmap.md`, `tasks.md`, `decisions.md`, `ai_handoff.md`. |
| **W-108** | Ngrok Warning Bypass on Model Fetch | DONE | 2026-09-22 | Configured `GLTFLoader` with `ngrok-skip-browser-warning: true` header and URL parameter to bypass ngrok ERR_NGROK_6024 CORS interstitial. |
| **W-109** | Non-Passive Wheel & Gesture Listeners | DONE | 2026-09-22 | Attached wheel and touch gesture listeners directly with `{ passive: false }` to resolve `Unable to preventDefault inside passive event listener` and prevent browser scrolling while zooming. |
| **W-110** | Hide Fullscreen Button | DONE | 2026-09-22 | Removed Fullscreen quick-action buttons from `FullScreenController`. |
| **W-111** | Persistent Mode, View Mode Changer & Ortho/Persp Toggle | DONE | 2026-09-22 | Made Rotate/Pan/Light/Magnifier modes and Projection view changer accessible in both Live View & D-Pad. Conditioned Camera Ortho/Persp toggle to show on Rotate/Pan and hide on Light/Magnifier across both views. |
| **W-112** | Auto-switch View on Mode Change | DONE | 2026-09-22 | Automatically switch to D-Pad when Light or Magnifier is selected; automatically restore 3D View when switching back to Rotate or Pan. |
| **W-113** | Replace D-Pad View Mode with Reset Button | DONE | 2026-09-22 | Replaced projection mode changer in D-Pad center with Reset button triggering `resetModelTransform()`. |
| **W-114** | Resolve Local IP SSL Error | DONE | 2026-09-22 | Fixed `getHttpBaseUrl()` in `StageSocketService` to respect plain HTTP on local IP / localhost connections, eliminating `ERR_SSL_PROTOCOL_ERROR`. |
| **W-115** | 3-Level UX Hierarchy Redesign | DONE | 2026-09-22 | Streamlined controller hierarchy into 3 distinct levels: Level 1 Control Mode, Level 2 Configuration (Projection/Camera pills), Level 3 Control Surface (3D View \| D-Pad), and uncluttered 3D viewport with external toolbar strip. |
| **W-116** | Persistent 3D Canvas & Render Loop Optimization | DONE | 2026-09-22 | Kept 3D canvas mounted in DOM with visibility toggle to prevent reloading/re-parsing GLB. Implemented on-demand dirty rendering (0% CPU/GPU idle) and pre-compilation to eliminate RAF violations. Preserved manual D-Pad mode preference and hid redundant mobile Reset/More buttons. Made oversized model warning a compact single-line pill. |
| **W-117** | "Load Anyway" Override Button | DONE | 2026-09-22 | Added inline `Load Anyway` button to compact warning badge, allowing operator to preview models exceeding 25MB/250k tris on capable devices. |
| **W-118** | 1:1 Angular Delta Rotation Synchronization | DONE | 2026-09-22 | Transmit accumulated angular degree deltas with `action: 'delta'` for exact 1:1 tactile model rotation replication on Unity Hologram Stage. |

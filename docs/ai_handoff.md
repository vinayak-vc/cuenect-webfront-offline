# AI Handoff: Cuenect Webfront Offline Controller

## 1. Summary of Changes
- Installed `three` and `@types/three`.
- Updated `src/types/protocol.ts` to include GLB metrics (`fileSizeBytes`, `fileSizeMB`, `triangleCount`, `vertexCount`, `isWebPreviewable`).
- Updated `src/services/socketService.ts` to expose `getHttpBaseUrl()`.
- Created `src/components/Controller/ModelViewer3D.tsx` featuring:
  - Three.js WebGL canvas and `GLTFLoader`.
  - Single-pointer touch/drag orbital rotation.
  - Two-finger drag / double-tap drag / right-click drag pan.
  - Two-finger pinch / mouse wheel zoom.
  - Stage synchronization with optional local preview toggle (`Sync Stage: ON/OFF`).
  - View switcher to classic D-Pad.
  - Frame reset button.
  - Ngrok browser warning bypass header and parameter to ensure cross-origin model streaming succeeds over cloud tunnels.
  - Non-passive wheel and gesture listener binding to eliminate passive event listener console warnings and prevent whole-page scrolling during model zooming.
  - Multi-mode drag handling in 3D viewport (routes dragging to pan, spotlight, or magnifier depending on active mode).
- Updated `src/components/Controller/FullScreenController.tsx`:
  - Removed/hid the Fullscreen quick button from primary actions and desktop status panel.
- Updated `src/components/Controller/ModelControlPanel.tsx`:
  - Kept `<ModelViewer3D>` mounted in the DOM when eligible (`display: show3DViewer ? 'flex' : 'none'`), eliminating model reload/re-download when switching between 3D View and D-Pad.
  - Decoupled `userSurfacePreference` ('3d' vs 'dpad') from control mode changes: if the user explicitly chooses D-Pad, switching between Pan and Rotate now preserves D-Pad mode.
  - Made the high-poly/oversized model warning badge a compact, unobtrusive single-line pill.
- Updated `src/components/Controller/ModelViewer3D.tsx`:
  - Implemented on-demand dirty rendering (`needsRenderRef`), dropping idle CPU/GPU/battery usage to 0% and eliminating `requestAnimationFrame` handler execution time violations.
  - Added shader pre-compilation (`renderer.compile`) during model load to prevent initial frame stutter.
  - Pauses rendering when `isVisible` is false.
- Updated `src/components/Controller/FullScreenController.tsx`:
  - Hid redundant mobile bottom buttons (`Reset` and `More`) as requested by the user.
- Updated `src/components/Controller/ModelControlPanel.tsx`:
  - Added "Load Anyway" button to compact single-line warning badge, enabling operator override to load heavy models (>25MB / >250k tris) into 3D viewer.
  - Reset override automatically on active model change.
- Updated `src/components/Controller/ModelViewer3D.tsx` & `src/context/StageContext.tsx`:
  - Implemented 1:1 tactile angular delta rotation replication: gestures calculate exact yaw and pitch degree deltas, accumulated across throttle intervals, and transmitted via `sendModelJoystick` with `action: 'delta'`.
  - Flushes any remaining delta upon gesture release before stopping velocity.
- Verified production build (`npm run build` succeeds cleanly with 0 errors).
- Maintained documentation in `docs/` per `AGENTS.md` §16.

## 2. Modified & New Files
- `src/types/protocol.ts` (MODIFIED)
- `src/services/socketService.ts` (MODIFIED)
- `src/context/StageContext.tsx` (MODIFIED)
- `src/components/Controller/ModelViewer3D.tsx` (NEW / MODIFIED)
- `src/components/Controller/ModelControlPanel.tsx` (MODIFIED)
- `src/components/Controller/DPad.tsx` (MODIFIED)
- `src/components/Controller/FullScreenController.tsx` (MODIFIED)
- `docs/tasks.md` (MODIFIED)
- `docs/decisions.md` (MODIFIED)
- `docs/ai_handoff.md` (MODIFIED)

## 3. Next Recommended Task
- Test with operator on live device with Unity stage.

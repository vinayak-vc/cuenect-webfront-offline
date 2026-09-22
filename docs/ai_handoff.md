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
  - Restructured layout into a strict 3-tier UX hierarchy:
    - Level 1: Primary Control Mode (`Rotate | Pan | Light | Magnifier`).
    - Level 2: Secondary Stage Configuration (`Projection: HOLO ▾`, `Camera: Persp ▾`).
    - Level 3: Control Surface Mode (`3D View | D-Pad` segmented control).
  - Auto-switching between views: Selecting Spotlight or Magnifier automatically presents the D-Pad. Selecting Rotate or Pan automatically restores the 3D Live View.
  - Replaced the D-Pad center projection button with a dedicated **Reset** button (`resetModelTransform()`).
- Updated `src/components/Controller/ModelViewer3D.tsx`:
  - Removed all floating overlay buttons from inside the 3D canvas viewport, leaving the canvas dedicated solely to interactive touch/mouse manipulation.
  - Placed `Sync Stage` toggle, metadata readout (`tris · MB`), and `Reset View` button in a clean external toolbar strip directly underneath the viewport.
- Updated `src/components/Controller/FullScreenController.tsx`:
  - Changed status strip text to `Stage Ready · HOLO · Persp`.
- Verified production build (`npm run build` succeeds cleanly).
- Added and updated `docs/` per `AGENTS.md` §16.

## 2. Modified & New Files
- `package.json` (MODIFIED - added `three`, `@types/three`)
- `package-lock.json` (MODIFIED)
- `src/types/protocol.ts` (MODIFIED)
- `src/services/socketService.ts` (MODIFIED)
- `src/components/Controller/ModelViewer3D.tsx` (NEW)
- `src/components/Controller/ModelControlPanel.tsx` (MODIFIED)
- `docs/project-overview.md` (NEW)
- `docs/architecture.md` (NEW)
- `docs/roadmap.md` (NEW)
- `docs/tasks.md` (NEW)
- `docs/decisions.md` (NEW)
- `docs/ai_handoff.md` (NEW)

## 3. Next Recommended Task
- Deploy updated webfront or run live end-to-end rehearsal with the Unity Hologram Stage.

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
  - Persistent Control Mode selector (Rotate, Pan, Light, Magnifier) across both 3D Live View and D-Pad.
  - View Mode Changer (Projection: 2D, SBS, HOLO, KMAX) accessible across both views.
  - Camera toggle (Ortho / Perspective): visible when Rotate or Pan is selected; automatically hidden when Light or Magnifier is selected for both views.
  - Auto-switching between views: Selecting Spotlight or Magnifier automatically presents the D-Pad. Selecting Rotate or Pan automatically restores the 3D Live View.
  - Models $\le 25\text{ MB}$ and $\le 250\text{k}$ triangles load `ModelViewer3D` with seamless D-Pad toggle.
- Verified production build (`npm run build` succeeds).
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

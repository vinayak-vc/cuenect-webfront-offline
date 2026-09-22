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
- Updated `src/components/Controller/ModelControlPanel.tsx` with size and poly gating:
  - Models $\le 25\text{ MB}$ and $\le 250\text{k}$ triangles load `ModelViewer3D`.
  - Models exceeding the budget display a direct-stage control notice and display `DPad`.
- Verified production build (`npm run build` succeeds).
- Added `docs/` per `AGENTS.md` §16.

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

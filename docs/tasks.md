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

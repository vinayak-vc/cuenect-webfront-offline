# Roadmap: Cuenect Webfront Offline Controller

## Milestone 1: 3D WebGL Viewer & Gesture Controls (Completed)
- [x] Integrate Three.js and `@types/three` into Vite build pipeline.
- [x] Extend `AssetInformation` protocol with `fileSizeBytes`, `triangleCount`, and `isWebPreviewable`.
- [x] Build `ModelViewer3D` component with touch orbit, two-finger pan, and pinch zoom.
- [x] Implement live Stage synchronization with optional private preview toggle (`Sync Stage: ON/OFF`).
- [x] Implement adaptive size/poly gating in `ModelControlPanel` (thresholds: 25 MB, 250k triangles) with automatic D-Pad fallback.

## Milestone 2: Visual Enhancements
- [ ] Add shadow plane beneath models in 3D viewport.
- [ ] Add material wireframe inspection mode.

## Milestone 3: AR QuickLook
- [ ] Support WebXR / QuickLook export for viewing models in real space from mobile Safari / Chrome.

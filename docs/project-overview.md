# Project Overview: Cuenect Webfront Offline Controller

## 1. Executive Summary
`cuenect-webfront-offline` is a responsive, touch-optimised mobile and desktop web controller built with React, Vite, TypeScript, and Three.js. It connects to the `cuenect-nodejs-server` signaling bridge via Socket.IO to manage the Cuenect Hologram Stage presentation application.

## 2. Core Capabilities
- **Asset Catalog Browser**: Visual grid of 3D models, videos, and still images with lazy thumbnail fetching and category resolution.
- **Adaptive 3D Model Control**:
  - **Lightweight Models ($\le 25\text{ MB}$, $\le 250\text{k}$ triangles)**: Mounts an interactive WebGL 3D touch viewer (`ModelViewer3D`) supporting single-touch orbital rotation, two-finger pan / double-tap drag, and pinch-to-zoom, synchronized live to the Unity Stage.
  - **Heavy / High-Poly Models**: Gracefully falls back to the classic virtual D-Pad with a prominent warning chip explaining that the model is configured for direct Stage control.
- **Stage Sync Toggle**: Allows operators to privately inspect 3D models locally or drive the holographic stage live.
- **Projection & Stereo Calibration**: Controls SBS stereoscopic calibration (IPD, parallax, field-of-view) and display modes (2D, SBS, HOLO, KMAX).
- **Single Operator Ownership**: Concurrency-safe lock requesting and releasing stage ownership.

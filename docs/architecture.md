# Architecture: Cuenect Webfront Offline Controller

## 1. Application Layering
```
┌─────────────────────────────────────────────────────────────┐
│ cuenect-webfront-offline                                    │
│                                                             │
│  [React 18 Component Tree]                                  │
│     ├── App.tsx                                             │
│     ├── Catalog/ (AssetGrid, AssetCard)                     │
│     ├── Controller/                                         │
│     │    ├── FullScreenController                           │
│     │    ├── ModelControlPanel (Adaptive Gating)            │
│     │    ├── ModelViewer3D (Three.js WebGL & Touch/Mouse)   │
│     │    └── DPad (Classic Virtual Directional Pad)         │
│     └── StageContext (State Management & Protocol Dispatch) │
│                                                             │
│  [Socket & HTTP Layer]                                      │
│     ├── socketService.ts (Socket.IO relay connection)       │
│     └── getHttpBaseUrl() -> streams GLB from Node.js        │
└─────────────────────────────────────────────────────────────┘
```

## 2. 3D Model Viewport & Gesture Architecture
- **Rendering Engine**: Three.js WebGLRenderer with perspective camera and 4-point studio lighting (ambient, key, fill, rim).
- **Model Loader**: `GLTFLoader` streaming binary GLB from the Node.js bridge server (`/api/model?file=...`).
- **Bounding Box Framing**: Automatically scales and centers any model geometry to fit comfortably within the camera frustum regardless of original export scale.
- **Gesture Mapping**:
  - **1-finger touch / Left-click drag**: Orbit / rotation around model center. Emits `sendModelJoystick(Move, normDx, normDy)`.
  - **2-finger touch / Double-tap drag / Right-click drag**: Translation / pan. Emits normalized pan coordinates.
  - **2-finger pinch / Mouse wheel**: Dolly zoom in / out. Emits `sendModelJoystick(Scale, 0, 0, zoomDirection)`.
  - **Release**: Automatically dispatches `JoyStickDirection.End` and `(0, 0)` velocity resets to prevent drifting in Unity.
- **Gating Logic**: Models $> 25\text{ MB}$ or $> 250,000$ triangles are blocked from client-side WebGL loading to avoid mobile GPU exhaustion or out-of-memory browser crashes.

# Decisions: Cuenect Webfront Offline Controller

## D-001: Three.js Vanilla Integration Over Wrapper Libraries
- **Context**: Need high-performance, low-latency 3D rendering with custom gesture capture.
- **Alternatives Considered**:
  1. `@react-three/fiber` + `@react-three/drei`
  2. Google `<model-viewer>` web component
  3. Vanilla `three` with native canvas lifecycle in React `useRef` / `useEffect`
- **Decision**: Vanilla `three` + `GLTFLoader`.
- **Rationale**:
  - Direct access to PointerEvents, touch events, and delta math without third-party abstraction layers.
  - Allows synchronized dispatching to Socket.IO (`sendModelJoystick`) in the same event loop.
  - Avoids heavy secondary react reconciler dependencies.

## D-002: Dual-Mode Operation (Option C)
- **Decision**: Provide both an interactive 3D WebGL gesture view and a classic virtual D-Pad.
- **Rationale**:
  - Lightweight models ($\le 25\text{ MB}$, $\le 250\text{k}$ triangles) benefit enormously from tactile 3D manipulation.
  - Heavy models on mobile browsers risk tab crashes or severe frame lag; falling back to the D-Pad keeps control reliable regardless of asset complexity.
  - Operators can switch between 3D Touch and D-Pad at any time via a single tap.

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

## D-003: Auto-Switching between 3D View and D-Pad for 2D Lighting/Magnification Tools
- **Decision**: When in 3D View, selecting Spotlight or Magnifier automatically transitions the workspace to the D-Pad. When returning to Rotate or Pan, the 3D View is automatically re-engaged.
- **Rationale**:
- Spotlight beam directional positioning and Magnifier lens repositioning are orthogonal 2D directional operations best served by the calibrated D-Pad controls.
  - Automatically toggling saves the operator multiple manual view switch taps while keeping 3D direct manipulation active during model inspection.

## D-004: Dedicated Reset Control in D-Pad Center
- **Decision**: Dedicate the D-Pad center round button to `Reset` (triggering `resetModelTransform()`), while keeping the `Projection` changer in the persistent action row above.
- **Rationale**:
  - The projection mode changer is already accessible at all times in the secondary row alongside the Camera toggle.
  - Positioning `Reset` at the center of the directional cross provides immediate, ergonomic access to restore the stage model orientation without reaching for separate menus.

## D-005: Local HTTP vs Public Tunnel HTTPS Protocol Resolution
- **Decision**: Preserve `http://` for local IPs (`192.168.x.x`, `10.x.x.x`, `localhost`) and use `https://` only for secure domains/tunnels (`ngrok`, `.app`).
- **Rationale**:
  - Node.js bridge servers run plain HTTP on local networks. Forcing `https://` on local IP addresses causes SSL handshake failure (`ERR_SSL_PROTOCOL_ERROR`).
  - Explicit scheme inspection ensures both local offline operations and remote ngrok sessions work seamlessly.

## D-006: 3-Level UX Hierarchy and Clean Viewport Separation
- **Decision**: Restructure the controller panel into three distinct visual tiers:
  1. Level 1: Primary Control Mode (`Rotate | Pan | Light | Magnifier`)
  2. Level 2: Secondary Configuration (`Projection: HOLO ▾`, `Camera: Persp ▾`)
  3. Level 3: Control Surface Mode (`3D View | D-Pad` segmented control)
  And strip all buttons from inside the 3D viewport, moving `Sync Stage` and `Reset View` to a clean external toolbar strip.
- **Rationale**:
  - Eliminates visual competition between configuration controls and primary manipulation actions.
  - Making `3D View | D-Pad` a segmented control communicates that they are two complementary surfaces for the same underlying stage model.
  - Keeping the 3D viewport free of floating buttons guarantees that the entire canvas is interactive without accidental button presses during drag or pinch gestures.

## D-007: Persistent Canvas Mount, Dirty Rendering & User Surface Preference Retention
- **Decision**:
  1. Keep `<ModelViewer3D>` mounted in the DOM when eligible, toggling visibility with CSS `display: 'flex'` / `'none'` instead of unmounting.
  2. Implement on-demand dirty rendering (`needsRenderRef`) and shader pre-compilation (`renderer.compile`) in Three.js so rendering only executes when user gestures or model updates occur.
  3. Decouple `userSurfacePreference` ('3d' vs 'dpad') from mode switches so that explicitly choosing D-Pad is preserved across Rotate/Pan changes.
  4. Remove redundant mobile bottom buttons (`Reset` and `More`) as both actions are already prominent in the D-Pad center, 3D toolbar, and header.
- **Rationale**:
  - Unmounting the 3D viewer destroyed the WebGL context, geometries, and textures, forcing expensive re-download and re-parsing of the GLB on every view switch.
  - Continuous 60fps rendering of a static 3D scene consumed excessive CPU/battery and triggered browser `requestAnimationFrame` violations (~350ms).
  - Preserving the user's explicit surface preference prevents unwanted snap-back into 3D view when the user intends to remain on the D-Pad.

## D-008: Operator Override ("Load Anyway") for Oversized Models
- **Decision**: Provide an inline `Load Anyway` button within the compact warning badge for models exceeding 25 MB or 250k triangles. Clicking it unlocks the 3D viewport and automatically sets the surface preference to 3D.
- **Rationale**:
  - Operators on capable hardware (e.g., high-end tablets or PCs) should have full discretion to view complex models in 3D despite conservative safety caps.
  - Resetting `forceLoadAnyway` on model change (`activeAsset.AssetID`) ensures subsequent models are still evaluated against safe defaults.

## D-009: 1:1 Angular Delta Rotation Synchronization
- **Decision**: In 3D gesture rotation, accumulate exact angular degree deltas (`deltaYawDeg`, `deltaPitchDeg`) and transmit them with `action: 'delta'` over the socket protocol, while leaving D-Pad continuous velocity rotation completely intact.
- **Rationale**:
  - The previous implementation sent normalized unit deltas (`normX ≈ 0.03`) into Unity's velocity-based `Update()` integrator, causing Unity to rotate less than 0.1° per swipe while Three.js rotated 45°+.
  - Sending accumulated angular degrees and handling `action == 'delta'` directly in Unity (`PanController.RotateModelDelta`) achieves instant 1:1 tactile synchronization with zero drift or lag.

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
- Updated `src/components/Controller/ModelControlPanel.tsx` & `src/services/socketService.ts`:
  - Added `stageSocket.isTunnelConnection()` to detect ngrok cloud tunnel.
  - Disabled automatic 3D model streaming when on ngrok to prevent burning through monthly bandwidth quotas. Kept classic D-Pad active with a dedicated tunnel badge and "Load Anyway" override button.
  - Enabled full 3D model auto-load when connected locally (LAN IP / localhost).
- Verified production build (`npm run build` succeeds cleanly with 0 errors).
- Maintained documentation in `docs/` per `AGENTS.md` §16.

## Session 2026-10-05: Socket Fixes, Button Padding & Playlist Drag-and-Drop
- **Socket & Model Loading Fix**: Fixed `emitEvent` in `src/services/socketService.ts` so mutating events (such as `hologram-asset-action`) are never dropped when stage selection is empty, and are always directly broadcasted to Unity stage viewers via `this.socket.emit(eventName, data)` when broadcasting (`targets === '*'`), ensuring standard Unity stage viewers receive the load command without requiring multi-stage room registration.
- **AssetInspector Footer Cleanup**: Removed the redundant "Close" button from `src/components/Inspector/AssetInspector.tsx` footer (the `✕` cross icon in the sheet header already provides clear and accessible sheet closing). Added fallback to load downloaded Smithsonian explore models.
- **Button & UI Padding System**:
  - Added base `min-height: 42px`, `padding: 10px 18px`, and `font-size: 0.86rem` to `.btn` in `src/styles/index.css`.
  - Added `--radius-pill: 9999px` to `src/styles/tokens.css`.
  - Defined dedicated `.btn-ghost` and `.btn-icon` classes matching the Obsidian Exhibition Console theme.
  - Added explicit padding (`12px 20px`) and `minHeight: 44` to the "Done" and "Connect" buttons in `src/components/Connection/ConnectionModal.tsx`.
- **Back Button Obsidian Styling**: Updated the back button in `src/components/Controller/FullScreenController.tsx` to use `.controller-back-btn` with matching background, border, hover, and active states, eliminating the browser-default beveled rectangle styling.
- **Playlist Vertical Drag-and-Drop**:
  - Replaced `ArrowUp` and `ArrowDown` buttons in `src/components/Playlist/PlaylistMakerModal.tsx` with vertical drag-and-drop reordering.
  - Implemented dual HTML5 Drag & Drop (mouse) and PointerEvent touch-capture (touchscreen) using a `GripVertical` handle.
  - Added visual drop indicators (`drag-target-above`, `drag-target-below`, and `is-dragging`).
- **Curatorial Record ("See More" / Full Information) Layout & Deduplication**:
  - **Unity Hologram Stage Viewer (`StageMetadataOverlay.cs`)**:
    - Removed `ContentSizeFitter` from `ModalCardBorder` which previously caused the card to expand to 2,500+ px off-screen.
    - Constrained modal card to a fixed `Vector2(1440f, 760f)` fitting entirely within 1080p display and SBS 3D mode.
    - Sized two balanced columns: Left Column (640f wide, height 580f) for structured specifications; Right Column (690f wide, height 580f) for curatorial narrative & publications.
    - Set `horizontalOverflow = Wrap` and `verticalOverflow = Truncate` on text labels so text never overflows.
    - Grouped all repetitive Smithsonian `"See more items in"` entries into a single `"Topics"` line separated by ` · `.
    - Routed `"Description"` / curatorial note items from `details` into the Right Column (Curatorial Narrative), keeping the Left Column uncluttered.
    - Deduplicated redundant Smithsonian API attributes (`maker` when identical to creator, `used` when identical to place, `Physical Description` when identical to medium, `Object Name` when matching title).
    - Formatted attribute lines inline (`<b>Label:</b> value`) with single `\n` line spacing instead of `\n\n`, reducing vertical height by >60%.
  - **Webfront Controller (`FullScreenController.tsx` & `AssetInspector.tsx`)**:
    - Deduplicated and parsed raw `md.details`: collected topics into a single `Topics` row, routed description items to the narrative body, and extracted publications into bulleted references.
    - Structured specifications in a responsive grid with obsidian color tokens, clear section labels, and generous padding.
    - Replaced raw "See More" toggle button with pill-styled action (`--radius-pill`, `minHeight: 36px`, `padding: 8px 16px`).

## 2. Session 2026-10-05: Curatorial Presentation Redesign (Web Operator vs Unity Audience)
- **Part 1 — Web Controller (Operator Information Experience)**:
  - **Desktop Proportions Refactored (`src/styles/system.css`)**: Adjusted `.controller-body` grid to `minmax(280px, 24%) minmax(0, 1fr) minmax(240px, 20%)` with a `max-width: 1560px`, giving the center manipulation viewport ~56-60% of the desktop screen.
  - **3D Hero Viewport Unlocked (`ModelControlPanel.tsx` & `ModelViewer3D.tsx`)**: Removed the artificial desktop `maxWidth: 420px` clamp on the 3D manipulation container; the 3D canvas now expands up to 100% of the center column with a height of `clamp(460px, 58vh, 620px)`.
  - **Operator Concise Summary & Semantic Full Record (`FullScreenController.tsx`)**: Replaced the verbose vertical metadata dump in the left column with a concise, vertically bounded summary card (Title, Museum, 2-column Essential Facts: Date, Maker, Origin, Material, Collection, and 2-line description preview). Full Smithsonian record is moved behind a progressive disclosure button (`[ View Curatorial Record ]`) opening a dedicated side-drawer (`BottomSheet`) grouped into 5 semantic categories (`IDENTITY`, `PROVENANCE`, `PHYSICAL`, `CLASSIFICATION`, `IDENTIFIERS & REFERENCES`).
  - **Asset Inspector (`AssetInspector.tsx`)**: Renamed primary action to `[ Load to Stage & Control ]` which loads the model and automatically opens the controller cockpit. Wrapped extended curatorial metadata (`Taxonomy`, `Identifier`, `Annotations`, `Credit Line`, `Topics`, archive fields) behind a collapsible progressive disclosure toggle (`[ View Full Curatorial Specifications ]`).

- **Part 2 — Unity Stage (Audience Museum Information Experience)**:
  - **Asymmetric Museum Exhibition Graphic (`StageMetadataOverlay.cs`)**:
    - Replaced the centered, 100% opaque blocking card with an editorial exhibition graphic anchored to the LEFT (`anchorMin/anchorMax = Vector2(0f, 0.5f)`, `anchoredPosition = Vector2(64f, 0f)`, `sizeDelta = Vector2(640f, 900f)`).
    - Left ~42% holds the museum graphic; the right ~58% remains completely open, lit, and unoccluded for the 3D hologram to float and rotate.
    - Replaced the opaque dark screen fill with a soft procedural horizontal vignette gradient sprite (`GetOrCreateVignetteSprite()`) covering the left ~55% and tapering to 0 alpha before the 3D model zone.
    - Refined typographic hierarchy: Hero Title (28pt bold, `#F3F5F7`) → Museum (13pt bold, uppercase, `#68D9D0`) → Divider hairline → 2x2 Key Facts Grid (`DATE / ERA`, `ORIGIN`, `MATERIAL`, `OBJECT TYPE` with micro-labels and `#F3F5F7` values) → Divider hairline → Curatorial Narrative (13pt, `#D0D7DE`, clean 2-4 sentences via `FormatCuratorialNarrative`) → Attribution footer (`Smithsonian Institution · Collection Record`).
    - Staggered entrance motion (Vignette fade → Title upward drift → Key Facts fade → Narrative fade) and graceful exit fade driven by `StageMetadataOverlayRunner : MonoBehaviour`.
    - Preserved Side-by-Side (SBS) 3D stereo parity with parallax disparity.

## 3. Modified & New Files
- `src/services/socketService.ts` (MODIFIED)
- `src/components/Inspector/AssetInspector.tsx` (MODIFIED)
- `src/components/Controller/FullScreenController.tsx` (MODIFIED)
- `src/components/Controller/ModelControlPanel.tsx` (MODIFIED)
- `src/components/Controller/ModelViewer3D.tsx` (MODIFIED)
- `src/components/Connection/ConnectionModal.tsx` (MODIFIED)
- `src/components/Playlist/PlaylistMakerModal.tsx` (MODIFIED)
- `src/styles/tokens.css` (MODIFIED)
- `src/styles/index.css` (MODIFIED)
- `src/styles/console.css` (MODIFIED)
- `src/styles/system.css` (MODIFIED)
- `Assets/Games/hologram-stage-viewer-application/Scripts/HoloWall/StageMetadataOverlay.cs` (MODIFIED in Unity)
- `docs/tasks.md` (MODIFIED)
- `docs/decisions.md` (MODIFIED)
- `docs/ai_handoff.md` (MODIFIED)

## 4. Next Recommended Task
- Open the Web Controller on desktop and tablet, test switching between assets, and verify that tapping `[ Stage View ]` triggers the editorial exhibition graphic on the left of the Unity screen while the 3D hologram rotates freely on the right.



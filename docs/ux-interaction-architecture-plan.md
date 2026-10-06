# CUENECT Webfront UX & Interaction Architecture Plan (v2.0)
**Branch:** `new-ux-changes`  
**Repository:** `c:\ReactApp\cuenect-webfront-offline`  
**Target:** Operator-First Interaction Overhaul & Obsidian Exhibition Console  
**Status:** COMPLETE IMPLEMENTATION SPECIFICATION (Ready for final review before development)

---

## Executive Summary & Core UX Thesis

CUENECT is a live exhibition and museum stage controller, not a 3D CAD editor or authoring tool. The operator’s dominant operational loop is:
$$\text{Find Asset} \longrightarrow \text{Load} \longrightarrow \text{Control} \longrightarrow \text{Adjust Presentation (if needed)} \longrightarrow \text{Next Asset}$$

### The Cardinal Interaction Rule:
> **The UI must expose controls according to what the operator is doing right now, not according to everything the system can do.**
>
> The interface must become **calmer and quieter as the operator moves closer to the physical stage**:
> * **Asset Catalog:** Rich discovery, multi-faceted filtering, metadata browsing.
> * **Active Asset Inspector:** Deliberate staging, metadata verification, queuing.
> * **Control Cockpit:** Pure object manipulation with "Quiet Chrome" and zero ambient distraction.
> * **Presentation & System Panels:** Progressively disclosed contextual and configuration controls.

---

## 1. The Operational Hierarchy (Primary, Contextual, System, Critical)

Every interaction element belongs to one of four unambiguous levels:

| Level | Operational Role | Examples | UI Placement & Disclosure Rule |
| :--- | :--- | :--- | :--- |
| **Level 1: Primary** | Used constantly during active operation | `Load to Stage`, `Control`, `Rotate`, `Pan`, `Zoom`, `Search`, `Catalog Browsing` | Immediately accessible on the active workspace surface. Visual priority. |
| **Level 2: Contextual / Secondary** | Used occasionally to tune active presentation | `Projection Mode` (2D/SBS/HOLO/FMAX), `Reset Transform`, `Playlist Queue` | 1 tap away via compact state summaries; contextual to current stage state. |
| **Level 3: System / Calibration** | Low-frequency setup and optical calibration | `IPD`, `Zero Parallax`, `FOV`, `Toe-in`, `Environment Preset`, `Camera Geometry`, `Network Config` | Kept behind dedicated panels, categorized `More` drawer, or Settings dialog. Never in primary flow. |
| **Level 4: Critical / Destructive** | Irreversible, visible to audience, or disconnections | `Clear Stage` (drops active asset to company logo), `Disconnect`, `Release Control` | Completely isolated. Requires deliberate confirmation. Never adjacent to manipulation actions like `Reset`. |

---

## 2. The 4 Functional Domains

```
CUENECT
├── 1. ASSETS
│    ├── Downloaded Catalog (Local SQLite/JSON database)
│    ├── Explore Catalog (Smithsonian 3D Open Access CC0)
│    ├── Search, Type Filters, Recents & Favorites
│    └── Asset Inspector Drawer (Safe inspection before staging)
├── 2. ACTIVE STAGE
│    ├── Persistent Live Anchor ("Now On Stage")
│    ├── Manipulation Cockpit (Touch 3D View vs. D-Pad)
│    └── Single Canonical Transform Reset
├── 3. PRESENTATION (Unified PresentationPanel)
│    ├── Canonical Projection Mode (2D, SBS, HOLO, FMAX)
│    ├── Environment Dressing (Void vs. Space)
│    └── Camera Projection Geometry (Perspective vs. Orthographic)
└── 4. SYSTEM
     ├── Multi-Operator Arbitration State Machine
     ├── Multi-Stage Matrix & Target Selection
     ├── Stereoscopic & Optical Calibration
     ├── Network Connection & Transport Promotion
     └── Stage Clearing (Critical/Destructive)
```

---

## 3. Action Deduplication & Canonical Component Mapping

### A. The Single Unified `PresentationPanel` (Resolving Contradiction #2)
* **The Problem in v1:** Presentation controls (`Projection`, `Environment`, `Camera`) were duplicated between `More → Presentation` and `Controller → Presentation`.
* **The Canonical Solution:** Create **one single reusable component**: `<PresentationPanel />`.
  * **State Owner:** `StageContext` is the single source of truth (`displayMode`, `environmentPreset`, `isOrthographic`).
  * **Presentation:**
    * On the **Header**: shows compact pill `[ 2D ▾ ]`.
    * In the **Controller**: shows compact summary `Presentation: 2D · Space ▾`.
    * In the **More Drawer**: lives under the `Presentation` category.
  * Clicking any of these triggers the exact same canonical `<PresentationPanel />` (slide-out sheet on mobile, popover on desktop). There are zero diverging implementations.

### B. Single Canonical Reset Transform
* **The Problem:** Reset existed in 4 places (3D canvas overlay, D-Pad center button, Desktop quick actions, More sheet).
* **The Canonical Solution:** Exactly **one primary Reset button** (`[ ↻ Reset ]`) placed directly beneath the manipulation surface.
  * Removed from 3D viewport canvas overlay.
  * Removed from D-Pad center (preventing misclicks while pressing directional arrows).
  * Removed from desktop Quick Actions grid.
  * Kept as a labeled secondary fallback under `More → Stage → Reset Transform`.

### C. Total Elimination of Cockpit Destructive Clutter
* **The Problem in v1:** `[ Settings ]` and `[ Clear Stage ]` were placed inside the desktop controller cockpit beside manipulation controls.
* **The Canonical Solution:** `Clear Stage` and `Settings` are **100% removed from the controller cockpit surface**.
  * The cockpit contains **only active object manipulation controls**.
  * `Clear Stage` lives exclusively in `More → Danger Zone → Clear Stage` with a 2-step confirmation dialog.
  * `Settings & Calibration` lives in `More → System → Settings & Calibration`.

### D. Single Canonical Fullscreen
* Removed from global header. Accessible via `More → System → Toggle Fullscreen` or keyboard shortcut `F11`.

---

## 4. Screen-by-Screen Detailed Interaction Specifications

### Screen 1: The Restrained Global Header

#### Desktop Layout (≥768px):
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [CUENECT]                   [ 2D ▾ ]    [● Connected · 2 ops]   [Playlist 5]  [⋮]│
│  Hologram Controller                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Mobile Layout (<768px):
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [CUENECT]                               [ 2D ▾ ]   [● Connected]   [⋮]       │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Element Responsibilities:
1. **Brand Identity:** Application logo + subtle version tag.
2. **Canonical Projection Pill (`[ 2D ▾ ]`):** Displays active projection mode. Tapping opens `<PresentationPanel />`.
3. **Connection & Operator Status Pill (`[● Connected · 2 ops]`):**
   * Green dot when linked and ready. Amber when control locked by another operator.
   * Tapping opens `<ConnectionPanel />` showing operator status and stage pairing.
4. **Stage Director Badge (`[ Matrix 2/3 ]`):** Only visible when multiple physical stages are detected online.
5. **Playlist Toggle Button (`[ Playlist (N) ]`):** Toggles the desktop non-blocking right-side drawer.
6. **Unified Menu Button (`⋮`):** Opens the categorized `<MoreSheet />`.

---

### Screen 2: Asset Catalog & Card Safety

#### Preventing Accidental Stage Loads:
* **Current hazard:** Clicking anywhere on an asset card immediately triggers a live socket load command to the physical stage.
* **New Behavior:**
  * **Clicking Card Thumbnail/Body:** Opens the **Asset Inspector Detail Drawer** (inspect metadata, high-res preview, polygon count, add to playlist, favorite). Zero physical stage impact.
  * **Clicking `[ ▶ Load ]`:** Deliberate primary button that transmits `LoadModel` to the physical stage and smoothly transitions the operator into the Control Cockpit.

#### Card Visual Hierarchy:
```
┌──────────────────────────────────────┐
│  [ Thumbnail ]                 [♡]   │
│                             [READY]  │
├──────────────────────────────────────┤
│ Tyrannosaurus Rex Skull              │
│ 3D Model · Smithsonian NMNH          │
│                                      │
│ [ ▶ Load ]                     [ + ] │
└──────────────────────────────────────┘
```

When active on the stage:
```
┌──────────────────────────────────────┐
│  [ Thumbnail ]                 [♡]   │
│                 [● LIVE ON STAGE]    │
├──────────────────────────────────────┤
│ Tyrannosaurus Rex Skull              │
│ 3D Model · Smithsonian NMNH          │
│                                      │
│ [ ⚙ Control Active Stage ]           │
└──────────────────────────────────────┘
```

---

### Screen 3: Asset Inspector Detail Drawer

When an operator taps an asset card without immediately firing a stage load:
* **Desktop:** Slides in as a clean 380px panel from the right.
* **Mobile:** Opens as a lightweight swipeable bottom sheet.
* **Contents:**
  * High-resolution thumbnail preview.
  * Title, Smithsonian Collection/Museum, Date, Taxonomy.
  * Technical telemetry: Polygon count, vertex count, file size in MB.
  * Action row:
    * `[ ♡ Favorite ]` icon button.
    * `[ + Playlist ]` secondary button.
    * `[ ▶ Load to Stage & Control ]` prominent primary action button.

---

### Screen 4: Dedicated "Control Cockpit" (Command Focus & Quiet Chrome)

The controller operates as a dedicated **Workspace**, not a popup modal. All non-essential chrome dims by 40% into the background.

#### Desktop 3-Column Cockpit Layout:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Catalog       Tyrannosaurus Rex Skull · LIVE 2D               [⋮] │
├─────────────────────────┬─────────────────────────┬─────────────────────────┤
│ ACTIVE ASSET IDENTITY   │ MANIPULATION COCKPIT    │ PRESENTATION SUMMARY    │
│                         │                         │                         │
│ [ High-Res Thumbnail ]  │   CONTROL METHOD        │ PRESENTATION            │
│                         │   [ Touch 3D ] [ D-Pad ]│   Mode:   [ 2D ▾ ]      │
│ Tyrannosaurus Rex Skull │                         │   Camera: Perspective   │
│ ID: USNM-PAL-002014     │ ┌─────────────────────┐ │   Env:    Space         │
│                         │ │                     │ │                         │
│ METADATA SUMMARY        │ │   3D VIEWPORT /     │ │ TELEMETRY               │
│ Smithsonian NMNH        │ │   GESTURE SURFACE   │ │   Transport: LAN (Direct│
│ Late Cretaceous         │ │                     │ │   Render:    60 fps     │
│                         │ └─────────────────────┘ │   Control:   You        │
│ [ Read Full Curatorial ]│                         │                         │
│                         │   [ Rotate ] [ Pan ]    │ [ Open Presentation ]   │
│                         │                         │                         │
│                         │       [ ↻ Reset ]       │                         │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

#### Mobile Zero-Scroll Cockpit Layout (<768px):
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Assets               Tyrannosaurus Rex Skull                          [⋮] │
│                        ● LIVE · 2D                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                        ┌────────────────────────┐                           │
│                        │                        │                           │
│                        │    3D TOUCH VIEWPORT   │                           │
│                        │                        │                           │
│                        └────────────────────────┘                           │
│                                                                             │
│                            [ Rotate ] [ Pan ]                               │
│                                                                             │
│                               [ ↻ Reset ]                                   │
│                                                                             │
│                  ─────────────────────────────────────                      │
│                                                                             │
│                         INPUT: [ Touch ] [ D-Pad ]                          │
│                                                                             │
│                      Presentation: [ 2D · Space ▾ ]                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### When Operator Switches to `[ D-Pad ]` Mode:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                    ▲                                        │
│                                ◀       ▶                                    │
│                                    ▼                                        │
│                                                                             │
│                            [ Rotate ] [ Pan ]                               │
│                                                                             │
│                               [ ↻ Reset ]                                   │
│                                                                             │
│                     [ − Zoom ]          [ Zoom + ]                          │
│                                                                             │
│                  ─────────────────────────────────────                      │
│                         INPUT: [ Touch ] [ D-Pad ]                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Core Manipulation Standards:
1. **Input Method Selector:** Explicitly labeled `[ Touch ] [ D-Pad ]`. Clarifies that both drive the same underlying physical model.
2. **Standardized Vocabulary:**
   * **Rotate:** 1-finger drag on touch / D-Pad arrows in rotate mode.
   * **Pan:** 2-finger drag on touch / D-Pad arrows in pan mode.
   * **Zoom:** Pinch gesture on touch / `[ − Zoom ] [ Zoom + ]` buttons.
   * **Reset:** Single canonical action returning yaw, pitch, pan, and zoom to defaults.

---

### Screen 5: Persistent "Now On Stage" Global Anchor

To ensure the operator never loses track of the physical stage:
* **Visual Form:** A sleek, low-profile dock anchored at the bottom of the viewport.
* **Visual States:**
  * **Idle (No Asset Loaded):** Collapsed into a resting indicator: `Stage: Ready for Content`.
  * **Active Model Loaded:** Expands with thumbnail, green breathing status halo, model name, and presentation summary:
    ```
    ┌──────────────────────────────────────────────────────────┐
    │ [Thumb]  Tyrannosaurus Rex Skull    ● LIVE · 2D   [Open →]│
    └──────────────────────────────────────────────────────────┘
    ```
* **Interaction:** Clicking anywhere on the dock smoothly brings up the **Control Cockpit**.
* **Smart Auto-Hide:** Automatically hides when the operator is already inside the Control Cockpit or when an automated slideshow sequence is actively playing.

---

### Screen 6: Categorized `<MoreSheet />` (System Console)

Replacing the former miscellaneous action drawer with 4 structured console categories:

```
┌────────────────────────────────────────────────────────┐
│ MORE                                               [✕] │
├────────────────────────────────────────────────────────┤
│ PRESENTATION                                           │
│   Projection Mode                [ 2D ▾ ]              │
│   Environment Dressing           [ Space ▾ ]           │
│   Camera Projection              [ Perspective ▾ ]     │
├────────────────────────────────────────────────────────┤
│ STAGE CONTROLS                                         │
│   Reset Transform                Return model to origin│
│   Multi-Stage Matrix             Targeting 2 of 3 nodes│
├────────────────────────────────────────────────────────┤
│ SYSTEM & OPTICS                                        │
│   Connection & Operators         Connected (2 online)  │
│   Stereo & Optics Calibration    IPD, FOV, Parallax    │
│   Display Fullscreen             Toggle windowed/F11   │
│   Catalog Synchronization        Request fresh assets  │
├────────────────────────────────────────────────────────┤
│ DANGER ZONE                                            │
│   [ ✕ Clear Content from Stage ]                       │
└────────────────────────────────────────────────────────┘
```

---

### Screen 7: Desktop Playlist Side Drawer

* On Desktop ($\ge 1024\text{px}$), clicking `[ Playlist (N) ]` opens a **non-blocking right-side drawer** (360px) alongside the catalog grid.
* The operator can browse, filter, and click `+` on catalog cards with immediate visual feedback in the playlist running order.
* Items support click-and-drag or up/down ordering, hold-duration adjustment, and `[ ▶ Play Sequence ]`.
* On mobile, retains the native touch-optimized bottom sheet.

---

### Screen 8: Multi-Stage Director UX

When multiple physical stages/screens are connected to the Node bridge:
* **Header Badge:** Displays `[ Matrix: 2/3 Targeted ]`.
* **Matrix Modal Surface:**
  * **Stage Status vs Target Selection:** Green indicator for *Online/Offline*; checkbox toggle for *Targeted/Ignored*.
  * **Batch Filters:** Quick actions for `Select All`, `Clear`, `Invert Selection`.
  * **Group Targeting:** One-click targeting by screen cluster (e.g. `Hall A`, `Main Stage`, `Kiosk Array`).
  * **Solo Mode:** Quick `[ Solo ]` button on any node chip immediately restricts commands exclusively to that physical screen.

---

## 5. Multi-Operator Control State Machine

The interface handles multi-operator contention as an **ambient system state**, never as an alarming error:

```
┌──────────────┐     Connects      ┌─────────────┐
│ DISCONNECTED │ ────────────────> │ CONNECTING  │
└──────────────┘                   └─────────────┘
                                          │
                                          │ Server Handshake OK
                                          ▼
                                   ┌─────────────┐
                                   │  AVAILABLE  │
                                   └─────────────┘
                                     │         │
                 You issue command   │         │ Other operator issues command
                                     ▼         ▼
                         ┌─────────────────┐ ┌─────────────────┐
                         │ YOU_HAVE_CONTROL│ │ OTHER_IN_CONTROL│
                         └─────────────────┘ └─────────────────┘
                                     │         │
                                     │         │ Operator taps "Request Control"
                                     │         ▼
                                     │       ┌─────────────────┐
                                     │       │   REQUESTING    │
                                     │       └─────────────────┘
                                     │         │             │
                    Control released │         │ Granted     │ Denied / Timeout
                                     ▼         ▼             ▼
                                   ┌─────────────┐ ┌─────────────────┐
                                   │  AVAILABLE  │ │ DENIED / LOCKED │
                                   └─────────────┘ └─────────────────┘
```

### UI Mappings:
| State | Header Pill | Cockpit Banner | Command Transport |
| :--- | :--- | :--- | :--- |
| `AVAILABLE` | `● Connected` (Green) | None | Commands pass through immediately |
| `YOU_HAVE_CONTROL` | `● In Control` (Green) | None | Commands pass through immediately |
| `OTHER_IN_CONTROL` | `Locked · Op 2` (Amber) | Amber banner: `Controlled by Operator 2 [Request Control]` | Outgoing joystick/load commands guarded |
| `REQUESTING` | `Requesting…` (Amber) | `Requesting control from Operator 2...` | Guarded |
| `DENIED` | `Control Locked` (Amber) | `Request declined. Operator 2 remains in control.` | Guarded |
| `DISCONNECTED` | `Offline` (Red) | Red banner: `Stage offline — Reconnecting...` | Queued / blocked |

---

## 6. Premium Visual Direction — "Obsidian Exhibition Console"

CUENECT transitions from a neon-glow sci-fi interface to a **luxury digital exhibition control console** (inspired by Apple Vision Pro system chrome, high-end automotive instrument clusters, and museum AV installations).

### A. The "Obsidian Exhibition" Color Palette
```css
:root {
  /* Canvas & Elevated Matte Surfaces */
  --obsidian-canvas:      #06090F; /* Deepest non-reflective background */
  --obsidian-surface:     #0C111A; /* Primary container and card surface */
  --obsidian-elevated:    #111824; /* Elevated drawers, panels, modals */
  --obsidian-sunken:      #04060A; /* Inset viewports, trackpads, inputs */

  /* Text & Readability */
  --text-primary:         #F3F5F7; /* High contrast, crisp sans typography */
  --text-secondary:       #8E9AAA; /* Muted curatorial labels and metadata */
  --text-tertiary:        #576477; /* Subtle technical indicators and lines */

  /* Semantic Accents (Restrained, never sprayed) */
  --accent-signature:     #68D9D0; /* Refined seafoam cyan for primary actions */
  --accent-signature-dim: rgba(104, 217, 208, 0.12); /* Touch highlights */
  
  --status-live:          #37D17F; /* Emerald signal for live stage active content */
  --status-warning:       #E7B75D; /* Warm amber for operator lock & probing */
  --status-danger:        #F06F78; /* Coral red reserved for destructive/clear */

  /* Subtle Optical Borders */
  --border-subtle:        rgba(255, 255, 255, 0.06);
  --border-elevated:      rgba(255, 255, 255, 0.12);
  --border-accent:        rgba(104, 217, 208, 0.35);
}
```

### B. Surface & Depth Principles
* **Matte Surfaces Over Heavy Glow:** Background gradients are eliminated in favor of velvety `#06090F`.
* **Concentrated Accents:** Cyan glow is strictly prohibited on ordinary borders and generic containers.
* **Stage Light Visual Metaphor:** When an asset is `LIVE ON STAGE`, a very soft, subtle radial illumination bloom (`rgba(55, 209, 127, 0.08)`) radiates from behind the active card/thumbnail, grounding the digital UI in physical stage reality.

---

## 7. Motion & Transition System

### A. Motion Principles
1. **Motion Communicates State; Never Decorates:** Animations exist to show causality (*"I tapped load $\rightarrow$ stage received asset $\rightarrow$ controller focused"*).
2. **Zero Input Latency:** Transitions run via GPU-accelerated `transform` and `opacity`. Never block or delay operator touch input.
3. **Reduced Motion Respect:** Full compliance with `@media (prefers-reduced-motion: reduce)` (all durations collapse to 0.01ms).

### B. Motion Tokens
```css
:root {
  --motion-micro:     150ms cubic-bezier(0.2, 0, 0, 1);    /* Buttons, toggles, chips */
  --motion-panel:     260ms cubic-bezier(0.16, 1, 0.3, 1);  /* Drawers, sheets, inspector */
  --motion-workspace: 380ms cubic-bezier(0.16, 1, 0.3, 1);  /* Cockpit focus, stage transitions */
  --motion-ambient:   12s ease-in-out infinite;             /* Subtle star/dust drift */
}
```

### C. The 3 Signature Animations
1. **Live Stage Signal Breathing:** The active stage dot pulses gently over 2.4s (`opacity: 0.70` $\rightarrow$ `1.0` $\rightarrow$ `0.70`), indicating live hardware link.
2. **Asset Staging Causality:** Clicking `[ ▶ Load ]` causes the button to show a brief focused pulse before the Control Cockpit smoothly opens, giving a tactile sensation of sending content to the physical screen.
3. **Ambient Space Dust (Space Environment Only):** When Space preset is active, the background canvas features slow, barely perceptible micro-particles drifting across the deep obsidian plane.

---

## 8. Exceptional States & System Failure UX

All non-nominal states are treated with first-class visual polish:

| State | Context | Visual Representation | Recovery Action |
| :--- | :--- | :--- | :--- |
| **Catalog Initial Sync** | Initial connection / `ReqAsset` | Skeleton grid matching card aspect ratio with subtle shimmer | Automatic; timeout offers `[ Request Assets ]` |
| **Smithsonian Fetching** | Explore tab | 10 card skeletons with subtle rotating compass icon | `[ Shuffle 10 Models ]` button |
| **Smithsonian Offline** | Node/Internet down | StateView with clear icon: *"Smithsonian 3D is unreachable. Downloaded catalog remains 100% operational."* | `[ Retry Connection ]` / `[ View Downloaded ]` |
| **Active Download** | Explore tab background | Progress track inside action button (`Downloading 64%`) + floating pill if user browses away | Click floating pill returns to model |
| **Stage Offline** | Bridge drops connection | Red header pill: `Offline`. Control cockpit disables manipulation surface with calm banner | Automatic socket reconnect with retry count |
| **Empty Playlist** | Playlist Drawer | StateView: *"Your queue is empty. Tap + on any asset card to sequence a presentation."* | `[ Browse Assets ]` |
| **No Active Stage** | User navigates to Control tab with no asset live | StateView: *"No model currently on stage. Select an asset from the catalog to begin control."* | `[ Browse Catalog ]` |

---

## 9. QA, Accessibility & Verification Standards

### A. Accessibility & Input Robustness
* **44px Minimum Touch Targets:** All touch targets meet or exceed $44\times 44\text{px}$ (Apple HIG / WCAG 2.2 AA).
* **Keyboard Navigation & Visible Focus:** All interactive elements support Tab/Enter navigation with a high-contrast focus ring (`outline: 2px solid var(--accent-signature)`).
* **Escape Key Dismissal:** Pressing `Escape` systematically closes open drawers, inspectors, and menus in reverse order of opening.
* **Color Independence:** Statuses always pair color with text/icons (e.g. Green dot + text `"Connected"`; Amber dot + lock icon + text `"Locked"`).

### B. Viewport & DPI Scaling Matrix
Every screen must be verified across the following standard devices and DPI scaling settings:
* **Mobile Phones:** $390\times 844$ (iPhone 14/15), $430\times 932$ (iPhone Pro Max).
* **Tablets:** $768\times 1024$ (iPad Portrait), $1024\times 768$ (iPad Landscape).
* **Laptops & Desktops:** $1280\times 720$, $1440\times 900$, $1920\times 1080$, $2560\times 1440$.
* **Windows Display Scaling:** Tested specifically at **100%, 125%, and 150% OS scaling** to ensure touch targets and layouts do not clip.
* **Input Modalities:** Tested with Mouse, Multi-touch screen, Trackpad, and Keyboard.

### C. Visual Regression Checkpoints
Screenshots will be captured and verified before and after each task milestone:
1. `01_asset_catalog_desktop.png`
2. `02_asset_catalog_mobile.png`
3. `03_asset_inspector_drawer.png`
4. `04_control_cockpit_touch.png`
5. `05_control_cockpit_dpad.png`
6. `06_presentation_panel_modal.png`
7. `07_more_drawer_categorized.png`
8. `08_playlist_desktop_drawer.png`
9. `09_stage_director_matrix.png`
10. `10_multi_operator_locked_state.png`

---

## 10. Technical Architecture & Component Tree

### A. Protocol Compatibility Target
> **Protocol compatibility target:** No changes to Unity or Node.js Socket.IO wire contracts unless implementation exposes an existing integration dependency. All 42 existing socket events (`LoadModel`, `ReqAsset`, `hologram-display-mode-action`, `hologram-environment-action`, `control-request`, etc.) are preserved and verified via unit tests.

### B. New & Refactored Component Map
```
src/components/
├── Common/
│   ├── Header.tsx                  # REFACTORED: Restrained layout, canonical projection, status pill
│   ├── BottomNav.tsx               # REFACTORED: Strict 4-tab model with live stage badge
│   ├── ConnectionStatus.tsx        # REFACTORED: Operator count and ambient state display
│   └── ConfirmDialog.tsx           # UNCHANGED: Reusable confirmation modal
├── Presentation/                   # NEW DIRECTORY: Unified presentation domain
│   ├── PresentationPanel.tsx       # NEW: Canonical presentation controller (Projection, Env, Camera)
│   ├── ProjectionSelector.tsx      # REFACTORED: Consumes canonical PresentationPanel logic
│   └── EnvironmentSelector.tsx     # REFACTORED: Consumes canonical PresentationPanel logic
├── Catalog/
│   ├── AssetCard.tsx               # REFACTORED: Decoupled inspect vs. load; subtle playlist +
│   ├── AssetGrid.tsx               # REFACTORED: Integrated desktop playlist drawer layout
│   └── ExploreCard.tsx             # REFACTORED: Matches decoupled inspection and load semantics
├── Inspector/                      # NEW DIRECTORY: Safe asset inspection
│   └── AssetInspector.tsx          # NEW: Drawer showing curatorial metadata, poly counts, load action
├── Controller/
│   ├── FullScreenController.tsx    # REFACTORED: Command Focus workspace, quiet chrome, zero Clear/Settings clutter
│   ├── ModelControlPanel.tsx       # REFACTORED: Touch 3D vs. D-Pad, unified Rotate/Pan/Zoom/Reset
│   ├── DPad.tsx                    # REFACTORED: Directional compass without center reset; zoom controls
│   ├── ModelViewer3D.tsx           # REFACTORED: 1-finger rotate, 2-finger pan, pinch zoom, dirty loop
│   └── VideoControlPanel.tsx       # REFACTORED: Crisp SVG vector transport buttons (no broken PNGs)
├── Playlist/
│   ├── PlaylistMakerModal.tsx      # REFACTORED: Non-blocking desktop side drawer + mobile sheet
│   └── SlideshowBar.tsx            # REFACTORED: Responsive bottom playback bar
├── Settings/
│   └── StageSettingsModal.tsx      # REFACTORED: Structured Optics & Calibration panel
└── Stage/
    ├── MoreSheet.tsx               # REFACTORED: Categorized into Presentation, Stage, System, Danger
    ├── NowOnStage.tsx              # REFACTORED: Global active stage anchor dock
    ├── StageDirectorBar.tsx        # REFACTORED: Multi-stage target switcher
    └── StageDirectorModal.tsx      # REFACTORED: Full Screen Matrix with solo and cluster targeting
```

---

## 11. Expanded Implementation Task Tracker (UX-201 → UX-218)

| Task ID | Domain / Component | Detailed Implementation Scope | Status |
| :--- | :--- | :--- | :--- |
| **UX-201** | Header Refactor | Remove low-frequency buttons (`Environment`, `Camera`, `Fullscreen`, `Settings`, `Refresh`). Establish restrained layout: Brand, Canonical Projection Pill, Connection/Operator Pill, Director Badge, Playlist Trigger, and `⋮` More Trigger. | `COMPLETED` |
| **UX-202** | Canonical PresentationPanel | Create `<PresentationPanel />` as single canonical component for `Projection`, `Environment`, and `Camera`. Wire into Header, Controller, and More drawer. | `COMPLETED` |
| **UX-203** | Categorized More Console | Rebuild `MoreSheet.tsx` with 4 explicit sections: *Presentation*, *Stage Controls*, *System & Optics*, *Danger Zone*. Relocate `Clear Stage` exclusively here with confirmation dialog. | `COMPLETED` |
| **UX-204** | Reset Transform Unification | Remove redundant Reset buttons from 3D Viewport canvas, D-Pad center, and quick actions. Create single canonical `[ ↻ Reset ]` button below manipulation surface. | `COMPLETED` |
| **UX-205** | Input Method & Vocabulary | Replace "3D View / D-Pad" segmented control with `[ Touch ] [ D-Pad ]`. Standardize manipulation labels to `Rotate`, `Pan`, `Zoom`, `Reset`. | `COMPLETED` |
| **UX-206** | Controller Cockpit & Quiet Chrome | Reorganize `FullScreenController.tsx` into a true focused cockpit. Completely remove `[ Settings ]` and `[ Clear Stage ]` from cockpit view. Dim secondary chrome. | `COMPLETED` |
| **UX-207** | Asset Card Safety | Decouple full-card surface tap from immediate stage loading. Card tap opens Inspector; explicit `[ ▶ Load ]` button transmits to stage. Streamline `+ Playlist` button to small icon. | `COMPLETED` |
| **UX-208** | Asset Inspector Drawer | Build `<AssetInspector />` drawer showing curatorial metadata, 3D polygon/size telemetry, `[ + Playlist ]`, `[ ♡ Favorite ]`, and `[ ▶ Load to Stage & Control ]`. | `COMPLETED` |
| **UX-209** | Desktop Playlist Side Drawer | Refactor playlist builder into non-blocking right-side drawer on desktop ($\ge 1024\text{px}$) while preserving native bottom sheet on mobile. | `COMPLETED` |
| **UX-210** | Video Vector Controls | Replace broken image asset tags in `VideoControlPanel.tsx` with crisp, accessible Lucide SVG vector buttons for Rewind, Play/Pause, Stop, Forward, Mute, and Volume. | `COMPLETED` |
| **UX-211** | Obsidian Color & Token System | Implement Obsidian palette (`#06090F`, `#0C111A`, `#68D9D0`, `#37D17F`, `#E7B75D`, `#F06F78`). Enforce pill (state) vs. button (action) token rules in `tokens.css`. | `COMPLETED` |
| **UX-212** | Motion & Transition System | Implement motion tokens and 3 signature animations: Live Stage Signal Breathing, Asset Staging Causality pulse, and subtle Space Dust canvas drift. | `COMPLETED` |
| **UX-213** | Multi-Operator State Machine | Formalize `CONTROL_STATE` machine in `StageContext.tsx`. Map states to clear non-alarming ambient UI in header and controller. | `COMPLETED` |
| **UX-214** | Stage Director & Screen Matrix | Redesign multi-stage targeting UX: clear visual distinction between *Online* and *Targeted*, cluster filters, and one-click *Solo* control. | `COMPLETED` |
| **UX-215** | Now On Stage Persistent Anchor | Upgrade `NowOnStage.tsx` with live stage light halo, presentation summary tag, and smooth single-click transition into the Control Cockpit. | `COMPLETED` |
| **UX-216** | System States & Failure UX | Implement consistent visual treatments for Initial Sync, Smithsonian Fetching, Background Download Pill, Stage Offline, and Empty Queue states. | `COMPLETED` |
| **UX-217** | Accessibility & Input Robustness | Audit and enforce 44px min touch targets, visible focus rings, Escape key dismissal, and `@media (prefers-reduced-motion: reduce)`. | `COMPLETED` |
| **UX-218** | Visual Regression & Production Build | Execute full viewport matrix testing ($390\text{px}$ to $2560\text{px}$ + 125%/150% OS scaling), capture 10 regression baseline images, and verify clean `tsc && vite build`. | `COMPLETED` |

---

## 12. Verification & Review Checkpoints

- **TypeScript Typecheck (`tsc`)**: Passed with 0 errors.
- **Production Bundle (`vite build`)**: Passed with 0 errors (Exit Code 0).
- **Socket.IO Wire Protocol**: Zero breaking changes to any of the 42 existing events (`LoadModel`, `ReqAsset`, `hologram-display-mode-action`, `hologram-environment-action`, `control-request`, etc.).
- **Branch**: `new-ux-changes` in `cuenect-webfront-offline`.


import React, { useState } from 'react';
import { useStage } from '../../context/StageContext';
import { MoveableAssetType, DisplayModeShortLabels } from '../../types/protocol';
import { ProjectionSheet } from '../Stage/ProjectionSheet';
import { DPad } from './DPad';
import { ModelViewer3D } from './ModelViewer3D';
import { SegmentedControl, SegmentedOption } from '../Common/SegmentedControl';
import {
  Box,
  Move,
  SunMedium,
  Search,
  AlertTriangle,
  Eye,
  Grid,
  Camera,
  Layers,
  RotateCcw
} from 'lucide-react';

/**
 * Model-only controls: adaptive 3D interactive gesture viewport or classic D-Pad.
 *
 * Features:
 * - Persistent Control Mode Selector (Rotate, Pan, Light, Magnifier) for both Live View & D-Pad.
 * - View Mode Changer (Projection: 2D, SBS, HOLO, KMAX) accessible in both views.
 * - Camera Toggle (Ortho / Perspective): visible when Rotate or Pan is selected;
 *   automatically hidden when Light or Magnifier is selected.
 * - 3D Touch vs D-Pad switcher for eligible models.
 */
export const ModelControlPanel: React.FC = () => {
  const {
    currentMovableMode,
    setMovableMode,
    displayMode,
    activeAsset,
    isOrthographic,
    toggleOrthographic,
    stereoSettings,
    resetModelTransform
  } = useStage();

  const [isProjectionOpen, setIsProjectionOpen] = useState(false);
  const [preferDpad, setPreferDpad] = useState(false);

  // Check whether the active model is eligible for web 3D rendering
  const isEligible = Boolean(
    activeAsset &&
      activeAsset.isWebPreviewable !== false &&
      (!activeAsset.fileSizeBytes || activeAsset.fileSizeBytes <= 25 * 1024 * 1024) &&
      (!activeAsset.triangleCount || activeAsset.triangleCount <= 250000)
  );

  // Show Camera toggle ONLY when Rotate or Pan is selected; hide for Light or Magnifier
  const isRotateOrPan =
    currentMovableMode === MoveableAssetType.Rotate || currentMovableMode === MoveableAssetType.Pan;

  // 3D View is shown for Rotate and Pan when eligible; Spotlight and Magnifier automatically switch to D-Pad
  const show3DViewer = isEligible && !preferDpad && !!activeAsset && isRotateOrPan;

  const handleModeChange = (mode: MoveableAssetType) => {
    setMovableMode(mode);
    // When returning to Rotate or Pan, automatically switch back to 3D view if eligible
    if (mode === MoveableAssetType.Rotate || mode === MoveableAssetType.Pan) {
      setPreferDpad(false);
    }
  };

  const handleSurfaceChange = (surface: '3d' | 'dpad') => {
    if (surface === '3d') {
      if (!isRotateOrPan) {
        setMovableMode(MoveableAssetType.Rotate);
      }
      setPreferDpad(false);
    } else {
      setPreferDpad(true);
    }
  };

  const modes: SegmentedOption<MoveableAssetType>[] = [
    { value: MoveableAssetType.Rotate, label: 'Rotate', icon: <Box size={14} /> },
    { value: MoveableAssetType.Pan, label: 'Pan', icon: <Move size={14} /> },
    { value: MoveableAssetType.Spotlight, label: 'Light', icon: <SunMedium size={14} /> },
    { value: MoveableAssetType.Magnifier, label: 'Magnifier', icon: <Search size={14} /> }
  ];

  const surfaceOptions: SegmentedOption<'3d' | 'dpad'>[] = [
    { value: '3d', label: '3D View', icon: <Eye size={14} /> },
    { value: 'dpad', label: 'D-Pad', icon: <Grid size={14} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 14 }}>
      {/* High-Poly / Oversized Model Notice */}
      {!isEligible && activeAsset && (
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm, 8px)',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: 'var(--color-warning, #f59e0b)',
            fontSize: '0.8rem',
            lineHeight: 1.4
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Direct Stage Control:</strong> Model exceeds web preview threshold{' '}
            {activeAsset.fileSizeMB ? `(${activeAsset.fileSizeMB} MB` : ''}
            {activeAsset.triangleCount ? ` • ${(activeAsset.triangleCount / 1000).toFixed(0)}k tris)` : ')'}.
            Touch D-Pad is active for direct Hologram Stage manipulation.
          </div>
        </div>
      )}

      {/* Level 1: Primary Control Mode (Rotate, Pan, Light, Magnifier) */}
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="u-section-label">Control Mode</span>
        <SegmentedControl
          options={modes}
          value={currentMovableMode}
          onChange={handleModeChange}
          ariaLabel="Model control mode"
        />
      </div>

      {/* Level 2: Secondary Stage Configuration (Projection & Camera) */}
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setIsProjectionOpen(true)}
          title="Change Stage Projection Mode (2D / SBS / HOLO / KMAX)"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '7px 12px',
            fontSize: '0.78rem',
            borderRadius: 'var(--radius-full, 9999px)'
          }}
        >
          <Layers size={13} />
          <span>Projection: {DisplayModeShortLabels[displayMode]} ▾</span>
        </button>

        {isRotateOrPan && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={toggleOrthographic}
            disabled={stereoSettings.isStereo}
            title={
              stereoSettings.isStereo
                ? 'Camera is locked to Perspective in SBS'
                : `Switch to ${isOrthographic ? 'Perspective' : 'Orthographic'} camera`
            }
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '7px 12px',
              fontSize: '0.78rem',
              borderRadius: 'var(--radius-full, 9999px)',
              opacity: stereoSettings.isStereo ? 0.6 : 1
            }}
          >
            <Camera size={13} />
            <span>Camera: {isOrthographic ? 'Ortho' : 'Persp'} ▾</span>
          </button>
        )}
      </div>

      {/* Level 3: Control Surface Selector (3D View vs D-Pad) */}
      {isEligible && (
        <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="u-section-label">Control Surface</span>
          <SegmentedControl
            options={surfaceOptions}
            value={show3DViewer ? '3d' : 'dpad'}
            onChange={handleSurfaceChange}
            compact
            ariaLabel="Control surface mode"
          />
        </div>
      )}

      {/* Level 4: Active Control Surface */}
      {show3DViewer ? (
        <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ModelViewer3D asset={activeAsset} onSwitchToDpad={() => setPreferDpad(true)} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 12 }}>
          <DPad
            centerLabel={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <RotateCcw size={18} />
                <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em' }}>RESET</span>
              </div>
            }
            onCenterPress={resetModelTransform}
            centerTitle="Reset model rotation and position on Hologram Stage"
          />
        </div>
      )}

      <ProjectionSheet isOpen={isProjectionOpen} onClose={() => setIsProjectionOpen(false)} />
    </div>
  );
};

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
  Layers
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
    stereoSettings
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

  const show3DViewer = isEligible && !preferDpad && !!activeAsset;

  // Show Camera toggle ONLY when Rotate or Pan is selected; hide for Light or Magnifier
  const isRotateOrPan =
    currentMovableMode === MoveableAssetType.Rotate || currentMovableMode === MoveableAssetType.Pan;

  const modes: SegmentedOption<MoveableAssetType>[] = [
    { value: MoveableAssetType.Rotate, label: 'Rotate', icon: <Box size={14} /> },
    { value: MoveableAssetType.Pan, label: 'Pan', icon: <Move size={14} /> },
    { value: MoveableAssetType.Spotlight, label: 'Light', icon: <SunMedium size={14} /> },
    { value: MoveableAssetType.Magnifier, label: 'Magnifier', icon: <Search size={14} /> }
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

      {/* 1. Control Mode Selector: Rotate, Pan, Light, Magnifier (Always visible in both views) */}
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="u-section-label">Control Mode</span>
        <SegmentedControl
          options={modes}
          value={currentMovableMode}
          onChange={setMovableMode}
          compact
          ariaLabel="Model control mode"
        />
      </div>

      {/* 2. Secondary Action Row: View Mode Changer, Camera Mode (conditional), and 3D/D-Pad Toggle */}
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* View Mode (Projection) Changer */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsProjectionOpen(true)}
            title="Change Stage Projection Mode (2D / SBS / HOLO / KMAX)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderRadius: 20
            }}
          >
            <Layers size={13} />
            <span>Projection: {DisplayModeShortLabels[displayMode]}</span>
          </button>

          {/* Camera Ortho / Perspective: Visible for Rotate & Pan, Hidden for Light & Magnifier */}
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
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                fontSize: '0.78rem',
                borderRadius: 20,
                opacity: stereoSettings.isStereo ? 0.6 : 1
              }}
            >
              <Camera size={13} />
              <span>Camera: {isOrthographic ? 'Ortho' : 'Persp'}</span>
            </button>
          )}
        </div>

        {/* 3D Touch vs D-Pad Toggle */}
        {isEligible && (
          <button
            type="button"
            onClick={() => setPreferDpad(!preferDpad)}
            className="btn btn-secondary"
            title={preferDpad ? 'Switch to 3D Touch View' : 'Switch to Classic D-Pad'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderRadius: 20
            }}
          >
            {preferDpad ? <Eye size={13} /> : <Grid size={13} />}
            <span>{preferDpad ? '3D View' : 'D-Pad'}</span>
          </button>
        )}
      </div>

      {/* 3. Main Interactive Viewport OR D-Pad */}
      {show3DViewer ? (
        <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ModelViewer3D asset={activeAsset} onSwitchToDpad={() => setPreferDpad(true)} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 12 }}>
          <DPad
            centerLabel={<span className="dpad-center-mode">{DisplayModeShortLabels[displayMode]}</span>}
            onCenterPress={() => setIsProjectionOpen(true)}
            centerTitle="Change stage projection mode"
          />
        </div>
      )}

      <ProjectionSheet isOpen={isProjectionOpen} onClose={() => setIsProjectionOpen(false)} />
    </div>
  );
};

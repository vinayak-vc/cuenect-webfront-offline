import React, { useState } from 'react';
import { useStage } from '../../context/StageContext';
import { MoveableAssetType, DisplayModeShortLabels } from '../../types/protocol';
import { ProjectionSheet } from '../Stage/ProjectionSheet';
import { DPad } from './DPad';
import { ModelViewer3D } from './ModelViewer3D';
import { SegmentedControl, SegmentedOption } from '../Common/SegmentedControl';
import { Box, Move, SunMedium, Search, AlertTriangle, Eye } from 'lucide-react';

/**
 * Model-only controls: adaptive 3D interactive gesture viewport or classic D-Pad.
 *
 * If the active model satisfies size & polygon budgets (<=25MB and <=250k triangles),
 * the interactive 3D WebGL viewport is mounted, allowing touch/mouse orbit, pan,
 * and pinch-zoom with live Stage synchronization.
 *
 * If the model exceeds the budget, it gracefully falls back to the classic D-Pad
 * with an informative high-poly notification badge.
 */
export const ModelControlPanel: React.FC = () => {
  const { currentMovableMode, setMovableMode, displayMode, activeAsset } = useStage();

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

  const modes: SegmentedOption<MoveableAssetType>[] = [
    { value: MoveableAssetType.Rotate, label: 'Rotate', icon: <Box size={14} /> },
    { value: MoveableAssetType.Pan, label: 'Pan', icon: <Move size={14} /> },
    { value: MoveableAssetType.Spotlight, label: 'Light', icon: <SunMedium size={14} /> },
    { value: MoveableAssetType.Magnifier, label: 'Magnifier', icon: <Search size={14} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 16 }}>
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

      {/* Interactive 3D Viewer OR Classic D-Pad */}
      {show3DViewer ? (
        <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ModelViewer3D asset={activeAsset} onSwitchToDpad={() => setPreferDpad(true)} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 16 }}>
          {isEligible && (
            <button
              type="button"
              onClick={() => setPreferDpad(false)}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                fontSize: '0.8rem',
                borderRadius: 20
              }}
            >
              <Eye size={14} />
              <span>Switch to 3D Touch View</span>
            </button>
          )}

          <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="u-section-label">Control Mode</span>
            <SegmentedControl
              options={modes}
              value={currentMovableMode}
              onChange={setMovableMode}
              compact
              ariaLabel="Model control mode"
            />
          </div>

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

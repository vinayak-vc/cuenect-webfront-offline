import React, { useState, useEffect } from 'react';
import { useStage } from '../../context/StageContext';
import {
  MoveableAssetType,
  DisplayModeShortLabels,
  EnvironmentPresetShortLabels,
  hasModelMetadata
} from '../../types/protocol';
import { PresentationPanel } from '../Presentation/PresentationPanel';
import { DPad } from './DPad';
import { ModelViewer3D } from './ModelViewer3D';
import { SegmentedControl, SegmentedOption } from '../Common/SegmentedControl';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import {
  Box,
  Move,
  AlertTriangle,
  Globe,
  Eye,
  Grid,
  Layers,
  RotateCcw,
  Loader2,
  ChevronDown
} from 'lucide-react';

/**
 * Model Control Cockpit:
 * Focused object manipulation interface.
 * - Input method selector: [ Touch ] [ D-Pad ]
 * - Unified presentation summary: Presentation: [ 2D · Space ▾ ] (triggers PresentationPanel)
 * - Standardized manipulation vocabulary: Rotate, Pan, Zoom, Reset
 * - Single canonical [ ↻ Reset Transform ] button beneath active manipulation surface
 * - Museum metadata 'i' toggle button
 */
export const ModelControlPanel: React.FC = () => {
  const isDesktop = useIsDesktop();
  const {
    currentMovableMode,
    setMovableMode,
    displayMode,
    environmentPreset,
    activeAsset,
    resetModelTransform,
    activeTransport,
    transportState,
    stopAutoRotate,
    isMetadataVisible,
    toggleMetadataVisible
  } = useStage();

  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [userSurfacePreference, setUserSurfacePreference] = useState<'3d' | 'dpad'>('3d');
  const [forceLoadAnyway, setForceLoadAnyway] = useState(false);

  // Reset force load override whenever active asset changes
  useEffect(() => {
    setForceLoadAnyway(false);
  }, [activeAsset?.AssetID]);

  const isTunnel = activeTransport === 'ngrok';
  const isProbing = transportState === 'discovering' || transportState === 'probing';
  const assetHasMetadata = hasModelMetadata(activeAsset);

  // Check whether active model is eligible for web 3D rendering
  const isWithinThreshold = Boolean(
    activeAsset &&
      activeAsset.isWebPreviewable !== false &&
      (!activeAsset.fileSizeBytes || activeAsset.fileSizeBytes <= 25 * 1024 * 1024) &&
      (!activeAsset.triangleCount || activeAsset.triangleCount <= 250000)
  );

  const isEligible = isWithinThreshold && !isTunnel && !isProbing;
  const canPreview = (isEligible || forceLoadAnyway) && Boolean(activeAsset);

  const isRotateOrPan =
    currentMovableMode === MoveableAssetType.Rotate || currentMovableMode === MoveableAssetType.Pan;

  const show3DViewer = canPreview && isRotateOrPan && userSurfacePreference === '3d';

  const handleModeChange = (mode: MoveableAssetType) => {
    setMovableMode(mode);
  };

  const handleSurfaceChange = (surface: '3d' | 'dpad') => {
    setUserSurfacePreference(surface);
    if (surface === 'dpad') {
      stopAutoRotate();
    } else if (surface === '3d') {
      if (!isRotateOrPan) {
        setMovableMode(MoveableAssetType.Rotate);
      }
    }
  };

  const modes: SegmentedOption<MoveableAssetType>[] = [
    { value: MoveableAssetType.Rotate, label: 'Rotate', icon: <Box size={14} /> },
    { value: MoveableAssetType.Pan, label: 'Pan', icon: <Move size={14} /> }
  ];

  const surfaceOptions: SegmentedOption<'3d' | 'dpad'>[] = [
    { value: '3d', label: 'Touch', icon: <Eye size={14} /> },
    { value: 'dpad', label: 'D-Pad', icon: <Grid size={14} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 12 }}>
      {/* High-Poly / Oversized Model / Tunnel / Probing Notice */}
      {activeAsset && (!isEligible || isProbing) && (
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '5px 10px 5px 12px',
            borderRadius: 'var(--radius-full)',
            background: isProbing
              ? 'rgba(99, 102, 241, 0.12)'
              : isTunnel
              ? 'rgba(59, 130, 246, 0.12)'
              : 'rgba(245, 158, 11, 0.12)',
            border: isProbing
              ? '1px solid rgba(99, 102, 241, 0.35)'
              : isTunnel
              ? '1px solid rgba(59, 130, 246, 0.35)'
              : '1px solid rgba(245, 158, 11, 0.3)',
            color: isProbing ? '#818cf8' : isTunnel ? '#60a5fa' : 'var(--status-warning)',
            fontSize: '0.72rem',
            lineHeight: 1.2
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
            {isProbing ? (
              <Loader2 size={13} className="animate-spin" style={{ flexShrink: 0 }} />
            ) : isTunnel ? (
              <Globe size={13} style={{ flexShrink: 0 }} />
            ) : (
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isProbing
                ? 'Checking local network connectivity...'
                : isTunnel
                ? 'Cloud tunnel · 3D download paused to save data'
                : `Direct mode · Model exceeds web preview ${activeAsset.fileSizeMB ? `(${activeAsset.fileSizeMB} MB)` : ''}`}
            </span>
          </div>
          {!isProbing && !forceLoadAnyway ? (
            <button
              type="button"
              onClick={() => {
                setForceLoadAnyway(true);
                setUserSurfacePreference('3d');
              }}
              style={{
                flexShrink: 0,
                background: isTunnel ? 'rgba(59, 130, 246, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                border: isTunnel ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(245, 158, 11, 0.5)',
                color: isTunnel ? '#93c5fd' : '#fbbf24',
                borderRadius: 'var(--radius-full)',
                padding: '2px 8px',
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Load Anyway
            </button>
          ) : (
            <span style={{ flexShrink: 0, fontSize: '0.65rem', opacity: 0.8, fontStyle: 'italic' }}>
              {isProbing ? 'Checking...' : isTunnel ? 'Tunnel active' : 'Preview forced'}
            </span>
          )}
        </div>
      )}

      {/* Control Method Selector (Touch vs D-Pad) */}
      {canPreview && (
        <div style={{ width: '100%', maxWidth: isDesktop ? 520 : 420, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="u-section-label">Input Method</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
              {show3DViewer ? 'Direct 3D Gestures' : 'Directional D-Pad'}
            </span>
          </div>
          <SegmentedControl
            options={surfaceOptions}
            value={show3DViewer ? '3d' : 'dpad'}
            onChange={handleSurfaceChange}
            compact
            ariaLabel="Input method"
          />
        </div>
      )}

      {/* Contextual Presentation Summary Bar & Metadata Toggle */}
      <div
        style={{
          width: '100%',
          maxWidth: isDesktop ? 520 : 420,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'nowrap'
        }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setIsPresentationOpen(true)}
          title="Open Presentation Controls (Projection, Environment, Camera)"
          style={{
            flex: 1,
            minWidth: 0,
            height: 38,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '0 14px',
            fontSize: '0.78rem',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            borderRadius: 'var(--radius-full)'
          }}
        >
          <Layers size={14} style={{ color: 'var(--accent-signature)', flexShrink: 0 }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Presentation: <strong style={{ color: 'var(--accent-signature)' }}>{DisplayModeShortLabels[displayMode]}</strong> · {EnvironmentPresetShortLabels[environmentPreset]}
          </span>
          <ChevronDown size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
        </button>

        {/* Round 'i' Metadata Toggle Button (if curatorial metadata exists) */}
        {assetHasMetadata && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={toggleMetadataVisible}
            title={isMetadataVisible ? 'Hide museum metadata' : 'Show museum metadata'}
            aria-label={isMetadataVisible ? 'Hide museum metadata' : 'Show museum metadata'}
            aria-pressed={isMetadataVisible}
            style={{
              width: 38,
              height: 38,
              minWidth: 38,
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              borderRadius: '50%',
              background: isMetadataVisible ? 'var(--accent-signature-dim)' : undefined,
              borderColor: isMetadataVisible ? 'var(--accent-signature)' : undefined,
              color: isMetadataVisible ? 'var(--accent-signature)' : undefined
            }}
          >
            <span
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: '0.95rem',
                lineHeight: 1,
                userSelect: 'none'
              }}
            >
              i
            </span>
          </button>
        )}
      </div>

      {/* Manipulation Surface: 3D Touch Viewport (Hero Viewport) */}
      {canPreview && activeAsset && (
        <div
          style={{
            width: '100%',
            maxWidth: isDesktop ? '100%' : 420,
            display: show3DViewer ? 'flex' : 'none',
            flexDirection: 'column',
            gap: 8,
            alignItems: 'center'
          }}
        >
          <ModelViewer3D
            asset={activeAsset}
            isVisible={show3DViewer}
            forceLoad={forceLoadAnyway}
            onSwitchToDpad={() => setUserSurfacePreference('dpad')}
          />
        </div>
      )}

      {/* Manipulation Surface: Classic D-Pad */}
      <div
        style={{
          display: !show3DViewer ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          gap: 12
        }}
      >
        {/* D-Pad Direction Mode (Rotate vs Pan) */}
        <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="u-section-label">Direction Mode</span>
          <SegmentedControl
            options={modes}
            value={currentMovableMode}
            onChange={handleModeChange}
            ariaLabel="D-Pad mode"
          />
        </div>

        {/* Directional Pad without duplicate center reset */}
        <DPad />
      </div>

      {/* Single Canonical Reset Button beneath active manipulation surface */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: 2 }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={resetModelTransform}
          title="Reset model rotation, pan, and zoom to starting defaults"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 18px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.78rem',
            fontWeight: 700
          }}
        >
          <RotateCcw size={14} style={{ color: 'var(--accent-signature)' }} />
          <span>Reset Transform</span>
        </button>
      </div>

      {/* Canonical Presentation Panel Modal / Sheet */}
      <PresentationPanel
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
      />
    </div>
  );
};

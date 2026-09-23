import React, { useState, useEffect } from 'react';
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
  Globe,
  Eye,
  Grid,
  Camera,
  Layers,
  RotateCcw,
  Loader2
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
    resetModelTransform,
    activeTransport,
    transportState
  } = useStage();

  const [isProjectionOpen, setIsProjectionOpen] = useState(false);
  const [userSurfacePreference, setUserSurfacePreference] = useState<'3d' | 'dpad'>('3d');
  const [forceLoadAnyway, setForceLoadAnyway] = useState(false);

  // Reset force load override whenever active asset changes
  useEffect(() => {
    setForceLoadAnyway(false);
  }, [activeAsset?.AssetID]);

  const isTunnel = activeTransport === 'ngrok';
  const isProbing = transportState === 'discovering' || transportState === 'probing';

  // Check whether the active model is eligible for web 3D rendering
  // If connected via cloud tunnel (ngrok) or probing LAN, auto-load is disabled to protect tunnel bandwidth limit
  const isWithinThreshold = Boolean(
    activeAsset &&
      activeAsset.isWebPreviewable !== false &&
      (!activeAsset.fileSizeBytes || activeAsset.fileSizeBytes <= 25 * 1024 * 1024) &&
      (!activeAsset.triangleCount || activeAsset.triangleCount <= 250000)
  );

  const isEligible = isWithinThreshold && !isTunnel && !isProbing;
  const canPreview = (isEligible || forceLoadAnyway) && Boolean(activeAsset);

  // Show Camera toggle ONLY when Rotate or Pan is selected; hide for Light or Magnifier
  const isRotateOrPan =
    currentMovableMode === MoveableAssetType.Rotate || currentMovableMode === MoveableAssetType.Pan;

  // 3D View is shown ONLY when model can be previewed, mode is Rotate/Pan, and user preferred '3d'
  const show3DViewer = canPreview && isRotateOrPan && userSurfacePreference === '3d';

  const handleModeChange = (mode: MoveableAssetType) => {
    setMovableMode(mode);
    // Preserves userSurfacePreference: if user chose 'dpad', they remain in 'dpad' when switching between Rotate and Pan.
    // If they preferred '3d', switching back from Light/Magnifier to Rotate/Pan naturally restores '3d'.
  };

  const handleSurfaceChange = (surface: '3d' | 'dpad') => {
    setUserSurfacePreference(surface);
    if (surface === '3d') {
      if (!isRotateOrPan) {
        setMovableMode(MoveableAssetType.Rotate);
      }
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
            borderRadius: 'var(--radius-full, 9999px)',
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
            color: isProbing ? '#818cf8' : isTunnel ? '#60a5fa' : 'var(--color-warning, #f59e0b)',
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
                ? 'Cloud tunnel (ngrok) · 3D download paused to save data'
                : `Direct stage control · Model exceeds web preview ${activeAsset.fileSizeMB ? `(${activeAsset.fileSizeMB} MB)` : ''}`}
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
                borderRadius: '9999px',
                padding: '2px 8px',
                fontSize: '0.68rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              title={isTunnel ? 'Load 3D preview over cloud tunnel anyway' : 'Force load 3D preview in browser anyway'}
            >
              Load Anyway
            </button>
          ) : (
            <span style={{ flexShrink: 0, fontSize: '0.65rem', opacity: 0.8, fontStyle: 'italic' }}>
              {isProbing ? 'Checking...' : isTunnel ? 'Tunnel preview active' : 'Preview forced'}
            </span>
          )}
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
      {canPreview && (
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
      {/* 3D Viewport (Kept mounted in DOM when previewable so model is never destroyed or reloaded) */}
      {canPreview && activeAsset && (
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            display: show3DViewer ? 'flex' : 'none',
            flexDirection: 'column',
            gap: 8
          }}
        >
          <ModelViewer3D
            asset={activeAsset}
            isVisible={show3DViewer}
            onSwitchToDpad={() => setUserSurfacePreference('dpad')}
          />
        </div>
      )}

      {/* Classic D-Pad */}
      <div
        style={{
          display: !show3DViewer ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          gap: 12
        }}
      >
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

      <ProjectionSheet isOpen={isProjectionOpen} onClose={() => setIsProjectionOpen(false)} />
    </div>
  );
};

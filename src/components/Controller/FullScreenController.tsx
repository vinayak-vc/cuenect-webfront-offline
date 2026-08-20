import React from 'react';
import { useStage } from '../../context/StageContext';
import { DataType, DisplayModeLabels, resolveCategory } from '../../types/protocol';
import { ModelControlPanel } from './ModelControlPanel';
import { VideoControlPanel } from './VideoControlPanel';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import {
  ArrowLeft,
  Box,
  Film,
  Image as ImageIcon,
  AlertTriangle,
  Loader2,
  RotateCcw,
  Square,
  Sliders,
  Maximize
} from 'lucide-react';

/**
 * Stage controller surface.
 *
 * Desktop: three columns - live asset (left), controller (centre, the main
 * task), stage status + quick actions (right).
 * Mobile: single column ordered for thumb reach - asset context, then the
 * controller, then quick actions.
 */
export const FullScreenController: React.FC = () => {
  const {
    activeAsset,
    unloadAsset,
    isControllerOpen,
    setIsControllerOpen,
    thumbnails,
    connectionState,
    displayMode,
    isOrthographic,
    resetModelTransform,
    triggerFullscreen,
    setIsSettingsOpen,
    currentMovableMode
  } = useStage();

  const isDesktop = useIsDesktop();

  useBodyScrollLock(isControllerOpen && !!activeAsset);

  if (!isControllerOpen || !activeAsset) return null;

  const thumbUrl = thumbnails[activeAsset.AssetID];
  const category = resolveCategory(activeAsset);

  const typeMeta = (): { label: string; cls: string; icon: React.ReactNode } => {
    switch (category) {
      case DataType.Video:
        return { label: 'Video', cls: 'video', icon: <Film size={12} /> };
      case DataType.Image:
        return { label: 'Image', cls: 'image', icon: <ImageIcon size={12} /> };
      default:
        return { label: '3D Model', cls: 'model', icon: <Box size={12} /> };
    }
  };

  const meta = typeMeta();

  const assetPanel = (
    <div className="controller-panel">
      <span className="u-section-label">Now on Stage</span>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt=""
            style={{
              width: isDesktop ? 84 : 60,
              height: isDesktop ? 84 : 60,
              borderRadius: 'var(--radius-md)',
              objectFit: 'cover',
              background: 'var(--surface-sunken)',
              flexShrink: 0
            }}
          />
        ) : (
          <div
            style={{
              width: isDesktop ? 84 : 60,
              height: isDesktop ? 84 : 60,
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-sunken)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              flexShrink: 0
            }}
          >
            <Box size={24} />
          </div>
        )}

        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className={`category-badge ${meta.cls}`} style={{ position: 'static', alignSelf: 'flex-start' }}>
            {meta.icon}
            <span>{meta.label}</span>
          </span>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }} className="u-truncate">
            {activeAsset.AssetName}
          </div>
          {activeAsset.AssetName !== activeAsset.AssetID && (
            <div className="u-mono" style={{ color: 'var(--text-muted)' }}>
              {activeAsset.AssetID}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const statusPanel = (
    <div className="controller-panel">
      <span className="u-section-label">Stage Status</span>

      <div className="stage-readout">
        <span style={{ color: 'var(--text-secondary)' }}>Link</span>
        <span
          className="stage-readout-value"
          style={{ color: connectionState === 'connected' ? 'var(--color-success)' : 'var(--color-danger)' }}
        >
          {connectionState === 'connected' ? 'Ready' : connectionState}
        </span>
      </div>

      <div className="stage-readout">
        <span style={{ color: 'var(--text-secondary)' }}>Projection</span>
        <span className="stage-readout-value">{DisplayModeLabels[displayMode]}</span>
      </div>

      <div className="stage-readout">
        <span style={{ color: 'var(--text-secondary)' }}>Camera</span>
        <span className="stage-readout-value">{isOrthographic ? 'Orthographic' : 'Perspective'}</span>
      </div>

      <div className="stage-readout">
        <span style={{ color: 'var(--text-secondary)' }}>Mode</span>
        <span className="stage-readout-value">{MOVABLE_LABELS[currentMovableMode] ?? 'Rotate'}</span>
      </div>

      <span className="u-section-label" style={{ marginTop: 4 }}>
        Quick Actions
      </span>

      <div className="quick-grid">
        <button type="button" className="quick-btn" onClick={resetModelTransform}>
          <RotateCcw size={14} />
          Reset
        </button>
        <button type="button" className="quick-btn" onClick={() => setIsSettingsOpen(true)}>
          <Sliders size={14} />
          Calibrate
        </button>
        <button type="button" className="quick-btn" onClick={triggerFullscreen}>
          <Maximize size={14} />
          Fullscreen
        </button>
        <button type="button" className="quick-btn danger" onClick={unloadAsset}>
          <Square size={14} />
          Clear Stage
        </button>
      </div>
    </div>
  );

  const controls = (
    <>
      {category === DataType.Model && <ModelControlPanel />}
      {category === DataType.Video && <VideoControlPanel />}
      {category === DataType.Image && (
        <div className="controller-panel" style={{ textAlign: 'center' }}>
          <span className="u-section-label">Image on Stage</span>
          <p className="u-meta">
            Still images have no transform controls. Use Clear Stage to return to the company logo.
          </p>
        </div>
      )}
    </>
  );

  return (
    <div className="controller-modal">
      <div className="controller-header">
        <button
          type="button"
          className="btn-icon"
          onClick={() => setIsControllerOpen(false)}
          title="Back to assets (keeps the asset on the stage)"
          aria-label="Back to assets"
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Stage Controller</div>
          <div className="u-meta">
            {connectionState === 'connected' ? 'Live stage control' : 'Stage offline'}
          </div>
        </div>

        <button
          type="button"
          className="btn-icon"
          onClick={unloadAsset}
          title="Clear the stage and restore the company logo"
          aria-label="Clear stage"
        >
          <Square size={16} />
        </button>
      </div>

      {connectionState !== 'connected' && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: '0.8rem',
            color: 'var(--color-danger)'
          }}
        >
          {connectionState === 'connecting' ? (
            <>
              <Loader2 size={14} className="spin" />
              <span>Reconnecting to stage — controls paused</span>
            </>
          ) : (
            <>
              <AlertTriangle size={14} />
              <span>Stage disconnected — controls paused</span>
            </>
          )}
        </div>
      )}

      <div className="controller-body">
        {isDesktop ? (
          <>
            <div className="controller-col-side">{assetPanel}</div>
            <div className="controller-col-main">{controls}</div>
            <div className="controller-col-side">{statusPanel}</div>
          </>
        ) : (
          <>
            {assetPanel}
            {controls}
            {statusPanel}
          </>
        )}
      </div>
    </div>
  );
};

const MOVABLE_LABELS: Record<number, string> = {
  0: 'Rotate',
  1: 'Zoom',
  2: 'Pan',
  3: 'Light'
};

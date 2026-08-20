import React, { useState } from 'react';
import { useStage } from '../../context/StageContext';
import { DataType, DisplayModeLabels, resolveCategory } from '../../types/protocol';
import { ModelControlPanel } from './ModelControlPanel';
import { VideoControlPanel } from './VideoControlPanel';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { BottomSheet } from '../Common/BottomSheet';
import { ConfirmDialog } from '../Common/ConfirmDialog';
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
  Maximize,
  MoreHorizontal,
  Lock,
  Unlock
} from 'lucide-react';

/**
 * Stage controller.
 *
 * Mobile target is zero-scroll for basic operation: asset line, control mode,
 * pad, zoom and a one-line status strip fit on a phone. Everything secondary
 * (calibration, clear stage, detailed status) is one tap away in a sheet.
 *
 * Desktop keeps three columns because the space exists: asset, controller,
 * status + quick actions.
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
    currentMovableMode,
    controlLock,
    requestControl
  } = useStage();

  const isDesktop = useIsDesktop();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  useBodyScrollLock(isControllerOpen && !!activeAsset);

  if (!isControllerOpen || !activeAsset) return null;

  const thumbUrl = thumbnails[activeAsset.AssetID];
  const category = resolveCategory(activeAsset);
  const hasControl = controlLock.youHaveControl;

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
  const modeLabel = MOVABLE_LABELS[currentMovableMode] ?? 'Rotate';

  // ---- Live asset identity -------------------------------------------------
  const assetLine = (
    <div className={isDesktop ? 'controller-panel' : 'controller-asset-line'}>
      {isDesktop && <span className="u-section-label">Now on Stage</span>}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt=""
            className="controller-asset-thumb"
            style={isDesktop ? { width: 84, height: 84 } : undefined}
          />
        ) : (
          <div
            className="controller-asset-thumb"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              ...(isDesktop ? { width: 84, height: 84 } : {})
            }}
          >
            <Box size={20} />
          </div>
        )}

        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div className="controller-asset-live">
            <span className="live-dot" />
            LIVE
          </div>
          <div className="controller-asset-name u-truncate">{activeAsset.AssetName}</div>
          {isDesktop && (
            <span className={`category-badge ${meta.cls}`} style={{ position: 'static', alignSelf: 'flex-start' }}>
              {meta.icon}
              <span>{meta.label}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // ---- Compact status strip (mobile) --------------------------------------
  const statusStrip = (
    <button type="button" className="status-strip" onClick={() => setIsStatusOpen(true)}>
      <span className={`status-strip-dot ${connectionState === 'connected' ? 'ok' : 'bad'}`} />
      <span className="status-strip-value">{connectionState === 'connected' ? 'Ready' : 'Offline'}</span>
      <span className="status-strip-sep">·</span>
      <span className="status-strip-value">{SHORT_MODE[displayMode] ?? '2D'}</span>
      <span className="status-strip-sep">·</span>
      <span className="status-strip-value">{isOrthographic ? 'Ortho' : 'Persp'}</span>
      {controlLock.locked && !hasControl && (
        <>
          <span className="status-strip-sep">·</span>
          <span className="status-strip-value warn">
            <Lock size={11} /> {controlLock.holderName || 'Locked'}
          </span>
        </>
      )}
    </button>
  );

  const statusDetail = (
    <>
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
        <span style={{ color: 'var(--text-secondary)' }}>Control mode</span>
        <span className="stage-readout-value">{modeLabel}</span>
      </div>
      <div className="stage-readout">
        <span style={{ color: 'var(--text-secondary)' }}>Control</span>
        <span className="stage-readout-value">
          {hasControl ? 'You have control' : controlLock.holderName || 'Another operator'}
        </span>
      </div>
      {!hasControl && (
        <button type="button" className="btn btn-primary" onClick={requestControl} style={{ gap: 6 }}>
          <Unlock size={15} />
          Request Control
        </button>
      )}
    </>
  );

  // ---- Primary + secondary actions ---------------------------------------
  const primaryActions = (
    <div className="controller-actions">
      <button type="button" className="quick-btn" onClick={resetModelTransform} disabled={!hasControl}>
        <RotateCcw size={14} />
        Reset
      </button>
      <button type="button" className="quick-btn" onClick={triggerFullscreen}>
        <Maximize size={14} />
        Fullscreen
      </button>
      <button type="button" className="quick-btn" onClick={() => setIsMoreOpen(true)}>
        <MoreHorizontal size={14} />
        More
      </button>
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

  const desktopStatusPanel = (
    <div className="controller-panel">
      <span className="u-section-label">Stage Status</span>
      {statusDetail}
      <span className="u-section-label" style={{ marginTop: 4 }}>
        Quick Actions
      </span>
      <div className="quick-grid">
        <button type="button" className="quick-btn" onClick={resetModelTransform} disabled={!hasControl}>
          <RotateCcw size={14} />
          Reset
        </button>
        <button type="button" className="quick-btn" onClick={triggerFullscreen}>
          <Maximize size={14} />
          Fullscreen
        </button>
        <button type="button" className="quick-btn" onClick={() => setIsSettingsOpen(true)}>
          <Sliders size={14} />
          Calibrate
        </button>
        <button type="button" className="quick-btn danger" onClick={() => setIsClearConfirmOpen(true)}>
          <Square size={14} />
          Clear Stage
        </button>
      </div>
    </div>
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
          onClick={() => setIsMoreOpen(true)}
          title="More stage actions"
          aria-label="More stage actions"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {connectionState !== 'connected' && (
        <div className="controller-banner">
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

      {controlLock.locked && !hasControl && (
        <div className="controller-banner warn">
          <Lock size={14} />
          <span>{controlLock.holderName || 'Another operator'} has control</span>
          <button type="button" className="banner-action" onClick={requestControl}>
            Request
          </button>
        </div>
      )}

      <div className="controller-body">
        {isDesktop ? (
          <>
            <div className="controller-col-side">{assetLine}</div>
            <div className="controller-col-main">{controls}</div>
            <div className="controller-col-side">{desktopStatusPanel}</div>
          </>
        ) : (
          <>
            {assetLine}
            {controls}
            {primaryActions}
            {statusStrip}
          </>
        )}
      </div>

      {/* Secondary / disruptive actions live behind an explicit tap. */}
      <BottomSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        title="Stage Actions"
        subtitle={activeAsset.AssetName}
      >
        <div className="sheet-action-list">
          <button
            type="button"
            className="sheet-action"
            onClick={() => {
              resetModelTransform();
              setIsMoreOpen(false);
            }}
            disabled={!hasControl}
          >
            <RotateCcw size={17} />
            <span>
              <strong>Reset transform</strong>
              <em>Return rotation, pan and scale to defaults</em>
            </span>
          </button>

          <button
            type="button"
            className="sheet-action"
            onClick={() => {
              setIsMoreOpen(false);
              setIsSettingsOpen(true);
            }}
          >
            <Sliders size={17} />
            <span>
              <strong>Stage settings & calibration</strong>
              <em>Stereo, lighting, camera</em>
            </span>
          </button>

          <button
            type="button"
            className="sheet-action"
            onClick={() => {
              triggerFullscreen();
              setIsMoreOpen(false);
            }}
          >
            <Maximize size={17} />
            <span>
              <strong>Toggle stage fullscreen</strong>
              <em>Switch the stage window mode</em>
            </span>
          </button>

          {!hasControl && (
            <button
              type="button"
              className="sheet-action"
              onClick={() => {
                requestControl();
                setIsMoreOpen(false);
              }}
            >
              <Unlock size={17} />
              <span>
                <strong>Request control</strong>
                <em>Take over from {controlLock.holderName || 'the current operator'}</em>
              </span>
            </button>
          )}

          <button
            type="button"
            className="sheet-action danger"
            onClick={() => {
              setIsMoreOpen(false);
              setIsClearConfirmOpen(true);
            }}
          >
            <Square size={17} />
            <span>
              <strong>Clear stage</strong>
              <em>Remove the current content and show the company logo</em>
            </span>
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        title="Stage Status"
        subtitle="Live link, projection and control ownership"
      >
        {statusDetail}
      </BottomSheet>

      {/* Clearing the stage is visible to the audience - always confirm. */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        title="Clear Stage?"
        message="This removes the current content from the stage and restores the company logo. The audience will see this change."
        confirmLabel="Clear Stage"
        destructive
        onCancel={() => setIsClearConfirmOpen(false)}
        onConfirm={() => {
          setIsClearConfirmOpen(false);
          unloadAsset();
        }}
      />
    </div>
  );
};

const MOVABLE_LABELS: Record<number, string> = {
  0: 'Rotate',
  1: 'Zoom',
  2: 'Pan',
  3: 'Light'
};

const SHORT_MODE: Record<number, string> = {
  0: '2D',
  1: 'SBS',
  2: 'HOLO'
};

import React, { useState } from 'react';
import { useStage } from '../../context/StageContext';
import {
  DataType,
  DisplayModeLabels,
  resolveCategory,
  hasModelMetadata,
  cleanMetadataDescription
} from '../../types/protocol';
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
  Unlock,
  ChevronDown,
  ChevronUp
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
    requestControl,
    isMetadataVisible,
    isFullMetadataOpen,
    toggleFullMetadataModal
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
      {isDesktop && <span className="u-section-label">Now Active</span>}

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
      <span className="status-strip-value">{connectionState === 'connected' ? 'Connected' : 'Offline'}</span>
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
        <span style={{ color: 'var(--text-secondary)' }}>Stage Link</span>
        <span
          className="stage-readout-value"
          style={{ color: connectionState === 'connected' ? 'var(--color-success)' : 'var(--color-danger)' }}
        >
          {connectionState === 'connected' ? 'Connected' : connectionState}
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
        <span style={{ color: 'var(--text-secondary)' }}>Control Mode</span>
        <span className="stage-readout-value">{modeLabel}</span>
      </div>
      <div className="stage-readout">
        <span style={{ color: 'var(--text-secondary)' }}>Operator</span>
        <span className="stage-readout-value">
          {hasControl ? 'You have control' : controlLock.holderName || 'Another operator'}
        </span>
      </div>
      {!hasControl && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={requestControl}
          style={{ gap: 6, marginTop: 8, width: '100%', justifyContent: 'center' }}
        >
          <Unlock size={15} />
          Request Control
        </button>
      )}
    </>
  );

  const controls = (
    <>
      {category === DataType.Model && <ModelControlPanel />}
      {category === DataType.Video && <VideoControlPanel />}
      {category === DataType.Image && (
        <div className="controller-panel" style={{ textAlign: 'center' }}>
          <span className="u-section-label">Active Image</span>
          <p className="u-meta">
            Still images have no transform controls. Use Clear to return to the company logo.
          </p>
        </div>
      )}
    </>
  );

  const desktopStatusPanel = (
    <div className="controller-panel">
      <span className="u-section-label">Stage Telemetry</span>
      {statusDetail}
    </div>
  );

  const metadataCard = (() => {
    if (!isMetadataVisible || !hasModelMetadata(activeAsset) || !activeAsset.metadata) {
      return null;
    }

    const md = activeAsset.metadata;
    const museum = md.museum?.trim() || '';
    const creator =
      md.creator && md.creator.trim().toLowerCase() !== museum.toLowerCase()
        ? md.creator.trim()
        : '';
    const date =
      md.date && md.date.trim().toLowerCase() !== 'smithsonian archive'
        ? md.date.trim()
        : '';
    const collection =
      md.collection && md.collection.trim().toLowerCase() !== 'open access 3d collection'
        ? md.collection.trim()
        : '';
    const place = md.place?.trim() || '';
    const medium = md.medium?.trim() || '';
    const dimensions = md.dimensions?.trim() || '';
    const creditLine = md.creditLine?.trim() || '';
    const identifier = md.identifier?.trim() || '';
    const taxonomy = md.taxonomy?.trim() || '';
    const annotations = md.annotations?.trim() || '';
    const cleanedDesc = cleanMetadataDescription(md.description);

    const leftItems = [collection, creator, date].filter(Boolean);
    const rightItems = [place, medium, dimensions].filter(Boolean);

    const extraDetails = (md.details || []).filter((item) => {
      if (!item || !item.value) return false;
      const val = item.value.trim();
      if (!val) return false;
      const shown = [
        museum,
        creator,
        date,
        collection,
        place,
        medium,
        dimensions,
        creditLine,
        identifier,
        taxonomy,
        annotations
      ];
      return !shown.some((s) => s && s.toLowerCase() === val.toLowerCase());
    });

    const isLongDesc = cleanedDesc.length > 140;
    const hasExtraCuratorial = Boolean(
      isLongDesc ||
        place ||
        medium ||
        creditLine ||
        identifier ||
        taxonomy ||
        annotations ||
        extraDetails.length > 0 ||
        cleanedDesc.length > 0
    );

    const displayedDesc =
      !isFullMetadataOpen && isLongDesc
        ? `${cleanedDesc.slice(0, 140).trimEnd()}…`
        : cleanedDesc;

    return (
      <div
        style={{
          width: '100%',
          maxWidth: isDesktop ? '100%' : 420,
          padding: '12px 14px',
          borderRadius: 'var(--radius-md, 12px)',
          background: 'rgba(13, 19, 34, 0.88)',
          border: '1px solid rgba(100, 197, 190, 0.28)',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}
      >
        <div
          style={{
            fontSize: '0.84rem',
            fontWeight: 700,
            color: '#f8fafc',
            whiteSpace: 'normal',
            wordBreak: 'break-word'
          }}
        >
          {md.title || activeAsset.AssetName}
        </div>

        {museum && (
          <div
            style={{
              fontSize: '0.74rem',
              fontWeight: 600,
              color: '#64c5be',
              whiteSpace: 'normal',
              wordBreak: 'break-word'
            }}
          >
            {museum}
          </div>
        )}

        {(leftItems.length > 0 || rightItems.length > 0) && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                leftItems.length > 0 && rightItems.length > 0 ? '1fr 1fr' : '1fr',
              gap: '6px 12px',
              marginTop: 2
            }}
          >
            {leftItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                {leftItems.map((line, idx) => (
                  <div
                    key={`l-${idx}`}
                    style={{
                      fontSize: '0.7rem',
                      color: '#cbd5e1',
                      lineHeight: 1.35,
                      whiteSpace: 'normal',
                      wordBreak: 'break-word'
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            )}

            {rightItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                {rightItems.map((line, idx) => (
                  <div
                    key={`r-${idx}`}
                    style={{
                      fontSize: '0.7rem',
                      color: '#cbd5e1',
                      lineHeight: 1.35,
                      whiteSpace: 'normal',
                      wordBreak: 'break-word'
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {displayedDesc && (
          <div
            style={{
              fontSize: '0.7rem',
              color: '#94a3b8',
              lineHeight: 1.45,
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              marginTop: 2
            }}
          >
            {displayedDesc}
          </div>
        )}

        {isFullMetadataOpen && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              marginTop: 4,
              paddingTop: 6,
              borderTop: '1px solid rgba(148, 163, 184, 0.16)'
            }}
          >
            {taxonomy && (
              <div style={{ fontSize: '0.69rem', color: '#cbd5e1', wordBreak: 'break-word' }}>
                <strong style={{ color: '#64c5be' }}>Taxonomy: </strong>
                {taxonomy}
              </div>
            )}
            {creditLine && (
              <div style={{ fontSize: '0.69rem', color: '#cbd5e1', wordBreak: 'break-word' }}>
                <strong style={{ color: '#64c5be' }}>Credit: </strong>
                {creditLine}
              </div>
            )}
            {identifier && (
              <div style={{ fontSize: '0.69rem', color: '#cbd5e1', wordBreak: 'break-word' }}>
                <strong style={{ color: '#64c5be' }}>Identifier: </strong>
                {identifier}
              </div>
            )}
            {annotations && (
              <div style={{ fontSize: '0.69rem', color: '#cbd5e1', wordBreak: 'break-word' }}>
                <strong style={{ color: '#64c5be' }}>Annotations: </strong>
                {annotations}
              </div>
            )}
            {extraDetails.map((item, idx) => (
              <div
                key={`d-${idx}`}
                style={{ fontSize: '0.69rem', color: '#cbd5e1', wordBreak: 'break-word' }}
              >
                <strong style={{ color: '#64c5be' }}>{item.label}: </strong>
                {item.value}
              </div>
            ))}
          </div>
        )}

        {hasExtraCuratorial && (
          <button
            type="button"
            onClick={toggleFullMetadataModal}
            style={{
              marginTop: 4,
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              borderRadius: 999,
              fontSize: '0.7rem',
              fontWeight: 600,
              color: isFullMetadataOpen ? '#070a13' : '#64c5be',
              background: isFullMetadataOpen
                ? '#64c5be'
                : 'rgba(100, 197, 190, 0.14)',
              border: '1px solid rgba(100, 197, 190, 0.4)',
              cursor: 'pointer'
            }}
          >
            {isFullMetadataOpen ? (
              <>
                <ChevronUp size={13} />
                <span>Close Full Info on Stage</span>
              </>
            ) : (
              <>
                <ChevronDown size={13} />
                <span>Read More · View on Stage</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  })();

  return (
    <div className="controller-modal">
      <div className="controller-header">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setIsControllerOpen(false)}
          title="Back to Catalog"
          aria-label="Back to Catalog"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 'var(--radius-pill)',
            color: 'var(--text-secondary)'
          }}
        >
          <ArrowLeft size={16} />
          {isDesktop && <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Catalog</span>}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            Stage Controller
          </div>
          <div className="u-meta" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              className={`status-strip-dot ${connectionState === 'connected' ? 'ok' : 'bad'}`}
              style={{ width: 6, height: 6 }}
            />
            {connectionState === 'connected' ? 'Live Telemetry' : 'Offline'}
          </div>
        </div>

        <button
          type="button"
          className="btn-icon"
          onClick={() => setIsMoreOpen(true)}
          title="More actions"
          aria-label="More actions"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {connectionState !== 'connected' && (
        <div className="controller-banner">
          {connectionState === 'connecting' ? (
            <>
              <Loader2 size={14} className="spin" />
              <span>Reconnecting — controls paused</span>
            </>
          ) : (
            <>
              <AlertTriangle size={14} />
              <span>Disconnected — controls paused</span>
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
            <div className="controller-col-side">
              {assetLine}
              {metadataCard}
            </div>
            <div className="controller-col-main">{controls}</div>
            <div className="controller-col-side">{desktopStatusPanel}</div>
          </>
        ) : (
          <>
            {assetLine}
            {controls}
            {statusStrip}
            {metadataCard}
          </>
        )}
      </div>

      {/* Secondary / disruptive actions live behind an explicit tap. */}
      <BottomSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        title="Actions"
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
              <strong>Settings & calibration</strong>
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
              <strong>Toggle fullscreen</strong>
              <em>Switch window mode</em>
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
              <strong>Clear</strong>
              <em>Remove the current content and show the company logo</em>
            </span>
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        title="Status"
        subtitle="Live link, projection and control ownership"
      >
        {statusDetail}
      </BottomSheet>

      {/* Clearing is visible to the audience - always confirm. */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        title="Clear Content?"
        message="This removes the current content and restores the company logo. The audience will see this change."
        confirmLabel="Clear"
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
  2: 'HOLO',
  3: 'FMAX'
};

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
  FileText,
  Tv
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
  const [isCuratorialSheetOpen, setIsCuratorialSheetOpen] = useState(false);

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

  // Curatorial record parsing and semantic grouping (Unified data model)
  const curatorialData = (() => {
    if (!hasModelMetadata(activeAsset) || !activeAsset.metadata) {
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

    const rawDetails = md.details || [];
    const topics: string[] = [];
    const extraDescs: string[] = [];
    const publications: string[] = [];
    const customDetails: { label: string; value: string }[] = [];

    const seenValues = new Set<string>();
    [
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
    ].forEach((s) => {
      if (s) seenValues.add(s.trim().toLowerCase());
    });

    let effectiveMaker = creator;
    let effectiveDemonstrator = '';
    let effectiveUsed = place;
    let effectiveMedium = medium;

    for (const item of rawDetails) {
      if (!item || !item.value) continue;
      const val = item.value.trim();
      if (!val) continue;
      const lbl = (item.label || 'Note').trim();
      const lowerLbl = lbl.toLowerCase();
      const lowerVal = val.toLowerCase();

      if (
        lowerLbl.includes('see more items') ||
        lowerLbl.includes('topic') ||
        lowerLbl.includes('category') ||
        lowerLbl.includes('subject')
      ) {
        if (!topics.some((t) => t.toLowerCase() === lowerVal)) {
          topics.push(val);
        }
        continue;
      }

      if (
        lowerLbl.includes('description') ||
        lowerLbl.includes('curatorial note') ||
        lowerLbl.includes('historical note')
      ) {
        if (
          lowerVal !== cleanedDesc.toLowerCase() &&
          !extraDescs.some((d) => d.toLowerCase() === lowerVal)
        ) {
          extraDescs.push(val);
        }
        continue;
      }

      if (
        lowerLbl.includes('publication') ||
        lowerLbl.includes('citation') ||
        lowerLbl.includes('reference') ||
        lowerLbl.includes('bibliography')
      ) {
        if (!publications.some((p) => p.toLowerCase() === lowerVal)) {
          publications.push(val);
        }
        continue;
      }

      if (lowerLbl === 'maker' || lowerLbl === 'creator') {
        if (!effectiveMaker) effectiveMaker = val;
        continue;
      }
      if (lowerLbl === 'demonstrator') {
        if (lowerVal !== (effectiveMaker || '').toLowerCase() && lowerVal !== creditLine.toLowerCase()) {
          effectiveDemonstrator = val;
        }
        continue;
      }
      if (lowerLbl === 'used') {
        if (!effectiveUsed) effectiveUsed = val;
        continue;
      }
      if (lowerLbl === 'physical description') {
        if (!effectiveMedium) effectiveMedium = val;
        continue;
      }
      if (lowerLbl === 'object name') {
        if (
          lowerVal === (md.title || activeAsset.AssetName).toLowerCase() ||
          lowerVal === collection.toLowerCase()
        ) {
          continue;
        }
      }
      if (lowerLbl === 'credit line' || lowerLbl === 'donor') {
        if (lowerVal === creditLine.toLowerCase()) {
          continue;
        }
      }

      if (!seenValues.has(lowerVal)) {
        seenValues.add(lowerVal);
        customDetails.push({ label: lbl, value: val });
      }
    }

    // 5 SEMANTIC CATEGORIES FOR OPERATOR CURATORIAL RECORD
    const identitySpecs: { label: string; value: string }[] = [];
    identitySpecs.push({ label: 'Object / Title', value: md.title || activeAsset.AssetName });
    if (museum) identitySpecs.push({ label: 'Institution', value: museum });
    if (collection) identitySpecs.push({ label: 'Collection', value: collection });
    if (identifier) identitySpecs.push({ label: 'Catalog / ID', value: identifier });

    const provenanceSpecs: { label: string; value: string }[] = [];
    if (effectiveMaker) provenanceSpecs.push({ label: 'Creator / Maker', value: effectiveMaker });
    if (effectiveDemonstrator) provenanceSpecs.push({ label: 'Demonstrator', value: effectiveDemonstrator });
    if (date) provenanceSpecs.push({ label: 'Date Made / Era', value: date });
    if (effectiveUsed) provenanceSpecs.push({ label: 'Origin / Place', value: effectiveUsed });
    if (creditLine) provenanceSpecs.push({ label: 'Credit Line', value: creditLine });

    const physicalSpecs: { label: string; value: string }[] = [];
    if (effectiveMedium) physicalSpecs.push({ label: 'Material / Medium', value: effectiveMedium });
    if (dimensions) physicalSpecs.push({ label: 'Dimensions', value: dimensions });

    const classificationSpecs: { label: string; value: string }[] = [];
    if (taxonomy) classificationSpecs.push({ label: 'Taxonomy', value: taxonomy });
    if (topics.length > 0) classificationSpecs.push({ label: 'Topics & Categories', value: topics.join(' · ') });

    const identifierSpecs: { label: string; value: string }[] = [];
    if (activeAsset.smithsonianId) identifierSpecs.push({ label: 'Smithsonian ID', value: activeAsset.smithsonianId });
    customDetails.forEach((cd) => {
      const lower = cd.label.toLowerCase();
      if (lower.includes('accession') || lower.includes('id') || lower.includes('number') || lower.includes('link')) {
        identifierSpecs.push(cd);
      } else if (lower.includes('exhibition')) {
        classificationSpecs.push(cd);
      } else {
        provenanceSpecs.push(cd);
      }
    });
    if (annotations) identifierSpecs.push({ label: 'Annotations', value: annotations });

    return {
      md,
      title: md.title || activeAsset.AssetName,
      museum,
      date,
      effectiveMaker,
      effectiveUsed,
      effectiveMedium,
      collection,
      cleanedDesc,
      extraDescs,
      publications,
      identitySpecs,
      provenanceSpecs,
      physicalSpecs,
      classificationSpecs,
      identifierSpecs
    };
  })();

  // Concise Bounded Operator Summary Card (Left Column)
  const metadataCard = (() => {
    if (!isMetadataVisible || !curatorialData) {
      return null;
    }

    const {
      title,
      museum,
      date,
      effectiveMaker,
      effectiveUsed,
      effectiveMedium,
      collection,
      cleanedDesc
    } = curatorialData;

    return (
      <div
        className="controller-panel"
        style={{
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          width: '100%',
          maxWidth: isDesktop ? '100%' : 420
        }}
      >
        {/* Identity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="u-section-label" style={{ fontSize: '0.64rem', letterSpacing: '0.06em' }}>
            Active Object
          </span>
          <div
            style={{
              fontSize: '0.94rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.25,
              wordBreak: 'break-word'
            }}
          >
            {title}
          </div>
          {museum && (
            <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--color-primary)' }}>
              {museum}
            </div>
          )}
        </div>

        {/* Essential Facts: Date, Maker, Origin, Material */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '8px 12px',
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-2)',
            border: '1px solid var(--line-subtle)'
          }}
        >
          {date && (
            <div>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
                Date
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                {date}
              </div>
            </div>
          )}

          {effectiveMaker && (
            <div>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
                Maker
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                {effectiveMaker}
              </div>
            </div>
          )}

          {effectiveUsed && (
            <div>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
                Origin
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                {effectiveUsed}
              </div>
            </div>
          )}

          {effectiveMedium && (
            <div>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
                Material
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                {effectiveMedium}
              </div>
            </div>
          )}

          {collection && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
                Collection
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)' }}>
                {collection}
              </div>
            </div>
          )}
        </div>

        {/* Short Narrative Preview (concise 1-2 lines) */}
        {cleanedDesc && (
          <div
            style={{
              fontSize: '0.71rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.45,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word'
            }}
          >
            {cleanedDesc}
          </div>
        )}

        {/* Progressive Disclosure Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsCuratorialSheetOpen(true)}
            style={{
              flex: 1,
              minHeight: 36,
              padding: '6px 14px',
              fontSize: '0.72rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-pill)',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <FileText size={13} style={{ color: 'var(--color-primary)' }} />
            <span>View Curatorial Record</span>
          </button>

          {/* Quick Stage View Toggle for Audience View */}
          <button
            type="button"
            onClick={toggleFullMetadataModal}
            title={isFullMetadataOpen ? 'Hide record from Unity stage' : 'Display exhibition graphic on Unity stage'}
            style={{
              height: 36,
              padding: '0 12px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.72rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
              background: isFullMetadataOpen ? 'var(--color-primary)' : 'rgba(104, 217, 208, 0.12)',
              color: isFullMetadataOpen ? '#06090F' : 'var(--color-primary)',
              border: '1px solid rgba(104, 217, 208, 0.35)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Tv size={13} />
            <span>{isFullMetadataOpen ? 'On Stage' : 'Stage View'}</span>
          </button>
        </div>
      </div>
    );
  })();

  return (
    <div className="controller-modal" data-controller-surface="true">
      <div className="controller-header">
        <button
          type="button"
          className="btn btn-ghost controller-back-btn"
          onClick={() => setIsControllerOpen(false)}
          title="Back to Catalog"
          aria-label="Back to Catalog"
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

      {/* Full Curatorial Record Drawer / Sheet (Progressive Disclosure) */}
      <BottomSheet
        isOpen={isCuratorialSheetOpen}
        onClose={() => setIsCuratorialSheetOpen(false)}
        variant={isDesktop ? 'side-drawer' : 'default'}
        title="Curatorial Record"
        subtitle={activeAsset.AssetName}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 12 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={toggleFullMetadataModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.82rem',
                minHeight: 40,
                padding: '0 16px',
                background: isFullMetadataOpen ? 'var(--color-primary)' : undefined,
                color: isFullMetadataOpen ? '#06090F' : undefined,
                fontWeight: 600
              }}
            >
              <Tv size={15} />
              <span>{isFullMetadataOpen ? 'Visible on Stage Viewer (Tap to Hide)' : 'Display on Stage Viewer'}</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIsCuratorialSheetOpen(false)}
              style={{ minHeight: 40, padding: '0 16px', borderRadius: 'var(--radius-pill)' }}
            >
              Close
            </button>
          </div>
        }
      >
        {curatorialData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '4px 0 16px' }}>
            {/* Identity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="u-section-label" style={{ color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
                IDENTITY
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px 12px' }}>
                {curatorialData.identitySpecs.map((spec, i) => (
                  <div key={`id-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {spec.label}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Provenance */}
            {curatorialData.provenanceSpecs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="u-section-label" style={{ color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
                  PROVENANCE
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px 12px' }}>
                  {curatorialData.provenanceSpecs.map((spec, i) => (
                    <div key={`prov-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {spec.label}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Physical */}
            {curatorialData.physicalSpecs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="u-section-label" style={{ color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
                  PHYSICAL
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px 12px' }}>
                  {curatorialData.physicalSpecs.map((spec, i) => (
                    <div key={`phys-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {spec.label}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Classification */}
            {curatorialData.classificationSpecs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="u-section-label" style={{ color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
                  CLASSIFICATION
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px 12px' }}>
                  {curatorialData.classificationSpecs.map((spec, i) => (
                    <div
                      key={`class-${i}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        ...(spec.label === 'Topics & Categories' ? { gridColumn: '1 / -1' } : {})
                      }}
                    >
                      <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {spec.label}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Identifiers & References */}
            {curatorialData.identifierSpecs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="u-section-label" style={{ color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
                  IDENTIFIERS & REFERENCES
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px 12px' }}>
                  {curatorialData.identifierSpecs.map((spec, i) => (
                    <div key={`id-ref-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {spec.label}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curatorial Narrative */}
            {(curatorialData.cleanedDesc || curatorialData.extraDescs.length > 0) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="u-section-label" style={{ color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
                  CURATORIAL NARRATIVE
                </span>
                <div
                  style={{
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                    background: 'var(--surface-2)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--line-subtle)',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {curatorialData.cleanedDesc}
                  {curatorialData.extraDescs.map((desc, i) => (
                    <div key={`extra-desc-${i}`} style={{ marginTop: 8 }}>
                      {desc}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Publications */}
            {curatorialData.publications.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="u-section-label" style={{ color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
                  PUBLICATIONS
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {curatorialData.publications.map((pub, i) => (
                    <div key={`pub-${i}`} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      • {pub}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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

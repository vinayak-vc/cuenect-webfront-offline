import React from 'react';
import { Box, Info, Sliders } from 'lucide-react';
import { useStage } from '../../context/StageContext';
import { DisplayModeLabels } from '../../types/protocol';

interface NowOnStageProps {
  /** Opens the controller surface for the live asset. */
  onOpenController: () => void;
}

/**
 * Global live-state bar: the application's single answer to "what is on the
 * stage right now, and in what mode?".
 *
 * Tapping the dock opens the controller for the live asset.
 * Tapping the quiet Info button opens the read-only Asset Inspector.
 */
export const NowOnStage: React.FC<NowOnStageProps> = ({ onOpenController }) => {
  const {
    activeAsset,
    thumbnails,
    isControllerOpen,
    isSlideshowActive,
    displayMode,
    isOrthographic,
    setInspectedAsset
  } = useStage();

  if (!activeAsset || isControllerOpen || isSlideshowActive) return null;

  const thumb = thumbnails[activeAsset.AssetID];
  const modeTag = `${DisplayModeLabels[displayMode]} · ${isOrthographic ? 'Ortho' : 'Persp'}`;

  return (
    <div
      className="stage-dock"
      onClick={onOpenController}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenController();
        }
      }}
      aria-label={`Now active: ${activeAsset.AssetName}. Open controller.`}
      style={{
        boxShadow: 'var(--shadow-live)',
        borderColor: 'rgba(55, 209, 127, 0.35)',
        cursor: 'pointer'
      }}
    >
      {thumb ? (
        <img src={thumb} alt="" className="stage-dock-thumb" />
      ) : (
        <span
          className="stage-dock-thumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}
        >
          <Box size={20} />
        </span>
      )}

      <div className="stage-dock-body">
        <div className="stage-dock-label" style={{ color: 'var(--color-live)' }}>
          <span className="live-dot" />
          <span>Active On Stage</span>
        </div>
        <div className="stage-dock-name" title={activeAsset.AssetName}>
          {activeAsset.AssetName}
        </div>
        <span className="stage-dock-mode">{modeTag}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <button
          type="button"
          className="btn-icon"
          onClick={(e) => {
            e.stopPropagation();
            setInspectedAsset(activeAsset);
          }}
          title="Inspect curatorial info"
          aria-label="Inspect curatorial info"
          style={{
            width: 32,
            height: 32,
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <Info size={16} />
        </button>

        <button
          type="button"
          className="btn-ghost"
          onClick={(e) => {
            e.stopPropagation();
            onOpenController();
          }}
          title="Open Controller"
          aria-label="Open Controller"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            background: 'rgba(100, 197, 190, 0.1)',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid rgba(100, 197, 190, 0.25)'
          }}
        >
          <Sliders size={13} />
          <span>Control</span>
        </button>
      </div>
    </div>
  );
};

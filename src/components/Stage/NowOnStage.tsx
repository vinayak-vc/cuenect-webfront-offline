import React from 'react';
import { Box, Sliders, Square } from 'lucide-react';
import { useStage } from '../../context/StageContext';

interface NowOnStageProps {
  /** Opens the controller surface for the live asset. */
  onOpenController: () => void;
}

/**
 * Persistent answer to "what is on the stage right now?".
 *
 * Docked bottom-centre on mobile (above the nav) and bottom-right on desktop.
 * Hidden while the controller is already open, and while a slideshow owns the
 * bottom bar, so the two never stack.
 */
export const NowOnStage: React.FC<NowOnStageProps> = ({ onOpenController }) => {
  const { activeAsset, thumbnails, unloadAsset, isControllerOpen, isSlideshowActive } = useStage();

  if (!activeAsset || isControllerOpen || isSlideshowActive) return null;

  const thumb = thumbnails[activeAsset.AssetID];

  return (
    <div className="stage-dock">
      {thumb ? (
        <img src={thumb} alt="" className="stage-dock-thumb" />
      ) : (
        <div
          className="stage-dock-thumb"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
        >
          <Box size={20} />
        </div>
      )}

      <div className="stage-dock-body">
        <div className="stage-dock-label">
          <span className="live-dot" />
          Now on Stage
        </div>
        <div className="stage-dock-name">{activeAsset.AssetName}</div>
      </div>

      <div className="stage-dock-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onOpenController}
          style={{ minHeight: 40, fontSize: '0.78rem', gap: 6 }}
        >
          <Sliders size={14} />
          <span>Control</span>
        </button>
        <button
          type="button"
          className="btn-icon"
          onClick={unloadAsset}
          title="Clear the stage and restore the company logo"
          aria-label="Stop and clear stage"
        >
          <Square size={15} />
        </button>
      </div>
    </div>
  );
};

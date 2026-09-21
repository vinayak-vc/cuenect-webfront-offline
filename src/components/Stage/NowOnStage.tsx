import React from 'react';
import { Box, ChevronRight } from 'lucide-react';
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
 * The whole bar is the affordance - tapping it opens the controller for the
 * live asset. It is not duplicated per screen: it sits above the bottom
 * navigation on mobile and bottom-right on desktop, and hides only when the
 * controller is already open or a slideshow owns the bottom bar.
 */
export const NowOnStage: React.FC<NowOnStageProps> = ({ onOpenController }) => {
  const { activeAsset, thumbnails, isControllerOpen, isSlideshowActive, displayMode } = useStage();

  if (!activeAsset || isControllerOpen || isSlideshowActive) return null;

  const thumb = thumbnails[activeAsset.AssetID];

  return (
    <button
      type="button"
      className="stage-dock"
      onClick={onOpenController}
      aria-label={`Now on stage: ${activeAsset.AssetName}. Open the stage controller.`}
    >
      {thumb ? (
        <img src={thumb} alt="" className="stage-dock-thumb" />
      ) : (
        <span
          className="stage-dock-thumb"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
        >
          <Box size={20} />
        </span>
      )}

      <span className="stage-dock-body">
        <span className="stage-dock-label">
          <span className="live-dot" />
          Now on Stage
        </span>
        <span className="stage-dock-name">{activeAsset.AssetName}</span>
        <span className="stage-dock-mode">{DisplayModeLabels[displayMode]}</span>
      </span>

      <ChevronRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </button>
  );
};

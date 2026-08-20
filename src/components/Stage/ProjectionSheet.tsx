import React from 'react';
import { Check, Monitor, Layers, Box } from 'lucide-react';
import { BottomSheet } from '../Common/BottomSheet';
import { useStage } from '../../context/StageContext';
import { DisplayMode, DisplayModeLabels } from '../../types/protocol';

interface ProjectionSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const OPTIONS: Array<{ mode: DisplayMode; icon: React.ReactNode; desc: string }> = [
  { mode: DisplayMode.Mono2D, icon: <Monitor size={16} />, desc: 'Single camera, no stereo separation.' },
  { mode: DisplayMode.StereoSbs, icon: <Layers size={16} />, desc: 'Side-by-side stereo pair rendered on the stage.' },
  { mode: DisplayMode.HoloDevice, icon: <Box size={16} />, desc: 'Axiom HOLO device with tracked per-eye rendering.' }
];

/**
 * Projection picker reached from More. The header keeps its own inline selector
 * for fast switching; this is the same state, presented for thumb reach.
 */
export const ProjectionSheet: React.FC<ProjectionSheetProps> = ({ isOpen, onClose }) => {
  const { displayMode, setDisplayMode } = useStage();

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Projection Mode"
      subtitle="How the stage renders the loaded asset"
    >
      <div role="listbox" aria-label="Projection mode">
        {OPTIONS.map((opt) => (
          <button
            key={opt.mode}
            type="button"
            role="option"
            aria-selected={displayMode === opt.mode}
            className="projection-option"
            onClick={() => {
              setDisplayMode(opt.mode);
              onClose();
            }}
          >
            <span className="projection-option-icon">{opt.icon}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="projection-option-name" style={{ display: 'block' }}>
                {DisplayModeLabels[opt.mode]}
              </span>
              <span className="projection-option-desc">{opt.desc}</span>
            </span>
            {displayMode === opt.mode && (
              <Check size={16} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 6 }} />
            )}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
};

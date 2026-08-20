import React from 'react';
import { useStage } from '../../context/StageContext';
import { MoveableAssetType } from '../../types/protocol';
import { DPad } from './DPad';
import { SegmentedControl, SegmentedOption } from '../Common/SegmentedControl';
import { Box, Move, Search, SunMedium } from 'lucide-react';

/**
 * Model-only controls. Stage-level settings (projection, camera, stereo
 * calibration, fullscreen) live in the header so they stay consistent across
 * every screen.
 */
export const ModelControlPanel: React.FC = () => {
  const { currentMovableMode, setMovableMode } = useStage();

  const modes: SegmentedOption<MoveableAssetType>[] = [
    { value: MoveableAssetType.Rotate, label: 'Rotate', icon: <Box size={14} /> },
    { value: MoveableAssetType.Pan, label: 'Pan', icon: <Move size={14} /> },
    { value: MoveableAssetType.Spotlight, label: 'Light', icon: <SunMedium size={14} /> },
    { value: MoveableAssetType.Magnifier, label: 'Zoom', icon: <Search size={14} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 20 }}>
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="u-section-label">Control Mode</span>
        <SegmentedControl
          options={modes}
          value={currentMovableMode}
          onChange={setMovableMode}
          ariaLabel="Model control mode"
        />
      </div>

      <DPad />
    </div>
  );
};

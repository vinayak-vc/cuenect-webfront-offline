import React, { useState } from 'react';
import { useStage } from '../../context/StageContext';
import { MoveableAssetType, DisplayModeShortLabels } from '../../types/protocol';
import { ProjectionSheet } from '../Stage/ProjectionSheet';
import { DPad } from './DPad';
import { SegmentedControl, SegmentedOption } from '../Common/SegmentedControl';
import { Box, Move, SunMedium, Search } from 'lucide-react';

/**
 * Model-only controls: interaction mode, directional pad, zoom.
 *
 * All four modes now work in every projection. The stage positions Light and
 * Magnifier on the presenting camera's view plane instead of an orthographic
 * screen mapping, and the magnifier lens renders once per eye in SBS and HOLO,
 * so its magnified image carries real stereo depth.
 */
export const ModelControlPanel: React.FC = () => {
  const { currentMovableMode, setMovableMode, displayMode } = useStage();

  const [isProjectionOpen, setIsProjectionOpen] = useState(false);

  // Rotate / Pan / Light / Magnifier are interaction modes. Zoom is an action,
  // so the Zoom -/+ controls stay permanently available under the pad.
  const modes: SegmentedOption<MoveableAssetType>[] = [
    { value: MoveableAssetType.Rotate, label: 'Rotate', icon: <Box size={14} /> },
    { value: MoveableAssetType.Pan, label: 'Pan', icon: <Move size={14} /> },
    { value: MoveableAssetType.Spotlight, label: 'Light', icon: <SunMedium size={14} /> },
    { value: MoveableAssetType.Magnifier, label: 'Magnifier', icon: <Search size={14} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 20 }}>
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="u-section-label">Control Mode</span>
        <SegmentedControl
          options={modes}
          value={currentMovableMode}
          onChange={setMovableMode}
          compact
          ariaLabel="Model control mode"
        />
      </div>

      {/* Centre of the pad opens the projection picker rather than firing an
          action: switching what the audience sees must never be a stray tap
          while rotating. Reset lives in the actions row below the pad. */}
      <DPad
        centerLabel={<span className="dpad-center-mode">{DisplayModeShortLabels[displayMode]}</span>}
        onCenterPress={() => setIsProjectionOpen(true)}
        centerTitle="Change stage projection mode"
      />

      <ProjectionSheet isOpen={isProjectionOpen} onClose={() => setIsProjectionOpen(false)} />

    </div>
  );
};

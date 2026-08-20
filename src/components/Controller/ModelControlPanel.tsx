import React from 'react';
import { useStage } from '../../context/StageContext';
import { MoveableAssetType } from '../../types/protocol';
import { DPad } from './DPad';
import { Box, Move, Search, SunMedium } from 'lucide-react';

export const ModelControlPanel: React.FC = () => {
  const {
    currentMovableMode,
    setMovableMode
  } = useStage();

  const modes = [
    { type: MoveableAssetType.Rotate, label: 'Rotate', icon: Box },
    { type: MoveableAssetType.Pan, label: 'Pan', icon: Move },
    { type: MoveableAssetType.Spotlight, label: 'Spotlight', icon: SunMedium },
    { type: MoveableAssetType.Magnifier, label: 'Magnifier', icon: Search }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 20 }}>
      {/* Mode Selector */}
      <div className="control-mode-selector">
        <span className="form-label" style={{ textAlign: 'center' }}>Control Mode</span>
        <div className="mode-pills">
          {modes.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              className={`mode-pill ${currentMovableMode === type ? 'active' : ''}`}
              onClick={() => setMovableMode(type)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon size={14} />
                <span>{label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* D-Pad */}
      <DPad />

    </div>
  );
};

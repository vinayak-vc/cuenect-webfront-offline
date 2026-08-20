import React from 'react';
import { useStage } from '../../context/StageContext';
import { MoveableAssetType, DisplayMode } from '../../types/protocol';
import { DPad } from './DPad';
import { Eye, Box, Move, Search, SunMedium, Sliders, Monitor } from 'lucide-react';

export const ModelControlPanel: React.FC = () => {
  const {
    currentMovableMode,
    setMovableMode,
    toggleOrthographic,
    isOrthographic,
    toggleStereoscopic,
    stereoSettings,
    triggerFullscreen,
    setIsSettingsOpen,
    displayMode,
    setDisplayMode
  } = useStage();

  const isHolo = displayMode === DisplayMode.HoloDevice;

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

      {/* Stage Settings Quick Bar */}
      <div className="control-options-bar">
        <button
          type="button"
          className={`btn btn-secondary ${isOrthographic ? 'active' : ''}`}
          onClick={toggleOrthographic}
          style={{
            fontSize: '0.75rem',
            padding: '8px 10px',
            borderColor: isOrthographic ? 'var(--color-primary)' : undefined,
            color: isOrthographic ? 'var(--color-primary)' : undefined
          }}
        >
          {isOrthographic ? 'Orthographic' : 'Perspective'}
        </button>

        <button
          type="button"
          className={`btn btn-secondary ${stereoSettings.isStereo ? 'active' : ''}`}
          onClick={toggleStereoscopic}
          style={{
            fontSize: '0.75rem',
            padding: '8px 10px',
            borderColor: stereoSettings.isStereo ? 'var(--color-primary)' : undefined,
            color: stereoSettings.isStereo ? 'var(--color-primary)' : undefined
          }}
        >
          <Eye size={14} />
          {stereoSettings.isStereo ? '3D SBS On' : '3D SBS'}
        </button>

        <button
          type="button"
          className={`btn btn-secondary ${isHolo ? 'active' : ''}`}
          onClick={() => setDisplayMode(isHolo ? DisplayMode.Mono2D : DisplayMode.HoloDevice)}
          style={{
            fontSize: '0.75rem',
            padding: '8px 10px',
            borderColor: isHolo ? 'var(--color-primary)' : undefined,
            color: isHolo ? 'var(--color-primary)' : undefined
          }}
          title="Switch the stage to the Axiom HOLO device"
        >
          <Monitor size={14} />
          {isHolo ? 'HOLO On' : 'HOLO'}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setIsSettingsOpen(true)}
          style={{ fontSize: '0.75rem', padding: '8px 10px' }}
          title="Adjust IPD, Zero Parallax, FOV, and Light"
        >
          <Sliders size={14} />
          Calibrate
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={triggerFullscreen}
          style={{ fontSize: '0.75rem', padding: '8px 10px' }}
        >
          Fullscreen
        </button>
      </div>
    </div>
  );
};

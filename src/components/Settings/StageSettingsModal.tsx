import React from 'react';
import { useStage } from '../../context/StageContext';
import { DisplayMode, DisplayModeLabels } from '../../types/protocol';
import { X, Sliders, Sun, Eye, RotateCcw, Camera, Monitor } from 'lucide-react';

export const StageSettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    stereoSettings,
    updateStereoSettings,
    resetStereoSettings,
    isOrthographic,
    toggleOrthographic,
    displayMode,
    setDisplayMode
  } = useStage();

  if (!isSettingsOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 className="modal-title">Stage & 3D Settings</h2>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setIsSettingsOpen(false)}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Section: Display Mode (2D / SBS / HOLO device) */}
          <div
            style={{
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--border-radius)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Monitor size={18} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Display Mode</span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[DisplayMode.Mono2D, DisplayMode.StereoSbs, DisplayMode.HoloDevice].map((mode) => {
                const isActive = displayMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDisplayMode(mode)}
                    style={{
                      flex: '1 1 120px',
                      padding: '10px 12px',
                      borderRadius: 'var(--border-radius)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--bg-secondary)' : 'transparent',
                      border: isActive
                        ? '1px solid var(--color-primary)'
                        : '1px solid var(--border-color)'
                    }}
                  >
                    {DisplayModeLabels[mode]}
                  </button>
                );
              })}
            </div>

            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              HOLO drives the Axiom holo device directly. The stage falls back to 2D and
              reports why if the device path is unavailable (it requires the stage to run
              on OpenGL Core).
            </span>
          </div>

          {/* Section: Stereoscopic 3D Holo-Wall */}
          <div
            style={{
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--border-radius)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Stereoscopic 3D Holo-Wall</span>
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                <input
                  type="checkbox"
                  checked={stereoSettings.isStereo}
                  onChange={(e) => updateStereoSettings({ isStereo: e.target.checked })}
                  style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }}
                />
                <span style={{ color: stereoSettings.isStereo ? 'var(--color-primary)' : 'var(--text-secondary)' }}>
                  {stereoSettings.isStereo ? '3D Active' : '2D Mono'}
                </span>
              </label>
            </div>

            {/* IPD Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Inter-Pupillary Distance (IPD / Cam Spacing)</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {Math.round(stereoSettings.ipd * 1000)} mm
                </span>
              </div>
              <input
                type="range"
                min={0.005}
                max={0.3}
                step={0.001}
                value={stereoSettings.ipd}
                onChange={(e) => updateStereoSettings({ ipd: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>5 mm (Flat)</span>
                <span>65 mm (Human)</span>
                <span>300 mm (Hyperstereo)</span>
              </div>
            </div>

            {/* Zero Parallax Distance Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Zero Parallax Focal Plane</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {stereoSettings.zeroParallax.toFixed(1)} m
                </span>
              </div>
              <input
                type="range"
                min={0.3}
                max={20.0}
                step={0.1}
                value={stereoSettings.zeroParallax}
                onChange={(e) => updateStereoSettings({ zeroParallax: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>0.3 m (All recede)</span>
                <span>3.0 m (Default)</span>
                <span>20.0 m (All pop out)</span>
              </div>
            </div>

            {/* Camera FOV Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Camera Field of View (FOV)</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {Math.round(stereoSettings.fov)}°
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={120}
                step={1}
                value={stereoSettings.fov}
                onChange={(e) => updateStereoSettings({ fov: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>15° (Tele)</span>
                <span>60° (Default)</span>
                <span>120° (Wide)</span>
              </div>
            </div>

            {/* Toe-In Convergence Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Toe-In Convergence (Legacy)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-warning)' }}>
                  Rotates the cameras inward. Adds keystone distortion and vertical
                  parallax at the frame corners — a known cause of eye strain. Leave off:
                  the default off-axis frustum is the correct method for a flat wall.
                </div>
              </div>
              <input
                type="checkbox"
                checked={stereoSettings.enableToeIn}
                onChange={(e) => updateStereoSettings({ enableToeIn: e.target.checked })}
                style={{ accentColor: 'var(--color-primary)', width: 18, height: 18, cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Section: Stage Lighting & Projection */}
          <div
            style={{
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--border-radius)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sun size={18} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Stage Lighting & Projection</span>
            </div>

            {/* Directional Light Brightness */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Directional Light Brightness</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {Math.round(stereoSettings.lightBrightness * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={4.0}
                step={0.05}
                value={stereoSettings.lightBrightness}
                onChange={(e) => updateStereoSettings({ lightBrightness: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>10% (Dim)</span>
                <span>80% (Default)</span>
                <span>400% (Bright)</span>
              </div>
            </div>

            {/* Camera Projection Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera size={16} style={{ color: 'var(--text-secondary)' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Projection Mode</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Current: {isOrthographic ? 'Orthographic' : 'Perspective'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className={`btn btn-secondary ${isOrthographic ? 'active' : ''}`}
                onClick={toggleOrthographic}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                {isOrthographic ? 'Orthographic' : 'Perspective'}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={resetStereoSettings}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCcw size={14} />
            Reset Defaults
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsSettingsOpen(false)}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

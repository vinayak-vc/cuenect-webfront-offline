import React, { useState } from 'react';
import { useStage } from '../../context/StageContext';
import { BottomSheet } from '../Common/BottomSheet';
import { Slider } from '../Common/Slider';
import { ChevronDown, Eye, Sun, Camera, RotateCcw, FlaskConical } from 'lucide-react';

interface SectionProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** Collapsible group - keeps expert controls out of the operator's way. */
const Section: React.FC<SectionProps> = ({ title, subtitle, icon, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`setting-section ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="setting-section-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span style={{ color: 'var(--color-primary)', display: 'flex' }}>{icon}</span>
        <span style={{ minWidth: 0 }}>
          <span className="setting-section-title" style={{ display: 'block' }}>
            {title}
          </span>
          {subtitle && <span className="setting-section-sub">{subtitle}</span>}
        </span>
        <ChevronDown size={18} className="chev" />
      </button>

      {open && <div className="setting-section-body">{children}</div>}
    </div>
  );
};

/**
 * Stage settings. Grouped into Stereo / Lighting / Camera / Advanced so the
 * everyday controls are one tap away and calibration parameters stay behind a
 * deliberate disclosure. Renders as a bottom sheet on mobile and a centred
 * dialog on desktop (handled by BottomSheet).
 */
export const StageSettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    stereoSettings,
    updateStereoSettings,
    resetStereoSettings,
    isOrthographic,
    toggleOrthographic
  } = useStage();

  return (
    <BottomSheet
      isOpen={isSettingsOpen}
      onClose={() => setIsSettingsOpen(false)}
      title="Stage Settings"
      subtitle="Stereo, lighting and camera calibration"
      footer={
        <button
          type="button"
          className="btn btn-secondary"
          onClick={resetStereoSettings}
          style={{ flex: 1, gap: 6 }}
        >
          <RotateCcw size={15} />
          Reset to Defaults
        </button>
      }
    >
      <Section
        title="Stereo"
        subtitle="Eye separation and focal depth"
        icon={<Eye size={18} />}
        defaultOpen
      >
        <Slider
          label="Inter-pupillary distance"
          valueLabel={`${Math.round(stereoSettings.ipd * 1000)} mm`}
          value={stereoSettings.ipd}
          min={0.005}
          max={0.3}
          step={0.001}
          onChange={(v) => updateStereoSettings({ ipd: v })}
          scale={['5 mm', '65 mm human', '300 mm']}
        />

        <Slider
          label="Zero parallax focal plane"
          valueLabel={`${stereoSettings.zeroParallax.toFixed(1)} m`}
          value={stereoSettings.zeroParallax}
          min={0.3}
          max={20}
          step={0.1}
          onChange={(v) => updateStereoSettings({ zeroParallax: v })}
          scale={['0.3 m', '20 m']}
        />

        <Slider
          label="Field of view"
          valueLabel={`${Math.round(stereoSettings.fov)}°`}
          value={stereoSettings.fov}
          min={20}
          max={120}
          step={1}
          onChange={(v) => updateStereoSettings({ fov: v })}
          scale={['20°', '120°']}
        />
      </Section>

      <Section title="Lighting" subtitle="Stage brightness" icon={<Sun size={18} />}>
        <Slider
          label="Directional light intensity"
          valueLabel={stereoSettings.lightBrightness.toFixed(2)}
          value={stereoSettings.lightBrightness}
          min={0}
          max={3}
          step={0.05}
          onChange={(v) => updateStereoSettings({ lightBrightness: v })}
          scale={['0', '3']}
        />
      </Section>

      <Section title="Camera" subtitle="Stage projection geometry" icon={<Camera size={18} />}>
        <div className="stage-readout">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Projection</span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={toggleOrthographic}
            style={{ minHeight: 40, fontSize: '0.78rem' }}
          >
            {isOrthographic ? 'Orthographic' : 'Perspective'}
          </button>
        </div>
        <p className="u-meta">
          Both stereo modes require a perspective camera; the stage locks this while stereo is active.
        </p>
      </Section>

      <Section
        title="Advanced"
        subtitle="Expert calibration — affects convergence"
        icon={<FlaskConical size={18} />}
      >
        <label className="form-toggle-row" style={{ cursor: 'pointer' }}>
          <span>
            <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>
              Toe-in convergence
            </span>
            <span className="setting-section-sub">
              Rotates the eye cameras inward instead of shearing the frustum.
            </span>
          </span>
          <input
            type="checkbox"
            checked={stereoSettings.enableToeIn}
            onChange={(e) => updateStereoSettings({ enableToeIn: e.target.checked })}
            style={{ accentColor: 'var(--color-primary)', width: 20, height: 20, flexShrink: 0 }}
          />
        </label>
      </Section>
    </BottomSheet>
  );
};

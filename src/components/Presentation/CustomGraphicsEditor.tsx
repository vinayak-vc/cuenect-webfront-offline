import React from 'react';
import { useStage } from '../../context/StageContext';
import { CUSTOM_PROFILE_LIMITS, CustomGraphicsProfile } from '../../types/protocol';

type BooleanKey = {
  [K in keyof CustomGraphicsProfile]: CustomGraphicsProfile[K] extends boolean ? K : never;
}[keyof CustomGraphicsProfile];

type NumberKey = {
  [K in keyof CustomGraphicsProfile]: CustomGraphicsProfile[K] extends number ? K : never;
}[keyof CustomGraphicsProfile];

const ENVIRONMENT_TOGGLES: Array<{ key: BooleanKey; label: string; hint: string }> = [
  { key: 'loadEnvironment', label: 'Heavy environment', hint: 'Loads the environment scene. Off turns everything below it off.' },
  { key: 'nebula', label: 'Nebula backdrop', hint: 'Space backdrop behind the stage.' },
  { key: 'causticFloor', label: 'Caustic floor', hint: 'Animated light on the floor.' },
  { key: 'probeVolume', label: 'Probe volume', hint: 'Baked bounce lighting.' },
  { key: 'reflectionProbe', label: 'Reflection probe', hint: 'Reflections on glossy models.' },
  { key: 'heroMaterials', label: 'Hero materials', hint: 'Upgraded shaders on the model on stage.' },
  { key: 'volumetricShafts', label: 'Volumetric shafts', hint: 'Light shafts. The most expensive effect.' },
  { key: 'motes', label: 'Motes', hint: 'Floating dust in the air.' }
];

const POINT_CLOUD_TOGGLES: Array<{ key: BooleanKey; label: string; hint: string }> = [
  { key: 'pointCloudReveal', label: 'Point-cloud reveal', hint: 'The particle entrance when a model loads.' }
];

const RENDERING_TOGGLES: Array<{ key: BooleanKey; label: string; hint: string }> = [
  { key: 'postProcessing', label: 'Post-processing', hint: 'Vignette and colour effects.' },
  { key: 'hdrOutput', label: 'HDR output', hint: 'Only takes effect on an HDR display.' }
];

const SLIDERS: Array<{
  key: NumberKey;
  label: string;
  format: (value: number) => string;
}> = [
  { key: 'moteCount', label: 'Mote count', format: (v) => v.toLocaleString() },
  { key: 'pointCloudCount', label: 'Point count', format: (v) => v.toLocaleString() },
  { key: 'pointCloudCoverage', label: 'Surface coverage', format: (v) => `${Math.round(v * 100)}%` },
  { key: 'pointCloudMaxPointSize', label: 'Largest point size', format: (v) => `${v.toFixed(1)} px` },
  { key: 'renderScale', label: 'Render scale', format: (v) => `${Math.round(v * 100)}%` }
];

const CHOICES: Array<{ key: NumberKey; label: string; options: string[] }> = [
  { key: 'upscaler', label: 'Upscaler', options: ['Off', 'STP', 'FSR'] },
  { key: 'antiAliasing', label: 'Anti-aliasing', options: ['Off', 'FXAA', 'MSAA 2x', 'MSAA 4x'] },
  { key: 'shadowQuality', label: 'Shadows', options: ['Off', 'Low', 'Medium', 'High'] }
];

const groupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--surface-1)',
  border: '1px solid var(--line-subtle)'
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  minHeight: 36
};

/**
 * The Custom graphics profile (HE-23): every setting the stage lets a controller change, grouped as the kiosk's own panel
 * groups them. Each edit is sent to the stage after a short pause (see `updateCustomProfile`), and the stage answers with
 * the values it actually applied, so a clamped or refused value shows as what it became.
 */
export const CustomGraphicsEditor: React.FC = () => {
  const { customProfile, updateCustomProfile } = useStage();

  const toggle = (item: { key: BooleanKey; label: string; hint: string }) => (
    <label key={item.key} style={{ ...rowStyle, cursor: 'pointer' }}>
      <span style={{ minWidth: 0 }}>
        <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{item.label}</strong>
        <em style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-secondary)', fontStyle: 'normal' }}>
          {item.hint}
        </em>
      </span>
      <input
        type="checkbox"
        checked={customProfile[item.key]}
        onChange={(event) => updateCustomProfile({ [item.key]: event.target.checked })}
        style={{ width: 20, height: 20, accentColor: 'var(--accent-signature)', flexShrink: 0 }}
        aria-label={item.label}
      />
    </label>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Custom graphics profile">
      <div style={groupStyle}>
        <span className="u-section-label">Environment</span>
        {ENVIRONMENT_TOGGLES.map(toggle)}
      </div>

      <div style={groupStyle}>
        <span className="u-section-label">Point cloud</span>
        {POINT_CLOUD_TOGGLES.map(toggle)}
      </div>

      <div style={groupStyle}>
        <span className="u-section-label">Rendering</span>
        {RENDERING_TOGGLES.map(toggle)}
      </div>

      <div style={groupStyle}>
        <span className="u-section-label">Amounts</span>
        {SLIDERS.map((slider) => {
          const limit = CUSTOM_PROFILE_LIMITS[slider.key];
          const value = customProfile[slider.key];
          return (
            <label key={slider.key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ ...rowStyle, minHeight: 0 }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{slider.label}</strong>
                <span style={{ fontSize: '0.74rem', color: 'var(--accent-signature)', fontFamily: 'monospace' }}>
                  {slider.format(value)}
                </span>
              </span>
              <input
                type="range"
                min={limit.min}
                max={limit.max}
                step={'step' in limit ? limit.step : 1}
                value={value}
                onChange={(event) => updateCustomProfile({ [slider.key]: Number(event.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-signature)' }}
                aria-label={slider.label}
              />
            </label>
          );
        })}
      </div>

      <div style={groupStyle}>
        <span className="u-section-label">Quality options</span>
        {CHOICES.map((choice) => (
          <div key={choice.key} style={rowStyle}>
            <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{choice.label}</strong>
            <select
              value={customProfile[choice.key]}
              onChange={(event) => updateCustomProfile({ [choice.key]: Number(event.target.value) })}
              style={{
                background: 'var(--surface-2, #1a2430)',
                color: 'var(--text-primary)',
                border: '1px solid var(--line-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 8px',
                fontSize: '0.78rem'
              }}
              aria-label={choice.label}
            >
              {choice.options.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
        Display settings (resolution, full screen, v-sync) stay on the kiosk: changing them from another machine can leave
        the screen blank.
      </span>
    </div>
  );
};

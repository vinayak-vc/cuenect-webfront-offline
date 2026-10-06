import React from 'react';
import { useStage } from '../../context/StageContext';
import {
  DisplayMode,
  DisplayModeLabels,
  EnvironmentPreset,
  EnvironmentPresetLabels,
  EnvironmentPresetDescriptions,
  QualityTier,
  QualityTierLabels,
  QualityTierDescriptions
} from '../../types/protocol';
import { BottomSheet } from '../Common/BottomSheet';
import {
  Monitor,
  Layers,
  Box,
  Glasses,
  Square,
  Sparkles,
  Camera,
  Check,
  ZapOff,
  Feather,
  Cpu,
  Flame,
  Sliders
} from 'lucide-react';

interface PresentationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROJECTION_OPTIONS: Array<{
  mode: DisplayMode;
  icon: React.ReactNode;
  desc: string;
}> = [
  {
    mode: DisplayMode.Mono2D,
    icon: <Monitor size={17} />,
    desc: 'Single camera standard view, no stereo separation.'
  },
  {
    mode: DisplayMode.StereoSbs,
    icon: <Layers size={17} />,
    desc: 'Side-by-side stereo pair for 3D displays and projectors.'
  },
  {
    mode: DisplayMode.HoloDevice,
    icon: <Box size={17} />,
    desc: 'Axiom HOLO holographic display with tracked eye rendering.'
  },
  {
    mode: DisplayMode.KmaxDevice,
    icon: <Glasses size={17} />,
    desc: 'FMAX XR spatial panel with head-tracked rendering.'
  }
];

const ENVIRONMENT_OPTIONS: Array<{
  preset: EnvironmentPreset;
  icon: React.ReactNode;
  desc: string;
}> = [
  {
    preset: EnvironmentPreset.Space,
    icon: <Sparkles size={17} />,
    desc: EnvironmentPresetDescriptions[EnvironmentPreset.Space]
  },
  {
    preset: EnvironmentPreset.Void,
    icon: <Square size={17} />,
    desc: EnvironmentPresetDescriptions[EnvironmentPreset.Void]
  }
];

const QUALITY_OPTIONS: Array<{
  tier: QualityTier;
  icon: React.ReactNode;
  tag?: string;
  cost: string;
  desc: string;
}> = [
  {
    tier: QualityTier.VeryLow,
    icon: <ZapOff size={17} />,
    tag: 'Fastest',
    cost: '~0.0 ms',
    desc: QualityTierDescriptions[QualityTier.VeryLow]
  },
  {
    tier: QualityTier.Low,
    icon: <Feather size={17} />,
    cost: '~0.3 ms',
    desc: QualityTierDescriptions[QualityTier.Low]
  },
  {
    tier: QualityTier.Medium,
    icon: <Cpu size={17} />,
    cost: '~0.6 ms',
    desc: QualityTierDescriptions[QualityTier.Medium]
  },
  {
    tier: QualityTier.High,
    icon: <Sparkles size={17} />,
    tag: 'Recommended',
    cost: '~1.0 ms',
    desc: QualityTierDescriptions[QualityTier.High]
  },
  {
    tier: QualityTier.Ultra,
    icon: <Flame size={17} />,
    tag: 'Max Immersion',
    cost: '~1.6 ms',
    desc: QualityTierDescriptions[QualityTier.Ultra]
  }
];

/**
 * Canonical PresentationPanel:
 * Single source of truth for all stage presentation controls
 * (Projection Mode, Environment Dressing, Graphics Quality, and Camera Geometry).
 */
export const PresentationPanel: React.FC<PresentationPanelProps> = ({
  isOpen,
  onClose
}) => {
  const {
    displayMode,
    setDisplayMode,
    environmentPreset,
    setEnvironmentPreset,
    qualityTier,
    setQualityTier,
    isOrthographic,
    toggleOrthographic,
    stereoSettings
  } = useStage();

  const isStereoActive = stereoSettings.isStereo || displayMode !== DisplayMode.Mono2D;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Presentation Controls"
      subtitle="Tune projection mode, stage environment, graphics quality, and camera optics"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Section 1: Projection Mode */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="u-section-label">Projection Display Mode</span>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--accent-signature)',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}
            >
              ACTIVE: {DisplayModeLabels[displayMode]}
            </span>
          </div>

          <div role="listbox" aria-label="Projection Display Mode" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PROJECTION_OPTIONS.map((opt) => {
              const isSelected = displayMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`sheet-action ${isSelected ? 'active' : ''}`}
                  onClick={() => setDisplayMode(opt.mode)}
                  style={{
                    background: isSelected ? 'var(--accent-signature-dim)' : 'var(--surface-1)',
                    borderColor: isSelected ? 'var(--accent-signature)' : 'var(--line-subtle)',
                    padding: '10px 14px'
                  }}
                >
                  <span
                    style={{
                      color: isSelected ? 'var(--accent-signature)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: 2
                    }}
                  >
                    {opt.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ color: isSelected ? '#fff' : 'var(--text-primary)', fontSize: '0.86rem' }}>
                      {DisplayModeLabels[opt.mode]}
                    </strong>
                    <em style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', display: 'block', marginTop: 2 }}>
                      {opt.desc}
                    </em>
                  </div>
                  {isSelected && (
                    <Check
                      size={18}
                      style={{ color: 'var(--accent-signature)', flexShrink: 0, alignSelf: 'center' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Environment Dressing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="u-section-label">Stage Environment Dressing</span>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--accent-signature)',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}
            >
              ACTIVE: {EnvironmentPresetLabels[environmentPreset]}
            </span>
          </div>

          <div role="listbox" aria-label="Stage Environment Dressing" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {ENVIRONMENT_OPTIONS.map((opt) => {
              const isSelected = environmentPreset === opt.preset;
              return (
                <button
                  key={opt.preset}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`sheet-action ${isSelected ? 'active' : ''}`}
                  onClick={() => setEnvironmentPreset(opt.preset)}
                  style={{
                    background: isSelected ? 'var(--accent-signature-dim)' : 'var(--surface-1)',
                    borderColor: isSelected ? 'var(--accent-signature)' : 'var(--line-subtle)',
                    padding: '10px 12px',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 6
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ color: isSelected ? 'var(--accent-signature)' : 'var(--text-secondary)' }}>
                      {opt.icon}
                    </span>
                    {isSelected && <Check size={16} style={{ color: 'var(--accent-signature)' }} />}
                  </div>
                  <div>
                    <strong style={{ color: isSelected ? '#fff' : 'var(--text-primary)', fontSize: '0.84rem' }}>
                      {EnvironmentPresetLabels[opt.preset]}
                    </strong>
                    <em style={{ color: 'var(--text-secondary)', fontSize: '0.70rem', display: 'block', marginTop: 2 }}>
                      {opt.desc}
                    </em>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Graphics Quality Tier */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="u-section-label">Graphics Quality Tier</span>
            <span
              style={{
                fontSize: '0.72rem',
                color: qualityTier === QualityTier.Custom ? '#ffaa00' : 'var(--accent-signature)',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}
            >
              ACTIVE: {QualityTierLabels[qualityTier]}
            </span>
          </div>

          {displayMode !== DisplayMode.Mono2D && (
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--line-subtle)'
              }}
            >
              Heavy environment features (caustic floor, volumetrics, motes, reveal) only render in 2D mode.
            </div>
          )}

          {qualityTier === QualityTier.Custom && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 170, 0, 0.1)',
                border: '1px solid rgba(255, 170, 0, 0.35)'
              }}
            >
              <Sliders size={16} style={{ color: '#ffaa00', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ color: '#ffaa00', fontSize: '0.84rem' }}>
                  Custom Profile Active
                </strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', display: 'block', marginTop: 2 }}>
                  Configured in kiosk display settings (F10 / G). Selecting any tier below applies that preset and restores defaults.
                </span>
              </div>
            </div>
          )}

          <div role="listbox" aria-label="Graphics Quality Tier" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {QUALITY_OPTIONS.map((opt) => {
              const isSelected = qualityTier === opt.tier;
              return (
                <button
                  key={opt.tier}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`sheet-action ${isSelected ? 'active' : ''}`}
                  onClick={() => setQualityTier(opt.tier)}
                  style={{
                    background: isSelected ? 'var(--accent-signature-dim)' : 'var(--surface-1)',
                    borderColor: isSelected ? 'var(--accent-signature)' : 'var(--line-subtle)',
                    padding: '10px 14px'
                  }}
                >
                  <span
                    style={{
                      color: isSelected ? 'var(--accent-signature)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: 2
                    }}
                  >
                    {opt.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ color: isSelected ? '#fff' : 'var(--text-primary)', fontSize: '0.86rem' }}>
                        {QualityTierLabels[opt.tier]}
                      </strong>
                      {opt.tag && (
                        <span
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-full)',
                            background: isSelected ? 'var(--accent-signature)' : 'rgba(255, 255, 255, 0.08)',
                            color: isSelected ? '#000' : 'var(--text-secondary)',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase'
                          }}
                        >
                          {opt.tag}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--text-muted)',
                          marginLeft: 'auto',
                          marginRight: 6,
                          fontFamily: 'monospace'
                        }}
                      >
                        {opt.cost}
                      </span>
                    </div>
                    <em style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', display: 'block', marginTop: 2 }}>
                      {opt.desc}
                    </em>
                  </div>
                  {isSelected && (
                    <Check
                      size={18}
                      style={{ color: 'var(--accent-signature)', flexShrink: 0, alignSelf: 'center' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Camera Optics & Projection Geometry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="u-section-label">Camera Optics</span>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-1)',
              border: '1px solid var(--line-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Camera size={18} style={{ color: 'var(--accent-signature)' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                  Camera Projection
                </strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {isStereoActive
                    ? 'Locked to Perspective in Stereoscopic modes'
                    : isOrthographic
                    ? 'Orthographic (parallel isometric view)'
                    : 'Perspective (natural real-world depth)'}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              disabled={isStereoActive}
              onClick={toggleOrthographic}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                opacity: isStereoActive ? 0.5 : 1
              }}
              title={isStereoActive ? 'Stereoscopic modes require Perspective projection' : 'Switch camera projection'}
            >
              {isOrthographic ? 'Orthographic' : 'Perspective'}
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};

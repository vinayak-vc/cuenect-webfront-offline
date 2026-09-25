import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Sparkles, Square, Check } from 'lucide-react';
import { useStage } from '../../context/StageContext';
import {
  EnvironmentPreset,
  EnvironmentPresetLabels,
  EnvironmentPresetShortLabels,
  EnvironmentPresetDescriptions
} from '../../types/protocol';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { BottomSheet } from './BottomSheet';

interface EnvironmentOption {
  preset: EnvironmentPreset;
  icon: React.ReactNode;
}

const OPTIONS: EnvironmentOption[] = [
  {
    preset: EnvironmentPreset.Void,
    icon: <Square size={16} />
  },
  {
    preset: EnvironmentPreset.Space,
    icon: <Sparkles size={16} />
  }
];

/**
 * Stage environment control: the black void the stage shipped with, or space.
 *
 * Deliberately the same shape, markup and CSS classes as ProjectionSelector -
 * desktop popover, mobile bottom sheet - because the two sit next to each other in
 * the header and an operator should not have to learn two controls.
 *
 * The descriptions come from the protocol module rather than being written here, so
 * the wire contract and the words an operator reads cannot drift apart.
 */
export const EnvironmentSelector: React.FC = () => {
  const { environmentPreset, setEnvironmentPreset } = useStage();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close the desktop popover on outside click / Escape.
  useEffect(() => {
    if (!open || isMobile) return;

    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, isMobile]);

  const select = (preset: EnvironmentPreset) => {
    setEnvironmentPreset(preset);
    setOpen(false);
  };

  const optionList = (
    <div role="listbox" aria-label="Environment">
      {OPTIONS.map((opt) => (
        <button
          key={opt.preset}
          type="button"
          role="option"
          aria-selected={environmentPreset === opt.preset}
          className="projection-option"
          onClick={() => select(opt.preset)}
        >
          <span className="projection-option-icon">{opt.icon}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="projection-option-name" style={{ display: 'block' }}>
              {EnvironmentPresetLabels[opt.preset]}
            </span>
            <span className="projection-option-desc">{EnvironmentPresetDescriptions[opt.preset]}</span>
          </span>
          {environmentPreset === opt.preset && (
            <Check size={16} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 6 }} />
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="projection-control" ref={wrapRef}>
      <button
        type="button"
        className="projection-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Environment"
      >
        <span className="projection-trigger-label">
          <span className="projection-trigger-caption">Environment</span>
          <span className="projection-trigger-value">
            <span className="label-full">{EnvironmentPresetLabels[environmentPreset]}</span>
            <span className="label-short">{EnvironmentPresetShortLabels[environmentPreset]}</span>
          </span>
        </span>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
      </button>

      {open && !isMobile && <div className="projection-menu">{optionList}</div>}

      {isMobile && (
        <BottomSheet
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Environment"
          subtitle="What the loaded asset is shown against"
        >
          {optionList}
        </BottomSheet>
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Monitor, Layers, Box, Check } from 'lucide-react';
import { useStage } from '../../context/StageContext';
import { DisplayMode, DisplayModeLabels } from '../../types/protocol';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { BottomSheet } from './BottomSheet';

interface ProjectionOption {
  mode: DisplayMode;
  icon: React.ReactNode;
  desc: string;
}

const OPTIONS: ProjectionOption[] = [
  {
    mode: DisplayMode.Mono2D,
    icon: <Monitor size={16} />,
    desc: 'Single camera, no stereo separation.'
  },
  {
    mode: DisplayMode.StereoSbs,
    icon: <Layers size={16} />,
    desc: 'Side-by-side stereo pair rendered on the stage.'
  },
  {
    mode: DisplayMode.HoloDevice,
    icon: <Box size={16} />,
    desc: 'Axiom HOLO device with tracked per-eye rendering.'
  }
];

/**
 * Custom projection-mode control replacing the native <select>.
 *
 * Desktop: a popover listbox anchored to the trigger.
 * Mobile: a bottom sheet, so the options land in thumb reach.
 * Both paths are keyboard operable and share one state source.
 */
export const ProjectionSelector: React.FC = () => {
  const { displayMode, setDisplayMode } = useStage();
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

  const select = (mode: DisplayMode) => {
    setDisplayMode(mode);
    setOpen(false);
  };

  const optionList = (
    <div role="listbox" aria-label="Projection mode">
      {OPTIONS.map((opt) => (
        <button
          key={opt.mode}
          type="button"
          role="option"
          aria-selected={displayMode === opt.mode}
          className="projection-option"
          onClick={() => select(opt.mode)}
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
  );

  return (
    <div className="projection-control" ref={wrapRef}>
      <button
        type="button"
        className="projection-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Stage projection mode"
      >
        <span className="projection-trigger-label">
          <span className="projection-trigger-caption">Projection</span>
          <span className="projection-trigger-value">{DisplayModeLabels[displayMode]}</span>
        </span>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
      </button>

      {open && !isMobile && <div className="projection-menu">{optionList}</div>}

      {isMobile && (
        <BottomSheet
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Projection Mode"
          subtitle="How the stage renders the loaded asset"
        >
          {optionList}
        </BottomSheet>
      )}
    </div>
  );
};

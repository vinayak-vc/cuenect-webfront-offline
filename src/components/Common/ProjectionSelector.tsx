import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useStage } from '../../context/StageContext';
import { DisplayModeShortLabels } from '../../types/protocol';
import { PresentationPanel } from '../Presentation/PresentationPanel';

interface ProjectionSelectorProps {
  labelPrefix?: string;
  className?: string;
}

/**
 * Canonical Projection Selector Pill:
 * Displays the current projection mode (2D, SBS, HOLO, FMAX)
 * and triggers the unified PresentationPanel when clicked.
 */
export const ProjectionSelector: React.FC<ProjectionSelectorProps> = ({
  labelPrefix = 'Mode:',
  className
}) => {
  const { displayMode } = useStage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`status-pill ${className || ''}`}
        onClick={() => setIsOpen(true)}
        title="Change Presentation Mode (2D / SBS / HOLO / FMAX)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          height: 36,
          padding: '0 12px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--surface-1)',
          border: '1px solid var(--line-subtle)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        <span
          style={{
            fontSize: '0.66rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            fontWeight: 600
          }}
        >
          {labelPrefix}
        </span>
        <span
          style={{
            fontSize: '0.80rem',
            fontWeight: 700,
            color: 'var(--accent-signature)'
          }}
        >
          {DisplayModeShortLabels[displayMode] || '2D'}
        </span>
        <ChevronDown size={13} style={{ color: 'var(--text-muted)', marginLeft: 2 }} />
      </button>

      <PresentationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { useStage } from '../../context/StageContext';
import { Monitor } from 'lucide-react';
import StageStatusPopover from './StageStatusPopover';

/**
 * Compact Stage Status & Targeting Trigger in the Header.
 * Replaces the old permanent full-width Stage Director strip per UX-219.
 */
export const StageStatusTrigger: React.FC = () => {
  const { stages, selectedStageIds } = useStage();

  const onlineStages = stages.filter((s) => s.online);
  const selectedOnlineCount = onlineStages.filter((s) => selectedStageIds.has(s.stageId)).length;
  const isTargeted = selectedOnlineCount > 0;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className="stage-trigger"
        onClick={toggleOpen}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title={`Stage Status: ${selectedOnlineCount} of ${onlineStages.length} targeted (${stages.length} total)`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          height: 36,
          minWidth: 44,
          padding: '0 12px',
          borderRadius: 'var(--radius-full)',
          background: isTargeted ? 'rgba(100, 197, 190, 0.12)' : 'var(--surface-1)',
          border: isTargeted ? '1px solid var(--accent-signature)' : '1px solid var(--line-subtle)',
          color: isTargeted ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: onlineStages.length > 0 ? 'var(--color-live)' : 'var(--text-muted)',
            boxShadow: onlineStages.length > 0 ? '0 0 6px var(--color-live)' : 'none',
            flexShrink: 0
          }}
        />
        <Monitor size={15} style={{ color: isTargeted ? 'var(--accent-signature)' : 'inherit' }} />
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: isTargeted ? 'var(--accent-signature)' : 'var(--text-primary)'
          }}
        >
          {onlineStages.length === 0 ? '0' : `${selectedOnlineCount}/${onlineStages.length}`}
        </span>
      </button>

      {isOpen && <StageStatusPopover onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export default StageStatusTrigger;

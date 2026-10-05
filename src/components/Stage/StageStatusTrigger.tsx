import React, { useState, useRef, useEffect } from 'react';
import { useStage } from '../../context/StageContext';
import { Monitor } from 'lucide-react';
import StageStatusPopover from './StageStatusPopover';

/**
 * Compact stage status trigger displayed in the header.
 * Shows a summary of online / targeted stages and opens a lightweight pop‑over
 * with detailed stage controls.
 */
const StageStatusTrigger: React.FC = () => {
  const {
    stages,
    selectedStageIds,
    toggleStageSelection,
    selectAllStages,
    clearStageSelection,
    setIsStageDirectorOpen,
  } = useStage();

  const onlineStages = stages.filter((s) => s.online);
  const selectedOnlineCount = onlineStages.filter((s) => selectedStageIds.has(s.stageId)).length;

  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const toggleOpen = () => setOpen((prev) => !prev);

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        className="stage-trigger btn-icon"
        onClick={toggleOpen}
        aria-haspopup="true"
        aria-expanded={open}
        title={`Stage status – ${selectedOnlineCount}/${onlineStages.length} targeted`}
        style={{
          position: 'relative',
          background: 'var(--surface-2)',
          border: '1px solid var(--line-subtle)',
          color: selectedOnlineCount > 0 ? 'var(--accent-signature)' : 'var(--text-muted)',
          borderRadius: 'var(--radius-pill)',
          padding: '3px 10px',
          fontSize: '0.74rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          minWidth: 44,
          height: 44,
        }}
      >
        <Monitor size={17} />
        <span>{selectedOnlineCount}/{onlineStages.length}</span>
      </button>
      {open && (
        <StageStatusPopover
          anchorEl={buttonRef.current}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default StageStatusTrigger;

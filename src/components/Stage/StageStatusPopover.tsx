// StageStatusPopover – lightweight pop‑over for stage status
import React, { useEffect } from 'react';
import { useStage } from '../../context/StageContext';
import { Check } from 'lucide-react';

interface Props {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const StageStatusPopover: React.FC<Props> = ({ anchorEl, onClose }) => {
  const {
    stages,
    selectedStageIds,
    toggleStageSelection,
    setIsStageDirectorOpen,
  } = useStage();

  const onlineStages = stages.filter((s) => s.online);

  // focus on first button when opened
  useEffect(() => {
    const firstBtn = anchorEl?.nextElementSibling?.querySelector('button');
    (firstBtn as HTMLElement | null)?.focus();
    // close on Escape
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [anchorEl, onClose]);

  const openMatrix = () => {
    setIsStageDirectorOpen(true);
    onClose();
  };

  // position under the anchor button
  const style = anchorEl
    ? {
        position: 'absolute',
        top: anchorEl.getBoundingClientRect().bottom + window.scrollY + 4,
        left: anchorEl.getBoundingClientRect().left + window.scrollX,
      }
    : {};

  return (
    <div className="stage-popover" style={style} role="menu" aria-label="Stage status">
      <div className="stage-header">STAGES {onlineStages.length}/{stages.length}</div>
      {onlineStages.map((stage) => {
        const isSelected = selectedStageIds.has(stage.stageId);
        return (
          <button
            key={stage.stageId}
            className="stage-row"
            role="menuitemcheckbox"
            aria-checked={isSelected}
            onClick={() => toggleStageSelection(stage.stageId)}
          >
            <span
              className="stage-dot"
              style={{
                background: stage.online ? 'var(--color-live)' : 'var(--text-muted)',
                width: 8,
                height: 8,
                borderRadius: '50%',
                marginRight: 6,
              }}
            />
            <span>{stage.displayName || stage.stageId}</span>
            {isSelected && <Check size={12} style={{ marginLeft: 'auto' }} />}
          </button>
        );
      })}
      <button className="stage-matrix-link" onClick={openMatrix}>
        Manage Stage Matrix →
      </button>
    </div>
  );
};

export default StageStatusPopover;

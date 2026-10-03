import React from 'react';
import { useStage } from '../../context/StageContext';
import { Monitor, Check, SlidersHorizontal } from 'lucide-react';

export const StageDirectorBar: React.FC = () => {
  const {
    stages,
    selectedStageIds,
    toggleStageSelection,
    selectAllStages,
    clearStageSelection,
    setIsStageDirectorOpen
  } = useStage();

  if (!stages || stages.length === 0) {
    return null;
  }

  const onlineStages = stages.filter((s) => s.online);
  const isAllSelected =
    onlineStages.length > 0 && onlineStages.every((s) => selectedStageIds.has(s.stageId));

  return (
    <div
      style={{
        background: 'var(--surface-nav)',
        borderBottom: '1px solid var(--line-subtle)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '6px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        zIndex: 900,
        position: 'sticky',
        top: 0
      }}
    >
      {/* Left: Summary Title and All button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--color-primary)',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.08em'
          }}
        >
          <Monitor size={15} />
          <span>STAGES</span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isAllSelected) {
              clearStageSelection();
            } else {
              selectAllStages();
            }
          }}
          style={{
            background: isAllSelected ? 'rgba(100, 197, 190, 0.15)' : 'var(--surface-2)',
            border: isAllSelected ? '1px solid var(--line-interactive)' : '1px solid var(--line-subtle)',
            color: isAllSelected ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderRadius: 'var(--radius-pill)',
            padding: '3px 10px',
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all 0.15s ease'
          }}
          title={isAllSelected ? 'Deselect all stages' : 'Select all online stages'}
        >
          {isAllSelected && <Check size={12} />}
          <span>All ({onlineStages.length})</span>
        </button>
      </div>

      {/* Center: Scrollable Stage Chips */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          padding: '2px 0',
          flex: 1
        }}
      >
        {stages.map((stage) => {
          const isSelected = selectedStageIds.has(stage.stageId);
          return (
            <button
              key={stage.stageId}
              type="button"
              onClick={() => toggleStageSelection(stage.stageId)}
              style={{
                background: isSelected
                  ? 'rgba(100, 197, 190, 0.14)'
                  : 'var(--surface-1)',
                border: isSelected
                  ? '1px solid var(--line-interactive)'
                  : '1px solid var(--line-subtle)',
                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-pill)',
                padding: '3px 10px',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                boxShadow: isSelected ? '0 0 10px rgba(100, 197, 190, 0.2)' : 'none',
                opacity: stage.online ? 1 : 0.45,
                transition: 'all 0.15s ease'
              }}
              title={`${stage.displayName} (${stage.stageId}) - ${stage.online ? 'Online' : 'Offline'}${stage.currentModel ? ` | Model: ${stage.currentModel}` : ''}`}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: stage.online ? 'var(--color-live)' : 'var(--text-muted)',
                  boxShadow: stage.online ? '0 0 6px var(--color-live)' : 'none'
                }}
              />
              <span style={{ fontWeight: 600 }}>{stage.displayName || stage.stageId}</span>
              {stage.currentModel && (
                <span
                  style={{
                    background: 'rgba(100, 197, 190, 0.12)',
                    color: 'var(--color-primary)',
                    padding: '1px 5px',
                    borderRadius: 4,
                    fontSize: '0.68rem',
                    maxWidth: 90,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {stage.currentModel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right: Full Director Button */}
      <button
        type="button"
        onClick={() => setIsStageDirectorOpen(true)}
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--line-subtle)',
          color: 'var(--text-secondary)',
          borderRadius: 'var(--radius-pill)',
          padding: '3px 10px',
          fontSize: '0.74rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0
        }}
        title="Open Stage Director Matrix"
      >
        <SlidersHorizontal size={13} />
        <span className="hide-on-mobile">Matrix</span>
        <span
          style={{
            background: 'rgba(100, 197, 190, 0.2)',
            color: 'var(--color-primary)',
            padding: '1px 6px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '0.7rem',
            fontWeight: 700
          }}
        >
          {selectedStageIds.size}/{onlineStages.length}
        </span>
      </button>
    </div>
  );
};

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
        background: 'rgba(10, 15, 29, 0.95)',
        borderBottom: '1px solid rgba(0, 229, 255, 0.2)',
        backdropFilter: 'blur(12px)',
        padding: '8px 16px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#00e5ff', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.05em' }}>
          <Monitor size={16} />
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
            background: isAllSelected ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: isAllSelected ? '1px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.15)',
            color: isAllSelected ? '#00e5ff' : '#94a3b8',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: '0.78rem',
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
                  ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.18), rgba(15, 23, 42, 0.9))'
                  : 'rgba(15, 23, 42, 0.6)',
                border: isSelected
                  ? '1px solid rgba(0, 229, 255, 0.75)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                color: isSelected ? '#ffffff' : '#94a3b8',
                borderRadius: 8,
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                boxShadow: isSelected ? '0 0 10px rgba(0, 229, 255, 0.25)' : 'none',
                opacity: stage.online ? 1 : 0.45,
                transition: 'all 0.15s ease'
              }}
              title={`${stage.displayName} (${stage.stageId}) - ${stage.online ? 'Online' : 'Offline'}${stage.currentModel ? ` | Model: ${stage.currentModel}` : ''}`}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: stage.online ? '#22c55e' : '#64748b',
                  boxShadow: stage.online ? '0 0 6px #22c55e' : 'none'
                }}
              />
              <span style={{ fontWeight: 600 }}>{stage.displayName || stage.stageId}</span>
              {stage.currentModel && (
                <span
                  style={{
                    background: 'rgba(0, 229, 255, 0.15)',
                    color: '#00e5ff',
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
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#cbd5e1',
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0
        }}
        title="Open Stage Director Matrix"
      >
        <SlidersHorizontal size={14} />
        <span className="hide-on-mobile">Matrix</span>
        <span
          style={{
            background: 'rgba(0, 229, 255, 0.25)',
            color: '#00e5ff',
            padding: '0 5px',
            borderRadius: 10,
            fontSize: '0.72rem'
          }}
        >
          {selectedStageIds.size}/{onlineStages.length}
        </span>
      </button>
    </div>
  );
};

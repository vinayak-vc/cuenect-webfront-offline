import React, { useState, useMemo } from 'react';
import { useStage } from '../../context/StageContext';
import { Modal } from '../Common/Modal';
import {
  Check,
  Search,
  Box,
  CheckSquare,
  Square,
  RefreshCw
} from 'lucide-react';

export const StageDirectorModal: React.FC = () => {
  const {
    stages,
    selectedStageIds,
    toggleStageSelection,
    selectAllStages,
    clearStageSelection,
    setSelectedStageIds,
    selectStageGroup,
    isStageDirectorOpen,
    setIsStageDirectorOpen
  } = useStage();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');

  // Discover all distinct groups across registered stages
  const groups = useMemo(() => {
    const set = new Set<string>();
    stages.forEach((s) => {
      if (s.group) set.add(s.group);
    });
    return ['All', ...Array.from(set)];
  }, [stages]);

  // Filter stages by search and group
  const filteredStages = useMemo(() => {
    return stages.filter((stage) => {
      const matchSearch =
        !searchQuery ||
        stage.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stage.stageId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (stage.currentModel && stage.currentModel.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchGroup = selectedGroup === 'All' || stage.group === selectedGroup;

      return matchSearch && matchGroup;
    });
  }, [stages, searchQuery, selectedGroup]);

  const onlineCount = stages.filter((s) => s.online).length;

  const handleInvert = () => {
    const next = new Set<string>();
    stages.filter((s) => s.online).forEach((s) => {
      if (!selectedStageIds.has(s.stageId)) {
        next.add(s.stageId);
      }
    });
    setSelectedStageIds(next);
  };

  const handleSolo = (stageId: string) => {
    setSelectedStageIds([stageId]);
  };

  return (
    <Modal
      isOpen={isStageDirectorOpen}
      onClose={() => setIsStageDirectorOpen(false)}
      title="Stage Director & Screen Matrix"
      maxWidth="720px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Targeting <strong style={{ color: 'var(--color-primary)' }}>{selectedStageIds.size}</strong> of {onlineCount} online stages
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: '8px 20px', borderRadius: 'var(--radius-pill)' }}
            onClick={() => setIsStageDirectorOpen(false)}
          >
            Apply & Close
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Controls Bar: Search & Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--surface-sunken)',
              border: '1px solid var(--line-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              gap: 8,
              flex: '1 1 200px'
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search stage or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                width: '100%'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={selectAllStages}
            >
              <CheckSquare size={14} />
              <span>Select All</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={clearStageSelection}
            >
              <Square size={14} />
              <span>Clear</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={handleInvert}
            >
              <RefreshCw size={14} />
              <span>Invert</span>
            </button>
          </div>
        </div>

        {/* Group Selector Chips (if multiple groups exist) */}
        {groups.length > 2 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {groups.map((group) => {
              const isActive = selectedGroup === group;
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => {
                    setSelectedGroup(group);
                    if (group !== 'All') {
                      selectStageGroup(group);
                    }
                  }}
                  style={{
                    background: isActive ? 'rgba(100, 197, 190, 0.18)' : 'var(--surface-1)',
                    border: isActive ? '1px solid var(--line-interactive)' : '1px solid var(--line-subtle)',
                    color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '4px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {group}
                </button>
              );
            })}
          </div>
        )}

        {/* Stage Cards Matrix Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
            maxHeight: '420px',
            overflowY: 'auto',
            paddingRight: 4
          }}
        >
          {filteredStages.map((stage) => {
            const isSelected = selectedStageIds.has(stage.stageId);
            return (
              <div
                key={stage.stageId}
                onClick={() => toggleStageSelection(stage.stageId)}
                style={{
                  background: isSelected
                    ? 'rgba(100, 197, 190, 0.1)'
                    : 'var(--surface-1)',
                  border: isSelected
                    ? '1px solid var(--line-interactive)'
                    : '1px solid var(--line-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  cursor: 'pointer',
                  position: 'relative',
                  opacity: stage.online ? 1 : 0.5,
                  boxShadow: isSelected ? '0 0 12px rgba(100, 197, 190, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Header: Checkbox + Name + Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--line-subtle)',
                        background: isSelected ? 'var(--color-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {isSelected && <Check size={12} color="#041017" strokeWidth={3} />}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {stage.displayName || stage.stageId}
                    </div>
                  </div>

                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: stage.online ? 'var(--color-live)' : 'var(--text-muted)',
                      boxShadow: stage.online ? '0 0 6px var(--color-live)' : 'none'
                    }}
                    title={stage.online ? 'Online' : 'Offline'}
                  />
                </div>

                {/* Subtitle / ID & Group */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>ID: {stage.stageId}</span>
                  {stage.group && <span>Group: {stage.group}</span>}
                </div>

                {/* Current Active Model */}
                <div
                  style={{
                    background: 'var(--surface-sunken)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.75rem',
                    color: stage.currentModel ? 'var(--color-primary)' : 'var(--text-muted)'
                  }}
                >
                  <Box size={14} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {stage.currentModel || 'No active model'}
                  </span>
                </div>

                {/* Footer: Mode badge & Solo button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      background: 'var(--surface-2)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Mode: {stage.displayMode || '2D'}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSolo(stage.stageId);
                    }}
                    style={{
                      background: 'rgba(100, 197, 190, 0.1)',
                      border: '1px solid rgba(100, 197, 190, 0.3)',
                      color: 'var(--color-primary)',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title="Control only this stage"
                  >
                    Solo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

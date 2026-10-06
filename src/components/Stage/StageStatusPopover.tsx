import React, { useEffect, useRef } from 'react';
import { useStage } from '../../context/StageContext';
import { Check, SlidersHorizontal, X } from 'lucide-react';

interface StageStatusPopoverProps {
  onClose: () => void;
}

/**
 * Lightweight Popover for Stage Status & Quick Targeting.
 * Rendered from the compact StageStatusTrigger in the header.
 */
export const StageStatusPopover: React.FC<StageStatusPopoverProps> = ({ onClose }) => {
  const {
    stages,
    selectedStageIds,
    toggleStageSelection,
    selectAllStages,
    clearStageSelection,
    setIsStageDirectorOpen
  } = useStage();

  const popoverRef = useRef<HTMLDivElement>(null);

  const onlineStages = stages.filter((s) => s.online);
  const selectedOnlineCount = onlineStages.filter((s) => selectedStageIds.has(s.stageId)).length;
  const isAllSelected = onlineStages.length > 0 && selectedOnlineCount === onlineStages.length;

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleOpenMatrix = () => {
    setIsStageDirectorOpen(true);
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Stage Targeting and Status"
      className="stage-popover"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        zIndex: 1200,
        width: 320,
        maxWidth: '90vw',
        background: 'rgba(12, 17, 26, 0.98)',
        border: '1px solid var(--line-subtle)',
        borderRadius: 'var(--radius-medium, 12px)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--line-subtle)',
          paddingBottom: 8
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent-signature)'
            }}
          >
            Stage Targeting
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {onlineStages.length === 0
              ? 'No online stages'
              : `${selectedOnlineCount} of ${onlineStages.length} targeted`}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {onlineStages.length > 1 && (
            <button
              type="button"
              onClick={() => (isAllSelected ? clearStageSelection() : selectAllStages())}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--line-subtle)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-pill)',
                padding: '2px 8px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isAllSelected ? 'Clear' : 'Select All'}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close stage menu"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
              borderRadius: 6
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Stage list */}
      <div
        style={{
          maxHeight: 240,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}
      >
        {stages.length === 0 ? (
          <div
            style={{
              padding: '16px 8px',
              textAlign: 'center',
              fontSize: '0.76rem',
              color: 'var(--text-muted)'
            }}
          >
            No stages connected. Start a stage client to control holograms.
          </div>
        ) : (
          stages.map((stage) => {
            const isTargeted = selectedStageIds.has(stage.stageId);
            const isOnline = stage.online;

            return (
              <div
                key={stage.stageId}
                onClick={() => {
                  if (isOnline) {
                    toggleStageSelection(stage.stageId);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: 8,
                  background: isTargeted
                    ? 'rgba(100, 197, 190, 0.12)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isTargeted
                    ? '1px solid rgba(100, 197, 190, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  cursor: isOnline ? 'pointer' : 'not-allowed',
                  opacity: isOnline ? 1 : 0.5,
                  transition: 'all 0.15s ease'
                }}
                title={
                  isOnline
                    ? `${stage.displayName || stage.stageId} - Click to toggle target`
                    : `${stage.displayName || stage.stageId} - Offline`
                }
              >
                {/* Left: Indicator dot + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: isOnline ? 'var(--color-live)' : 'var(--text-muted)',
                      boxShadow: isOnline ? '0 0 6px var(--color-live)' : 'none',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: isOnline ? 'var(--text-primary)' : 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {stage.displayName || stage.stageId}
                    </span>
                    {stage.currentModel && (
                      <span
                        style={{
                          fontSize: '0.66rem',
                          color: 'var(--accent-signature)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Model: {stage.currentModel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Targeted status badge / check */}
                {isOnline && (
                  <div style={{ flexShrink: 0, marginLeft: 8 }}>
                    {isTargeted ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          background: 'rgba(100, 197, 190, 0.25)',
                          color: 'var(--accent-signature)',
                          padding: '2px 7px',
                          borderRadius: 999,
                          fontSize: '0.66rem',
                          fontWeight: 700
                        }}
                      >
                        <Check size={11} />
                        Targeted
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          color: 'var(--text-muted)',
                          fontSize: '0.66rem',
                          padding: '2px 6px'
                        }}
                      >
                        Online
                      </span>
                    )}
                  </div>
                )}
                {!isOnline && (
                  <span
                    style={{
                      fontSize: '0.66rem',
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                      marginLeft: 8
                    }}
                  >
                    Offline
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer: Manage Stage Matrix link */}
      <div
        style={{
          borderTop: '1px solid var(--line-subtle)',
          paddingTop: 8,
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        <button
          type="button"
          onClick={handleOpenMatrix}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 'none',
            color: 'var(--accent-signature)',
            fontSize: '0.74rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: 6,
            transition: 'opacity 0.15s ease'
          }}
        >
          <SlidersHorizontal size={13} />
          <span>Manage Stage Matrix →</span>
        </button>
      </div>
    </div>
  );
};

export default StageStatusPopover;

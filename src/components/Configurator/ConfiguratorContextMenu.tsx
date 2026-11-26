import React, { useEffect, useRef } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Copy,
  Trash2,
  Lock,
  Unlock,
  FlipHorizontal,
  FlipVertical,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Star,
  Heart,
  Maximize2,
  ZoomIn,
  ZoomOut,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  RefreshCw,
  Edit3,
  Layers
} from 'lucide-react';
import { ConfiguratorLayer } from './types';

export interface ConfiguratorContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  targetLayer: ConfiguratorLayer | null;
  selectedCount: number;
  onClose: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDuplicate: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onAlign?: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onReplacePhoto?: () => void;
  onEditText?: () => void;
  onAddText: () => void;
  onAddShape: (type: 'rectangle' | 'circle' | 'star' | 'heart') => void;
  onChangeBackground: () => void;
  onFitToScreen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSelectAll: () => void;
}

export const ConfiguratorContextMenu: React.FC<ConfiguratorContextMenuProps> = ({
  isOpen,
  position,
  targetLayer,
  selectedCount,
  onClose,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onToggleLock,
  onDelete,
  onFlipHorizontal,
  onFlipVertical,
  onAlign,
  onReplacePhoto,
  onEditText,
  onAddText,
  onAddShape,
  onChangeBackground,
  onFitToScreen,
  onZoomIn,
  onZoomOut,
  onSelectAll
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-position to stay strictly on screen
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const el = menuRef.current;
    const rect = el.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    let adjustedX = position.x;
    let adjustedY = position.y;

    if (adjustedX + rect.width > winW - 12) {
      adjustedX = Math.max(12, winW - rect.width - 12);
    }
    if (adjustedY + rect.height > winH - 12) {
      adjustedY = Math.max(12, winH - rect.height - 12);
    }

    el.style.left = `${adjustedX}px`;
    el.style.top = `${adjustedY}px`;
  }, [isOpen, position]);

  // Close on outside click or escape
  useEffect(() => {
    if (!isOpen) return;
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '7px 12px',
    background: 'none',
    border: 'none',
    color: '#E0E0E0',
    fontSize: '0.8rem',
    cursor: 'pointer',
    textAlign: 'left',
    borderRadius: 4,
    transition: 'background 0.1s ease'
  };

  const dividerStyle: React.CSSProperties = {
    height: 1,
    background: '#333333',
    margin: '4px 0'
  };

  const shortcutStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    color: '#777777',
    marginLeft: 16
  };

  const hoverIn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#0D99FF';
    e.currentTarget.style.color = '#FFFFFF';
    const s = e.currentTarget.querySelector('.menu-shortcut') as HTMLElement;
    if (s) s.style.color = 'rgba(255,255,255,0.8)';
  };

  const hoverOut = (e: React.MouseEvent<HTMLButtonElement>, defaultColor = '#E0E0E0') => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = defaultColor;
    const s = e.currentTarget.querySelector('.menu-shortcut') as HTMLElement;
    if (s) s.style.color = '#777777';
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 100000,
        backgroundColor: '#1E1E1E',
        border: '1px solid #383838',
        borderRadius: 8,
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65), 0 2px 6px rgba(0, 0, 0, 0.4)',
        minWidth: 220,
        padding: '5px',
        color: '#E0E0E0',
        fontFamily: 'Inter, system-ui, sans-serif',
        userSelect: 'none'
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ── CASE A: LAYER(S) SELECTED ── */}
      {targetLayer ? (
        <>
          {/* Header Tag */}
          <div
            style={{
              padding: '4px 10px 6px 10px',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#0D99FF',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Layers size={13} />
            <span>
              {selectedCount > 1
                ? `${selectedCount} Layers Selected`
                : targetLayer.name || targetLayer.type}
            </span>
          </div>

          <div style={dividerStyle} />

          {/* Quick Context Actions */}
          {targetLayer.type === 'text' && onEditText && (
            <button
              style={itemStyle}
              onClick={() => {
                onClose();
                onEditText();
              }}
              onMouseEnter={hoverIn}
              onMouseLeave={(e) => hoverOut(e)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={14} color="#0D99FF" />
                <span>Edit Text</span>
              </span>
              <span className="menu-shortcut" style={shortcutStyle}>Double click</span>
            </button>
          )}

          {targetLayer.type === 'image' && onReplacePhoto && (
            <button
              style={itemStyle}
              onClick={() => {
                onClose();
                onReplacePhoto();
              }}
              onMouseEnter={hoverIn}
              onMouseLeave={(e) => hoverOut(e)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={14} color="#0D99FF" />
                <span>Replace Photo...</span>
              </span>
            </button>
          )}

          {/* Layer Ordering */}
          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onBringForward();
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowUp size={14} />
              <span>Bring Forward</span>
            </span>
            <span className="menu-shortcut" style={shortcutStyle}>Ctrl + ]</span>
          </button>

          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onSendBackward();
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowDown size={14} />
              <span>Send Backward</span>
            </span>
            <span className="menu-shortcut" style={shortcutStyle}>Ctrl + [</span>
          </button>

          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onBringToFront();
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ChevronsUp size={14} />
              <span>Bring to Front</span>
            </span>
            <span className="menu-shortcut" style={shortcutStyle}>Ctrl + Shift + ]</span>
          </button>

          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onSendToBack();
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ChevronsDown size={14} />
              <span>Send to Back</span>
            </span>
            <span className="menu-shortcut" style={shortcutStyle}>Ctrl + Shift + [</span>
          </button>

          <div style={dividerStyle} />

          {/* Transform & Flipping */}
          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onFlipHorizontal();
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FlipHorizontal size={14} />
              <span>Flip Horizontal</span>
            </span>
          </button>

          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onFlipVertical();
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FlipVertical size={14} />
              <span>Flip Vertical</span>
            </span>
          </button>

          {/* Alignments (if multi-selected or alignment is provided) */}
          {onAlign && (
            <>
              <div style={dividerStyle} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px'
                }}
              >
                <span style={{ fontSize: '0.72rem', color: '#888888' }}>Align</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => {
                      onClose();
                      onAlign('left');
                    }}
                    title="Align Left"
                    style={{ background: '#2B2B2B', border: '1px solid #3E3E3E', color: '#CCC', padding: 4, borderRadius: 4, cursor: 'pointer' }}
                  >
                    <AlignLeft size={13} />
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onAlign('center');
                    }}
                    title="Align Center"
                    style={{ background: '#2B2B2B', border: '1px solid #3E3E3E', color: '#CCC', padding: 4, borderRadius: 4, cursor: 'pointer' }}
                  >
                    <AlignCenter size={13} />
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onAlign('right');
                    }}
                    title="Align Right"
                    style={{ background: '#2B2B2B', border: '1px solid #3E3E3E', color: '#CCC', padding: 4, borderRadius: 4, cursor: 'pointer' }}
                  >
                    <AlignRight size={13} />
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onAlign('top');
                    }}
                    title="Align Top"
                    style={{ background: '#2B2B2B', border: '1px solid #3E3E3E', color: '#CCC', padding: 4, borderRadius: 4, cursor: 'pointer' }}
                  >
                    <AlignStartVertical size={13} />
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onAlign('middle');
                    }}
                    title="Align Middle"
                    style={{ background: '#2B2B2B', border: '1px solid #3E3E3E', color: '#CCC', padding: 4, borderRadius: 4, cursor: 'pointer' }}
                  >
                    <AlignCenterVertical size={13} />
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onAlign('bottom');
                    }}
                    title="Align Bottom"
                    style={{ background: '#2B2B2B', border: '1px solid #3E3E3E', color: '#CCC', padding: 4, borderRadius: 4, cursor: 'pointer' }}
                  >
                    <AlignEndVertical size={13} />
                  </button>
                </div>
              </div>
            </>
          )}

          <div style={dividerStyle} />

          {/* Duplicate, Lock, Delete */}
          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onDuplicate();
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Copy size={14} />
              <span>Duplicate</span>
            </span>
            <span className="menu-shortcut" style={shortcutStyle}>Ctrl + D</span>
          </button>

          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onToggleLock();
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {targetLayer.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
              <span>{targetLayer.isLocked ? 'Unlock Layer' : 'Lock Layer'}</span>
            </span>
            <span className="menu-shortcut" style={shortcutStyle}>Ctrl + L</span>
          </button>

          <button
            style={{ ...itemStyle, color: '#EF4444' }}
            onClick={() => {
              onClose();
              onDelete();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EF4444';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => hoverOut(e, '#EF4444')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trash2 size={14} />
              <span>Delete</span>
            </span>
            <span className="menu-shortcut" style={shortcutStyle}>Del</span>
          </button>
        </>
      ) : (
        /* ── CASE B: EMPTY CANVAS CLICKED ── */
        <>
          <div
            style={{
              padding: '4px 10px 6px 10px',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Canvas Actions
          </div>

          <div style={dividerStyle} />

          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onAddText();
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Type size={14} color="#0D99FF" />
              <span>Add Text</span>
            </span>
            <span className="menu-shortcut" style={shortcutStyle}>T</span>
          </button>

          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onAddShape('rectangle');
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Square size={14} color="#FACC15" />
              <span>Add Rectangle</span>
            </span>
            <span className="menu-shortcut" style={shortcutStyle}>R</span>
          </button>

          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onAddShape('circle');
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Circle size={14} color="#38BDF8" />
              <span>Add Circle</span>
            </span>
            <span className="menu-shortcut" style={shortcutStyle}>O</span>
          </button>

          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onAddShape('star');
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star size={14} color="#F43F5E" />
              <span>Add Star</span>
            </span>
          </button>

          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onAddShape('heart');
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Heart size={14} color="#EC4899" />
              <span>Add Heart</span>
            </span>
          </button>

          <div style={dividerStyle} />

          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onChangeBackground();
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ImageIcon size={14} color="#34D399" />
              <span>Change Background...</span>
            </span>
          </button>

          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onSelectAll();
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={14} />
              <span>Select All</span>
            </span>
            <span className="menu-shortcut" style={shortcutStyle}>Ctrl + A</span>
          </button>

          <div style={dividerStyle} />

          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onFitToScreen();
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Maximize2 size={14} color="#0D99FF" />
              <span>Fit to Screen</span>
            </span>
            <span className="menu-shortcut" style={shortcutStyle}>F</span>
          </button>

          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onZoomIn();
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ZoomIn size={14} />
              <span>Zoom In</span>
            </span>
            <span className="menu-shortcut" style={shortcutStyle}>+</span>
          </button>

          <button
            style={itemStyle}
            onClick={() => {
              onClose();
              onZoomOut();
            }}
            onMouseEnter={hoverIn}
            onMouseLeave={(e) => hoverOut(e)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ZoomOut size={14} />
              <span>Zoom Out</span>
            </span>
            <span className="menu-shortcut" style={shortcutStyle}>-</span>
          </button>
        </>
      )}
    </div>
  );
};

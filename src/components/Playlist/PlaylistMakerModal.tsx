import React, { useState, useRef } from 'react';
import { useStage } from '../../context/StageContext';
import { BottomSheet } from '../Common/BottomSheet';
import { Slider } from '../Common/Slider';
import { Play, Trash2, GripVertical, ListPlus, Box } from 'lucide-react';
import { StateView } from '../Common/StateView';

interface PlaylistMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Playlist composition surface: the running order is the content.
 * Reordering uses vertical drag-and-drop with pointer and HTML5 drag support.
 */
export const PlaylistMakerModal: React.FC<PlaylistMakerModalProps> = ({ isOpen, onClose }) => {
  const {
    customPlaylistIds,
    assets,
    thumbnails,
    removeFromCustomPlaylist,
    reorderCustomPlaylist,
    slideDuration,
    setSlideDuration,
    startSlideshow,
    isSlideshowActive,
    slideshowIndex
  } = useStage();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null);

  const playlistAssets = customPlaylistIds
    .map((id) => assets.find((a) => a.AssetID === id))
    .filter((a): a is (typeof assets)[0] => Boolean(a));

  const handleStart = () => {
    startSlideshow(0);
    onClose();
  };

  const totalRuntime = playlistAssets.length * slideDuration;

  // HTML5 Drag and Drop handlers
  const handleDragStart = (idx: number, e: React.DragEvent) => {
    setDraggedIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragOver = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === idx) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? 'above' : 'below';

    if (dragOverIndex !== idx || dropPosition !== pos) {
      setDragOverIndex(idx);
      setDropPosition(pos);
    }
  };

  const handleDrop = (targetIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIdx) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDropPosition(null);
      return;
    }

    const newIds = [...customPlaylistIds];
    const [movedId] = newIds.splice(draggedIndex, 1);

    let insertIdx = targetIdx;
    if (draggedIndex < targetIdx && dropPosition === 'above') {
      insertIdx = targetIdx - 1;
    } else if (draggedIndex > targetIdx && dropPosition === 'below') {
      insertIdx = targetIdx + 1;
    }
    insertIdx = Math.max(0, Math.min(newIds.length, insertIdx));

    newIds.splice(insertIdx, 0, movedId);
    reorderCustomPlaylist(newIds);

    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);
  };

  // Pointer drag for touch devices via the grip handle
  const pointerDragRef = useRef<{
    active: boolean;
    startIndex: number;
    container: HTMLElement | null;
  } | null>(null);

  const handlePointerDown = (idx: number, e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const container = (e.currentTarget as HTMLElement).closest('.playlist-rows-container') as HTMLElement | null;
    pointerDragRef.current = {
      active: true,
      startIndex: idx,
      container
    };
    setDraggedIndex(idx);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerDragRef.current?.active || !pointerDragRef.current.container) return;
    const { startIndex, container } = pointerDragRef.current;
    const clientY = e.clientY;

    const rows = Array.from(container.querySelectorAll('.playlist-row')) as HTMLElement[];
    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i].getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
        if (i !== startIndex) {
          const midY = rect.top + rect.height / 2;
          setDragOverIndex(i);
          setDropPosition(clientY < midY ? 'above' : 'below');
        }
        return;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerDragRef.current?.active) return;
    const { startIndex } = pointerDragRef.current;
    pointerDragRef.current = null;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if not captured
    }

    if (dragOverIndex !== null && dragOverIndex !== startIndex) {
      const newIds = [...customPlaylistIds];
      const [movedId] = newIds.splice(startIndex, 1);

      let insertIdx = dragOverIndex;
      if (startIndex < dragOverIndex && dropPosition === 'above') {
        insertIdx = dragOverIndex - 1;
      } else if (startIndex > dragOverIndex && dropPosition === 'below') {
        insertIdx = dragOverIndex + 1;
      }
      insertIdx = Math.max(0, Math.min(newIds.length, insertIdx));

      newIds.splice(insertIdx, 0, movedId);
      reorderCustomPlaylist(newIds);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      variant="side-drawer"
      title="Playlist"
      subtitle={
        playlistAssets.length > 0
          ? `${playlistAssets.length} items · ${formatRuntime(totalRuntime)} runtime`
          : 'Build an automated sequence'
      }
      footer={
        playlistAssets.length > 0 ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStart}
            style={{ flex: 1, minHeight: 44, padding: '12px 24px', gap: 8, fontSize: '0.88rem', fontWeight: 700 }}
          >
            <Play size={16} fill="currentColor" />
            {isSlideshowActive ? 'Restart Sequence' : 'Play Sequence'}
          </button>
        ) : undefined
      }
    >
      {playlistAssets.length === 0 ? (
        <StateView
          icon={<ListPlus size={26} />}
          title="Playlist is empty"
          description="Add assets with the + button on any catalog tile, then order them here to run an automated sequence."
          actions={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ minHeight: 42, padding: '10px 20px' }}
            >
              Browse Assets
            </button>
          }
        />
      ) : (
        <>
          <Slider
            label="Time per item"
            valueLabel={`${slideDuration}s`}
            value={slideDuration}
            min={1}
            max={60}
            step={1}
            onChange={(v) => setSlideDuration(Math.round(v))}
            scale={['1s', '60s']}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="u-section-label">Running Order</span>
              <span className="u-meta" style={{ fontSize: '0.72rem' }}>Drag handle to reorder</span>
            </div>

            <div className="playlist-rows-container" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {playlistAssets.map((asset, idx) => {
                const thumb = thumbnails[asset.AssetID];
                const isCurrent = isSlideshowActive && slideshowIndex === idx;
                const isDragging = draggedIndex === idx;
                const isDragOver = dragOverIndex === idx;

                return (
                  <div
                    key={asset.AssetID}
                    draggable
                    onDragStart={(e) => handleDragStart(idx, e)}
                    onDragOver={(e) => handleDragOver(idx, e)}
                    onDrop={(e) => handleDrop(idx, e)}
                    onDragEnd={handleDragEnd}
                    className={`playlist-row ${isCurrent ? 'current' : ''} ${
                      isDragging ? 'is-dragging' : ''
                    } ${
                      isDragOver && dropPosition === 'above' ? 'drag-target-above' : ''
                    } ${
                      isDragOver && dropPosition === 'below' ? 'drag-target-below' : ''
                    }`}
                  >
                    <div
                      className="playlist-drag-handle"
                      title="Drag to reorder"
                      onPointerDown={(e) => handlePointerDown(idx, e)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                    >
                      <GripVertical size={16} />
                    </div>

                    <span className="playlist-row-index">{idx + 1}</span>

                    {thumb ? (
                      <img src={thumb} alt="" className="playlist-row-thumb" />
                    ) : (
                      <div
                        className="playlist-row-thumb"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)'
                        }}
                      >
                        <Box size={18} />
                      </div>
                    )}

                    <div className="playlist-row-body">
                      <div className="playlist-row-name">{asset.AssetName}</div>
                      <div className="u-mono" style={{ color: 'var(--text-muted)' }}>
                        {slideDuration}s{isCurrent ? ' · active' : ''}
                      </div>
                    </div>

                    <div className="playlist-row-actions">
                      <button
                        type="button"
                        className="icon-btn-sm danger"
                        onClick={() => removeFromCustomPlaylist(asset.AssetID)}
                        aria-label={`Remove ${asset.AssetName} from playlist`}
                        title="Remove from playlist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </BottomSheet>
  );
};

function formatRuntime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

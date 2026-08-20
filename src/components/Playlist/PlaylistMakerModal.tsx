import React from 'react';
import { useStage } from '../../context/StageContext';
import { BottomSheet } from '../Common/BottomSheet';
import { Slider } from '../Common/Slider';
import { Play, Trash2, ArrowUp, ArrowDown, ListPlus, Box } from 'lucide-react';
import { StateView } from '../Common/StateView';

interface PlaylistMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Playlist composition surface: the running order is the content, so rows carry
 * a preview, position and reorder controls rather than sitting in empty space.
 *
 * Reordering uses explicit up/down buttons - drag-and-drop on a phone in a dark
 * venue is far easier to get wrong than a 34px button.
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

  const playlistAssets = customPlaylistIds
    .map((id) => assets.find((a) => a.AssetID === id))
    .filter((a): a is (typeof assets)[0] => Boolean(a));

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= customPlaylistIds.length) return;

    const newIds = [...customPlaylistIds];
    const [moved] = newIds.splice(index, 1);
    newIds.splice(newIndex, 0, moved);
    reorderCustomPlaylist(newIds);
  };

  const handleStart = () => {
    startSlideshow(0);
    onClose();
  };

  const totalRuntime = playlistAssets.length * slideDuration;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Playlist"
      subtitle={
        playlistAssets.length > 0
          ? `${playlistAssets.length} items · ${formatRuntime(totalRuntime)} runtime`
          : 'Build an automated stage sequence'
      }
      footer={
        playlistAssets.length > 0 ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStart}
            style={{ flex: 1, gap: 8 }}
          >
            <Play size={16} />
            {isSlideshowActive ? 'Restart Sequence' : 'Play Sequence'}
          </button>
        ) : undefined
      }
    >
      {playlistAssets.length === 0 ? (
        <StateView
          icon={<ListPlus size={26} />}
          title="Playlist is empty"
          description="Add assets with the + button on any catalog tile, then order them here to run an automated stage sequence."
          actions={
            <button type="button" className="btn btn-secondary" onClick={onClose}>
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
            <span className="u-section-label">Running Order</span>

            {playlistAssets.map((asset, idx) => {
              const thumb = thumbnails[asset.AssetID];
              const isCurrent = isSlideshowActive && slideshowIndex === idx;

              return (
                <div key={asset.AssetID} className={`playlist-row ${isCurrent ? 'current' : ''}`}>
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
                      {slideDuration}s{isCurrent ? ' · on stage' : ''}
                    </div>
                  </div>

                  <div className="playlist-row-actions">
                    <button
                      type="button"
                      className="icon-btn-sm"
                      disabled={idx === 0}
                      onClick={() => moveItem(idx, 'up')}
                      aria-label={`Move ${asset.AssetName} up`}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn-sm"
                      disabled={idx === playlistAssets.length - 1}
                      onClick={() => moveItem(idx, 'down')}
                      aria-label={`Move ${asset.AssetName} down`}
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn-sm danger"
                      onClick={() => removeFromCustomPlaylist(asset.AssetID)}
                      aria-label={`Remove ${asset.AssetName}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
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

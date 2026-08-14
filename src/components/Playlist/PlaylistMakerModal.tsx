import React from 'react';
import { useStage } from '../../context/StageContext';
import { Modal } from '../Common/Modal';
import { Play, Trash2, ArrowUp, ArrowDown, Timer, ListPlus } from 'lucide-react';

interface PlaylistMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlaylistMakerModal: React.FC<PlaylistMakerModalProps> = ({ isOpen, onClose }) => {
  const {
    customPlaylistIds,
    assets,
    removeFromCustomPlaylist,
    reorderCustomPlaylist,
    slideDuration,
    setSlideDuration,
    startSlideshow
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Custom Playlist Builder" maxWidth="520px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Slide Duration Input */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Timer size={14} />
            Slide Duration (Seconds per item)
          </label>
          <input
            type="number"
            min="1"
            max="120"
            className="form-input"
            value={slideDuration}
            onChange={(e) => setSlideDuration(parseInt(e.target.value, 10) || 5)}
          />
        </div>

        {/* Playlist Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '320px', overflowY: 'auto' }}>
          {playlistAssets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
              <ListPlus size={32} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: '0.85rem' }}>Playlist is empty.</p>
              <p style={{ fontSize: '0.75rem' }}>Click the "+" icon on any asset in the catalog to add it.</p>
            </div>
          ) : (
            playlistAssets.map((asset, idx) => (
              <div
                key={asset.AssetID}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', width: 20 }}>
                  {idx + 1}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {asset.AssetName}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    ID: {asset.AssetID}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    className="btn-icon"
                    style={{ width: 28, height: 28 }}
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, 'up')}
                    title="Move Up"
                  >
                    <ArrowUp size={14} />
                  </button>

                  <button
                    type="button"
                    className="btn-icon"
                    style={{ width: 28, height: 28 }}
                    disabled={idx === playlistAssets.length - 1}
                    onClick={() => moveItem(idx, 'down')}
                    title="Move Down"
                  >
                    <ArrowDown size={14} />
                  </button>

                  <button
                    type="button"
                    className="btn-icon btn-danger"
                    style={{ width: 28, height: 28 }}
                    onClick={() => removeFromCustomPlaylist(asset.AssetID)}
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Start Slideshow Button */}
        {playlistAssets.length > 0 && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStart}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Play size={18} />
            Start Automated Slideshow
          </button>
        )}
      </div>
    </Modal>
  );
};

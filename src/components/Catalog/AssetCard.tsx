import React, { useEffect, useState } from 'react';
import { AssetInformation, DataType, resolveCategory } from '../../types/protocol';
import { useStage } from '../../context/StageContext';
import { Play, Plus, Check, Box, Image as ImageIcon, Film, Sliders, Heart, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../Common/ConfirmDialog';

interface AssetCardProps {
  asset: AssetInformation;
}

/**
 * Asset tile: preview first, then identity, then one obvious primary action.
 *
 * Thumbnails are still requested lazily through the existing IntersectionObserver
 * path so scrolling a large catalog does not flood the bridge.
 */
export const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const {
    thumbnails,
    requestThumbnail,
    loadAsset,
    activeAsset,
    customPlaylistIds,
    addToCustomPlaylist,
    removeFromCustomPlaylist,
    setIsControllerOpen,
    favouriteAssetIds,
    toggleFavourite,
    setInspectedAsset,
    deleteAsset
  } = useStage();

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const thumbUrl = thumbnails[asset.AssetID];
  const isActive = activeAsset?.AssetID === asset.AssetID;
  const isInCustomPlaylist = customPlaylistIds.includes(asset.AssetID);
  const isFavourite = favouriteAssetIds.includes(asset.AssetID);
  const category = resolveCategory(asset);

  useEffect(() => {
    if (thumbUrl) return;

    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      requestThumbnail(asset.AssetID);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          requestThumbnail(asset.AssetID);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [asset.AssetID, thumbUrl, requestThumbnail]);

  const categoryClass = (): string => {
    switch (category) {
      case DataType.Video:
        return 'video';
      case DataType.Image:
        return 'image';
      default:
        return 'model';
    }
  };

  const categoryName = (): string => {
    switch (category) {
      case DataType.Video:
        return 'Video';
      case DataType.Image:
        return 'Image';
      default:
        return '3D Model';
    }
  };

  const categoryIcon = (size: number) => {
    switch (category) {
      case DataType.Video:
        return <Film size={size} />;
      case DataType.Image:
        return <ImageIcon size={size} />;
      default:
        return <Box size={size} />;
    }
  };

  const durationLabel =
    category === DataType.Video && asset.videoDuration
      ? `${Math.round(asset.videoDuration)}s`
      : null;

  const handleCardClick = () => {
    setInspectedAsset(asset);
  };

  const handleLoadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) {
      setIsControllerOpen(true);
    } else {
      loadAsset(asset);
    }
  };

  const [isImgLoaded, setIsImgLoaded] = React.useState(false);

  return (
    <div
      ref={cardRef}
      data-asset-id={asset.AssetID}
      className={`asset-card card-enter ${isActive ? 'active-stage glow-cyan-subtle' : ''}`}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="asset-thumb-wrapper">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={asset.AssetName}
            className={`asset-thumb ${isImgLoaded ? 'loaded' : ''}`}
            loading="lazy"
            onLoad={() => setIsImgLoaded(true)}
          />
        ) : (
          <div className="asset-thumb-placeholder shimmering">{categoryIcon(34)}</div>
        )}

        {/* When an asset is live, its state matters more than its type - showing
            both badges made them overlap on narrow cards. */}
        {!isActive && (
          <span className={`category-badge ${categoryClass()}`}>
            {categoryIcon(11)}
            <span>{categoryName()}</span>
          </span>
        )}

        {isActive ? (
          <span className="asset-live-badge">
            <span className="live-dot" />
            LIVE
          </span>
        ) : isInCustomPlaylist ? (
          <span className="asset-state-badge">
            <Check size={11} />
            IN PLAYLIST
          </span>
        ) : null}

        {/* Card Actions Overlay (Bottom-Right: Delete + Favorite) */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            zIndex: 3
          }}
        >
          <button
            type="button"
            className="asset-delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsConfirmDeleteOpen(true);
            }}
            title={`Delete ${asset.AssetName} from database`}
            aria-label={`Delete ${asset.AssetName}`}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'rgba(20, 20, 25, 0.75)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--text-secondary, #999)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#F43F5E';
              e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.5)';
              e.currentTarget.style.background = 'rgba(244, 63, 94, 0.18)';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary, #999)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.background = 'rgba(20, 20, 25, 0.75)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Trash2 size={13} />
          </button>

          <button
            type="button"
            className={`asset-fav ${isFavourite ? 'on' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavourite(asset.AssetID);
            }}
            title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            aria-pressed={isFavourite}
            style={{
              position: 'relative',
              bottom: 'auto',
              right: 'auto',
              opacity: 1
            }}
          >
            <Heart size={14} fill={isFavourite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="asset-info">
        <div className="asset-title" title={asset.AssetName}>
          {asset.AssetName}
        </div>

        <div className="asset-meta-row">
          {asset.AssetName !== asset.AssetID && <span>{asset.AssetID}</span>}
          {asset.AssetName !== asset.AssetID && durationLabel && <span>·</span>}
          {durationLabel && <span>{durationLabel}</span>}
          {asset.AssetName === asset.AssetID && !durationLabel && <span>{categoryName()}</span>}
        </div>

        <div className="asset-actions">
          <button
            type="button"
            className={`btn btn-card-load ${isActive ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleLoadClick}
          >
            {isActive ? <Sliders size={14} /> : <Play size={14} />}
            {isActive ? 'Control' : 'Load'}
          </button>

          <button
            type="button"
            className={`btn-card-playlist-action ${isInCustomPlaylist ? 'in-playlist' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (isInCustomPlaylist) {
                removeFromCustomPlaylist(asset.AssetID);
              } else {
                addToCustomPlaylist(asset.AssetID);
              }
            }}
            title={isInCustomPlaylist ? 'Remove from playlist' : 'Add to playlist'}
          >
            {isInCustomPlaylist ? <Check size={15} /> : <Plus size={15} />}
            <span className="playlist-action-label">Playlist</span>
          </button>
        </div>
      </div>

      {isConfirmDeleteOpen && (
        <ConfirmDialog
          isOpen={isConfirmDeleteOpen}
          title="Delete Asset from Database"
          message={`Are you sure you want to permanently delete "${asset.AssetName}" from the stage database and disk files? This action cannot be undone.`}
          confirmLabel="Delete Asset"
          cancelLabel="Cancel"
          destructive={true}
          onConfirm={() => {
            deleteAsset(asset.AssetID, true);
            setIsConfirmDeleteOpen(false);
          }}
          onCancel={() => setIsConfirmDeleteOpen(false)}
        />
      )}
    </div>
  );
};

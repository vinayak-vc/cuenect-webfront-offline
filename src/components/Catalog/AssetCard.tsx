import React, { useEffect } from 'react';
import { AssetInformation, DataType, resolveCategory } from '../../types/protocol';
import { useStage } from '../../context/StageContext';
import { Play, Plus, Check, Box, Image as ImageIcon, Film, Sliders, Heart } from 'lucide-react';

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
    toggleFavourite
  } = useStage();

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

  return (
    <div ref={cardRef} className={`asset-card ${isActive ? 'active-stage' : ''}`}>
      <div className="asset-thumb-wrapper">
        {thumbUrl ? (
          <img src={thumbUrl} alt={asset.AssetName} className="asset-thumb" loading="lazy" />
        ) : (
          <div className="asset-thumb-placeholder">{categoryIcon(34)}</div>
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
            ON STAGE
          </span>
        ) : isInCustomPlaylist ? (
          <span className="asset-state-badge">
            <Check size={11} />
            IN PLAYLIST
          </span>
        ) : null}

        <button
          type="button"
          className={`asset-fav ${isFavourite ? 'on' : ''}`}
          onClick={() => toggleFavourite(asset.AssetID)}
          title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
          aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
          aria-pressed={isFavourite}
        >
          <Heart size={14} fill={isFavourite ? 'currentColor' : 'none'} />
        </button>
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
            onClick={() => (isActive ? setIsControllerOpen(true) : loadAsset(asset))}
          >
            {isActive ? <Sliders size={14} /> : <Play size={14} />}
            {isActive ? (
              'Control'
            ) : (
              <>
                <span className="label-full">Load to Stage</span>
                <span className="label-short">Load</span>
              </>
            )}
          </button>

          <button
            type="button"
            className={`btn-card-playlist-action ${isInCustomPlaylist ? 'in-playlist' : ''}`}
            onClick={() =>
              isInCustomPlaylist
                ? removeFromCustomPlaylist(asset.AssetID)
                : addToCustomPlaylist(asset.AssetID)
            }
            title={isInCustomPlaylist ? 'Remove from playlist' : 'Add to playlist'}
          >
            {isInCustomPlaylist ? <Check size={15} /> : <Plus size={15} />}
            <span className="playlist-action-label">Playlist</span>
          </button>
        </div>
      </div>
    </div>
  );
};

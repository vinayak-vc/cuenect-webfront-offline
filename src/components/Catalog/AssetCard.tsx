import React, { useEffect } from 'react';
import { AssetInformation, DataType, resolveCategory } from '../../types/protocol';
import { useStage } from '../../context/StageContext';
import { Box, Film, Image as ImageIcon, Play, Plus, Check } from 'lucide-react';

interface AssetCardProps {
  asset: AssetInformation;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const {
    thumbnails,
    requestThumbnail,
    loadAsset,
    activeAsset,
    customPlaylistIds,
    addToCustomPlaylist,
    removeFromCustomPlaylist
  } = useStage();

  const cardRef = React.useRef<HTMLDivElement>(null);
  const thumbUrl = thumbnails[asset.AssetID];
  const isActive = activeAsset?.AssetID === asset.AssetID;
  const isInCustomPlaylist = customPlaylistIds.includes(asset.AssetID);
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

  const getCategoryClass = (): string => {
    switch (category) {
      case DataType.Model:
        return 'model';
      case DataType.Video:
        return 'video';
      case DataType.Image:
        return 'image';
      default:
        return 'model';
    }
  };

  const getCategoryName = (): string => {
    switch (category) {
      case DataType.Model:
        return '3D Model';
      case DataType.Video:
        return 'Video';
      case DataType.Image:
        return 'Image';
      default:
        return '3D Model';
    }
  };

  const renderIcon = () => {
    switch (category) {
      case DataType.Model:
        return <Box size={36} />;
      case DataType.Video:
        return <Film size={36} />;
      case DataType.Image:
        return <ImageIcon size={36} />;
      default:
        return <Box size={36} />;
    }
  };

  return (
    <div ref={cardRef} className={`asset-card ${isActive ? 'active-stage' : ''}`}>
      <div className="asset-thumb-wrapper">
        {thumbUrl ? (
          <img src={thumbUrl} alt={asset.AssetName} className="asset-thumb" loading="lazy" />
        ) : (
          <div className="asset-thumb-placeholder">{renderIcon()}</div>
        )}
        <span className={`category-badge ${getCategoryClass()}`}>{getCategoryName()}</span>
      </div>

      <div className="asset-info">
        <div className="asset-title" title={asset.AssetName}>
          {asset.AssetName}
        </div>

        <div className="asset-actions">
          <button
            type="button"
            className={`btn btn-card-load ${isActive ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => loadAsset(asset)}
          >
            <Play size={14} />
            {isActive ? 'Control' : 'Load'}
          </button>

          <button
            type="button"
            className={`btn btn-card-playlist ${isInCustomPlaylist ? 'in-playlist' : ''}`}
            onClick={() =>
              isInCustomPlaylist
                ? removeFromCustomPlaylist(asset.AssetID)
                : addToCustomPlaylist(asset.AssetID)
            }
            title={isInCustomPlaylist ? 'Remove from Playlist' : 'Add to Playlist'}
          >
            {isInCustomPlaylist ? <Check size={14} /> : <Plus size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};

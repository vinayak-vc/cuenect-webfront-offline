import React from 'react';
import { SmithsonianExploreModel, DataType } from '../../types/protocol';
import { useStage } from '../../context/StageContext';
import { Download, Play, Loader2, Box, Sliders, CheckCircle2 } from 'lucide-react';

interface ExploreCardProps {
  model: SmithsonianExploreModel;
}

/**
 * Smithsonian 3D Open Access (CC0) Explore tile.
 * Uses the exact same visual language and classes as AssetCard (`asset-card`,
 * `asset-thumb-wrapper`, `asset-info`, `btn-card-load`).
 */
export const ExploreCard: React.FC<ExploreCardProps> = ({ model }) => {
  const {
    assets,
    activeAsset,
    loadAsset,
    setIsControllerOpen,
    activeDownloads,
    startExploreDownload
  } = useStage();

  const downloadState = activeDownloads[model.smithsonianId];
  const isDownloading = Boolean(downloadState && downloadState.status === 'downloading');
  const progress = downloadState?.progress ?? 0;

  // Resolve matching downloaded asset if already in local catalog
  const downloadedAsset = React.useMemo(() => {
    return assets.find(
      (a) =>
        (a.smithsonianId && a.smithsonianId === model.smithsonianId) ||
        (model.downloadedAssetId && a.AssetID === model.downloadedAssetId) ||
        a.AssetName.trim().toLowerCase() === model.title.trim().toLowerCase()
    );
  }, [assets, model.smithsonianId, model.downloadedAssetId, model.title]);

  const isDownloaded = Boolean(downloadedAsset || model.isDownloaded);
  const isActive = Boolean(downloadedAsset && activeAsset?.AssetID === downloadedAsset.AssetID);

  const sizeLabel =
    model.fileSizeMB && model.fileSizeMB > 0
      ? `${model.fileSizeMB.toFixed(1)} MB`
      : '';

  const handleAction = () => {
    if (isDownloading) return;

    if (isDownloaded) {
      if (isActive) {
        setIsControllerOpen(true);
      } else if (downloadedAsset) {
        loadAsset(downloadedAsset);
      } else {
        // Fallback if catalog list hasn't echoed yet
        loadAsset({
          AssetID: model.downloadedAssetId || model.smithsonianId,
          AssetName: model.title,
          ThumbnailImagePath: '',
          ModelPath: '',
          PlaylistName: 'Smithsonian 3D',
          Category: DataType.Model,
          fileSizeBytes: model.fileSizeBytes,
          fileSizeMB: model.fileSizeMB,
          smithsonianId: model.smithsonianId,
          metadata: model.metadata
        });
      }
      return;
    }

    startExploreDownload(model);
  };

  return (
    <div
      className={`asset-card ${isActive ? 'active-stage' : ''}`}
      onClick={handleAction}
      style={{ cursor: isDownloading ? 'progress' : 'pointer' }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleAction();
        }
      }}
    >
      <div className="asset-thumb-wrapper">
        {model.thumbnailUrl ? (
          <img
            src={model.thumbnailUrl}
            alt={model.title}
            className="asset-thumb"
            loading="lazy"
          />
        ) : (
          <div className="asset-thumb-placeholder">
            <Box size={34} />
          </div>
        )}

        {!isActive && (
          <span className="category-badge model">
            <Box size={11} />
            <span>CC0 • 3D</span>
          </span>
        )}

        {isActive ? (
          <span className="asset-live-badge">
            <span className="live-dot" />
            LIVE
          </span>
        ) : isDownloaded ? (
          <span className="asset-state-badge">
            <CheckCircle2 size={11} />
            READY
          </span>
        ) : sizeLabel ? (
          <span
            className="asset-state-badge"
            style={{
              background: 'rgba(7, 10, 19, 0.78)',
              color: '#e2e8f0',
              border: '1px solid rgba(255, 255, 255, 0.14)'
            }}
          >
            {sizeLabel}
          </span>
        ) : null}
      </div>

      <div className="asset-info">
        <div className="asset-title" title={model.title}>
          {model.title}
        </div>

        <div className="asset-meta-row" title={model.metadata?.museum || 'Smithsonian Open Access'}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {model.metadata?.museum || 'Smithsonian Institution'}
          </span>
          {model.metadata?.date && (
            <>
              <span>·</span>
              <span style={{ flexShrink: 0 }}>{model.metadata.date}</span>
            </>
          )}
        </div>

        <div className="asset-actions">
          <button
            type="button"
            disabled={isDownloading}
            className={`btn btn-card-load ${isActive ? 'btn-secondary' : 'btn-primary'}`}
            onClick={(e) => {
              e.stopPropagation();
              handleAction();
            }}
            style={{
              width: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {isDownloading && (
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${Math.max(5, progress)}%`,
                  background: 'rgba(255, 255, 255, 0.22)',
                  transition: 'width 0.25s ease',
                  pointerEvents: 'none'
                }}
              />
            )}
            {isDownloading ? (
              <>
                <Loader2 size={14} className="spin" />
                <span>Downloading {progress}%</span>
              </>
            ) : isDownloaded ? (
              <>
                {isActive ? <Sliders size={14} /> : <Play size={14} />}
                <span>{isActive ? 'Control' : 'Load Model'}</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Download {sizeLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useStage } from '../../context/StageContext';
import {
  AssetInformation,
  SmithsonianExploreModel,
  DataType,
  resolveCategory,
  cleanMetadataDescription
} from '../../types/protocol';
import { BottomSheet } from '../Common/BottomSheet';
import {
  Play,
  Sliders,
  Download,
  Plus,
  Check,
  Heart,
  Box,
  Film,
  Image as ImageIcon,
  Loader2,
  Calendar,
  Building2,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';

export const AssetInspector: React.FC = () => {
  const {
    inspectedAsset,
    setInspectedAsset,
    thumbnails,
    activeAsset,
    loadAsset,
    setIsControllerOpen,
    customPlaylistIds,
    addToCustomPlaylist,
    removeFromCustomPlaylist,
    favouriteAssetIds,
    toggleFavourite,
    assets,
    activeDownloads,
    startExploreDownload
  } = useStage();

  const [showAllDetails, setShowAllDetails] = useState(false);

  useEffect(() => {
    setShowAllDetails(false);
  }, [inspectedAsset]);

  if (!inspectedAsset) return null;

  // Determine whether it's an AssetInformation or a SmithsonianExploreModel
  const isExplore = !('AssetID' in inspectedAsset) && 'smithsonianId' in inspectedAsset;
  const exploreModel = isExplore ? (inspectedAsset as SmithsonianExploreModel) : null;
  const standardAsset = !isExplore ? (inspectedAsset as AssetInformation) : null;

  // Resolve downloaded asset if exploreModel
  const downloadedAsset = isExplore && exploreModel
    ? assets.find(
        (a) =>
          (a.smithsonianId && a.smithsonianId === exploreModel.smithsonianId) ||
          (exploreModel.downloadedAssetId && a.AssetID === exploreModel.downloadedAssetId) ||
          a.AssetName.trim().toLowerCase() === exploreModel.title.trim().toLowerCase()
      )
    : standardAsset;

  const currentAsset: AssetInformation | null = downloadedAsset || standardAsset;
  const title = exploreModel?.title || currentAsset?.AssetName || 'Asset Inspector';
  const assetId = currentAsset?.AssetID || exploreModel?.smithsonianId || '';
  const isActive = Boolean(activeAsset && currentAsset && activeAsset.AssetID === currentAsset.AssetID);
  const isInPlaylist = customPlaylistIds.includes(assetId);
  const isFavourite = favouriteAssetIds.includes(assetId);

  // Download state for explore models
  const downloadState = exploreModel ? activeDownloads[exploreModel.smithsonianId] : undefined;
  const isDownloading = Boolean(downloadState && downloadState.status === 'downloading');
  const downloadProgress = downloadState?.progress ?? 0;

  // Thumbnail
  const thumbUrl =
    (currentAsset && thumbnails[currentAsset.AssetID]) ||
    currentAsset?.ThumbnailImagePath ||
    exploreModel?.thumbnailUrl ||
    '';

  // Category
  const category = currentAsset ? resolveCategory(currentAsset) : DataType.Model;
  const categoryLabel =
    category === DataType.Video ? 'Video' : category === DataType.Image ? 'Image' : '3D Model';

  const categoryIcon = () => {
    switch (category) {
      case DataType.Video:
        return <Film size={13} />;
      case DataType.Image:
        return <ImageIcon size={13} />;
      default:
        return <Box size={13} />;
    }
  };

  // Metadata Extraction
  const metadata = currentAsset?.metadata || exploreModel?.metadata;
  const museum = metadata?.museum?.trim() || (isExplore ? 'Smithsonian Institution' : '');
  const creator = metadata?.creator?.trim() || '';
  const date = metadata?.date?.trim() || '';
  const collection = metadata?.collection?.trim() || '';
  const place = metadata?.place?.trim() || '';
  const medium = metadata?.medium?.trim() || '';
  const dimensions = metadata?.dimensions?.trim() || '';
  const creditLine = metadata?.creditLine?.trim() || '';
  const identifier = metadata?.identifier?.trim() || '';
  const taxonomy = metadata?.taxonomy?.trim() || '';
  const annotations = metadata?.annotations?.trim() || '';
  const rawDescription = metadata?.description || '';
  const cleanedDesc = cleanMetadataDescription(rawDescription);

  const topics: string[] = [];
  if (metadata?.details) {
    for (const item of metadata.details) {
      if (!item || !item.value) continue;
      const lbl = (item.label || '').toLowerCase();
      if (
        lbl.includes('see more items') ||
        lbl.includes('topic') ||
        lbl.includes('category') ||
        lbl.includes('subject')
      ) {
        const val = item.value.trim();
        if (val && !topics.includes(val)) {
          topics.push(val);
        }
      }
    }
  }

  const handlePrimaryAction = () => {
    if (isDownloading) return;

    if (isActive) {
      setIsControllerOpen(true);
      setInspectedAsset(null);
      return;
    }

    if (currentAsset) {
      loadAsset(currentAsset);
      setIsControllerOpen(true);
      setInspectedAsset(null);
      return;
    }

    if (exploreModel && exploreModel.isDownloaded) {
      loadAsset({
        AssetID: exploreModel.downloadedAssetId || exploreModel.smithsonianId,
        AssetName: exploreModel.title,
        ThumbnailImagePath: exploreModel.thumbnailUrl || '',
        ModelPath: '',
        PlaylistName: 'Smithsonian 3D',
        Category: DataType.Model,
        fileSizeBytes: exploreModel.fileSizeBytes,
        fileSizeMB: exploreModel.fileSizeMB,
        smithsonianId: exploreModel.smithsonianId,
        metadata: exploreModel.metadata
      });
      setIsControllerOpen(true);
      setInspectedAsset(null);
      return;
    }

    if (exploreModel) {
      startExploreDownload(exploreModel);
    }
  };

  const footer = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          className={`btn-icon ${isFavourite ? 'on' : ''}`}
          onClick={() => toggleFavourite(assetId)}
          title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
          aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
          style={{
            width: 40,
            height: 40,
            minWidth: 40,
            minHeight: 40,
            borderRadius: 'var(--radius-md)',
            background: isFavourite ? 'rgba(239, 68, 68, 0.15)' : 'var(--surface-2)',
            color: isFavourite ? '#ef4444' : 'var(--text-secondary)',
            border: isFavourite ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--line-subtle)'
          }}
        >
          <Heart size={16} fill={isFavourite ? 'currentColor' : 'none'} />
        </button>

        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            if (isInPlaylist) {
              removeFromCustomPlaylist(assetId);
            } else {
              addToCustomPlaylist(assetId);
            }
          }}
          title={isInPlaylist ? 'Remove from playlist' : 'Add to playlist'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minHeight: 40,
            padding: '0 14px',
            fontSize: '0.82rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            background: isInPlaylist ? 'rgba(100, 197, 190, 0.15)' : 'var(--surface-2)',
            color: isInPlaylist ? 'var(--color-primary)' : 'var(--text-secondary)',
            border: isInPlaylist ? '1px solid rgba(100, 197, 190, 0.3)' : '1px solid var(--line-subtle)'
          }}
        >
          {isInPlaylist ? <Check size={14} /> : <Plus size={14} />}
          <span>{isInPlaylist ? 'In Playlist' : 'Playlist'}</span>
        </button>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        onClick={handlePrimaryAction}
        disabled={isDownloading}
        style={{
          minHeight: 42,
          padding: '0 20px',
          fontSize: '0.86rem',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        {isDownloading ? (
          <>
            <Loader2 size={16} className="spin" />
            <span>Downloading {downloadProgress}%</span>
          </>
        ) : isActive ? (
          <>
            <Sliders size={16} />
            <span>Control Live Stage</span>
          </>
        ) : currentAsset ? (
          <>
            <Play size={16} fill="currentColor" />
            <span>Load to Stage & Control</span>
          </>
        ) : (
          <>
            <Download size={16} />
            <span>Download Model</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <BottomSheet
      isOpen={Boolean(inspectedAsset)}
      onClose={() => setInspectedAsset(null)}
      variant="side-drawer"
      title="Asset Inspector"
      subtitle={categoryLabel}
      footer={footer}
    >
      <div className="inspector-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Visual Preview Banner */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 220,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-canvas)',
            border: '1px solid var(--line-subtle)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isActive ? 'var(--shadow-live)' : 'none'
          }}
        >
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt={title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: 'radial-gradient(circle, rgba(16,24,39,0.9) 0%, rgba(6,9,15,1) 85%)'
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                color: 'var(--text-muted)'
              }}
            >
              {categoryIcon()}
              <span style={{ fontSize: '0.78rem' }}>No preview available</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
            <span
              className="category-badge"
              style={{
                position: 'static',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(6, 9, 15, 0.85)',
                backdropFilter: 'blur(8px)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.72rem',
                color: 'var(--text-primary)',
                border: '1px solid var(--line-subtle)'
              }}
            >
              {categoryIcon()}
              <span>{categoryLabel}</span>
            </span>

            {isActive && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'rgba(55, 209, 127, 0.18)',
                  border: '1px solid rgba(55, 209, 127, 0.5)',
                  color: 'var(--color-live)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}
              >
                <span className="live-dot" style={{ width: 6, height: 6 }} />
                ACTIVE ON STAGE
              </span>
            )}
          </div>
        </div>

        {/* Identity & Curatorial Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
              margin: 0
            }}
          >
            {title}
          </h2>

          {museum && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-primary)'
              }}
            >
              <Building2 size={13} />
              <span>{museum}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {cleanedDesc && (
          <div
            style={{
              fontSize: '0.82rem',
              lineHeight: 1.55,
              color: 'var(--text-secondary)',
              background: 'var(--surface-1)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line-subtle)',
              whiteSpace: 'pre-line'
            }}
          >
            {cleanedDesc}
          </div>
        )}

        {/* Curatorial Specifications Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
            background: 'var(--surface-1)',
            padding: 14,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--line-subtle)'
          }}
        >
          {creator && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="u-section-label" style={{ fontSize: '0.68rem' }}>Creator</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{creator}</span>
            </div>
          )}

          {date && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="u-section-label" style={{ fontSize: '0.68rem' }}>Date / Era</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} />
                {date}
              </span>
            </div>
          )}

          {collection && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="u-section-label" style={{ fontSize: '0.68rem' }}>Collection</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{collection}</span>
            </div>
          )}

          {medium && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="u-section-label" style={{ fontSize: '0.68rem' }}>Medium</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{medium}</span>
            </div>
          )}

          {dimensions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="u-section-label" style={{ fontSize: '0.68rem' }}>Dimensions</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{dimensions}</span>
            </div>
          )}

          {place && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="u-section-label" style={{ fontSize: '0.68rem' }}>Origin / Place</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{place}</span>
            </div>
          )}

        </div>

        {/* Extended Curatorial Details (Progressive Disclosure) */}
        {(taxonomy || identifier || annotations || creditLine || topics.length > 0 || (metadata?.details && metadata.details.length > 0)) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="button"
              onClick={() => setShowAllDetails(v => !v)}
              className="btn-ghost"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-primary)',
                background: 'rgba(104, 217, 208, 0.08)',
                border: '1px solid rgba(104, 217, 208, 0.25)',
                cursor: 'pointer'
              }}
            >
              <FileText size={14} />
              <span>{showAllDetails ? 'Hide Curatorial Specifications' : 'View Full Curatorial Specifications'}</span>
              {showAllDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAllDetails && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  background: 'var(--surface-1)',
                  padding: 14,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--line-subtle)'
                }}
              >
                {taxonomy && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span className="u-section-label" style={{ fontSize: '0.68rem' }}>Taxonomy</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{taxonomy}</span>
                  </div>
                )}

                {identifier && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span className="u-section-label" style={{ fontSize: '0.68rem' }}>Identifier</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{identifier}</span>
                  </div>
                )}

                {annotations && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span className="u-section-label" style={{ fontSize: '0.68rem' }}>Annotations</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{annotations}</span>
                  </div>
                )}

                {creditLine && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span className="u-section-label" style={{ fontSize: '0.68rem' }}>Credit Line</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{creditLine}</span>
                  </div>
                )}

                {topics.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span className="u-section-label" style={{ fontSize: '0.68rem' }}>Topics & Categories</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{topics.join(' · ')}</span>
                  </div>
                )}

                {metadata?.details && metadata.details.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                    <span className="u-section-label" style={{ fontSize: '0.68rem' }}>Smithsonian Archive Fields</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {metadata.details.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            fontSize: '0.76rem',
                            borderBottom: '1px solid var(--line-subtle)',
                            paddingBottom: 4
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{item.label}</span>
                          <span style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

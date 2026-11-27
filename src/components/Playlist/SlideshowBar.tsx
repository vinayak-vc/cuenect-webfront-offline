import React from 'react';
import { useStage } from '../../context/StageContext';
import { Pause, SkipBack, SkipForward, X, Radio } from 'lucide-react';
import { DataType } from '../../types/protocol';
import { getTemplateInstances } from '../Configurator/templateStorage';

export const SlideshowBar: React.FC = () => {
  const {
    isSlideshowActive,
    slideshowIndex,
    customPlaylistIds,
    assets,
    stopSlideshow,
    nextSlide,
    prevSlide
  } = useStage();

  if (!isSlideshowActive) return null;

  const playlistAssets = customPlaylistIds
    .map((id) => {
      const found = assets.find((a) => a.AssetID === id);
      if (found) return found;
      const inst = getTemplateInstances().find((i) => i.assetId === id || i.id === id);
      if (inst) {
        return {
          AssetID: inst.assetId || inst.id,
          AssetName: inst.assetName,
          ThumbnailImagePath: inst.thumbUrl,
          ModelPath: inst.thumbUrl,
          PlaylistName: 'Occasions',
          isloaded: false,
          Category: DataType.Image,
          fileSizeBytes: 0,
          fileSizeMB: 0,
          smithsonianId: '',
          metadata: {
            title: inst.assetName,
            templateId: inst.templateId
          }
        } as (typeof assets)[0];
      }
      return undefined;
    })
    .filter(Boolean);

  const currentItem = playlistAssets[slideshowIndex];

  return (
    <div className="slideshow-bottom-bar">
      <div className="slideshow-info">
        <Radio size={18} color="var(--color-primary)" style={{ animation: 'pulse 1.5s infinite' }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            Slideshow Active ({slideshowIndex + 1}/{playlistAssets.length})
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {currentItem?.AssetName || 'Advancing...'}
          </div>
        </div>
      </div>

      <div className="slideshow-controls">
        <button
          type="button"
          className="btn-icon"
          onClick={prevSlide}
          title="Previous Slide"
        >
          <SkipBack size={16} />
        </button>

        <button
          type="button"
          className="btn-icon btn-primary"
          onClick={stopSlideshow}
          title="Pause / Stop Slideshow"
        >
          <Pause size={16} />
        </button>

        <button
          type="button"
          className="btn-icon"
          onClick={nextSlide}
          title="Next Slide"
        >
          <SkipForward size={16} />
        </button>

        <button
          type="button"
          className="btn-icon btn-danger"
          onClick={stopSlideshow}
          title="Close Slideshow"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

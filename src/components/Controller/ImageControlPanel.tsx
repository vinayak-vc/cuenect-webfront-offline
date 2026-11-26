import React, { useState } from 'react';
import { useStage } from '../../context/StageContext';
import {
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Maximize2,
  RefreshCw,
  XSquare,
  Sparkles,
  Sliders,
  Expand,
  Minimize
} from 'lucide-react';
import { ConfiguratorStudio } from '../Configurator/ConfiguratorStudio';

export const ImageControlPanel: React.FC = () => {
  const {
    imageScale,
    imageRotation,
    isImagePreserveAspect,
    zoomImage,
    rotateImage,
    toggleImageFit,
    resetImageTransform,
    unloadAsset,
    activeAsset
  } = useStage();

  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);

  return (
    <div className="image-control-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ImageIcon size={16} style={{ color: '#0D99FF' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>
            Stage Image Controls
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: 'rgba(52, 211, 153, 0.15)',
              color: '#34D399',
              border: '1px solid rgba(52, 211, 153, 0.3)'
            }}
          >
            Presenting
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 4,
              fontFamily: 'monospace',
              background: 'rgba(255,255,255,0.06)',
              color: '#E0E0E0'
            }}
          >
            {Math.round(imageScale * 100)}%
          </span>
          {imageRotation !== 0 && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                fontFamily: 'monospace',
                background: 'rgba(13, 153, 255, 0.15)',
                color: '#38BDF8'
              }}
            >
              {imageRotation}°
            </span>
          )}
        </div>
      </div>

      {/* Scale / Zoom Control Group */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary, #AAA)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sliders size={13} />
            <span>Zoom & Scale</span>
          </span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{Math.round(imageScale * 100)}%</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => zoomImage('in')}
            title="Zoom In (+15%)"
            style={{ justifyContent: 'center', gap: 6, padding: '7px 8px', fontSize: '0.78rem' }}
          >
            <ZoomIn size={15} />
            <span>Zoom In</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => zoomImage('out')}
            title="Zoom Out (-15%)"
            style={{ justifyContent: 'center', gap: 6, padding: '7px 8px', fontSize: '0.78rem' }}
          >
            <ZoomOut size={15} />
            <span>Zoom Out</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => zoomImage('reset')}
            title="Reset Scale to 100%"
            style={{ justifyContent: 'center', gap: 6, padding: '7px 8px', fontSize: '0.78rem' }}
          >
            <Maximize2 size={15} />
            <span>100%</span>
          </button>
        </div>
      </div>

      {/* Rotation Control Group */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary, #AAA)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <RotateCw size={13} />
            <span>Stage Orientation</span>
          </span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{imageRotation}°</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => rotateImage('ccw')}
            title="Rotate 90° Counter-Clockwise"
            style={{ justifyContent: 'center', gap: 6, padding: '7px 8px', fontSize: '0.78rem' }}
          >
            <RotateCcw size={15} />
            <span>-90°</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => rotateImage('cw')}
            title="Rotate 90° Clockwise"
            style={{ justifyContent: 'center', gap: 6, padding: '7px 8px', fontSize: '0.78rem' }}
          >
            <RotateCw size={15} />
            <span>+90°</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => rotateImage('reset')}
            title="Reset Orientation to 0°"
            style={{ justifyContent: 'center', gap: 6, padding: '7px 8px', fontSize: '0.78rem' }}
          >
            <RefreshCw size={15} />
            <span>Reset 0°</span>
          </button>
        </div>
      </div>

      {/* Fit Mode & Reset Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <button
          type="button"
          className={`btn ${isImagePreserveAspect ? 'btn-primary' : 'btn-secondary'}`}
          onClick={toggleImageFit}
          title={isImagePreserveAspect ? 'Currently Fit: Letterboxed without distortion' : 'Currently Fill: Stretched to stage bounds'}
          style={{ justifyContent: 'center', gap: 6, padding: '7px 8px', fontSize: '0.78rem' }}
        >
          {isImagePreserveAspect ? <Minimize size={14} /> : <Expand size={14} />}
          <span>{isImagePreserveAspect ? 'Fit to Screen' : 'Fill Stage'}</span>
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={resetImageTransform}
          title="Reset Zoom & Rotation"
          style={{ justifyContent: 'center', gap: 6, padding: '7px 8px', fontSize: '0.78rem' }}
        >
          <RefreshCw size={14} />
          <span>Reset All</span>
        </button>
      </div>

      {/* Action Buttons: Open Image Editor & Clear Stage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 8, marginTop: 4 }}>
        <button
          type="button"
          onClick={() => setIsConfiguratorOpen(true)}
          className="btn btn-primary"
          title="Open in Image Editor & Template Studio"
          style={{ justifyContent: 'center', gap: 6, padding: '8px 10px', fontSize: '0.8rem', background: 'linear-gradient(135deg, #0D99FF, #68D9D0)' }}
        >
          <Sparkles size={15} />
          <span>Open Image Studio</span>
        </button>

        <button
          type="button"
          onClick={unloadAsset}
          className="btn btn-secondary"
          title="Unload Image and clear stage back to company logo"
          style={{ justifyContent: 'center', gap: 6, padding: '8px 10px', fontSize: '0.8rem', color: '#F43F5E' }}
        >
          <XSquare size={15} />
          <span>Clear Stage</span>
        </button>
      </div>

      {/* Active Asset Info Footer */}
      {activeAsset && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #777)', display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
          <span>Source: Stage Image Controller</span>
          <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeAsset.AssetName || 'Image Asset'}
          </span>
        </div>
      )}

      {/* Configurator Studio Modal if triggered */}
      {isConfiguratorOpen && (
        <ConfiguratorStudio
          isOpen={isConfiguratorOpen}
          onClose={() => setIsConfiguratorOpen(false)}
        />
      )}
    </div>
  );
};

import React from 'react';
import { useStage } from '../../context/StageContext';
import { DataType, resolveCategory } from '../../types/protocol';
import { ModelControlPanel } from './ModelControlPanel';
import { VideoControlPanel } from './VideoControlPanel';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { ArrowLeft, Box, Film, Image as ImageIcon, AlertTriangle, Loader2 } from 'lucide-react';

export const FullScreenController: React.FC = () => {
  const {
    activeAsset,
    unloadAsset,
    isControllerOpen,
    thumbnails,
    connectionState
  } = useStage();

  useBodyScrollLock(isControllerOpen && !!activeAsset);

  if (!isControllerOpen || !activeAsset) return null;

  const thumbUrl = thumbnails[activeAsset.AssetID];
  const category = resolveCategory(activeAsset);

  const renderMediaTypeTag = () => {
    switch (category) {
      case DataType.Model:
        return (
          <span className="category-badge model" style={{ position: 'static' }}>
            <Box size={12} style={{ display: 'inline', marginRight: 4 }} />
            3D Model
          </span>
        );
      case DataType.Video:
        return (
          <span className="category-badge video" style={{ position: 'static' }}>
            <Film size={12} style={{ display: 'inline', marginRight: 4 }} />
            Video
          </span>
        );
      case DataType.Image:
        return (
          <span className="category-badge image" style={{ position: 'static' }}>
            <ImageIcon size={12} style={{ display: 'inline', marginRight: 4 }} />
            Image
          </span>
        );
      default:
        return (
          <span className="category-badge model" style={{ position: 'static' }}>
            <Box size={12} style={{ display: 'inline', marginRight: 4 }} />
            3D Model
          </span>
        );
    }
  };

  return (
    <div className="controller-modal">
      {/* Top Bar */}
      <div className="controller-header">
        <button
          type="button"
          className="btn-icon"
          onClick={unloadAsset}
          title="Back to Catalog (unloads the stage and restores the company logo)"
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Stage Controller</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {connectionState === 'connected' ? 'Live Stage Control' : 'Stage Offline'}
          </div>
        </div>

      </div>

      {/* Disconnection Alert Banner */}
      {connectionState !== 'connected' && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: '0.8rem',
            color: 'var(--color-danger)'
          }}
        >
          {connectionState === 'connecting' ? (
            <>
              <Loader2 size={14} className="spin" />
              <span>Reconnecting to stage...</span>
            </>
          ) : (
            <>
              <AlertTriangle size={14} />
              <span>Stage is disconnected. Controls are paused.</span>
            </>
          )}
        </div>
      )}

      {/* Controller Body */}
      <div className="controller-body">
        {/* Active Asset Info Header */}
        <div className="controller-preview-box">
          {thumbUrl ? (
            <img src={thumbUrl} alt={activeAsset.AssetName} className="controller-preview-img" />
          ) : (
            <div
              className="controller-preview-img"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
            >
              <Box size={32} />
            </div>
          )}

          <div className="controller-meta">
            {renderMediaTypeTag()}
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {activeAsset.AssetName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              ID: {activeAsset.AssetID}
            </div>
          </div>
        </div>

        {/* Dynamic Controls based on Media Type */}
        {category === DataType.Model && <ModelControlPanel />}
        {category === DataType.Video && <VideoControlPanel />}
        {category === DataType.Image && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>
            Image displayed on Holo Stage
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useStage } from '../../context/StageContext';
import { RefreshCw, ListPlus, Users, Sliders, Layers, Camera, Maximize } from 'lucide-react';
import { DisplayMode, DisplayModeLabels } from '../../types/protocol';

interface HeaderProps {
  onOpenConnection: () => void;
  onOpenPlaylistMaker: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenConnection,
  onOpenPlaylistMaker
}) => {
  const {
    connectionState,
    connectedUsers,
    refreshAssets,
    selectedPlaylist,
    customPlaylistIds,
    setIsSettingsOpen,
    displayMode,
    setDisplayMode,
    isOrthographic,
    toggleOrthographic,
    triggerFullscreen
  } = useStage();

  const [logoError, setLogoError] = useState<boolean>(false);

  const getStatusText = (): string => {
    switch (connectionState) {
      case 'connected':
        return connectedUsers.length > 0 ? `Connected (${connectedUsers.length})` : 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        {!logoError ? (
          <img
            src="/assets/branding/cuenect - white - 01.png"
            alt="Cuenect Hologram Stage"
            className="header-logo-img"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="header-logo-fallback">
            <Layers size={28} />
          </div>
        )}
        <div className="header-title-wrap">
          <h1 className="header-title">CUENECT</h1>
          <div className="header-subtitle">
            {selectedPlaylist !== 'All' ? `Playlist: ${selectedPlaylist}` : 'Hologram Stage Controller'}
          </div>
        </div>
      </div>

      <div className="header-actions">
        <label className="header-projection" title="Stage projection mode">
          <span className="header-projection-label">Projection</span>
          <select
            className="header-projection-select"
            value={displayMode}
            onChange={(e) => setDisplayMode(Number(e.target.value) as DisplayMode)}
          >
            <option value={DisplayMode.Mono2D}>{DisplayModeLabels[DisplayMode.Mono2D]}</option>
            <option value={DisplayMode.StereoSbs}>{DisplayModeLabels[DisplayMode.StereoSbs]}</option>
            <option value={DisplayMode.HoloDevice}>{DisplayModeLabels[DisplayMode.HoloDevice]}</option>
          </select>
        </label>

        <button
          className={`status-badge ${connectionState}`}
          onClick={onOpenConnection}
          title="Click to change connection settings"
        >
          <span className="status-dot" />
          {connectedUsers.length > 0 && <Users size={12} style={{ marginRight: 2 }} />}
          <span>{getStatusText()}</span>
        </button>

        <button
          className="btn-icon"
          onClick={refreshAssets}
          title="Refresh Assets"
          disabled={connectionState !== 'connected'}
        >
          <RefreshCw size={18} />
        </button>

        <button
          className="btn-icon"
          onClick={toggleOrthographic}
          title={isOrthographic ? 'Projection: Orthographic' : 'Projection: Perspective'}
          style={{
            borderColor: isOrthographic ? 'var(--color-primary)' : undefined,
            color: isOrthographic ? 'var(--color-primary)' : undefined
          }}
        >
          <Camera size={18} />
        </button>

        <button
          className="btn-icon"
          onClick={triggerFullscreen}
          title="Toggle stage fullscreen"
        >
          <Maximize size={18} />
        </button>

        <button
          className="btn-icon"
          onClick={() => setIsSettingsOpen(true)}
          title="Stereo calibration & stage settings (IPD, Zero Parallax, FOV, Light)"
        >
          <Sliders size={18} />
        </button>

        <button
          className="btn-icon"
          onClick={onOpenPlaylistMaker}
          title="Playlist Builder"
          style={{ position: 'relative' }}
        >
          <ListPlus size={18} />
          {customPlaylistIds.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: '#041017',
                fontSize: '0.65rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(100, 197, 190, 0.6)'
              }}
            >
              {customPlaylistIds.length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

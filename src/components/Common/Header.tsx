import React, { useState } from 'react';
import { useStage } from '../../context/StageContext';
import { RefreshCw, ListPlus, Sliders, Layers, Camera, Maximize } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { ProjectionSelector } from './ProjectionSelector';
import { SearchField } from './SearchField';

interface HeaderProps {
  onOpenConnection: () => void;
  onOpenPlaylistMaker: () => void;
  query: string;
  onQueryChange: (value: string) => void;
}

/**
 * Stage-level controls live here so they are reachable from every screen -
 * catalog, loading and controller alike. Model-specific controls stay on the
 * controller surface.
 *
 * Hierarchy: brand (left) - asset discovery (centre, desktop) - stage state and
 * projection (right). Utility icons are visually quieter than both.
 */
export const Header: React.FC<HeaderProps> = ({
  onOpenConnection,
  onOpenPlaylistMaker,
  query,
  onQueryChange
}) => {
  const {
    connectionState,
    refreshAssets,
    selectedPlaylist,
    customPlaylistIds,
    setIsSettingsOpen,
    isOrthographic,
    toggleOrthographic,
    triggerFullscreen
  } = useStage();

  const [logoError, setLogoError] = useState<boolean>(false);

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

      {/* Desktop asset discovery. Mobile gets its own field in the catalog. */}
      <div className="header-search">
        <SearchField value={query} onChange={onQueryChange} />
      </div>

      <div className="header-actions">
        <ProjectionSelector />

        <ConnectionStatus onClick={onOpenConnection} />

        <button
          className="btn-icon hide-on-mobile"
          onClick={refreshAssets}
          title="Refresh asset catalog"
          disabled={connectionState !== 'connected'}
        >
          <RefreshCw size={18} />
        </button>

        <button
          className="btn-icon hide-on-mobile"
          onClick={toggleOrthographic}
          title={isOrthographic ? 'Camera: Orthographic' : 'Camera: Perspective'}
          style={{
            borderColor: isOrthographic ? 'var(--line-interactive)' : undefined,
            color: isOrthographic ? 'var(--color-primary)' : undefined
          }}
        >
          <Camera size={18} />
        </button>

        <button className="btn-icon hide-on-mobile" onClick={triggerFullscreen} title="Toggle stage fullscreen">
          <Maximize size={18} />
        </button>

        <button
          className="btn-icon hide-on-mobile"
          onClick={() => setIsSettingsOpen(true)}
          title="Stereo calibration & stage settings"
        >
          <Sliders size={18} />
        </button>

        <button
          className="btn-icon hide-on-mobile"
          onClick={onOpenPlaylistMaker}
          title="Playlist builder"
          style={{ position: 'relative' }}
        >
          <ListPlus size={18} />
          {customPlaylistIds.length > 0 && (
            <span className="bottom-nav-badge" style={{ top: -4, right: -4, transform: 'none' }}>
              {customPlaylistIds.length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

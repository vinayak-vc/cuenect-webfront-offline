import React, { useState, useRef, useEffect } from 'react';
import { useStage } from '../../context/StageContext';
import { RefreshCw, ListPlus, Sliders, Layers, Camera, Maximize, Download, Search, X } from 'lucide-react';
import { usePWAInstall } from '../../services/pwaService';
import { ConnectionStatus } from './ConnectionStatus';
import { ProjectionSelector } from './ProjectionSelector';
import { EnvironmentSelector } from './EnvironmentSelector';
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
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { canInstall, triggerInstall } = usePWAInstall();

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  return (
    <header className="app-header">
      <div className="header-brand">
        {!logoError ? (
          <img
            src="/icon-192.png"
            alt="Cuenect Hologram"
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
            {selectedPlaylist !== 'All' ? `Playlist: ${selectedPlaylist}` : 'Hologram Controller'}
          </div>
        </div>
      </div>

      {/* Animated Expandable Search Bar */}
      <div className={`header-expandable-search ${isSearchOpen ? 'open' : ''}`}>
        <div className="expandable-search-inner">
          <Search size={16} className="search-icon" />
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search 3D models..."
            className="expandable-search-input"
          />
          {query && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onQueryChange('')}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            className="search-close-btn"
            onClick={() => {
              setIsSearchOpen(false);
              onQueryChange('');
            }}
            title="Close search"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Desktop static search (shown when expandable is not open) */}
      {!isSearchOpen && (
        <div className="header-search">
          <SearchField value={query} onChange={onQueryChange} />
        </div>
      )}

      <div className="header-actions">
        {/* Top Search Button */}
        <button
          type="button"
          className={`btn-icon header-search-toggle ${isSearchOpen ? 'active' : ''}`}
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          title={isSearchOpen ? 'Close search' : 'Search models'}
          aria-label="Search models"
          aria-expanded={isSearchOpen}
        >
          <Search size={18} />
        </button>

        <ProjectionSelector />

        <EnvironmentSelector />

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

        <button className="btn-icon hide-on-mobile" onClick={triggerFullscreen} title="Toggle fullscreen">
          <Maximize size={18} />
        </button>

        <button
          className="btn-icon hide-on-mobile"
          onClick={() => setIsSettingsOpen(true)}
          title="Stereo calibration & settings"
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

        {canInstall && (
          <button
            className="btn-icon pwa-install-btn"
            onClick={triggerInstall}
            title="Install Cuenect App to Home Screen"
            style={{
              borderColor: 'var(--color-primary)',
              color: 'var(--color-primary)'
            }}
          >
            <Download size={18} />
          </button>
        )}
      </div>
    </header>
  );
};

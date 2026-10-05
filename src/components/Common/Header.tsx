import React, { useState } from 'react';
import { useStage } from '../../context/StageContext';
import { ListMusic, Download, Monitor, MoreVertical, Layers } from 'lucide-react';
import { usePWAInstall } from '../../services/pwaService';
import { ConnectionStatus } from './ConnectionStatus';
import StageStatusTrigger from '../Stage/StageStatusTrigger';
import { ProjectionSelector } from './ProjectionSelector';

interface HeaderProps {
  onOpenConnection: () => void;
  onOpenPlaylistMaker: () => void;
  onOpenMore?: () => void;
}

/**
 * Restrained Header:
 * High-frequency state indicators and navigation:
 * Brand, Canonical Projection Mode, Stage/Operator status pill,
 * Multi-Stage Director badge (if active), Desktop Playlist Trigger, and Unified More Trigger.
 * Low-frequency controls (Environment, Camera, Fullscreen, Calibration) are moved to More.
 */
export const Header: React.FC<HeaderProps> = ({
  onOpenConnection,
  onOpenPlaylistMaker,
  onOpenMore
}) => {
  const {
    selectedPlaylist,
    customPlaylistIds,
    stages,
    selectedStageIds,
    setIsStageDirectorOpen
  } = useStage();

  const [logoError, setLogoError] = useState<boolean>(false);
  const { canInstall, triggerInstall } = usePWAInstall();

  const onlineStages = stages.filter((s) => s.online);

  return (
    <header className="app-header">
      <div className="header-brand">
        {!logoError ? (
          <img
            src="/icon-192.png"
            alt="Cuenect"
            className="header-logo-img"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="header-logo-fallback">
            <Layers size={24} />
          </div>
        )}
        <div className="header-title-wrap">
          <h1 className="header-title">CUENECT</h1>
          <div className="header-subtitle">
            {selectedPlaylist !== 'All' ? `Playlist: ${selectedPlaylist}` : 'Hologram Controller'}
          </div>
        </div>
      </div>

      <div className="header-actions">
        {/* Canonical Projection Selector */}
        <ProjectionSelector />

        {/* Stage Director Matrix Badge (conditional if stages exist) */}
                {/* Compact Stage status trigger */}
        <StageStatusTrigger />

        {/* Stage Link / Operator Pill */}
        <ConnectionStatus onClick={onOpenConnection} />

        {/* Desktop Playlist Queue Button */}
        <button
          type="button"
          className="btn btn-secondary hide-on-mobile"
          onClick={onOpenPlaylistMaker}
          title="Open Playlist Queue"
          style={{
            height: 36,
            padding: '0 12px',
            fontSize: '0.78rem',
            gap: 6,
            borderRadius: 'var(--radius-full)'
          }}
        >
          <ListMusic size={15} />
          <span>Playlist</span>
          {customPlaylistIds.length > 0 && (
            <span
              style={{
                background: 'var(--accent-signature-dim)',
                color: 'var(--accent-signature)',
                padding: '1px 6px',
                borderRadius: 999,
                fontSize: '0.68rem',
                fontWeight: 700
              }}
            >
              {customPlaylistIds.length}
            </span>
          )}
        </button>

        {/* PWA Install Button (if available) */}
        {canInstall && (
          <button
            className="btn-icon pwa-install-btn"
            onClick={triggerInstall}
            title="Install Cuenect App to Home Screen"
            style={{
              borderColor: 'var(--accent-signature)',
              color: 'var(--accent-signature)'
            }}
          >
            <Download size={17} />
          </button>
        )}

        {/* Unified System / More Menu Trigger */}
        {onOpenMore && (
          <button
            type="button"
            className="btn-icon"
            onClick={onOpenMore}
            title="More Options & System Settings"
            aria-label="More Options & System Settings"
          >
            <MoreVertical size={18} />
          </button>
        )}
      </div>
    </header>
  );
};

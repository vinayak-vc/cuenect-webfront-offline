import React from 'react';
import { useStage } from '../../context/StageContext';
import { Box, RefreshCw, ListPlus, Users, Sliders } from 'lucide-react';

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
    setIsSettingsOpen
  } = useStage();

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
        <Box className="header-logo" />
        <div>
          <h1 className="header-title">CUENECT</h1>
          <div className="header-subtitle">
            {selectedPlaylist !== 'All' ? `Playlist: ${selectedPlaylist}` : 'Holo Stage Controller'}
          </div>
        </div>
      </div>

      <div className="header-actions">
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
          onClick={() => setIsSettingsOpen(true)}
          title="Stage & 3D Settings"
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
                top: 4,
                right: 4,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: '#000',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
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

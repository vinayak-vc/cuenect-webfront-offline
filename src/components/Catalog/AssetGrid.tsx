import React from 'react';
import { useStage } from '../../context/StageContext';
import { AssetCard } from './AssetCard';
import { Layers, WifiOff, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface AssetGridProps {
  onOpenConnection: () => void;
}

export const AssetGrid: React.FC<AssetGridProps> = ({ onOpenConnection }) => {
  const {
    assets,
    selectedPlaylist,
    setSelectedPlaylist,
    connectionState,
    refreshAssets,
    config
  } = useStage();

  // State 1: Connecting in progress
  if (connectionState === 'connecting') {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          textAlign: 'center',
          gap: 16
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)'
          }}
        >
          <Loader2 size={36} className="spin" />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Connecting to Stage...</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 360, fontSize: '0.85rem' }}>
          Establishing WebSocket connection with {config.serverIp || 'stage server'}...
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenConnection}
          style={{ fontSize: '0.85rem' }}
        >
          Connection Settings
        </button>
      </div>
    );
  }

  // State 2: Connection Error
  if (connectionState === 'error') {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          textAlign: 'center',
          gap: 16
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-danger)'
          }}
        >
          <AlertCircle size={36} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-danger)' }}>
          Connection Error
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 380, fontSize: '0.85rem' }}>
          Could not connect to {config.serverIp || 'stage'}. Ensure the stage server is running and your device is on the same local network.
        </p>
        <button type="button" className="btn btn-primary" onClick={onOpenConnection}>
          Retry Connection
        </button>
      </div>
    );
  }

  // State 3: Disconnected
  if (connectionState === 'disconnected') {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          textAlign: 'center',
          gap: 16
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)'
          }}
        >
          <WifiOff size={32} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Stage Disconnected</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 360, fontSize: '0.85rem' }}>
          Connect to the Hologram Stage's local server or scan the QR code to load 3D models and media.
        </p>
        <button type="button" className="btn btn-primary" onClick={onOpenConnection}>
          Connect to Stage
        </button>
      </div>
    );
  }

  // State 4: Connected, but assets list is still loading/syncing from stage
  if (assets.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          textAlign: 'center',
          gap: 16
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)'
          }}
        >
          <Loader2 size={32} className="spin" />
        </div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Syncing with Stage...</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 340, fontSize: '0.85rem' }}>
          Requesting media catalog from the connected stage application.
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={refreshAssets}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} />
          Request Assets
        </button>
      </div>
    );
  }

  // State 5: Filtered Playlist items
  const filtered = selectedPlaylist === 'All'
    ? assets
    : assets.filter((a) => a.PlaylistName === selectedPlaylist);

  if (filtered.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          textAlign: 'center',
          gap: 12
        }}
      >
        <Layers size={40} color="var(--text-muted)" />
        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>No assets found in "{selectedPlaylist}"</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          {assets.length} total assets available across other playlists.
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setSelectedPlaylist('All')}
          style={{ fontSize: '0.85rem', marginTop: 4 }}
        >
          View All Assets ({assets.length})
        </button>
      </div>
    );
  }

  return (
    <main className="catalog-container">
      <div className="asset-grid">
        {filtered.map((asset) => (
          <AssetCard key={asset.AssetID} asset={asset} />
        ))}
      </div>
    </main>
  );
};

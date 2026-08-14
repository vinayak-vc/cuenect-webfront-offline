import React from 'react';
import { useStage } from '../../context/StageContext';
import { AssetCard } from './AssetCard';
import { Layers, WifiOff } from 'lucide-react';

interface AssetGridProps {
  onOpenConnection: () => void;
}

export const AssetGrid: React.FC<AssetGridProps> = ({ onOpenConnection }) => {
  const { assets, selectedPlaylist, connectionState } = useStage();

  if (connectionState !== 'connected') {
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
        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>No assets found</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          No media available in "{selectedPlaylist}"
        </p>
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

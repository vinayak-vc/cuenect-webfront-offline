import React, { useMemo } from 'react';
import { useStage } from '../../context/StageContext';
import { AssetCard } from './AssetCard';
import { SearchField } from '../Common/SearchField';
import { StateView, SkeletonGrid } from '../Common/StateView';
import { DataType, resolveCategory } from '../../types/protocol';
import { Layers, WifiOff, Loader2, RefreshCw, AlertCircle, SearchX } from 'lucide-react';

interface AssetGridProps {
  onOpenConnection: () => void;
  query: string;
  onQueryChange: (value: string) => void;
}

type TypeFilter = 'all' | 'recent' | 'favourites' | 'models' | 'videos' | 'images';

const TYPE_FILTERS: Array<{ id: TypeFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'recent', label: 'Recent' },
  { id: 'favourites', label: 'Favorites' },
  { id: 'models', label: '3D Models' },
  { id: 'videos', label: 'Videos' },
  { id: 'images', label: 'Images' }
];

/**
 * Asset browser: search, type + playlist filters, responsive grid.
 *
 * Filters are derived from the real data model (Category + PlaylistName) - no
 * invented taxonomy such as favourites or tags, which the stage catalog does
 * not provide.
 */
export const AssetGrid: React.FC<AssetGridProps> = ({ onOpenConnection, query, onQueryChange }) => {
  const {
    assets,
    playlists,
    selectedPlaylist,
    setSelectedPlaylist,
    connectionState,
    refreshAssets,
    config,
    recentAssetIds,
    favouriteAssetIds
  } = useStage();

  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>('all');

  const typeCounts = useMemo(() => {
    let models = 0;
    let videos = 0;
    let images = 0;
    for (const a of assets) {
      const c = resolveCategory(a);
      if (c === DataType.Model) models++;
      else if (c === DataType.Video) videos++;
      else if (c === DataType.Image) images++;
    }
    const known = new Set(assets.map((a) => a.AssetID));
    return {
      all: assets.length,
      recent: recentAssetIds.filter((id) => known.has(id)).length,
      favourites: favouriteAssetIds.filter((id) => known.has(id)).length,
      models,
      videos,
      images
    };
  }, [assets, recentAssetIds, favouriteAssetIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matched = assets.filter((a) => {
      if (selectedPlaylist !== 'All' && a.PlaylistName !== selectedPlaylist) return false;

      if (typeFilter === 'recent' && !recentAssetIds.includes(a.AssetID)) return false;
      if (typeFilter === 'favourites' && !favouriteAssetIds.includes(a.AssetID)) return false;

      if (typeFilter === 'models' || typeFilter === 'videos' || typeFilter === 'images') {
        const c = resolveCategory(a);
        if (typeFilter === 'models' && c !== DataType.Model) return false;
        if (typeFilter === 'videos' && c !== DataType.Video) return false;
        if (typeFilter === 'images' && c !== DataType.Image) return false;
      }

      if (!q) return true;
      // Name and asset ID are the two identifiers operators actually use.
      return (
        (a.AssetName || '').toLowerCase().includes(q) ||
        (a.AssetID || '').toLowerCase().includes(q)
      );
    });

    // Recent is only useful in most-recent-first order.
    if (typeFilter === 'recent') {
      const order = new Map(recentAssetIds.map((id, i) => [id, i]));
      return [...matched].sort(
        (a, b) => (order.get(a.AssetID) ?? 999) - (order.get(b.AssetID) ?? 999)
      );
    }

    return matched;
  }, [assets, selectedPlaylist, typeFilter, query, recentAssetIds, favouriteAssetIds]);

  if (connectionState === 'connecting') {
    return (
      <StateView
        icon={<Loader2 size={30} className="spin" />}
        title="Connecting to stage"
        description={`Establishing a link with ${config.serverIp || 'the stage server'}.`}
        actions={
          <button type="button" className="btn btn-secondary" onClick={onOpenConnection}>
            Connection Settings
          </button>
        }
      />
    );
  }

  if (connectionState === 'error') {
    return (
      <StateView
        tone="danger"
        icon={<AlertCircle size={30} />}
        title="Unable to reach the stage"
        description={`No response from ${config.serverIp || 'the stage'}. Check that the stage server is running and this device is on the same network.`}
        actions={
          <>
            <button type="button" className="btn btn-primary" onClick={onOpenConnection}>
              Retry Connection
            </button>
            <button type="button" className="btn btn-secondary" onClick={onOpenConnection}>
              Details
            </button>
          </>
        }
      />
    );
  }

  if (connectionState === 'disconnected') {
    return (
      <StateView
        icon={<WifiOff size={28} />}
        title="Stage disconnected"
        description="Connect to the hologram stage's local server, or scan its QR code, to browse and load assets."
        actions={
          <button type="button" className="btn btn-primary" onClick={onOpenConnection}>
            Connect to Stage
          </button>
        }
      />
    );
  }

  // Connected, catalog still arriving: skeletons reflect the real sync state.
  if (assets.length === 0) {
    return (
      <div className="catalog-container">
        <div className="catalog-toolbar">
          <div className="catalog-toolbar-row">
            <span className="u-section-label">Syncing catalog from stage</span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={refreshAssets}
              style={{ minHeight: 38, fontSize: '0.78rem', gap: 6 }}
            >
              <RefreshCw size={14} />
              Request Assets
            </button>
          </div>
        </div>
        <SkeletonGrid count={8} />
      </div>
    );
  }

  return (
    <div className="catalog-container">
      <div className="catalog-toolbar">
        <div className="catalog-search-mobile">
          <SearchField value={query} onChange={onQueryChange} placeholder="Search models..." />
        </div>

        <div className="filter-rail" role="group" aria-label="Filter by type">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`filter-chip ${typeFilter === f.id ? 'active' : ''}`}
              onClick={() => setTypeFilter(f.id)}
            >
              {f.label}
              <span className="filter-chip-count">{typeCounts[f.id]}</span>
            </button>
          ))}

          {/* Playlist chips. "All" is omitted - the type rail already owns that
              slot; clicking an active playlist clears back to the full catalog. */}
          {playlists
            .filter((name) => name !== 'All')
            .map((name) => (
              <button
                key={name}
                type="button"
                className={`filter-chip ${selectedPlaylist === name ? 'active' : ''}`}
                onClick={() => setSelectedPlaylist(selectedPlaylist === name ? 'All' : name)}
              >
                {name}
              </button>
            ))}
        </div>

        <div className="catalog-toolbar-row">
          <span className="catalog-count">
            {filtered.length} of {assets.length} assets
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <StateView
          icon={query ? <SearchX size={26} /> : <Layers size={26} />}
          title={query ? `No matches for "${query}"` : 'Nothing in this filter'}
          description={
            query
              ? 'Try a different name or asset ID, or clear the search to see the full catalog.'
              : `${assets.length} assets are available under other filters.`
          }
          actions={
            <>
              {query && (
                <button type="button" className="btn btn-primary" onClick={() => onQueryChange('')}>
                  Clear Search
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setTypeFilter('all');
                  setSelectedPlaylist('All');
                }}
              >
                Show All Assets
              </button>
            </>
          }
        />
      ) : (
        <div className="asset-grid">
          {filtered.map((asset) => (
            <AssetCard key={asset.AssetID} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
};

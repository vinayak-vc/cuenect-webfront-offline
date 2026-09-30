import React, { useMemo } from 'react';
import { useStage } from '../../context/StageContext';
import { AssetCard } from './AssetCard';
import { ExploreCard } from './ExploreCard';
import { SearchField } from '../Common/SearchField';
import { StateView, SkeletonGrid } from '../Common/StateView';
import { DataType, resolveCategory } from '../../types/protocol';
import {
  Layers,
  WifiOff,
  Loader2,
  RefreshCw,
  AlertCircle,
  SearchX,
  Compass,
  HardDrive,
  Shuffle
} from 'lucide-react';

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
 * Asset browser:
 * - "Downloaded" tab: shows locally downloaded models from CuenectDatabase.json
 * - "Explore" tab: shows 10 random CC0 models from the Smithsonian 3D API with search,
 *   shuffle, and background download progress.
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
    favouriteAssetIds,
    catalogTab,
    setCatalogTab,
    exploreModels,
    isExploreLoading,
    isExploreOffline,
    exploreOfflineReason,
    exploreQuery,
    setExploreQuery,
    fetchExploreCatalog,
    activeDownloads
  } = useStage();

  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>('all');

  const activeDownloadCount = Object.keys(activeDownloads).length;

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
        title="Connecting"
        description={`Establishing a link with ${config.serverIp || 'the server'}.`}
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
        title="Unable to reach the server"
        description={`No response from ${config.serverIp || 'the server'}. Check that the server is running and this device is on the same network.`}
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
        title="Disconnected"
        description="Connect to the local server, or scan its QR code, to browse and load assets."
        actions={
          <button type="button" className="btn btn-primary" onClick={onOpenConnection}>
            Connect
          </button>
        }
      />
    );
  }

  const renderTabSwitcher = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap',
        marginBottom: 4
      }}
    >
      <div
        role="tablist"
        aria-label="Catalog Source"
        style={{
          display: 'inline-flex',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
          borderRadius: 'var(--radius-full, 9999px)',
          padding: 3,
          gap: 4
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={catalogTab === 'downloaded'}
          onClick={() => setCatalogTab('downloaded')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '7px 16px',
            borderRadius: 'var(--radius-full, 9999px)',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            background:
              catalogTab === 'downloaded'
                ? 'var(--color-primary, #0ea5e9)'
                : 'transparent',
            color: catalogTab === 'downloaded' ? '#fff' : 'var(--text-secondary, #94a3b8)',
            transition: 'all 0.15s ease'
          }}
        >
          <HardDrive size={14} />
          <span>Downloaded</span>
          <span
            style={{
              fontSize: '0.7rem',
              padding: '1px 6px',
              borderRadius: 999,
              background:
                catalogTab === 'downloaded'
                  ? 'rgba(255, 255, 255, 0.22)'
                  : 'rgba(255, 255, 255, 0.08)'
            }}
          >
            {assets.length}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={catalogTab === 'explore'}
          onClick={() => setCatalogTab('explore')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '7px 16px',
            borderRadius: 'var(--radius-full, 9999px)',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            background:
              catalogTab === 'explore'
                ? 'var(--color-primary, #0ea5e9)'
                : 'transparent',
            color: catalogTab === 'explore' ? '#fff' : 'var(--text-secondary, #94a3b8)',
            transition: 'all 0.15s ease'
          }}
        >
          <Compass size={14} />
          <span>Explore</span>
          <span
            style={{
              fontSize: '0.66rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: 999,
              background:
                catalogTab === 'explore'
                  ? 'rgba(255, 255, 255, 0.22)'
                  : 'rgba(0, 229, 255, 0.15)',
              color: catalogTab === 'explore' ? '#fff' : '#00e5ff'
            }}
          >
            CC0
          </span>
          {activeDownloadCount > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.68rem',
                padding: '1px 6px',
                borderRadius: 999,
                background: 'rgba(34, 197, 94, 0.22)',
                color: '#4ade80'
              }}
            >
              <Loader2 size={11} className="spin" />
              {activeDownloadCount}
            </span>
          )}
        </button>
      </div>

      {catalogTab === 'explore' && (
        <button
          type="button"
          className="btn btn-secondary"
          disabled={isExploreLoading}
          onClick={() => fetchExploreCatalog(exploreQuery)}
          style={{ minHeight: 36, fontSize: '0.78rem', gap: 6 }}
          title="Fetch 10 new random CC0 models from Smithsonian 3D"
        >
          {isExploreLoading ? <Loader2 size={14} className="spin" /> : <Shuffle size={14} />}
          <span>Shuffle 10 Models</span>
        </button>
      )}
    </div>
  );

  // ---------------- EXPLORE TAB VIEW ----------------
  if (catalogTab === 'explore') {
    return (
      <div className="catalog-container">
        <div className="catalog-toolbar">
          {renderTabSwitcher()}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchExploreCatalog(exploreQuery);
            }}
            style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center' }}
          >
            <div style={{ flex: 1 }}>
              <SearchField
                value={exploreQuery}
                onChange={(val) => {
                  setExploreQuery(val);
                  if (val === '' && exploreQuery !== '') {
                    fetchExploreCatalog('');
                  }
                }}
                placeholder="Search Smithsonian 3D Open Access (e.g. Apollo, fossil, skull, statue)..."
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isExploreLoading}
              style={{ minHeight: 38, padding: '0 14px', fontSize: '0.8rem', flexShrink: 0 }}
            >
              Search
            </button>
          </form>

          <div className="catalog-toolbar-row">
            <span className="catalog-count">
              {isExploreLoading
                ? 'Discovering CC0 models from Smithsonian 3D API...'
                : `Showing ${exploreModels.length} random CC0 models from Smithsonian Institution`}
            </span>
          </div>
        </div>

        {isExploreLoading ? (
          <SkeletonGrid count={10} />
        ) : isExploreOffline ? (
          <StateView
            tone="default"
            icon={<WifiOff size={28} />}
            title="Smithsonian Explore Offline"
            description={
              exploreOfflineReason ||
              'Unable to reach the Smithsonian 3D API. Your downloaded models remain available offline.'
            }
            actions={
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => fetchExploreCatalog(exploreQuery)}
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCatalogTab('downloaded')}
                >
                  View Downloaded Models
                </button>
              </>
            }
          />
        ) : exploreModels.length === 0 ? (
          <StateView
            icon={<SearchX size={26} />}
            title={exploreQuery ? `No CC0 models found for "${exploreQuery}"` : 'No models returned'}
            description="Try a different search term or shuffle to sample another 10 random Smithsonian 3D models."
            actions={
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setExploreQuery('');
                  fetchExploreCatalog('');
                }}
              >
                <Shuffle size={14} />
                Shuffle 10 Random Models
              </button>
            }
          />
        ) : (
          <div className="asset-grid">
            {exploreModels.map((model) => (
              <ExploreCard key={model.smithsonianId} model={model} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------------- DOWNLOADED TAB VIEW ----------------
  // Connected, catalog still arriving: skeletons reflect the real sync state.
  if (assets.length === 0) {
    return (
      <div className="catalog-container">
        <div className="catalog-toolbar">
          {renderTabSwitcher()}
          <div className="catalog-toolbar-row">
            <span className="u-section-label">Syncing catalog</span>
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
        {renderTabSwitcher()}

        <div className="catalog-search-mobile">
          <SearchField value={query} onChange={onQueryChange} placeholder="Search downloaded models..." />
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
            {filtered.length} of {assets.length} downloaded assets
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

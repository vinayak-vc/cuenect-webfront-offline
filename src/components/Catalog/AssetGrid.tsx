import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
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
  Shuffle,
  Sparkles,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Send
} from 'lucide-react';
import { ConfiguratorProject } from '../Configurator/types';
import { STARTER_TEMPLATES } from '../Configurator/templates';
import { generateProjectSVG } from '../Configurator/svgExporter';
import { QuickTemplateModal } from './QuickTemplateModal';

interface AssetGridProps {
  onOpenConnection: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  onOpenConfigurator?: (project?: ConfiguratorProject) => void;
  onOpenUploadModal?: () => void;
}

type TypeFilter = 'all' | 'templates' | 'recent' | 'favourites' | 'models' | 'videos' | 'images';

const TYPE_FILTERS: Array<{ id: TypeFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'templates', label: 'Templates' },
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
export const AssetGrid: React.FC<AssetGridProps> = ({
  onOpenConnection,
  query,
  onQueryChange,
  onOpenConfigurator,
  onOpenUploadModal
}) => {
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

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedTemplateForModal, setSelectedTemplateForModal] = useState<ConfiguratorProject | null>(null);
  const [isQuickTemplateOpen, setIsQuickTemplateOpen] = useState<boolean>(false);

  // All occasion templates (pre-built starter templates + user saved projects from image editor)
  const allTemplates = useMemo<ConfiguratorProject[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cuenect_saved_projects') || '[]');
      const combined = [...STARTER_TEMPLATES];
      saved.forEach((p: ConfiguratorProject) => {
        if (!combined.some((item) => item.id === p.id)) {
          combined.push(p);
        }
      });
      return combined;
    } catch {
      return STARTER_TEMPLATES;
    }
  }, []);

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allTemplates;
    return allTemplates.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      t.layers.some((l) => (l.name || '').toLowerCase().includes(q) || (l.editableLabel || '').toLowerCase().includes(q))
    );
  }, [allTemplates, query]);

  const filterRailRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const checkRailScroll = useCallback(() => {
    const el = filterRailRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    checkRailScroll();
    const el = filterRailRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkRailScroll, { passive: true });
    window.addEventListener('resize', checkRailScroll);
    return () => {
      el.removeEventListener('scroll', checkRailScroll);
      window.removeEventListener('resize', checkRailScroll);
    };
  }, [checkRailScroll, playlists, typeFilter]);

  const handleFilterRailWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    startXRef.current = e.pageX - (filterRailRef.current?.offsetLeft || 0);
    scrollLeftRef.current = filterRailRef.current?.scrollLeft || 0;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !filterRailRef.current) return;
    const x = e.pageX - (filterRailRef.current.offsetLeft || 0);
    const walk = (x - startXRef.current) * 1.5;
    filterRailRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const scrollRail = (direction: 'left' | 'right') => {
    if (!filterRailRef.current) return;
    const amount = direction === 'left' ? -240 : 240;
    filterRailRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

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
      templates: allTemplates.length,
      recent: recentAssetIds.filter((id) => known.has(id)).length,
      favourites: favouriteAssetIds.filter((id) => known.has(id)).length,
      models,
      videos,
      images
    };
  }, [assets, recentAssetIds, favouriteAssetIds, allTemplates]);

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

        {onOpenConfigurator && (
          <button
            type="button"
            onClick={() => onOpenConfigurator()}
            title="Create Custom Graphic in Image Studio"
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
              background: 'transparent',
              color: 'var(--accent-signature, #68D9D0)',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={14} />
            <span>Image Studio</span>
          </button>
        )}

        {onOpenUploadModal && (
          <button
            type="button"
            onClick={onOpenUploadModal}
            title="Upload Models, Videos, or Images to Stage"
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
              background: 'transparent',
              color: '#0D99FF',
              transition: 'all 0.15s ease'
            }}
          >
            <UploadCloud size={14} />
            <span>Upload Asset</span>
          </button>
        )}
      </div>

      {catalogTab === 'explore' && (
        <button
          type="button"
          className="btn btn-secondary"
          disabled={isExploreLoading}
          onClick={() => fetchExploreCatalog(exploreQuery)}
          style={{ minHeight: 38, padding: '8px 16px', fontSize: '0.8rem', gap: 8 }}
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
    const cleanOfflineReason = exploreOfflineReason
      ? exploreOfflineReason.replace(/\s*API\b/gi, '')
      : 'Unable to reach Smithsonian 3D. Your downloaded models remain available offline.';

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
              style={{ minHeight: 38, padding: '8px 16px', fontSize: '0.8rem', flexShrink: 0 }}
            >
              Search
            </button>
          </form>

          <div className="catalog-toolbar-row">
            <span className="catalog-count">
              {isExploreLoading
                ? 'Discovering CC0 models from Smithsonian 3D...'
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
            description={cleanOfflineReason}
            actions={
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ minHeight: 38, padding: '8px 16px' }}
                  onClick={() => fetchExploreCatalog(exploreQuery)}
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ minHeight: 38, padding: '8px 16px' }}
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
                style={{ minHeight: 38, padding: '8px 16px' }}
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
              style={{ minHeight: 38, padding: '8px 16px', fontSize: '0.78rem', gap: 6 }}
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

        <div style={{ width: '100%' }}>
          <SearchField value={query} onChange={onQueryChange} placeholder="Search downloaded models..." />
        </div>

        <div className="filter-rail-container" style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollRail('left')}
              title="Scroll categories left"
              aria-label="Scroll categories left"
              style={{
                position: 'absolute',
                left: 0,
                zIndex: 4,
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'rgba(20, 20, 25, 0.88)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={16} />
            </button>
          )}

          <div
            className="filter-rail"
            role="group"
            aria-label="Filter by type"
            ref={filterRailRef}
            onWheel={handleFilterRailWheel}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
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

          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollRail('right')}
              title="Scroll categories right"
              aria-label="Scroll categories right"
              style={{
                position: 'absolute',
                right: 0,
                zIndex: 4,
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'rgba(20, 20, 25, 0.88)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                cursor: 'pointer'
              }}
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        <div className="catalog-toolbar-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="catalog-count">
            {typeFilter === 'templates'
              ? `Showing ${filteredTemplates.length} occasion templates for instant stage display`
              : `${filtered.length} of ${assets.length} downloaded assets`}
          </span>
        </div>
      </div>

      {typeFilter === 'templates' ? (
        filteredTemplates.length === 0 ? (
          <StateView
            icon={query ? <SearchX size={26} /> : <Layers size={26} />}
            title={query ? `No templates found for "${query}"` : 'No templates available'}
            description="Clear search or create a new template in the Image Studio."
            actions={
              query ? (
                <button type="button" className="btn btn-primary" onClick={() => onQueryChange('')}>
                  Clear Search
                </button>
              ) : onOpenConfigurator ? (
                <button type="button" className="btn btn-primary" onClick={() => onOpenConfigurator()}>
                  <Sparkles size={14} /> Create in Studio
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="asset-grid">
            {filteredTemplates.map((template) => {
              const editableFields = template.layers.filter((l) => Boolean(l.isEditable || l.isTemplateField));
              const svgPreview = generateProjectSVG(template).replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"');

              return (
                <div
                  key={template.id}
                  className="asset-card"
                  onClick={() => {
                    setSelectedTemplateForModal(template);
                    setIsQuickTemplateOpen(true);
                  }}
                  style={{
                    background: '#16161A',
                    border: '1px solid #282830',
                    borderRadius: 12,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0D99FF';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(13, 153, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#282830';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Aspect Ratio 16:9 Thumbnail SVG */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '16 / 9',
                      background: '#0B0B0E',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      borderBottom: '1px solid #22222A'
                    }}
                  >
                    <div
                      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                      dangerouslySetInnerHTML={{ __html: svgPreview }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(13, 153, 255, 0.9)',
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 999,
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                      }}
                    >
                      {editableFields.length} Editable Fields
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {template.title}
                    </h4>

                    {/* Chips showing editable fields */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 38 }}>
                      {editableFields.slice(0, 4).map((f) => (
                        <span
                          key={f.id}
                          style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: '#22222A',
                            color: '#9E9EB0',
                            border: '1px solid #2E2E3A'
                          }}
                        >
                          {f.editableLabel || f.templateLabel || f.name}
                        </span>
                      ))}
                      {editableFields.length > 4 && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: '#22222A',
                            color: '#0D99FF'
                          }}
                        >
                          +{editableFields.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: 'auto',
                        paddingTop: 8,
                        borderTop: '1px solid #22222A'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplateForModal(template);
                          setIsQuickTemplateOpen(true);
                        }}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '7px 12px',
                          background: 'linear-gradient(135deg, #0D99FF 0%, #0077CC 100%)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(13,153,255,0.3)'
                        }}
                      >
                        <Send size={12} />
                        <span>Use Template</span>
                      </button>

                      {onOpenConfigurator && (
                        <button
                          type="button"
                          onClick={() => onOpenConfigurator(template)}
                          title="Open in full studio editor"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '7px 9px',
                            background: '#22222A',
                            border: '1px solid #333340',
                            color: '#CCCCCC',
                            borderRadius: 6,
                            cursor: 'pointer'
                          }}
                        >
                          <Edit3 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : filtered.length === 0 ? (
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

      {/* Quick Template Customization Modal */}
      <QuickTemplateModal
        isOpen={isQuickTemplateOpen}
        template={selectedTemplateForModal}
        onClose={() => setIsQuickTemplateOpen(false)}
        onOpenInEditor={(proj) => {
          setIsQuickTemplateOpen(false);
          if (onOpenConfigurator) {
            onOpenConfigurator(proj);
          }
        }}
      />
    </div>
  );
};

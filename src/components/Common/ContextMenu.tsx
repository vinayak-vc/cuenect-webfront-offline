import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStage } from '../../context/StageContext';
import {
  AssetInformation,
  SmithsonianExploreModel,
  DisplayMode,
  MoveableAssetType,
  DataType,
  resolveCategory
} from '../../types/protocol';
import {
  Play,
  RotateCcw,
  SlidersHorizontal,
  ListMusic,
  Settings,
  Heart,
  Copy,
  Info,
  Maximize,
  Minimize,
  Monitor,
  Box,
  Image as ImageIcon,
  Film,
  Camera,
  Sun,
  Search,
  Move,
  RefreshCw,
  Tv,
  Check,
  CheckSquare,
  Square,
  Radio,
  Gamepad2,
  ExternalLink
} from 'lucide-react';

interface ContextMenuProps {
  onOpenConnection?: () => void;
  onOpenPlaylistMaker?: () => void;
  onOpenSettings?: () => void;
}

interface MenuState {
  x: number;
  y: number;
  type: 'asset' | 'explore' | 'controller' | 'global';
  asset?: AssetInformation;
  exploreModel?: SmithsonianExploreModel;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  onOpenConnection,
  onOpenPlaylistMaker,
  onOpenSettings
}) => {
  const {
    assets,
    exploreModels,
    activeAsset,
    loadAsset,
    setIsControllerOpen,
    setInspectedAsset,
    customPlaylistIds,
    addToCustomPlaylist,
    removeFromCustomPlaylist,
    favouriteAssetIds,
    toggleFavourite,
    startExploreDownload,
    resetModelTransform,
    stopAutoRotate,
    setMovableMode,
    currentMovableMode,
    isOrthographic,
    toggleOrthographic,
    isFullMetadataOpen,
    toggleFullMetadataModal,
    displayMode,
    setDisplayMode,
    triggerFullscreen,
    setIsStageDirectorOpen,
    setIsSettingsOpen,
    addToast
  } = useStage();

  const [menu, setMenu] = useState<MenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState<{ x: number; y: number } | null>(null);

  // Close context menu handler
  const closeMenu = useCallback(() => {
    setMenu(null);
    setAdjustedPos(null);
  }, []);

  // Global right-click interceptor
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 1. Check if right-clicked on an Asset card
      const assetCard = target.closest('[data-asset-id]') as HTMLElement | null;
      if (assetCard) {
        const assetId = assetCard.getAttribute('data-asset-id');
        const foundAsset = assets.find((a) => a.AssetID === assetId);
        if (foundAsset) {
          setMenu({
            x: e.clientX,
            y: e.clientY,
            type: 'asset',
            asset: foundAsset
          });
          return;
        }
      }

      // 2. Check if right-clicked on an Explore card
      const exploreCard = target.closest('[data-explore-id]') as HTMLElement | null;
      if (exploreCard) {
        const exploreId = exploreCard.getAttribute('data-explore-id');
        const foundModel = exploreModels.find((m) => m.smithsonianId === exploreId);
        if (foundModel) {
          setMenu({
            x: e.clientX,
            y: e.clientY,
            type: 'explore',
            exploreModel: foundModel
          });
          return;
        }
      }

      // 3. Check if right-clicked inside the 3D model viewport or controller
      const isController =
        Boolean(target.closest('[data-model-viewport]')) ||
        Boolean(target.closest('[data-controller-surface]'));

      if (isController && activeAsset) {
        setMenu({
          x: e.clientX,
          y: e.clientY,
          type: 'controller',
          asset: activeAsset
        });
        return;
      }

      // 4. Default: Global application context menu
      setMenu({
        x: e.clientX,
        y: e.clientY,
        type: 'global'
      });
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [assets, exploreModels, activeAsset]);

  // Adjust menu position so it never overflows off-screen
  useEffect(() => {
    if (!menu || !menuRef.current) return;

    const el = menuRef.current;
    const rect = el.getBoundingClientRect();
    const margin = 10;

    let posX = menu.x;
    let posY = menu.y;

    if (posX + rect.width > window.innerWidth - margin) {
      posX = Math.max(margin, window.innerWidth - rect.width - margin);
    }

    if (posY + rect.height > window.innerHeight - margin) {
      posY = Math.max(margin, window.innerHeight - rect.height - margin);
    }

    setAdjustedPos({ x: posX, y: posY });
  }, [menu]);

  // Dismiss on outside click, window blur, resize, scroll, or Escape key
  useEffect(() => {
    if (!menu) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    const handleScrollOrResize = () => {
      closeMenu();
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [menu, closeMenu]);

  if (!menu) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addToast('Copied', `${label} copied to clipboard`, 'success');
    }).catch(() => {
      addToast('Copy Failed', 'Unable to access clipboard', 'error');
    });
    closeMenu();
  };

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
    closeMenu();
  };

  const renderAssetMenu = (asset: AssetInformation) => {
    const isActive = activeAsset?.AssetID === asset.AssetID;
    const isInPlaylist = customPlaylistIds.includes(asset.AssetID);
    const isFavourite = favouriteAssetIds.includes(asset.AssetID);
    const category = resolveCategory(asset);

    return (
      <>
        {/* Header Summary */}
        <div className="ctx-header">
          <div className="ctx-icon-badge">
            {category === DataType.Video ? (
              <Film size={15} />
            ) : category === DataType.Image ? (
              <ImageIcon size={15} />
            ) : (
              <Box size={15} />
            )}
          </div>
          <div className="ctx-title-wrap">
            <div className="ctx-title" title={asset.AssetName}>
              {asset.AssetName}
            </div>
            <div className="ctx-subtitle">
              {category === DataType.Video
                ? 'Video Stream'
                : category === DataType.Image
                ? 'High-Res Image'
                : '3D Hologram Model'}
            </div>
          </div>
        </div>

        <div className="ctx-divider" />
        <div className="ctx-section-label">Actions</div>

        {/* Primary Load/Control */}
        <button
          type="button"
          className="ctx-item primary"
          onClick={() => {
            if (isActive) {
              setIsControllerOpen(true);
            } else {
              loadAsset(asset);
            }
            closeMenu();
          }}
        >
          {isActive ? (
            <>
              <Gamepad2 size={15} />
              <span>Open Controller Cockpit</span>
            </>
          ) : (
            <>
              <Play size={15} />
              <span>Load to Stage & Control</span>
            </>
          )}
        </button>

        {/* Inspect Specifications */}
        <button
          type="button"
          className="ctx-item"
          onClick={() => {
            setInspectedAsset(asset);
            closeMenu();
          }}
        >
          <Info size={15} />
          <span>Curatorial Specifications</span>
        </button>

        {/* Playlist Toggle */}
        <button
          type="button"
          className="ctx-item"
          onClick={() => {
            if (isInPlaylist) {
              removeFromCustomPlaylist(asset.AssetID);
            } else {
              addToCustomPlaylist(asset.AssetID);
            }
            closeMenu();
          }}
        >
          {isInPlaylist ? (
            <>
              <CheckSquare size={15} style={{ color: 'var(--accent-signature)' }} />
              <span>Remove from Playlist</span>
            </>
          ) : (
            <>
              <Square size={15} />
              <span>Add to Playlist Queue</span>
            </>
          )}
        </button>

        {/* Favourite Toggle */}
        <button
          type="button"
          className="ctx-item"
          onClick={() => {
            toggleFavourite(asset.AssetID);
            closeMenu();
          }}
        >
          <Heart
            size={15}
            fill={isFavourite ? 'var(--color-danger, #ef4444)' : 'none'}
            color={isFavourite ? 'var(--color-danger, #ef4444)' : 'currentColor'}
          />
          <span>{isFavourite ? 'Favorited' : 'Add to Favorites'}</span>
        </button>

        <div className="ctx-divider" />
        <div className="ctx-section-label">Utilities</div>

        {/* Copy Asset ID */}
        <button
          type="button"
          className="ctx-item"
          onClick={() => copyToClipboard(asset.AssetID, 'Asset ID')}
        >
          <Copy size={15} />
          <span>Copy Asset ID</span>
        </button>
      </>
    );
  };

  const renderExploreMenu = (model: SmithsonianExploreModel) => {
    const recordUrl = model.metadata?.sourceUrl || (model.smithsonianId ? `https://3d.si.edu/object/3d/${model.smithsonianId}` : undefined);

    return (
      <>
        <div className="ctx-header">
          <div className="ctx-icon-badge">
            <Box size={15} />
          </div>
          <div className="ctx-title-wrap">
            <div className="ctx-title" title={model.title}>
              {model.title}
            </div>
            <div className="ctx-subtitle">
              Smithsonian 3D · {model.fileSizeMB ? `${model.fileSizeMB.toFixed(1)} MB` : 'CC0'}
            </div>
          </div>
        </div>

        <div className="ctx-divider" />
        <div className="ctx-section-label">Actions</div>

        <button
          type="button"
          className="ctx-item primary"
          onClick={() => {
            startExploreDownload(model);
            closeMenu();
          }}
        >
          <Play size={15} />
          <span>Download & Load to Stage</span>
        </button>

        <button
          type="button"
          className="ctx-item"
          onClick={() => {
            setInspectedAsset(model);
            closeMenu();
          }}
        >
          <Info size={15} />
          <span>View Curatorial Record</span>
        </button>

        {recordUrl && (
          <button
            type="button"
            className="ctx-item"
            onClick={() => {
              window.open(recordUrl, '_blank', 'noopener,noreferrer');
              closeMenu();
            }}
          >
            <ExternalLink size={15} />
            <span>Open in Smithsonian 3D</span>
          </button>
        )}

        <div className="ctx-divider" />
        <div className="ctx-section-label">Utilities</div>

        <button
          type="button"
          className="ctx-item"
          onClick={() => copyToClipboard(model.smithsonianId, 'Smithsonian ID')}
        >
          <Copy size={15} />
          <span>Copy Smithsonian ID</span>
        </button>
      </>
    );
  };

  const renderControllerMenu = () => {
    return (
      <>
        <div className="ctx-header">
          <div className="ctx-icon-badge">
            <Gamepad2 size={15} />
          </div>
          <div className="ctx-title-wrap">
            <div className="ctx-title" title={activeAsset?.AssetName || 'Stage Model'}>
              {activeAsset?.AssetName || 'Model Cockpit'}
            </div>
            <div className="ctx-subtitle">3D Model Manipulation</div>
          </div>
        </div>

        <div className="ctx-divider" />
        <div className="ctx-section-label">Transform & Orientation</div>

        <button
          type="button"
          className="ctx-item"
          onClick={() => {
            resetModelTransform();
            closeMenu();
          }}
        >
          <RotateCcw size={15} />
          <span>Reset Transform (Center & Frame)</span>
        </button>

        <button
          type="button"
          className="ctx-item"
          onClick={() => {
            stopAutoRotate();
            closeMenu();
          }}
        >
          <RefreshCw size={15} />
          <span>Stop Auto-Rotate</span>
        </button>

        <div className="ctx-divider" />
        <div className="ctx-section-label">Manipulation Mode</div>

        <button
          type="button"
          className={`ctx-item ${currentMovableMode === MoveableAssetType.Rotate ? 'active' : ''}`}
          onClick={() => {
            setMovableMode(MoveableAssetType.Rotate);
            closeMenu();
          }}
        >
          <RotateCcw size={15} />
          <span>Orbit / Rotate</span>
          {currentMovableMode === MoveableAssetType.Rotate && (
            <Check size={14} className="ctx-check" />
          )}
        </button>

        <button
          type="button"
          className={`ctx-item ${currentMovableMode === MoveableAssetType.Pan ? 'active' : ''}`}
          onClick={() => {
            setMovableMode(MoveableAssetType.Pan);
            closeMenu();
          }}
        >
          <Move size={15} />
          <span>Pan / Translate</span>
          {currentMovableMode === MoveableAssetType.Pan && (
            <Check size={14} className="ctx-check" />
          )}
        </button>

        <button
          type="button"
          className={`ctx-item ${currentMovableMode === MoveableAssetType.Spotlight ? 'active' : ''}`}
          onClick={() => {
            setMovableMode(MoveableAssetType.Spotlight);
            closeMenu();
          }}
        >
          <Sun size={15} />
          <span>Spotlight / Lighting</span>
          {currentMovableMode === MoveableAssetType.Spotlight && (
            <Check size={14} className="ctx-check" />
          )}
        </button>

        <button
          type="button"
          className={`ctx-item ${currentMovableMode === MoveableAssetType.Magnifier ? 'active' : ''}`}
          onClick={() => {
            setMovableMode(MoveableAssetType.Magnifier);
            closeMenu();
          }}
        >
          <Search size={15} />
          <span>Magnifier Lens</span>
          {currentMovableMode === MoveableAssetType.Magnifier && (
            <Check size={14} className="ctx-check" />
          )}
        </button>

        <div className="ctx-divider" />
        <div className="ctx-section-label">Camera & Stage Display</div>

        <button
          type="button"
          className="ctx-item"
          onClick={() => {
            toggleOrthographic();
            closeMenu();
          }}
        >
          <Camera size={15} />
          <span>{isOrthographic ? 'Switch to Perspective' : 'Switch to Orthographic'}</span>
        </button>

        <button
          type="button"
          className="ctx-item"
          onClick={() => {
            toggleFullMetadataModal();
            closeMenu();
          }}
        >
          <Tv size={15} />
          <span>{isFullMetadataOpen ? 'Hide Unity Stage Overlay' : 'Show Unity Stage Overlay'}</span>
        </button>

        <button
          type="button"
          className="ctx-item"
          onClick={() => {
            triggerFullscreen();
            closeMenu();
          }}
        >
          <Maximize size={15} />
          <span>Toggle Unity Hologram Fullscreen</span>
        </button>
      </>
    );
  };

  const renderGlobalMenu = () => {
    return (
      <>
        <div className="ctx-header">
          <div className="ctx-icon-badge">
            <Monitor size={15} />
          </div>
          <div className="ctx-title-wrap">
            <div className="ctx-title">CUENECT CONSOLE</div>
            <div className="ctx-subtitle">Hologram Exhibition Control</div>
          </div>
        </div>

        <div className="ctx-divider" />
        <div className="ctx-section-label">Projection Mode</div>

        <button
          type="button"
          className={`ctx-item ${displayMode === DisplayMode.Mono2D ? 'active' : ''}`}
          onClick={() => {
            setDisplayMode(DisplayMode.Mono2D);
            closeMenu();
          }}
        >
          <Radio size={14} />
          <span>2D Flat Display</span>
          {displayMode === DisplayMode.Mono2D && <Check size={14} className="ctx-check" />}
        </button>

        <button
          type="button"
          className={`ctx-item ${displayMode === DisplayMode.StereoSbs ? 'active' : ''}`}
          onClick={() => {
            setDisplayMode(DisplayMode.StereoSbs);
            closeMenu();
          }}
        >
          <Radio size={14} />
          <span>Side-by-Side 3D (SBS)</span>
          {displayMode === DisplayMode.StereoSbs && <Check size={14} className="ctx-check" />}
        </button>

        <button
          type="button"
          className={`ctx-item ${displayMode === DisplayMode.HoloDevice ? 'active' : ''}`}
          onClick={() => {
            setDisplayMode(DisplayMode.HoloDevice);
            closeMenu();
          }}
        >
          <Radio size={14} />
          <span>Hologram Stage (HOLO)</span>
          {displayMode === DisplayMode.HoloDevice && <Check size={14} className="ctx-check" />}
        </button>

        <button
          type="button"
          className={`ctx-item ${displayMode === DisplayMode.KmaxDevice ? 'active' : ''}`}
          onClick={() => {
            setDisplayMode(DisplayMode.KmaxDevice);
            closeMenu();
          }}
        >
          <Radio size={14} />
          <span>Fullscreen Max (FMAX)</span>
          {displayMode === DisplayMode.KmaxDevice && <Check size={14} className="ctx-check" />}
        </button>

        <div className="ctx-divider" />
        <div className="ctx-section-label">Navigation & Surfaces</div>

        <button
          type="button"
          className="ctx-item"
          onClick={() => {
            setIsStageDirectorOpen(true);
            closeMenu();
          }}
        >
          <SlidersHorizontal size={15} />
          <span>Stage Director & Matrix</span>
        </button>

        <button
          type="button"
          className="ctx-item"
          onClick={() => {
            if (onOpenPlaylistMaker) onOpenPlaylistMaker();
            closeMenu();
          }}
        >
          <ListMusic size={15} />
          <span>Playlist Queue & Slideshow</span>
        </button>

        <button
          type="button"
          className="ctx-item"
          onClick={() => {
            if (onOpenConnection) onOpenConnection();
            closeMenu();
          }}
        >
          <Monitor size={15} />
          <span>Stage Link & Telemetry</span>
        </button>

        <div className="ctx-divider" />
        <div className="ctx-section-label">System & Display</div>

        <button
          type="button"
          className="ctx-item"
          onClick={() => {
            if (onOpenSettings) onOpenSettings();
            else setIsSettingsOpen(true);
            closeMenu();
          }}
        >
          <Settings size={15} />
          <span>Settings & Calibration</span>
        </button>

        <button type="button" className="ctx-item" onClick={toggleBrowserFullscreen}>
          {document.fullscreenElement ? <Minimize size={15} /> : <Maximize size={15} />}
          <span>{document.fullscreenElement ? 'Exit Browser Fullscreen' : 'Browser Fullscreen'}</span>
        </button>
      </>
    );
  };

  const posStyle: React.CSSProperties = {
    position: 'fixed',
    top: adjustedPos ? adjustedPos.y : menu.y,
    left: adjustedPos ? adjustedPos.x : menu.x,
    visibility: adjustedPos ? 'visible' : 'hidden'
  };

  return (
    <div
      ref={menuRef}
      className="custom-context-menu"
      style={posStyle}
      role="menu"
      aria-label="Cuenect Context Menu"
      tabIndex={-1}
    >
      {menu.type === 'asset' && menu.asset && renderAssetMenu(menu.asset)}
      {menu.type === 'explore' && menu.exploreModel && renderExploreMenu(menu.exploreModel)}
      {menu.type === 'controller' && renderControllerMenu()}
      {menu.type === 'global' && renderGlobalMenu()}
    </div>
  );
};

export default ContextMenu;

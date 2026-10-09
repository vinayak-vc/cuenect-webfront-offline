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
  Search,
  Move,
  RefreshCw,
  Tv,
  Check,
  CheckSquare,
  Square,
  Radio,
  Gamepad2,
  ExternalLink,
  Scissors,
  Clipboard,
  Trash2,
  X,
  LogOut,
  FileText
} from 'lucide-react';

interface ContextMenuProps {
  onOpenConnection?: () => void;
  onOpenPlaylistMaker?: () => void;
  onOpenSettings?: () => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

interface MenuState {
  x: number;
  y: number;
  type: 'editable-input' | 'text-selection' | 'asset' | 'explore' | 'controller' | 'stage-pill' | 'global';
  asset?: AssetInformation;
  exploreModel?: SmithsonianExploreModel;
  inputElement?: HTMLInputElement | HTMLTextAreaElement;
  selectedText?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  onOpenConnection,
  onOpenPlaylistMaker,
  onOpenSettings,
  searchQuery,
  onSearchQueryChange
}) => {
  const {
    stages,
    selectedStageIds,
    selectAllStages,
    clearStageSelection,
    assets,
    exploreModels,
    activeAsset,
    loadAsset,
    unloadAsset,
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

  const onlineStages = stages.filter((s) => s.online);
  const selectedOnlineCount = onlineStages.filter((s) => selectedStageIds.has(s.stageId)).length;

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

      // 1. Check if right-clicking an editable input or textarea
      const inputTarget =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
          ? target
          : (target.closest('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null);

      if (inputTarget) {
        const start = inputTarget.selectionStart ?? 0;
        const end = inputTarget.selectionEnd ?? 0;
        const inputSel = start !== end ? inputTarget.value.substring(start, end).trim() : '';

        setMenu({
          x: e.clientX,
          y: e.clientY,
          type: 'editable-input',
          inputElement: inputTarget,
          selectedText: inputSel
        });
        return;
      }

      // 2. Check if text is currently highlighted/selected on the page
      const winSel = window.getSelection()?.toString().trim() || '';
      if (winSel.length > 0) {
        setMenu({
          x: e.clientX,
          y: e.clientY,
          type: 'text-selection',
          selectedText: winSel
        });
        return;
      }

      // 3. Check if right-clicked on an Asset card
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

      // 4. Check if right-clicked on an Explore card
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

      // 5. Check if right-clicked on Stage trigger pill
      const stageTrigger = target.closest('.stage-trigger, [title*="Stage status"]') as HTMLElement | null;
      if (stageTrigger) {
        setMenu({
          x: e.clientX,
          y: e.clientY,
          type: 'stage-pill'
        });
        return;
      }

      // 6. Check if right-clicked inside the 3D model viewport or controller
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

      // 7. Default: Global application context menu
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

  // Helper: Copy string to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addToast('Copied', `${label} copied to clipboard`, 'success');
    }).catch(() => {
      addToast('Copy Failed', 'Unable to access clipboard', 'error');
    });
    closeMenu();
  };

  // Helper: Cut from input
  const handleCutInput = (input: HTMLInputElement | HTMLTextAreaElement) => {
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    if (start === end) return;
    const val = input.value;
    const selected = val.substring(start, end);
    navigator.clipboard.writeText(selected).then(() => {
      const newVal = val.slice(0, start) + val.slice(end);
      setNativeInputValue(input, newVal);
      input.focus();
      input.setSelectionRange(start, start);
      addToast('Cut', 'Text cut to clipboard', 'info');
    }).catch(() => {
      addToast('Cut Failed', 'Could not access clipboard', 'error');
    });
    closeMenu();
  };

  // Helper: Paste into input
  const handlePasteInput = async (input: HTMLInputElement | HTMLTextAreaElement) => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        addToast('Clipboard Empty', 'No text found in clipboard', 'info');
        closeMenu();
        return;
      }
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const val = input.value;
      const newVal = val.slice(0, start) + text + val.slice(end);
      setNativeInputValue(input, newVal);
      input.focus();
      input.setSelectionRange(start + text.length, start + text.length);
      addToast('Pasted', 'Text pasted from clipboard', 'info');
    } catch {
      addToast('Paste Unavailable', 'Clipboard permission not granted', 'warning');
    }
    closeMenu();
  };

  // Helper: Delete selected text in input
  const handleDeleteInput = (input: HTMLInputElement | HTMLTextAreaElement) => {
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    if (start === end) return;
    const val = input.value;
    const newVal = val.slice(0, start) + val.slice(end);
    setNativeInputValue(input, newVal);
    input.focus();
    input.setSelectionRange(start, start);
    closeMenu();
  };

  // Helper: Select all in input
  const handleSelectAllInput = (input: HTMLInputElement | HTMLTextAreaElement) => {
    input.focus();
    input.select();
    closeMenu();
  };

  // Helper: Clear input value
  const handleClearInput = (input: HTMLInputElement | HTMLTextAreaElement) => {
    setNativeInputValue(input, '');
    input.focus();
    closeMenu();
  };

  // Helper: set value and dispatch input/change events so React states update
  const setNativeInputValue = (input: HTMLInputElement | HTMLTextAreaElement, value: string) => {
    const proto = input instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };

  // Helper: Search catalog for query
  const handleSearchCatalog = (text: string) => {
    if (onSearchQueryChange) {
      onSearchQueryChange(text);
    }
    setIsControllerOpen(false);
    addToast('Catalog Search', `Searching for "${text.slice(0, 24)}"`, 'info');
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

  // ============================================================================
  // RENDER: Editable Input / Text Area Context
  // ============================================================================
  const renderEditableInputMenu = (input: HTMLInputElement | HTMLTextAreaElement, selText?: string) => {
    const hasSelection = Boolean(selText && selText.length > 0);
    const hasValue = input.value.length > 0;
    const isSearchInput = input.type === 'search' || input.className.includes('search') || input.placeholder.toLowerCase().includes('search');

    return (
      <>
        <div className="ctx-header">
          <div className="ctx-icon-badge">
            {isSearchInput ? <Search size={15} /> : <FileText size={15} />}
          </div>
          <div className="ctx-title-wrap">
            <div className="ctx-title">
              {hasSelection ? 'Selected Text' : isSearchInput ? 'Search Input' : 'Text Input'}
            </div>
            <div className="ctx-subtitle">
              {hasSelection ? `"${selText!.slice(0, 22)}${selText!.length > 22 ? '...' : ''}"` : input.placeholder || 'Editable field'}
            </div>
          </div>
        </div>

        <div className="ctx-divider" />
        <div className="ctx-section-label">Edit Actions</div>

        {hasSelection && (
          <button
            type="button"
            className="ctx-item"
            onClick={() => handleCutInput(input)}
          >
            <Scissors size={15} />
            <span>Cut</span>
            <span className="ctx-shortcut">Ctrl+X</span>
          </button>
        )}

        {hasSelection && (
          <button
            type="button"
            className="ctx-item"
            onClick={() => copyToClipboard(selText!, 'Selected text')}
          >
            <Copy size={15} />
            <span>Copy</span>
            <span className="ctx-shortcut">Ctrl+C</span>
          </button>
        )}

        <button
          type="button"
          className="ctx-item primary"
          onClick={() => handlePasteInput(input)}
        >
          <Clipboard size={15} />
          <span>Paste</span>
          <span className="ctx-shortcut">Ctrl+V</span>
        </button>

        {hasSelection && (
          <button
            type="button"
            className="ctx-item"
            onClick={() => handleDeleteInput(input)}
          >
            <Trash2 size={15} />
            <span>Delete</span>
            <span className="ctx-shortcut">Del</span>
          </button>
        )}

        {hasValue && (
          <button
            type="button"
            className="ctx-item"
            onClick={() => handleSelectAllInput(input)}
          >
            <CheckSquare size={15} />
            <span>Select All</span>
            <span className="ctx-shortcut">Ctrl+A</span>
          </button>
        )}

        {hasValue && (
          <button
            type="button"
            className="ctx-item"
            onClick={() => handleClearInput(input)}
          >
            <X size={15} />
            <span>Clear Field</span>
          </button>
        )}

        {hasSelection && (
          <>
            <div className="ctx-divider" />
            <div className="ctx-section-label">Catalog Actions</div>
            <button
              type="button"
              className="ctx-item"
              onClick={() => handleSearchCatalog(selText!)}
            >
              <Search size={15} />
              <span>Search Catalog for "{selText!.slice(0, 16)}"</span>
            </button>
          </>
        )}
      </>
    );
  };

  // ============================================================================
  // RENDER: Non-Editable Text Selection Context
  // ============================================================================
  const renderTextSelectionMenu = (selectedText: string) => {
    return (
      <>
        <div className="ctx-header">
          <div className="ctx-icon-badge">
            <FileText size={15} />
          </div>
          <div className="ctx-title-wrap">
            <div className="ctx-title">Text Selection</div>
            <div className="ctx-subtitle">"{selectedText.slice(0, 22)}{selectedText.length > 22 ? '...' : ''}"</div>
          </div>
        </div>

        <div className="ctx-divider" />
        <div className="ctx-section-label">Actions</div>

        <button
          type="button"
          className="ctx-item primary"
          onClick={() => copyToClipboard(selectedText, 'Selected text')}
        >
          <Copy size={15} />
          <span>Copy</span>
          <span className="ctx-shortcut">Ctrl+C</span>
        </button>

        <button
          type="button"
          className="ctx-item"
          onClick={() => handleSearchCatalog(selectedText)}
        >
          <Search size={15} />
          <span>Search Catalog for "{selectedText.slice(0, 16)}"</span>
        </button>

        <button
          type="button"
          className="ctx-item"
          onClick={() => {
            window.getSelection()?.removeAllRanges();
            closeMenu();
          }}
        >
          <X size={15} />
          <span>Deselect</span>
        </button>
      </>
    );
  };

  // ============================================================================
  // RENDER: Stage Trigger Pill Context
  // ============================================================================
  const renderStagePillMenu = () => {
    const isAllSelected = onlineStages.length > 0 && selectedOnlineCount === onlineStages.length;

    return (
      <>
        <div className="ctx-header">
          <div className="ctx-icon-badge">
            <Monitor size={15} />
          </div>
          <div className="ctx-title-wrap">
            <div className="ctx-title">Stage Status & Targeting</div>
            <div className="ctx-subtitle">{selectedOnlineCount} of {onlineStages.length} online stages targeted</div>
          </div>
        </div>

        <div className="ctx-divider" />
        <div className="ctx-section-label">Stage Targeting</div>

        {onlineStages.length > 0 && (
          <button
            type="button"
            className="ctx-item"
            onClick={() => {
              if (isAllSelected) clearStageSelection();
              else selectAllStages();
              closeMenu();
            }}
          >
            {isAllSelected ? (
              <>
                <Square size={15} />
                <span>Deselect All Stages</span>
              </>
            ) : (
              <>
                <CheckSquare size={15} />
                <span>Target All Online Stages</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          className="ctx-item primary"
          onClick={() => {
            setIsStageDirectorOpen(true);
            closeMenu();
          }}
        >
          <SlidersHorizontal size={15} />
          <span>Open Stage Director Matrix</span>
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
          <span>Stage Connection & Telemetry</span>
        </button>
      </>
    );
  };

  // ============================================================================
  // RENDER: Asset Card Context
  // ============================================================================
  const renderAssetMenu = (asset: AssetInformation) => {
    const isActive = activeAsset?.AssetID === asset.AssetID;
    const isInPlaylist = customPlaylistIds.includes(asset.AssetID);
    const isFavourite = favouriteAssetIds.includes(asset.AssetID);
    const category = resolveCategory(asset);

    return (
      <>
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

        {/* Unload active asset */}
        {isActive && (
          <button
            type="button"
            className="ctx-item"
            onClick={() => {
              unloadAsset();
              closeMenu();
            }}
          >
            <LogOut size={15} />
            <span>Unload from Stage</span>
          </button>
        )}

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

        <button
          type="button"
          className="ctx-item"
          onClick={() => copyToClipboard(asset.AssetName, 'Asset Name')}
        >
          <Copy size={15} />
          <span>Copy Asset Name</span>
        </button>
      </>
    );
  };

  // ============================================================================
  // RENDER: Smithsonian Explore Card Context
  // ============================================================================
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

  // ============================================================================
  // RENDER: 3D Model Viewport / Controller Context
  // ============================================================================
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
          <span className="ctx-shortcut">F</span>
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

        <button
          type="button"
          className="ctx-item"
          onClick={() => {
            unloadAsset();
            closeMenu();
          }}
        >
          <LogOut size={15} />
          <span>Unload from Stage</span>
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
          <span className="ctx-shortcut">Q</span>
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
          <span className="ctx-shortcut">E</span>
          {currentMovableMode === MoveableAssetType.Pan && (
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

  // ============================================================================
  // RENDER: Global Kiosk Context
  // ============================================================================
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

        {/* Active Search Filter Clear Affordance */}
        {searchQuery && (
          <>
            <div className="ctx-divider" />
            <div className="ctx-section-label">Catalog Filter</div>
            <button
              type="button"
              className="ctx-item"
              onClick={() => {
                if (onSearchQueryChange) onSearchQueryChange('');
                closeMenu();
              }}
            >
              <X size={15} />
              <span>Clear Filter ("{searchQuery.slice(0, 16)}")</span>
            </button>
          </>
        )}

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
      {menu.type === 'editable-input' && menu.inputElement && renderEditableInputMenu(menu.inputElement, menu.selectedText)}
      {menu.type === 'text-selection' && menu.selectedText && renderTextSelectionMenu(menu.selectedText)}
      {menu.type === 'stage-pill' && renderStagePillMenu()}
      {menu.type === 'asset' && menu.asset && renderAssetMenu(menu.asset)}
      {menu.type === 'explore' && menu.exploreModel && renderExploreMenu(menu.exploreModel)}
      {menu.type === 'controller' && renderControllerMenu()}
      {menu.type === 'global' && renderGlobalMenu()}
    </div>
  );
};

export default ContextMenu;

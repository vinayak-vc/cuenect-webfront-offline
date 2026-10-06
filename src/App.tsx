import React, { useEffect, useMemo, useState } from 'react';
import packageJson from '../package.json';
import { Header } from './components/Common/Header';
import { AssetGrid } from './components/Catalog/AssetGrid';
import { ConnectionModal } from './components/Connection/ConnectionModal';
import { FullScreenController } from './components/Controller/FullScreenController';
import { PlaylistMakerModal } from './components/Playlist/PlaylistMakerModal';
import { StageSettingsModal } from './components/Settings/StageSettingsModal';
import { SlideshowBar } from './components/Playlist/SlideshowBar';
import { ToastContainer } from './components/Common/Toast';
import { BottomNav, MobileSection } from './components/Common/BottomNav';
import { NowOnStage } from './components/Stage/NowOnStage';
import { BottomSheet } from './components/Common/BottomSheet';
import { StateView } from './components/Common/StateView';
import { AssetInspector } from './components/Inspector/AssetInspector';
import { MoreSheet } from './components/Stage/MoreSheet';
import { ProjectionSheet } from './components/Stage/ProjectionSheet';
import { StageDirectorModal } from './components/Stage/StageDirectorModal';
import { ConfirmDialog } from './components/Common/ConfirmDialog';
import { ContextMenu } from './components/Common/ContextMenu';
import { Gamepad2, Loader2 } from 'lucide-react';
import { EnvironmentPreset } from './types/protocol';
import { useStage } from './context/StageContext';
import { useIsMobile } from './hooks/useMediaQuery';

export const App: React.FC = () => {
  const {
    activeAsset,
    isControllerOpen,
    setIsControllerOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isSlideshowActive,
    activeDownloads,
    completedDownloadPrompt,
    dismissCompletedDownloadPrompt,
    loadAsset,
    catalogTab,
    setCatalogTab,
    environmentPreset
  } = useStage();

  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);
  const [isPlaylistMakerOpen, setIsPlaylistMakerOpen] = useState<boolean>(false);
  const [isNoAssetSheetOpen, setIsNoAssetSheetOpen] = useState<boolean>(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState<boolean>(false);
  const [isProjectionSheetOpen, setIsProjectionSheetOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');

  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = `Cuenect Controller v${packageJson.version}`;
  }, []);

  // Nav highlight is derived from which surface is open - no duplicate state.
  const activeSection: MobileSection = useMemo(() => {
    if (isControllerOpen) return 'control';
    if (isPlaylistMakerOpen) return 'playlist';
    if (isMoreSheetOpen || isSettingsOpen || isProjectionSheetOpen) return 'more';
    return 'assets';
  }, [isControllerOpen, isPlaylistMakerOpen, isSettingsOpen, isMoreSheetOpen, isProjectionSheetOpen]);

  const closeAllSurfaces = () => {
    setIsPlaylistMakerOpen(false);
    setIsSettingsOpen(false);
    setIsControllerOpen(false);
    setIsNoAssetSheetOpen(false);
    setIsMoreSheetOpen(false);
    setIsProjectionSheetOpen(false);
  };

  const handleNavSelect = (section: MobileSection) => {
    switch (section) {
      case 'assets':
        closeAllSurfaces();
        break;
      case 'playlist':
        closeAllSurfaces();
        setIsPlaylistMakerOpen(true);
        break;
      case 'control':
        closeAllSurfaces();
        // Never navigate to a dead screen: explain the state instead.
        if (activeAsset) {
          setIsControllerOpen(true);
        } else {
          setIsNoAssetSheetOpen(true);
        }
        break;
      case 'more':
        closeAllSurfaces();
        setIsMoreSheetOpen(true);
        break;
    }
  };

  const showDock = !!activeAsset && !isControllerOpen && !isSlideshowActive;
  const downloadEntries = Object.values(activeDownloads);
  const isAwayFromExplore = catalogTab !== 'explore' || isControllerOpen || isSettingsOpen || isPlaylistMakerOpen;

  return (
    <div
      className={[
        'app-container',
        isMobile ? 'has-bottom-nav' : '',
        showDock && isMobile ? 'has-dock' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {environmentPreset === EnvironmentPreset.Space && <div className="env-space-dust" aria-hidden="true" />}

      <Header
        onOpenConnection={() => setIsConnectionModalOpen(true)}
        onOpenPlaylistMaker={() => setIsPlaylistMakerOpen(true)}
        onOpenMore={() => setIsMoreSheetOpen(true)}
      />

      <main className="app-main">
        <AssetGrid
          onOpenConnection={() => setIsConnectionModalOpen(true)}
          query={query}
          onQueryChange={setQuery}
        />
      </main>

      {/* Floating Background Download Progress Banner when user navigates away from Explore */}
      {downloadEntries.length > 0 && isAwayFromExplore && (
        <div
          onClick={() => {
            closeAllSurfaces();
            setCatalogTab('explore');
          }}
          title="Click to view in Explore tab"
          style={{
            position: 'fixed',
            bottom: isMobile ? (showDock ? 136 : 74) : 20,
            right: 16,
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: '10px 14px',
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.94)',
            border: '1px solid rgba(0, 229, 255, 0.4)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
            minWidth: 230,
            maxWidth: 320
          }}
        >
          {downloadEntries.map((d) => (
            <div key={d.smithsonianId} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#f8fafc',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Loader2 size={13} className="spin" style={{ color: '#00e5ff', flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.title}
                  </span>
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#00e5ff', flexShrink: 0 }}>
                  {d.progress}%
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: 4,
                  borderRadius: 999,
                  background: 'rgba(255, 255, 255, 0.12)',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${Math.max(4, d.progress)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #0ea5e9, #00e5ff)',
                    transition: 'width 0.25s ease'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Popup when background download completes while user is NOT on the Explore screen (Webfront only) */}
      <ConfirmDialog
        isOpen={Boolean(completedDownloadPrompt)}
        title="Model Download Complete"
        message={
          completedDownloadPrompt
            ? `"${completedDownloadPrompt.AssetName}" has finished downloading in the background. Would you like to load it onto the stage now?`
            : ''
        }
        confirmLabel="Load Model"
        cancelLabel="Not Now"
        onConfirm={() => {
          if (completedDownloadPrompt) {
            const target = completedDownloadPrompt;
            dismissCompletedDownloadPrompt();
            loadAsset(target);
          }
        }}
        onCancel={dismissCompletedDownloadPrompt}
      />

      <NowOnStage onOpenController={() => setIsControllerOpen(true)} />

      <AssetInspector />

      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
      />

      <PlaylistMakerModal
        isOpen={isPlaylistMakerOpen}
        onClose={() => setIsPlaylistMakerOpen(false)}
      />

      <StageSettingsModal />
      <StageDirectorModal />

      <FullScreenController />

      <SlideshowBar />

      <BottomSheet
        isOpen={isNoAssetSheetOpen}
        onClose={() => setIsNoAssetSheetOpen(false)}
        title="Controller"
      >
        <StateView
          icon={<Gamepad2 size={26} />}
          title="No active asset"
          description="Load an asset, then return here to rotate, pan, zoom and light it."
          actions={
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsNoAssetSheetOpen(false)}
            >
              Browse Assets
            </button>
          }
        />
      </BottomSheet>

      <MoreSheet
        isOpen={isMoreSheetOpen}
        onClose={() => setIsMoreSheetOpen(false)}
        onOpenConnection={() => setIsConnectionModalOpen(true)}
        onOpenProjection={() => setIsProjectionSheetOpen(true)}
      />

      <ProjectionSheet
        isOpen={isProjectionSheetOpen}
        onClose={() => setIsProjectionSheetOpen(false)}
      />

      <ToastContainer />

      <ContextMenu
        onOpenConnection={() => setIsConnectionModalOpen(true)}
        onOpenPlaylistMaker={() => setIsPlaylistMakerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {isMobile && <BottomNav active={activeSection} onSelect={handleNavSelect} />}
    </div>
  );
};

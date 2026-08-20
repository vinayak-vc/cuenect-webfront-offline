import React, { useMemo, useState } from 'react';
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
import { MoreSheet } from './components/Stage/MoreSheet';
import { ProjectionSheet } from './components/Stage/ProjectionSheet';
import { Gamepad2 } from 'lucide-react';
import { useStage } from './context/StageContext';
import { useIsMobile } from './hooks/useMediaQuery';

export const App: React.FC = () => {
  const {
    activeAsset,
    isControllerOpen,
    setIsControllerOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isSlideshowActive
  } = useStage();

  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);
  const [isPlaylistMakerOpen, setIsPlaylistMakerOpen] = useState<boolean>(false);
  const [isNoAssetSheetOpen, setIsNoAssetSheetOpen] = useState<boolean>(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState<boolean>(false);
  const [isProjectionSheetOpen, setIsProjectionSheetOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');

  const isMobile = useIsMobile();

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
      <Header
        onOpenConnection={() => setIsConnectionModalOpen(true)}
        onOpenPlaylistMaker={() => setIsPlaylistMakerOpen(true)}
        query={query}
        onQueryChange={setQuery}
      />

      <main className="app-main">
        <AssetGrid
          onOpenConnection={() => setIsConnectionModalOpen(true)}
          query={query}
          onQueryChange={setQuery}
        />
      </main>

      <NowOnStage onOpenController={() => setIsControllerOpen(true)} />

      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
      />

      <PlaylistMakerModal
        isOpen={isPlaylistMakerOpen}
        onClose={() => setIsPlaylistMakerOpen(false)}
      />

      <StageSettingsModal />

      <FullScreenController />

      <SlideshowBar />

      <BottomSheet
        isOpen={isNoAssetSheetOpen}
        onClose={() => setIsNoAssetSheetOpen(false)}
        title="Stage Controller"
      >
        <StateView
          icon={<Gamepad2 size={26} />}
          title="Nothing on the stage"
          description="Load an asset to the stage, then return here to rotate, pan, zoom and light it."
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

      {isMobile && <BottomNav active={activeSection} onSelect={handleNavSelect} />}
    </div>
  );
};

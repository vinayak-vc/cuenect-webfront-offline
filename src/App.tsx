import React, { useState } from 'react';
import { Header } from './components/Common/Header';
import { PlaylistTabs } from './components/Catalog/PlaylistTabs';
import { AssetGrid } from './components/Catalog/AssetGrid';
import { ConnectionModal } from './components/Connection/ConnectionModal';
import { FullScreenController } from './components/Controller/FullScreenController';
import { PlaylistMakerModal } from './components/Playlist/PlaylistMakerModal';
import { StageSettingsModal } from './components/Settings/StageSettingsModal';
import { SlideshowBar } from './components/Playlist/SlideshowBar';
import { ToastContainer } from './components/Common/Toast';

export const App: React.FC = () => {
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);
  const [isPlaylistMakerOpen, setIsPlaylistMakerOpen] = useState<boolean>(false);

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        onOpenConnection={() => setIsConnectionModalOpen(true)}
        onOpenPlaylistMaker={() => setIsPlaylistMakerOpen(true)}
      />

      {/* Playlist Filter Tabs */}
      <PlaylistTabs />

      {/* Main Asset Grid */}
      <AssetGrid onOpenConnection={() => setIsConnectionModalOpen(true)} />

      {/* Modals & FullScreen Overlays */}
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

      <ToastContainer />
    </div>
  );
};

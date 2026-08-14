import React from 'react';
import { useStage } from '../../context/StageContext';

export const PlaylistTabs: React.FC = () => {
  const { playlists, selectedPlaylist, setSelectedPlaylist } = useStage();

  if (playlists.length <= 1) return null;

  return (
    <div className="playlist-tabs-container">
      {playlists.map((name) => (
        <button
          key={name}
          className={`playlist-tab ${selectedPlaylist === name ? 'active' : ''}`}
          onClick={() => setSelectedPlaylist(name)}
        >
          {name}
        </button>
      ))}
    </div>
  );
};

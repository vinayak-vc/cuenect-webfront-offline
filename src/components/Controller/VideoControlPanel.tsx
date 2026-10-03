import React from 'react';
import { useStage } from '../../context/StageContext';
import { Play, Pause, Square, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';

export const VideoControlPanel: React.FC = () => {
  const {
    playVideo,
    pauseVideo,
    stopVideo,
    seekVideo,
    setVideoVolume,
    toggleVideoMute,
    isVideoMuted,
    videoVolume,
    isVideoPlaying
  } = useStage();

  return (
    <div className="video-control-panel">
      {/* Transport Controls */}
      <div className="video-transport-btns">
        <button
          type="button"
          className="btn-transport-sec"
          onClick={() => seekVideo(-10)}
          title="Rewind 10s"
          aria-label="Rewind 10 seconds"
        >
          <RotateCcw size={18} />
        </button>

        {isVideoPlaying ? (
          <button
            type="button"
            className="btn-transport-main"
            onClick={pauseVideo}
            title="Pause Video"
            aria-label="Pause Video"
          >
            <Pause size={28} />
          </button>
        ) : (
          <button
            type="button"
            className="btn-transport-main"
            onClick={playVideo}
            title="Play Video"
            aria-label="Play Video"
          >
            <Play size={28} style={{ marginLeft: 3 }} />
          </button>
        )}

        <button
          type="button"
          className="btn-transport-sec"
          onClick={stopVideo}
          title="Stop Video"
          aria-label="Stop Video"
        >
          <Square size={18} />
        </button>

        <button
          type="button"
          className="btn-transport-sec"
          onClick={() => seekVideo(10)}
          title="Forward 10s"
          aria-label="Forward 10 seconds"
        >
          <RotateCw size={18} />
        </button>
      </div>

      {/* Volume Control */}
      <div className="volume-control-row">
        <button
          type="button"
          className="btn-icon"
          onClick={toggleVideoMute}
          title={isVideoMuted ? 'Unmute' : 'Mute'}
          aria-label={isVideoMuted ? 'Unmute' : 'Mute'}
        >
          {isVideoMuted || videoVolume === 0 ? (
            <VolumeX size={20} style={{ color: 'var(--text-muted)' }} />
          ) : (
            <Volume2 size={20} style={{ color: 'var(--color-primary)' }} />
          )}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isVideoMuted ? 0 : videoVolume}
          onChange={(e) => setVideoVolume(parseFloat(e.target.value))}
          className="volume-slider"
          aria-label="Volume slider"
        />
        <span
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            width: 40,
            textAlign: 'right',
            fontFamily: 'var(--font-mono)'
          }}
        >
          {Math.round((isVideoMuted ? 0 : videoVolume) * 100)}%
        </span>
      </div>
    </div>
  );
};

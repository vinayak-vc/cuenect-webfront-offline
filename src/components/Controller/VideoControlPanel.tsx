import React from 'react';
import { useStage } from '../../context/StageContext';
import { RotateCcw, RotateCw, Play, Pause, Square, Volume2 } from 'lucide-react';

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
        >
          <img
            src="/assets/mobile/backward (1).png"
            alt="Rewind"
            style={{ width: 18, height: 18, objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <RotateCcw size={18} style={{ display: 'none' }} />
        </button>

        {isVideoPlaying ? (
          <button
            type="button"
            className="btn-transport-main"
            onClick={pauseVideo}
            title="Pause Video"
          >
            <img
              src="/assets/mobile/pause.png"
              alt="Pause"
              style={{ width: 26, height: 26, objectFit: 'contain', filter: 'brightness(0.1)' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <Pause size={28} style={{ display: 'none' }} />
          </button>
        ) : (
          <button
            type="button"
            className="btn-transport-main"
            onClick={playVideo}
            title="Play Video"
          >
            <img
              src="/assets/mobile/play.png"
              alt="Play"
              style={{ width: 26, height: 26, objectFit: 'contain', filter: 'brightness(0.1)', marginLeft: 2 }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <Play size={28} style={{ display: 'none' }} />
          </button>
        )}

        <button
          type="button"
          className="btn-transport-sec"
          onClick={stopVideo}
          title="Stop Video"
        >
          <img
            src="/assets/mobile/stop.png"
            alt="Stop"
            style={{ width: 18, height: 18, objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <Square size={18} style={{ display: 'none' }} />
        </button>

        <button
          type="button"
          className="btn-transport-sec"
          onClick={() => seekVideo(10)}
          title="Forward 10s"
        >
          <img
            src="/assets/ui/forward.png"
            alt="Forward"
            style={{ width: 18, height: 18, objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <RotateCw size={18} style={{ display: 'none' }} />
        </button>
      </div>

      {/* Volume Control */}
      <div className="volume-control-row">
        <button
          type="button"
          className="btn-icon"
          onClick={toggleVideoMute}
          title={isVideoMuted ? 'Unmute' : 'Mute'}
        >
          {isVideoMuted ? (
            <img
              src="/assets/mobile/volume-mute.png"
              alt="Muted"
              style={{ width: 18, height: 18, objectFit: 'contain' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <img
              src="/assets/mobile/volume.png"
              alt="Volume"
              style={{ width: 18, height: 18, objectFit: 'contain' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <Volume2 size={20} style={{ display: 'none' }} />
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isVideoMuted ? 0 : videoVolume}
          onChange={(e) => setVideoVolume(parseFloat(e.target.value))}
          className="volume-slider"
        />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', width: 40, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
          {Math.round((isVideoMuted ? 0 : videoVolume) * 100)}%
        </span>
      </div>
    </div>
  );
};

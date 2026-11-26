import React from 'react';
import { useStage } from '../../context/StageContext';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Repeat,
  SkipBack,
  XSquare,
  Film
} from 'lucide-react';

export const VideoControlPanel: React.FC = () => {
  const {
    playVideo,
    pauseVideo,
    stopVideo,
    restartVideo,
    seekVideo,
    setVideoVolume,
    toggleVideoMute,
    toggleVideoLoop,
    isVideoMuted,
    videoVolume,
    isVideoPlaying,
    isVideoLooping,
    unloadAsset,
    activeAsset
  } = useStage();

  const handleClear = () => {
    stopVideo();
    unloadAsset();
  };

  return (
    <div className="video-control-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Video Header & Status Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Film size={16} style={{ color: 'var(--color-primary, #0D99FF)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary, #FFFFFF)' }}>
            Video Stage Playback
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: isVideoPlaying ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)',
              color: isVideoPlaying ? '#34D399' : '#FBBF24',
              border: `1px solid ${isVideoPlaying ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
            }}
          >
            {isVideoPlaying ? 'Playing' : 'Paused'}
          </span>
          {isVideoLooping && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 4,
                textTransform: 'uppercase',
                background: 'rgba(13, 153, 255, 0.15)',
                color: '#38BDF8',
                border: '1px solid rgba(13, 153, 255, 0.3)'
              }}
            >
              Loop
            </span>
          )}
        </div>
      </div>

      {/* Main Transport Controls */}
      <div className="video-transport-btns" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        {/* Restart from beginning */}
        <button
          type="button"
          className="btn-transport-sec"
          onClick={restartVideo}
          title="Restart from Beginning (0:00)"
          aria-label="Restart from Beginning"
          style={{ width: 38, height: 38 }}
        >
          <SkipBack size={18} />
        </button>

        {/* Rewind 10s */}
        <button
          type="button"
          className="btn-transport-sec"
          onClick={() => seekVideo(-10)}
          title="Rewind 10 seconds"
          aria-label="Rewind 10 seconds"
          style={{ width: 40, height: 40 }}
        >
          <RotateCcw size={18} />
        </button>

        {/* Play / Pause Toggle */}
        {isVideoPlaying ? (
          <button
            type="button"
            className="btn-transport-main"
            onClick={pauseVideo}
            title="Pause Video"
            aria-label="Pause Video"
            style={{ width: 52, height: 52, borderRadius: '50%', background: '#0D99FF', color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(13, 153, 255, 0.4)' }}
          >
            <Pause size={26} />
          </button>
        ) : (
          <button
            type="button"
            className="btn-transport-main"
            onClick={playVideo}
            title="Play Video"
            aria-label="Play Video"
            style={{ width: 52, height: 52, borderRadius: '50%', background: '#0D99FF', color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(13, 153, 255, 0.4)' }}
          >
            <Play size={26} style={{ marginLeft: 3 }} />
          </button>
        )}

        {/* Forward 10s */}
        <button
          type="button"
          className="btn-transport-sec"
          onClick={() => seekVideo(10)}
          title="Forward 10 seconds"
          aria-label="Forward 10 seconds"
          style={{ width: 40, height: 40 }}
        >
          <RotateCw size={18} />
        </button>

        {/* Stop */}
        <button
          type="button"
          className="btn-transport-sec"
          onClick={stopVideo}
          title="Stop Video"
          aria-label="Stop Video"
          style={{ width: 38, height: 38 }}
        >
          <Square size={17} />
        </button>
      </div>

      {/* Secondary Fast Seek & Loop Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <button
          type="button"
          onClick={() => seekVideo(-30)}
          className="btn btn-secondary"
          title="Rewind 30 seconds"
          style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'center' }}
        >
          -30s
        </button>
        <button
          type="button"
          onClick={() => seekVideo(30)}
          className="btn btn-secondary"
          title="Forward 30 seconds"
          style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'center' }}
        >
          +30s
        </button>
        <button
          type="button"
          onClick={toggleVideoLoop}
          className={`btn ${isVideoLooping ? 'btn-primary' : 'btn-secondary'}`}
          title="Toggle Repeat / Looping"
          style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'center', gap: 5 }}
        >
          <Repeat size={14} />
          <span>Loop</span>
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="btn btn-secondary"
          title="Stop video and clear stage to logo"
          style={{ fontSize: '0.75rem', padding: '6px 8px', justifyContent: 'center', gap: 5, color: '#F43F5E' }}
        >
          <XSquare size={14} />
          <span>Clear</span>
        </button>
      </div>

      {/* Volume Control */}
      <div className="volume-control-row" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          type="button"
          className="btn-icon"
          onClick={toggleVideoMute}
          title={isVideoMuted ? 'Unmute' : 'Mute'}
          aria-label={isVideoMuted ? 'Unmute' : 'Mute'}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          {isVideoMuted || videoVolume === 0 ? (
            <VolumeX size={18} style={{ color: 'var(--text-muted, #777)' }} />
          ) : (
            <Volume2 size={18} style={{ color: 'var(--color-primary, #0D99FF)' }} />
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
          style={{ flex: 1, cursor: 'pointer' }}
        />
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary, #AAA)',
            minWidth: 38,
            textAlign: 'right',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 600
          }}
        >
          {Math.round((isVideoMuted ? 0 : videoVolume) * 100)}%
        </span>
      </div>

      {/* Video Details Card */}
      {activeAsset && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #888)', display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
          <span>Source: Stage Video Player</span>
          <span>{activeAsset.AssetName || 'Video Asset'}</span>
        </div>
      )}
    </div>
  );
};

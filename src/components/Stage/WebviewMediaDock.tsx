import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  FastForward,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  X,
  Radio,
  ExternalLink,
  Music
} from 'lucide-react';
import { stageSocket } from '../../services/socketService';

export interface WebviewMediaState {
  title: string;
  artist: string;
  artwork: string;
  currentTime: number;
  duration: number;
  isPaused: boolean;
  volume: number;
  isMuted: boolean;
  url: string;
}

interface WebviewMediaDockProps {
  onOpenModal?: () => void;
}

function formatTime(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '0:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const WebviewMediaDock: React.FC<WebviewMediaDockProps> = ({ onOpenModal }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [media, setMedia] = useState<WebviewMediaState>({
    title: '',
    artist: '',
    artwork: '',
    currentTime: 0,
    duration: 0,
    isPaused: true,
    volume: 100,
    isMuted: false,
    url: ''
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const [seekVal, setSeekVal] = useState<number>(0);
  const [adSkippedNotice, setAdSkippedNotice] = useState<boolean>(false);

  // Listen to stage webview events
  useEffect(() => {
    const handleStatus = (e: any) => {
      const msg = e.detail;
      if (typeof msg === 'string' && msg.startsWith('WebviewStatus#')) {
        try {
          const json = msg.substring(msg.indexOf('#') + 1);
          const data = JSON.parse(json);
          setIsOpen(Boolean(data.isOpen));
          setIsVisible(Boolean(data.isVisible));
          setCurrentUrl(data.currentUrl || '');
        } catch {}
      }
    };

    const handleMedia = (e: any) => {
      const msg = e.detail;
      if (typeof msg === 'string' && msg.startsWith('WebviewMediaState#')) {
        try {
          const json = msg.substring(msg.indexOf('#') + 1);
          if (!json || json.trim() === '{}') {
            setMedia({
              title: '',
              artist: '',
              artwork: '',
              currentTime: 0,
              duration: 0,
              isPaused: true,
              volume: 100,
              isMuted: false,
              url: ''
            });
            return;
          }
          const data: WebviewMediaState = JSON.parse(json);
          setMedia(data);
          if (!isSeeking) {
            setSeekVal(data.currentTime);
          }
        } catch {}
      }
    };

    window.addEventListener('stage_webview_status' as any, handleStatus);
    window.addEventListener('stage_webview_media_state' as any, handleMedia);
    return () => {
      window.removeEventListener('stage_webview_status' as any, handleStatus);
      window.removeEventListener('stage_webview_media_state' as any, handleMedia);
    };
  }, [isSeeking]);

  // If no webview is open and no media is detected, do not render dock
  if (!isOpen && !media.title && !currentUrl) {
    return null;
  }

  const handlePlayPause = () => {
    stageSocket.playPauseWebview();
    setMedia((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleNext = () => {
    stageSocket.nextWebviewTrack();
  };

  const handlePrev = () => {
    stageSocket.prevWebviewTrack();
  };

  const handleSkipAd = () => {
    stageSocket.skipWebviewAd();
    setAdSkippedNotice(true);
    setTimeout(() => setAdSkippedNotice(false), 2000);
  };

  const handleBringForward = () => {
    stageSocket.bringWebviewForward();
    setIsVisible(true);
  };

  const handleSendBackward = () => {
    stageSocket.sendWebviewBackward();
    setIsVisible(false);
  };

  const handleToggleVisibility = () => {
    if (isVisible) {
      handleSendBackward();
    } else {
      handleBringForward();
    }
  };

  const handleSeekCommit = () => {
    setIsSeeking(false);
    stageSocket.seekWebview(seekVal);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setMedia((prev) => ({ ...prev, volume: val, isMuted: val === 0 }));
    stageSocket.setWebviewVolume(val);
  };

  const handleClose = () => {
    stageSocket.closeWebview();
    setIsOpen(false);
    setMedia({
      title: '',
      artist: '',
      artwork: '',
      currentTime: 0,
      duration: 0,
      isPaused: true,
      volume: 100,
      isMuted: false,
      url: ''
    });
  };

  const displayTitle = media.title || currentUrl || 'Live Stage Webview';
  const displayArtist = media.artist || (isVisible ? 'Displaying on Stage' : 'Background Audio Mode');

  // Collapsed Minimalist Pill Mode
  if (isCollapsed) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 14px',
          background: 'rgba(20, 20, 26, 0.94)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: 30,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.65)',
          color: '#FFFFFF',
          fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {media.artwork ? (
          <img
            src={media.artwork}
            alt="Artwork"
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0D99FF, #68D9D0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Music size={14} color="#FFF" />
          </div>
        )}

        <div
          style={{
            maxWidth: 160,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer'
          }}
          onClick={() => setIsCollapsed(false)}
          title={displayTitle}
        >
          {displayTitle}
        </div>

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={handlePlayPause}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {media.isPaused ? <Play size={13} fill="#FFF" /> : <Pause size={13} fill="#FFF" />}
        </button>

        {/* Expand Button */}
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#888899',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center'
          }}
          title="Expand Webview Controls"
        >
          <ChevronUp size={16} />
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#FF5555',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center'
          }}
          title="Close Webview"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  // Expanded Rich Desktop Media Overlay (modeled after the user's reference)
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        width: 380,
        background: '#16161D',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: 16,
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75)',
        color: '#FFFFFF',
        fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
        overflow: 'hidden',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      {/* Top Bar: Distinction Badge & Minimize / Close */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 4,
              background: isVisible ? 'rgba(13, 153, 255, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: isVisible ? '#0D99FF' : '#10B981',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: isVisible ? '#0D99FF' : '#10B981'
              }}
            />
            {isVisible ? 'Stage Screen (Forward)' : 'Background Audio (Backward)'}
          </span>
          <span style={{ fontSize: 10, color: '#666677' }}>Webview</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {onOpenModal && (
            <button
              type="button"
              onClick={onOpenModal}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#888899',
                cursor: 'pointer',
                padding: 4,
                display: 'flex'
              }}
              title="Open Full Stage Webview Manager"
            >
              <ExternalLink size={14} />
            </button>
          )}

          {/* Minimize / Hide Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888899',
              cursor: 'pointer',
              padding: 4,
              display: 'flex'
            }}
            title="Minimize to Pill (Keep playing)"
          >
            <ChevronDown size={16} />
          </button>

          {/* Close Webview Button */}
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FF6666',
              cursor: 'pointer',
              padding: 4,
              display: 'flex'
            }}
            title="Close Webview"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Main Content Area: Left Controls / Title, Right Thumbnail */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Left Side: Volume & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: 10 }}>
          {/* Track Info */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={displayTitle}
            >
              {displayTitle}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#9999AA',
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {displayArtist}
            </div>
          </div>

          {/* Media Buttons Row: Prev, Play/Pause, Next */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={handlePrev}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Previous Track / Restart"
            >
              <SkipBack size={15} fill="#FFF" />
            </button>

            <button
              type="button"
              onClick={handlePlayPause}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#FFFFFF',
                border: 'none',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(255, 255, 255, 0.25)'
              }}
              title={media.isPaused ? 'Play' : 'Pause'}
            >
              {media.isPaused ? (
                <Play size={18} fill="#000" style={{ marginLeft: 2 }} />
              ) : (
                <Pause size={18} fill="#000" />
              )}
            </button>

            <button
              type="button"
              onClick={handleNext}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Next Track"
            >
              <SkipForward size={15} fill="#FFF" />
            </button>

            {/* Quick Skip Ad Button */}
            <button
              type="button"
              onClick={handleSkipAd}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 8px',
                borderRadius: 6,
                background: adSkippedNotice ? 'rgba(16, 185, 129, 0.2)' : 'rgba(250, 204, 21, 0.12)',
                border: `1px solid ${adSkippedNotice ? '#10B981' : 'rgba(250, 204, 21, 0.3)'}`,
                color: adSkippedNotice ? '#10B981' : '#FACC15',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                marginLeft: 4
              }}
              title="Auto-Skip YouTube Ad"
            >
              <FastForward size={11} />
              <span>{adSkippedNotice ? 'Skipped!' : 'Skip Ad'}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Artwork Thumbnail */}
        <div style={{ flexShrink: 0 }}>
          {media.artwork ? (
            <img
              src={media.artwork}
              alt="Track Artwork"
              style={{
                width: 80,
                height: 80,
                borderRadius: 10,
                objectFit: 'cover',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
              }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B'
              }}
            >
              <Music size={32} />
            </div>
          )}
        </div>
      </div>

      {/* Seekbar Progress Row */}
      {media.duration > 0 && (
        <div style={{ padding: '0 16px 8px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <input
            type="range"
            min={0}
            max={media.duration}
            value={isSeeking ? seekVal : media.currentTime}
            onMouseDown={() => setIsSeeking(true)}
            onTouchStart={() => setIsSeeking(true)}
            onChange={(e) => setSeekVal(Number(e.target.value))}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            style={{
              width: '100%',
              height: 4,
              borderRadius: 2,
              accentColor: '#0D99FF',
              cursor: 'pointer'
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: '#888899',
              fontWeight: 600
            }}
          >
            <span>{formatTime(isSeeking ? seekVal : media.currentTime)}</span>
            <span>{formatTime(media.duration)}</span>
          </div>
        </div>
      )}

      {/* Bottom Controls: Volume & Forward/Backward Switch */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        {/* Volume Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              const nextVol = media.volume > 0 ? 0 : 70;
              setMedia((prev) => ({ ...prev, volume: nextVol, isMuted: nextVol === 0 }));
              stageSocket.setWebviewVolume(nextVol);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: media.volume === 0 ? '#888' : '#0D99FF',
              cursor: 'pointer',
              padding: 0,
              display: 'flex'
            }}
            title={media.volume === 0 ? 'Unmute' : 'Mute'}
          >
            {media.volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={media.volume}
            onChange={handleVolumeChange}
            style={{
              width: 70,
              height: 4,
              accentColor: '#0D99FF',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontSize: 10, color: '#888899', width: 22, textAlign: 'right' }}>
            {media.volume}
          </span>
        </div>

        {/* Bring Forward / Send Backward Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isVisible ? (
            <button
              type="button"
              onClick={handleSendBackward}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 9px',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#E0E0E0',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Send webview to background (Keep music playing quietly while stage shows 3D models)"
            >
              <EyeOff size={12} color="#10B981" />
              <span>Send to BG</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBringForward}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 9px',
                borderRadius: 6,
                background: 'rgba(13, 153, 255, 0.15)',
                border: '1px solid #0D99FF',
                color: '#0D99FF',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Bring webview to stage screen (Show YouTube video on stage)"
            >
              <Eye size={12} />
              <span>Bring Forward</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

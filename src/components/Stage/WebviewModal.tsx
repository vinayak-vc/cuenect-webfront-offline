import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Globe,
  Radio,
  Music,
  ExternalLink,
  FastForward,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Power,
  Volume2,
  VolumeX,
  Check,
  Play,
  Pause,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { stageSocket } from '../../services/socketService';
import { useStage } from '../../context/StageContext';

interface WebviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

function formatTime(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '0:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

const PRESETS = [
  { label: 'YouTube Music', url: 'https://music.youtube.com', icon: Music },
  { label: 'YouTube', url: 'https://www.youtube.com', icon: ExternalLink },
  { label: 'Lofi Girl Live', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', icon: Radio },
  { label: 'Spotify Web', url: 'https://open.spotify.com', icon: Music }
];

export const WebviewModal: React.FC<WebviewModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useStage();

  const [url, setUrl] = useState<string>('https://music.youtube.com');
  const [isBackground, setIsBackground] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [activeUrl, setActiveUrl] = useState<string>('');
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [skipSuccess, setSkipSuccess] = useState<boolean>(false);
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
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const [seekVal, setSeekVal] = useState<number>(0);

  // Sync with stage socket if WebviewStatus or WebviewMediaState is received
  useEffect(() => {
    const handleStatus = (e: any) => {
      const msg = e.detail;
      if (typeof msg === 'string' && msg.startsWith('WebviewStatus#')) {
        try {
          const json = msg.substring(msg.indexOf('#') + 1);
          const data = JSON.parse(json);
          setIsActive(Boolean(data.isOpen));
          setActiveUrl(data.currentUrl || '');
          setIsVisible(Boolean(data.isVisible));
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

  if (!isOpen) return null;

  const handleOpenOnStage = () => {
    if (!url.trim()) return;
    let target = url.trim();
    if (!/^https?:\/\//i.test(target) && !/^file:\/\//i.test(target)) {
      target = 'https://' + target;
      setUrl(target);
    }

    stageSocket?.openWebview(target, isBackground);
    setIsActive(true);
    setActiveUrl(target);
    setIsVisible(!isBackground);

    if (addToast) {
      addToast(
        isBackground ? 'Background Audio Started' : 'Displaying Webview on Stage',
        `Opened: ${target} ${isBackground ? '(Background Audio Mode)' : '(Visible on Stage)'}`,
        'success'
      );
    }
  };

  const handleSkipAd = () => {
    stageSocket?.skipWebviewAd();
    setSkipSuccess(true);
    setTimeout(() => setSkipSuccess(false), 2000);
    if (addToast) {
      addToast('Skip Ad Signal Sent', 'Auto-skip ad command dispatched to webview', 'info');
    }
  };

  const handleScroll = (deltaY: number) => {
    stageSocket?.scrollWebview(deltaY);
  };

  const handleBringForward = () => {
    stageSocket?.bringWebviewForward();
    setIsVisible(true);
    if (addToast) {
      addToast('Webview Brought Forward', 'Webview is now visible on top of the stage screen', 'info');
    }
  };

  const handleSendBackward = () => {
    stageSocket?.sendWebviewBackward();
    setIsVisible(false);
    if (addToast) {
      addToast('Webview Sent to Background', 'Webview hidden; audio keeps playing in the background', 'info');
    }
  };

  const handlePlayPause = () => {
    stageSocket?.playPauseWebview();
    setMedia((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleNext = () => {
    stageSocket?.nextWebviewTrack();
  };

  const handlePrev = () => {
    stageSocket?.prevWebviewTrack();
  };

  const handleSeekCommit = () => {
    setIsSeeking(false);
    stageSocket?.seekWebview(seekVal);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setMedia((prev) => ({ ...prev, volume: val, isMuted: val === 0 }));
    stageSocket?.setWebviewVolume(val);
  };

  const handleCloseWebview = () => {
    stageSocket?.closeWebview();
    setIsActive(false);
    setActiveUrl('');
    setIsVisible(false);
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
    if (addToast) {
      addToast('Webview Closed', 'Stopped stage webview process', 'info');
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          background: '#16161D',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: '#FFFFFF',
          fontFamily: 'Inter, -apple-system, system-ui, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #0D99FF 0%, #68D9D0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF'
              }}
            >
              <Globe size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>
                Stage Webview & Live Player
              </h3>
              <p style={{ margin: 0, fontSize: 11, color: '#888899' }}>
                Play YouTube music, video streams, or websites on Hologram Stage
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: 4,
              display: 'flex'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Active Playing Media Card if playing */}
          {(isActive || media.title) && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: 16,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0D99FF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Now Playing via Webview
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: isVisible ? 'rgba(13, 153, 255, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: isVisible ? '#0D99FF' : '#10B981'
                  }}
                >
                  {isVisible ? 'Showing on Stage (Forward)' : 'Background Audio (Backward)'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {media.artwork ? (
                  <img
                    src={media.artwork}
                    alt="Track Artwork"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 8,
                      objectFit: 'cover',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 8,
                      background: '#1F1F26',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666'
                    }}
                  >
                    <Music size={28} />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {media.title || activeUrl || 'Live Stage Webview'}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#888899',
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {media.artist || 'Web Stream'}
                  </div>

                  {/* Quick media buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={handlePrev}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: 6,
                        color: '#FFF',
                        padding: '5px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Previous"
                    >
                      <SkipBack size={13} fill="#FFF" />
                    </button>
                    <button
                      type="button"
                      onClick={handlePlayPause}
                      style={{
                        background: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        color: '#000',
                        padding: '5px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        fontWeight: 700
                      }}
                      title={media.isPaused ? 'Play' : 'Pause'}
                    >
                      {media.isPaused ? <Play size={13} fill="#000" /> : <Pause size={13} fill="#000" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: 6,
                        color: '#FFF',
                        padding: '5px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Next"
                    >
                      <SkipForward size={13} fill="#FFF" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Seekbar if duration available */}
              {media.duration > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                      accentColor: '#0D99FF',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888' }}>
                    <span>{formatTime(isSeeking ? seekVal : media.currentTime)}</span>
                    <span>{formatTime(media.duration)}</span>
                  </div>
                </div>
              )}

              {/* Volume & Forward/Backward Actions inside card */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Volume2 size={14} color="#0D99FF" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={media.volume}
                    onChange={handleVolumeChange}
                    style={{ width: 80, height: 4, accentColor: '#0D99FF', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 10, color: '#888' }}>{media.volume}%</span>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {isVisible ? (
                    <button
                      type="button"
                      onClick={handleSendBackward}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 6,
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#FFF',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <EyeOff size={12} color="#10B981" />
                      <span>Send to Backward (BG)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBringForward}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 6,
                        background: 'rgba(13, 153, 255, 0.15)',
                        border: '1px solid #0D99FF',
                        color: '#0D99FF',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Eye size={12} />
                      <span>Bring to Forward (Stage)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* URL Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#CCCCCC' }}>Web URL / Link:</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#1F1F26',
                border: '1px solid #363640',
                borderRadius: 8,
                padding: '0 12px',
                height: 42
              }}
            >
              <Globe size={16} style={{ color: '#0D99FF', marginRight: 10, flexShrink: 0 }} />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://music.youtube.com or any web link..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 13,
                  outline: 'none'
                }}
              />
              {url && (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  style={{ background: 'transparent', border: 'none', color: '#777', cursor: 'pointer', padding: 2 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PRESETS.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setUrl(p.url)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px',
                    borderRadius: 6,
                    background: url === p.url ? 'rgba(13, 153, 255, 0.18)' : '#22222A',
                    border: `1px solid ${url === p.url ? '#0D99FF' : '#33333E'}`,
                    color: url === p.url ? '#0D99FF' : '#AAAAAA',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Icon size={12} />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Background Toggle Checkbox */}
          <div
            onClick={() => setIsBackground(!isBackground)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '12px 14px',
              background: isBackground ? 'rgba(13, 153, 255, 0.08)' : '#1B1B22',
              border: `1px solid ${isBackground ? 'rgba(13, 153, 255, 0.35)' : '#2B2B36'}`,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <input
              type="checkbox"
              checked={isBackground}
              onChange={(e) => setIsBackground(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              style={{
                marginTop: 2,
                cursor: 'pointer',
                accentColor: '#0D99FF',
                width: 16,
                height: 16
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: isBackground ? '#0D99FF' : '#FFFFFF' }}>
                  Background Mode (Audio Only / Hidden)
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: isBackground ? 'rgba(13,153,255,0.2)' : 'rgba(255,255,255,0.08)',
                    color: isBackground ? '#0D99FF' : '#888'
                  }}
                >
                  {isBackground ? 'Active in Background' : 'Displays on Stage Screen'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#888899', lineHeight: 1.4 }}>
                When checked, the URL runs quietly in the background without disturbing the active 3D model, video, or graphic playing on the hologram stage.
              </p>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleOpenOnStage}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 20px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #0D99FF 0%, #0077CC 100%)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(13, 153, 255, 0.35)'
            }}
          >
            <Globe size={16} />
            <span>Open on Stage</span>
          </button>

          {/* Interactive Remote Controls (When Webview is active on stage) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              borderTop: '1px solid #262630',
              paddingTop: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#888899', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Stage Remote Controls
              </span>
              {isActive && (
                <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                  <span>Playing on Stage</span>
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {/* Skip Ad Button */}
              <button
                type="button"
                onClick={handleSkipAd}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 12px',
                  background: skipSuccess ? 'rgba(16, 185, 129, 0.2)' : '#262632',
                  border: `1px solid ${skipSuccess ? '#10B981' : '#3E3E4D'}`,
                  borderRadius: 6,
                  color: skipSuccess ? '#10B981' : '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Simulate click on YouTube 'Skip Ad' button"
              >
                {skipSuccess ? <Check size={14} /> : <FastForward size={14} style={{ color: '#FACC15' }} />}
                <span>{skipSuccess ? 'Ad Skipped!' : 'Skip Ad (YouTube)'}</span>
              </button>

              {/* Toggle Visual / Background Visibility */}
              <button
                type="button"
                onClick={isVisible ? handleSendBackward : handleBringForward}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 12px',
                  background: '#262632',
                  border: '1px solid #3E3E4D',
                  borderRadius: 6,
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Toggle between hidden background audio and visible on stage"
              >
                {isVisible ? <EyeOff size={14} style={{ color: '#10B981' }} /> : <Eye size={14} style={{ color: '#0D99FF' }} />}
                <span>{isVisible ? 'Send to Backward (BG)' : 'Bring to Forward (Stage)'}</span>
              </button>

              {/* Scroll Up */}
              <button
                type="button"
                onClick={() => handleScroll(-350)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '9px 12px',
                  background: '#22222A',
                  border: '1px solid #33333E',
                  borderRadius: 6,
                  color: '#CCCCCC',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <ChevronUp size={14} />
                <span>Scroll Up</span>
              </button>

              {/* Scroll Down */}
              <button
                type="button"
                onClick={() => handleScroll(350)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '9px 12px',
                  background: '#22222A',
                  border: '1px solid #33333E',
                  borderRadius: 6,
                  color: '#CCCCCC',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <ChevronDown size={14} />
                <span>Scroll Down</span>
              </button>
            </div>

            {/* Close Webview Button */}
            <button
              type="button"
              onClick={handleCloseWebview}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '9px 12px',
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 6,
                color: '#F43F5E',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 4
              }}
            >
              <Power size={13} />
              <span>Close Webview on Stage</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

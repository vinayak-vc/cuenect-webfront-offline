import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  AssetInformation,
  ConnectionState,
  DataType,
  JoyStickDirection,
  ModelControl,
  MovableActionEvent,
  MoveableAssetType,
  StaticStrings,
  VideoControl,
  CameraOrthographic,
  User,
  resolveCategory,
  MovableModeActionNames,
  StereoAdjustSettings,
  DEFAULT_STEREO_SETTINGS
} from '../types/protocol';
import { stageSocket } from '../services/socketService';
import { StorageService, ConnectionConfig } from '../services/storage';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface StageContextValue {
  connectionState: ConnectionState;
  connectedUsers: User[];
  config: ConnectionConfig;
  connect: (config: ConnectionConfig) => void;
  disconnect: () => void;
  assets: AssetInformation[];
  playlists: string[];
  selectedPlaylist: string;
  setSelectedPlaylist: (name: string) => void;
  thumbnails: Record<string, string>;
  requestThumbnail: (assetId: string) => void;
  activeAsset: AssetInformation | null;
  loadAsset: (asset: AssetInformation) => void;
  unloadAsset: () => void;
  isControllerOpen: boolean;
  setIsControllerOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  
  // Model controls
  sendModelJoystick: (direction: JoyStickDirection, xPos?: number, yPos?: number, zoom?: number) => void;
  resetModelTransform: () => void;
  setMovableMode: (mode: MoveableAssetType) => void;
  currentMovableMode: MoveableAssetType;
  toggleOrthographic: () => void;
  isOrthographic: boolean;
  toggleStereoscopic: () => void;
  triggerFullscreen: () => void;
  
  // Stereoscopic & Stage Calibration Settings
  stereoSettings: StereoAdjustSettings;
  updateStereoSettings: (settings: Partial<StereoAdjustSettings>) => void;
  resetStereoSettings: () => void;
  
  // Video controls
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekVideo: (offsetSeconds: number) => void;
  setVideoVolume: (volume: number) => void;
  toggleVideoMute: () => void;
  isVideoMuted: boolean;
  videoVolume: number;
  isVideoPlaying: boolean;
  
  // Custom Playlist & Slideshow
  customPlaylistIds: string[];
  addToCustomPlaylist: (assetId: string) => void;
  removeFromCustomPlaylist: (assetId: string) => void;
  reorderCustomPlaylist: (newIds: string[]) => void;
  isSlideshowActive: boolean;
  slideshowIndex: number;
  slideDuration: number;
  setSlideDuration: (seconds: number) => void;
  startSlideshow: (startIndex?: number) => void;
  stopSlideshow: () => void;
  nextSlide: () => void;
  prevSlide: () => void;
  
  // Refresh & Stage
  refreshAssets: () => void;
  toasts: ToastMessage[];
  addToast: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

const StageContext = createContext<StageContextValue | null>(null);

export const StageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<ConnectionConfig>(StorageService.getConnectionConfig());
  const [assets, setAssets] = useState<AssetInformation[]>([]);
  const [playlists, setPlaylists] = useState<string[]>(['All']);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('All');
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [activeAsset, setActiveAsset] = useState<AssetInformation | null>(null);
  const [isControllerOpen, setIsControllerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  // Model & stage state
  const [currentMovableMode, setCurrentMovableMode] = useState<MoveableAssetType>(MoveableAssetType.Rotate);
  const [isOrthographic, setIsOrthographic] = useState<boolean>(false);
  const [stereoSettings, setStereoSettings] = useState<StereoAdjustSettings>(StorageService.getStereoSettings());
  const stereoSettingsRef = useRef<StereoAdjustSettings>(stereoSettings);
  stereoSettingsRef.current = stereoSettings;
  const stereoDebounceTimerRef = useRef<number | null>(null);
  
  // Video state
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [videoVolume, setVideoVolumeState] = useState<number>(1.0);
  
  // Custom playlist & slideshow state
  const [customPlaylistIds, setCustomPlaylistIds] = useState<string[]>(StorageService.getCustomPlaylist());
  const [isSlideshowActive, setIsSlideshowActive] = useState<boolean>(false);
  const [slideshowIndex, setSlideshowIndex] = useState<number>(0);
  const [slideDuration, setSlideDurationState] = useState<number>(StorageService.getSlideDuration());
  const slideshowTimerRef = useRef<number | null>(null);
  
  // Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const requestedThumbnailsRef = useRef<Set<string>>(new Set());

  // Connect / Disconnect handlers
  const connect = useCallback((newConfig: ConnectionConfig) => {
    setConfig(newConfig);
    StorageService.saveConnectionConfig(newConfig);
    StorageService.saveAutoConnect(true);
    stageSocket.connect(newConfig.serverIp, newConfig.usePort, newConfig.port);
  }, []);

  const disconnect = useCallback(() => {
    StorageService.saveAutoConnect(false);
    stageSocket.disconnect();
    requestedThumbnailsRef.current.clear();
    setActiveAsset(null);
    setIsControllerOpen(false);
    setIsSlideshowActive(false);
  }, []);

  const requestThumbnail = useCallback((assetId: string) => {
    if (requestedThumbnailsRef.current.has(assetId)) return;
    requestedThumbnailsRef.current.add(assetId);
    stageSocket.requestThumbnail(assetId);
  }, []);

  // Stage/Node re-deliver the full catalog on every reconnect and on every ReqAsset
  // handshake. Track the last-applied catalog's signature so a redundant, unchanged
  // delivery updates nothing and stays silent instead of re-rendering and re-toasting.
  const lastAssetsSignatureRef = useRef<string>('');

  const parseAndSetAssets = useCallback((dataOrString: any) => {
    try {
      let rawList: any[] = [];
      let parsed = dataOrString;
      if (typeof dataOrString === 'string') {
        parsed = JSON.parse(dataOrString);
      }
      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (parsed && parsed.assetinformation && Array.isArray(parsed.assetinformation)) {
        rawList = parsed.assetinformation;
      } else if (parsed && parsed.AssetInformation && Array.isArray(parsed.AssetInformation)) {
        rawList = parsed.AssetInformation;
      } else if (parsed && parsed.assetInformation && Array.isArray(parsed.assetInformation)) {
        rawList = parsed.assetInformation;
      }

      if (rawList.length > 0) {
        const normalizedAssets: AssetInformation[] = rawList.map((item) => ({
          ...item,
          Category: resolveCategory(item)
        }));

        const signature = normalizedAssets.map((a) => `${a.AssetID}:${a.isloaded ? 1 : 0}`).join('|');
        if (signature === lastAssetsSignatureRef.current) {
          return;
        }
        lastAssetsSignatureRef.current = signature;

        setAssets(normalizedAssets);
        const names = Array.from(
          new Set(normalizedAssets.map((a) => a.PlaylistName).filter(Boolean))
        );
        setPlaylists(['All', ...names]);
        addToast('Loaded', `Received ${normalizedAssets.length} stage assets`, 'success');
      }
    } catch (e) {
      console.error('Error parsing assets JSON:', e);
    }
  }, [addToast]);

  const refreshAssets = useCallback(() => {
    if (connectionState === 'connected') {
      requestedThumbnailsRef.current.clear();
      setThumbnails({});
      stageSocket.emitEvent('message', StaticStrings.ReqAsset);
      addToast('Sync', 'Requesting assets from stage...', 'info');
    }
  }, [connectionState, addToast]);

  // Auto-connect on page refresh / initial load if previously connected
  useEffect(() => {
    const shouldAutoConnect = StorageService.getAutoConnect();
    const savedConfig = StorageService.getConnectionConfig();
    if (shouldAutoConnect && savedConfig.serverIp.trim()) {
      stageSocket.connect(savedConfig.serverIp, savedConfig.usePort, savedConfig.port);
    }
  }, []);

  // Socket.IO event listeners (single transport for the stage connection)
  useEffect(() => {
    const unsubState = stageSocket.onStateChange((state, detail, isInitial) => {
      setConnectionState(state);
      if (isInitial) return;
      if (state === 'connected') {
        addToast('Connected', 'Connected to Stage Server', 'success');

        // Handshake with Unity desktop app now that the socket is live
        stageSocket.emitEvent('message', `${StaticStrings.AppVersion}#1.0.0`);
        stageSocket.emitEvent('message', StaticStrings.ReqAsset);
        const currentSettings = StorageService.getStereoSettings();
        stageSocket.sendStereoSettings(currentSettings);
      } else if (state === 'error') {
        const savedConfig = StorageService.getConnectionConfig();
        const host = savedConfig.serverIp || '';
        const isRawIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host === 'localhost' || host === '127.0.0.1';
        if (!isRawIp) {
          // Stop auto-connect immediately on first error for public cloud URLs
          StorageService.saveAutoConnect(false);
        }
        addToast('Connection Error', detail || 'Failed to connect to stage server', 'error');
      } else if (state === 'disconnected') {
        addToast('Disconnected', 'Disconnected from stage', 'warning');
      }
    });

    const unsubUsers = stageSocket.onUsersChange((users) => {
      setConnectedUsers(users);
    });

    const unsubSocketMsg = stageSocket.onMessage((eventName: string, data: any) => {
      if (eventName === 'hologram-asset-list') {
        parseAndSetAssets(data);
        return;
      }

      if ((eventName === 'message' || eventName === 'stage-message') && typeof data === 'string') {
        const hashIndex = data.indexOf('#');
        const command = hashIndex !== -1 ? data.substring(0, hashIndex) : data;

        if (command === StaticStrings.SendingAsset) {
          if (hashIndex !== -1) {
            parseAndSetAssets(data.substring(hashIndex + 1).trim());
          }
        } else if (command === StaticStrings.ModelImageReceving) {
          const parts = data.split('#');
          if (parts.length > 2) {
            const assetId = parts[1];
            const base64 = parts.slice(2).join('#');
            if (base64 && base64 !== '-1') {
              const imageSrc = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
              setThumbnails((prev) => ({ ...prev, [assetId]: imageSrc }));
            }
          }
        }
      }
    });

    return () => {
      unsubState();
      unsubUsers();
      unsubSocketMsg();
    };
  }, [addToast, parseAndSetAssets]);

  // Load Asset on Stage
  const loadAsset = useCallback((asset: AssetInformation) => {
    const normalized: AssetInformation = {
      ...asset,
      Category: resolveCategory(asset)
    };
    setActiveAsset(normalized);
    setIsControllerOpen(true);

    const assetPayload = {
      uuid: asset.AssetID,
      title: asset.AssetName,
      name: asset.ModelPath || asset.AssetName,
      action: asset.ModelPath || asset.AssetName,
      thumb_image: asset.ThumbnailImagePath || '',
      type: normalized.Category.toString()
    };

    stageSocket.sendLoadAsset(assetPayload);
    
    if (normalized.Category === DataType.Model) {
      setCurrentMovableMode(MoveableAssetType.Rotate);
      const event: MovableActionEvent = { action: 'rotate' };
      stageSocket.sendMovableAction(event);
    } else if (normalized.Category === DataType.Video) {
      setIsVideoPlaying(true);
    }
  }, []);

  // Unload Asset
  const unloadAsset = useCallback(() => {
    const modelControl: ModelControl = { isAssetClose: 'true', action: 'reset' };
    stageSocket.sendModelControl(modelControl);
    setActiveAsset(null);
    setIsControllerOpen(false);
    setIsVideoPlaying(false);
  }, []);

  // 3D Model Joystick Controls
  const sendModelJoystick = useCallback((direction: JoyStickDirection, xPos?: number, yPos?: number, zoom?: number) => {
    const payload: ModelControl = {
      direction: direction.toString(),
      action: direction.toString().toLowerCase(),
      xPos: xPos ?? 0,
      yPos: yPos ?? 0,
      zoom: zoom ?? 0
    };
    stageSocket.sendJoystickControl(payload);
  }, []);

  const resetModelTransform = useCallback(() => {
    const payload: ModelControl = { direction: JoyStickDirection.Reset, action: 'reset' };
    stageSocket.sendModelControl(payload);
  }, []);

  const setMovableMode = useCallback((mode: MoveableAssetType) => {
    setCurrentMovableMode(mode);
    const actionName = MovableModeActionNames[mode] || 'rotate';
    const event: MovableActionEvent = { action: actionName };
    stageSocket.sendMovableAction(event);

    // Reset joystick velocity to 0,0 on mode switch
    sendModelJoystick(JoyStickDirection.End, 0, 0);
    sendModelJoystick(JoyStickDirection.Move, 0, 0);
  }, [sendModelJoystick]);

  const toggleOrthographic = useCallback(() => {
    const nextVal = !isOrthographic;
    setIsOrthographic(nextVal);
    const payload: CameraOrthographic = { isOrthographic: nextVal };
    stageSocket.sendCameraOrthographic(payload);
  }, [isOrthographic]);

  const toggleStereoscopic = useCallback(() => {
    const nextStereo = !stereoSettings.isStereo;
    const updated = { ...stereoSettings, isStereo: nextStereo };
    setStereoSettings(updated);
    StorageService.saveStereoSettings(updated);
    stageSocket.sendStereoSettings(updated);
  }, [stereoSettings]);

  const updateStereoSettings = useCallback((partial: Partial<StereoAdjustSettings>) => {
    const updated: StereoAdjustSettings = { ...stereoSettingsRef.current, ...partial };
    stereoSettingsRef.current = updated;
    setStereoSettings(updated);
    StorageService.saveStereoSettings(updated);

    if (stereoDebounceTimerRef.current) {
      window.clearTimeout(stereoDebounceTimerRef.current);
    }
    stereoDebounceTimerRef.current = window.setTimeout(() => {
      stageSocket.sendStereoSettings(stereoSettingsRef.current);
      stereoDebounceTimerRef.current = null;
    }, 40);
  }, []);

  const resetStereoSettings = useCallback(() => {
    setStereoSettings(DEFAULT_STEREO_SETTINGS);
    StorageService.saveStereoSettings(DEFAULT_STEREO_SETTINGS);
    stageSocket.sendStereoSettings(DEFAULT_STEREO_SETTINGS);
  }, []);

  const triggerFullscreen = useCallback(() => {
    stageSocket.triggerFullscreen();
  }, []);

  // Video Controls
  const playVideo = useCallback(() => {
    setIsVideoPlaying(true);
    const payload: VideoControl = { videoAction: 'play', isPlaying: 'true' };
    stageSocket.sendVideoControl(payload);
  }, []);

  const pauseVideo = useCallback(() => {
    setIsVideoPlaying(false);
    const payload: VideoControl = { videoAction: 'pause', isPlaying: 'false' };
    stageSocket.sendVideoControl(payload);
  }, []);

  const stopVideo = useCallback(() => {
    setIsVideoPlaying(false);
    const payload: VideoControl = { videoAction: 'stop', isStop: 'true' };
    stageSocket.sendVideoControl(payload);
  }, []);

  const seekVideo = useCallback((offsetSeconds: number) => {
    const payload: VideoControl = {
      videoAction: offsetSeconds > 0 ? 'seekForward' : 'seekBackward',
      seekTime: Math.abs(offsetSeconds)
    };
    stageSocket.sendVideoControl(payload);
  }, []);

  const setVideoVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVideoVolumeState(clamped);
    const payload: VideoControl = { videoAction: 'volume', volume: clamped };
    stageSocket.sendVideoControl(payload);
  }, []);

  const toggleVideoMute = useCallback(() => {
    const nextMute = !isVideoMuted;
    setIsVideoMuted(nextMute);
    const payload: VideoControl = { videoAction: 'mute', isMute: nextMute };
    stageSocket.sendVideoControl(payload);
  }, [isVideoMuted]);

  // Custom Playlist Management
  const addToCustomPlaylist = useCallback((assetId: string) => {
    setCustomPlaylistIds((prev) => {
      if (prev.includes(assetId)) return prev;
      const updated = [...prev, assetId];
      StorageService.saveCustomPlaylist(updated);
      return updated;
    });
    addToast('Playlist', 'Added asset to playlist', 'success');
  }, [addToast]);

  const removeFromCustomPlaylist = useCallback((assetId: string) => {
    setCustomPlaylistIds((prev) => {
      const updated = prev.filter((id) => id !== assetId);
      StorageService.saveCustomPlaylist(updated);
      return updated;
    });
    addToast('Playlist', 'Removed asset from playlist', 'info');
  }, [addToast]);

  const reorderCustomPlaylist = useCallback((newIds: string[]) => {
    setCustomPlaylistIds(newIds);
    StorageService.saveCustomPlaylist(newIds);
  }, []);

  const setSlideDuration = useCallback((seconds: number) => {
    const val = Math.max(1, seconds);
    setSlideDurationState(val);
    StorageService.saveSlideDuration(val);
  }, []);

  // Slideshow Player Loop
  const playlistAssets = React.useMemo(() => {
    return customPlaylistIds
      .map((id) => assets.find((a) => a.AssetID === id))
      .filter((a): a is AssetInformation => Boolean(a));
  }, [customPlaylistIds, assets]);

  const startSlideshow = useCallback((startIndex: number = 0) => {
    if (playlistAssets.length === 0) {
      addToast('Playlist Empty', 'Add assets to the custom playlist first', 'warning');
      return;
    }
    setIsSlideshowActive(true);
    setSlideshowIndex(startIndex);
  }, [playlistAssets.length, addToast]);

  const stopSlideshow = useCallback(() => {
    setIsSlideshowActive(false);
    if (slideshowTimerRef.current) {
      window.clearTimeout(slideshowTimerRef.current);
      slideshowTimerRef.current = null;
    }
    addToast('Slideshow', 'Slideshow stopped', 'info');
  }, [addToast]);

  const nextSlide = useCallback(() => {
    if (playlistAssets.length === 0) return;
    setSlideshowIndex((prev) => (prev + 1) % playlistAssets.length);
  }, [playlistAssets.length]);

  const prevSlide = useCallback(() => {
    if (playlistAssets.length === 0) return;
    setSlideshowIndex((prev) => (prev - 1 + playlistAssets.length) % playlistAssets.length);
  }, [playlistAssets.length]);

  const playlistAssetsRef = useRef<AssetInformation[]>(playlistAssets);
  playlistAssetsRef.current = playlistAssets;

  useEffect(() => {
    if (!isSlideshowActive || playlistAssets.length === 0) {
      return;
    }

    const currentItem = playlistAssets[slideshowIndex];
    if (currentItem) {
      loadAsset(currentItem);
      const totalWait = (slideDuration + (currentItem.videoDuration || 0)) * 1000;
      slideshowTimerRef.current = window.setTimeout(() => {
        setSlideshowIndex((prev) => (prev + 1) % (playlistAssetsRef.current.length || 1));
      }, totalWait);
    }

    return () => {
      if (slideshowTimerRef.current) {
        window.clearTimeout(slideshowTimerRef.current);
      }
    };
  }, [isSlideshowActive, slideshowIndex, slideDuration, loadAsset, playlistAssets.length]);

  const value: StageContextValue = {
    connectionState,
    connectedUsers,
    config,
    connect,
    disconnect,
    assets,
    playlists,
    selectedPlaylist,
    setSelectedPlaylist,
    thumbnails,
    requestThumbnail,
    activeAsset,
    loadAsset,
    unloadAsset,
    isControllerOpen,
    setIsControllerOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    sendModelJoystick,
    resetModelTransform,
    setMovableMode,
    currentMovableMode,
    toggleOrthographic,
    isOrthographic,
    toggleStereoscopic,
    triggerFullscreen,
    stereoSettings,
    updateStereoSettings,
    resetStereoSettings,
    playVideo,
    pauseVideo,
    stopVideo,
    seekVideo,
    setVideoVolume,
    toggleVideoMute,
    isVideoMuted,
    videoVolume,
    isVideoPlaying,
    customPlaylistIds,
    addToCustomPlaylist,
    removeFromCustomPlaylist,
    reorderCustomPlaylist,
    isSlideshowActive,
    slideshowIndex,
    slideDuration,
    setSlideDuration,
    startSlideshow,
    stopSlideshow,
    nextSlide,
    prevSlide,
    refreshAssets,
    toasts,
    addToast,
    removeToast
  };

  return <StageContext.Provider value={value}>{children}</StageContext.Provider>;
};

export const useStage = (): StageContextValue => {
  const context = useContext(StageContext);
  if (!context) {
    throw new Error('useStage must be used within a StageProvider');
  }
  return context;
};

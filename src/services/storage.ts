// Local storage helpers
import { StereoAdjustSettings, DEFAULT_STEREO_SETTINGS, DisplayMode, DEFAULT_DISPLAY_MODE } from '../types/protocol';

const STORAGE_KEYS = {
  SERVER_IP: 'cuenect_server_ip',
  USE_PORT: 'cuenect_use_port',
  PORT: 'cuenect_port',
  AUTO_CONNECT: 'cuenect_auto_connect',
  SLIDE_DURATION: 'cuenect_slide_duration',
  CUSTOM_PLAYLIST: 'cuenect_custom_playlist',
  STEREO_SETTINGS: 'cuenect_stereo_settings',
  DISPLAY_MODE: 'cuenect_display_mode'
} as const;

export interface ConnectionConfig {
  serverIp: string;
  usePort: boolean;
  port: number;
}

export const StorageService = {
  getConnectionConfig(): ConnectionConfig {
    const serverIp = localStorage.getItem(STORAGE_KEYS.SERVER_IP) || '';
    const usePortStr = localStorage.getItem(STORAGE_KEYS.USE_PORT);
    const usePort = usePortStr !== null ? usePortStr === 'true' : true;
    const portStr = localStorage.getItem(STORAGE_KEYS.PORT);
    const port = portStr ? parseInt(portStr, 10) : 9000;

    return { serverIp, usePort, port };
  },

  saveConnectionConfig(config: ConnectionConfig): void {
    localStorage.setItem(STORAGE_KEYS.SERVER_IP, config.serverIp);
    localStorage.setItem(STORAGE_KEYS.USE_PORT, config.usePort.toString());
    localStorage.setItem(STORAGE_KEYS.PORT, config.port.toString());
  },

  getAutoConnect(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.AUTO_CONNECT);
    return val === 'true';
  },

  saveAutoConnect(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.AUTO_CONNECT, enabled ? 'true' : 'false');
  },

  getStereoSettings(): StereoAdjustSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.STEREO_SETTINGS);
    if (!raw) return DEFAULT_STEREO_SETTINGS;
    try {
      return { ...DEFAULT_STEREO_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_STEREO_SETTINGS;
    }
  },

  saveStereoSettings(settings: StereoAdjustSettings): void {
    localStorage.setItem(STORAGE_KEYS.STEREO_SETTINGS, JSON.stringify(settings));
  },

  getDisplayMode(): DisplayMode {
    const raw = localStorage.getItem(STORAGE_KEYS.DISPLAY_MODE);
    if (raw === null) return DEFAULT_DISPLAY_MODE;
    const parsed = parseInt(raw, 10);
    if (parsed === DisplayMode.Mono2D || parsed === DisplayMode.StereoSbs || parsed === DisplayMode.HoloDevice) {
      return parsed;
    }
    return DEFAULT_DISPLAY_MODE;
  },

  saveDisplayMode(mode: DisplayMode): void {
    localStorage.setItem(STORAGE_KEYS.DISPLAY_MODE, mode.toString());
  },

  getSlideDuration(): number {
    const val = localStorage.getItem(STORAGE_KEYS.SLIDE_DURATION);
    return val ? parseFloat(val) : 5;
  },

  saveSlideDuration(seconds: number): void {
    localStorage.setItem(STORAGE_KEYS.SLIDE_DURATION, seconds.toString());
  },

  getCustomPlaylist(): string[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_PLAYLIST);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveCustomPlaylist(assetIds: string[]): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PLAYLIST, JSON.stringify(assetIds));
  }
};

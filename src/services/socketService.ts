import { io, Socket } from 'socket.io-client';
import {
  ConnectionState,
  User,
  ModelControl,
  VideoControl,
  MovableActionEvent,
  CameraOrthographic,
  StereoAdjustSettings
} from '../types/protocol';

export type SocketMessageHandler = (event: string, data: any) => void;
export type SocketStateChangeHandler = (state: ConnectionState, detail?: string, isInitial?: boolean) => void;
export type SocketUsersChangeHandler = (users: User[]) => void;

export class StageSocketService {
  private socket: Socket | null = null;
  private url: string = '';
  private state: ConnectionState = 'disconnected';
  private users: User[] = [];
  private clientName: string = '';
  private messageHandlers: Set<SocketMessageHandler> = new Set();
  private stateHandlers: Set<SocketStateChangeHandler> = new Set();
  private usersHandlers: Set<SocketUsersChangeHandler> = new Set();

  public getState(): ConnectionState {
    return this.state;
  }

  public getUrl(): string {
    return this.url;
  }

  public getUsers(): User[] {
    return this.users;
  }

  public getClientName(): string {
    return this.clientName;
  }

  public onMessage(handler: SocketMessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  public onStateChange(handler: SocketStateChangeHandler): () => void {
    this.stateHandlers.add(handler);
    // Replay the current state synchronously so a late subscriber sees it immediately.
    // Flagged as isInitial so subscribers can skip side effects (e.g. toasts) that
    // should only fire on a real transition, not on this replay of the pre-connect default.
    handler(this.state, undefined, true);
    return () => {
      this.stateHandlers.delete(handler);
    };
  }

  public onUsersChange(handler: SocketUsersChangeHandler): () => void {
    this.usersHandlers.add(handler);
    handler(this.users);
    return () => {
      this.usersHandlers.delete(handler);
    };
  }

  private setState(state: ConnectionState, detail?: string): void {
    this.state = state;
    this.stateHandlers.forEach((h) => h(state, detail));
  }

  private setUsers(users: User[]): void {
    this.users = users;
    this.usersHandlers.forEach((h) => h(users));
  }

  public connect(address: string, usePort: boolean = true, port: number = 9000): void {
    this.disconnect();
    this.clientName = `WebBrowser_${Math.random().toString(36).substring(2, 8)}`;

    let targetUrl = address.trim();
    // Preserve an explicit scheme if the caller already included one (ws/wss/http/https).
    const hadSecureScheme = /^(wss|https):\/\//i.test(targetUrl);
    targetUrl = targetUrl.replace(/^wss?:\/\//i, '').replace(/^https?:\/\//i, '');

    // Extract bare host for type check (URL vs IP)
    let bareHost = targetUrl;
    if (bareHost.includes(':')) {
      bareHost = bareHost.split(':')[0];
    }
    bareHost = bareHost.replace(/\/+.*$/, '');

    const isRawIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(bareHost) || bareHost === 'localhost' || bareHost === '127.0.0.1';
    const isPublicTunnel = !isRawIp || bareHost.includes('ngrok') || bareHost.includes('.app');

    // usePort=false means "public tunnel address, no dedicated port" (e.g. an ngrok hostname)
    const effectiveUsePort = isPublicTunnel ? false : usePort;
    const useSecureScheme = hadSecureScheme || isPublicTunnel || !effectiveUsePort;
    targetUrl = `${useSecureScheme ? 'https' : 'http'}://${targetUrl}`;

    if (effectiveUsePort) {
      try {
        const urlObj = new URL(targetUrl);
        if (!urlObj.port) {
          urlObj.port = port.toString();
          targetUrl = urlObj.origin;
        }
      } catch {
        targetUrl = `${targetUrl}:${port}`;
      }
    } else {
      try {
        const urlObj = new URL(targetUrl);
        targetUrl = `${urlObj.protocol}//${urlObj.hostname}`;
      } catch {}
    }

    this.url = targetUrl;
    this.setState('connecting');

    try {
      this.socket = io(this.url, {
        transports: ['websocket', 'polling'],
        reconnection: !isPublicTunnel,
        reconnectionAttempts: isPublicTunnel ? 0 : 10,
        reconnectionDelay: 1000,
        timeout: 8000
      });

      this.socket.on('connect', () => {
        this.setState('connected');
        this.socket?.emit('login', { name: this.clientName });
      });

      this.socket.on('connect_error', (err) => {
        this.setState('error', err.message);
        if (isPublicTunnel) {
          this.disconnect();
        }
      });

      this.socket.on('disconnect', (reason) => {
        this.setState('disconnected', reason);
      });

      this.socket.on('login_response', (resp: { success: boolean; users?: string[] }) => {
        if (resp && resp.users) {
          const userList: User[] = resp.users.map((name, idx) => ({ name, id: idx + 1 }));
          this.setUsers(userList);
        }
      });

      this.socket.on('user_joined', (data: { user: string; users: string[] }) => {
        if (data && data.users) {
          const userList: User[] = data.users.map((name, idx) => ({ name, id: idx + 1 }));
          this.setUsers(userList);
        }
      });

      this.socket.on('user_left', (data: { user: string; users: string[] }) => {
        if (data && data.users) {
          const userList: User[] = data.users.map((name, idx) => ({ name, id: idx + 1 }));
          this.setUsers(userList);
        }
      });

      this.socket.onAny((event: string, ...args: any[]) => {
        this.messageHandlers.forEach((handler) => handler(event, args[0]));
      });
    } catch (err: any) {
      this.setState('error', err.message || 'Failed to initialize socket');
    }
  }

  public disconnect(): void {
    const wasConnected = this.state !== 'disconnected';
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    if (wasConnected) {
      this.setState('disconnected');
    }
    this.setUsers([]);
  }

  public emitEvent(eventName: string, data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(eventName, data);
    }
  }

  // Unified Stage Actions
  public sendLoadAsset(asset: any): void {
    this.emitEvent('hologram-asset-action', asset);
  }

  public sendModelControl(control: ModelControl | any): void {
    this.emitEvent('hologram-model-action', control);
  }

  public sendJoystickControl(control: ModelControl | any): void {
    this.emitEvent('hologram-joystick-action', control);
  }

  public sendModelAction(action: string): void {
    this.emitEvent('hologram-model-action', { action });
  }

  public sendVideoControl(control: Partial<VideoControl>): void {
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(control)) {
      if (v !== undefined) payload[k] = v;
    }
    if (control.mute !== undefined || control.isMute !== undefined) {
      const m = control.mute ?? control.isMute;
      payload.mute = m;
      payload.isMute = m;
    }
    if (control.seekTime !== undefined || control.backForwardSeconds !== undefined) {
      const s = control.seekTime ?? control.backForwardSeconds;
      payload.seekTime = s;
      payload.backForwardSeconds = s;
    }
    this.emitEvent('hologram-video-action', payload);
  }

  public sendMovableAction(action: MovableActionEvent | any): void {
    this.emitEvent('hologram-action', action);
  }

  public sendCameraOrthographic(camera: CameraOrthographic | any): void {
    this.emitEvent('hologram-camera-orthographic-action', camera);
  }

  public sendStereoSettings(settings: Partial<StereoAdjustSettings> | any): void {
    const payload = {
      ...settings,
      zeroParallaxDistance: settings.zeroParallaxDistance ?? settings.zeroParallax,
      zeroParallax: settings.zeroParallax ?? settings.zeroParallaxDistance,
      fieldOfView: settings.fieldOfView ?? settings.fov,
      fov: settings.fov ?? settings.fieldOfView,
      lightIntensity: settings.lightIntensity ?? settings.lightBrightness,
      lightBrightness: settings.lightBrightness ?? settings.lightIntensity
    };
    this.emitEvent('StereoSettingsActionKey', payload);
  }

  // Bridged as raw stage command strings (same convention as ReqAsset)
  public requestThumbnail(assetId: string): void {
    this.emitEvent('message', `ModelImageRequest#${assetId}`);
  }

  public triggerFullscreen(): void {
    this.emitEvent('message', 'FullScreen');
  }
}

export const stageSocket = new StageSocketService();

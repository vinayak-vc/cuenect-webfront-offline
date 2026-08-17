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

    // usePort=false means "public tunnel address, no dedicated port" (e.g. an ngrok
    // hostname), which is always served over TLS — must be https/wss, never http/ws.
    const useSecureScheme = hadSecureScheme || !usePort;
    targetUrl = `${useSecureScheme ? 'https' : 'http'}://${targetUrl}`;

    if (usePort) {
      try {
        const urlObj = new URL(targetUrl);
        if (!urlObj.port) {
          urlObj.port = port.toString();
          targetUrl = urlObj.origin;
        }
      } catch {
        // Fallback for IP inputs
        targetUrl = `${targetUrl}:${port}`;
      }
    }

    this.url = targetUrl;
    this.setState('connecting');

    try {
      this.socket = io(this.url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      this.socket.on('connect', () => {
        this.setState('connected');
        this.socket?.emit('login', { name: this.clientName });
        this.socket?.emit('message', 'ReqAsset');
        this.socket?.emit('stage-message', 'ReqAsset');
      });

      this.socket.on('connect_error', (err) => {
        this.setState('error', err.message);
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

      // Catch-all event listener to dispatch to subscribers
      this.socket.onAny((eventName: string, ...args: any[]) => {
        this.messageHandlers.forEach((h) => h(eventName, args[0]));
      });
    } catch (err: any) {
      this.setState('error', err.message || 'Failed to initialize Socket.IO');
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.setState('disconnected');
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

  public sendVideoControl(control: VideoControl | any): void {
    this.emitEvent('hologram-video-action', control);
  }

  public sendMovableAction(action: MovableActionEvent | any): void {
    this.emitEvent('hologram-action', action);
  }

  public sendCameraOrthographic(camera: CameraOrthographic | any): void {
    this.emitEvent('hologram-camera-orthographic-action', camera);
  }

  public sendStereoSettings(settings: Partial<StereoAdjustSettings> | any): void {
    this.emitEvent('StereoSettingsActionKey', settings);
  }

  // Bridged as raw stage command strings (same convention as ReqAsset) since
  // Unity has no dedicated typed Socket.IO event for these yet.
  public requestThumbnail(assetId: string): void {
    this.emitEvent('message', `ModelImageRequest#${assetId}`);
    this.emitEvent('stage-message', `ModelImageRequest#${assetId}`);
  }

  public triggerFullscreen(): void {
    this.emitEvent('message', 'FullScreen');
    this.emitEvent('stage-message', 'FullScreen');
  }
}

export const stageSocket = new StageSocketService();

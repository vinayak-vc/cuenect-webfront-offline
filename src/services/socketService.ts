import { io, Socket } from 'socket.io-client';
import { StorageService } from './storage';
import {
  ConnectionState,
  User,
  ModelControl,
  VideoControl,
  MovableActionEvent,
  CameraOrthographic,
  StereoAdjustSettings,
  DisplayMode,
  DisplayModePayload,
  DisplayModeNames,
  EnvironmentPreset,
  EnvironmentPresetPayload,
  EnvironmentPresetNames,
  StaticStrings
} from '../types/protocol';

export type SocketMessageHandler = (event: string, data: any) => void;
export type SocketStateChangeHandler = (state: ConnectionState, detail?: string, isInitial?: boolean) => void;
export type SocketUsersChangeHandler = (users: User[]) => void;
export type ConnectionTransport = 'ngrok' | 'lan';
export type TransportPromotionState = 'idle' | 'discovering' | 'probing' | 'promoted' | 'fallback';
export type TransportChangeHandler = (transport: ConnectionTransport, state: TransportPromotionState) => void;

export class StageSocketService {
  private socket: Socket | null = null;
  private url: string = '';
  private state: ConnectionState = 'disconnected';
  private transport: ConnectionTransport = 'lan';
  private transportState: TransportPromotionState = 'idle';
  private hasAttemptedLanPromotion: boolean = false;
  private users: User[] = [];
  private clientName: string = '';
  private messageHandlers: Set<SocketMessageHandler> = new Set();
  private stateHandlers: Set<SocketStateChangeHandler> = new Set();
  private usersHandlers: Set<SocketUsersChangeHandler> = new Set();
  private transportHandlers: Set<TransportChangeHandler> = new Set();

  public getState(): ConnectionState {
    return this.state;
  }

  public getUrl(): string {
    return this.url;
  }

  public getActiveServerUrl(): string {
    return this.url;
  }

  public getActiveApiBaseUrl(): string {
    return this.getHttpBaseUrl();
  }

  public getTransport(): ConnectionTransport {
    return this.transport;
  }

  public getTransportState(): TransportPromotionState {
    return this.transportState;
  }

  public isLocalConnection(): boolean {
    return this.transport === 'lan';
  }

  public isTunnelConnection(): boolean {
    return this.transport === 'ngrok';
  }

  public onTransportChange(handler: TransportChangeHandler): () => void {
    this.transportHandlers.add(handler);
    handler(this.transport, this.transportState);
    return () => {
      this.transportHandlers.delete(handler);
    };
  }

  private setTransportState(state: TransportPromotionState): void {
    this.transportState = state;
    this.transportHandlers.forEach((h) => h(this.transport, this.transportState));
  }

  public getHttpBaseUrl(): string {
    let raw = this.url;
    if (!raw && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const server = params.get('server') || params.get('url');
      if (server) {
        raw = server;
      } else {
        const host = params.get('host') || params.get('ip');
        const port = params.get('port');
        if (host) {
          raw = port ? `${host}:${port}` : host;
        } else {
          const saved = StorageService.getConnectionConfig();
          if (saved.serverIp) {
            raw = saved.usePort ? `${saved.serverIp}:${saved.port}` : saved.serverIp;
          }
        }
      }
    }

    if (!raw) {
      return 'http://127.0.0.1:9000';
    }

    const trimmed = raw.trim();

    // Preserve explicit scheme if provided
    if (/^https:\/\//i.test(trimmed)) {
      return trimmed.replace(/\/+$/, '');
    }
    if (/^wss:\/\//i.test(trimmed)) {
      return trimmed.replace(/^wss:\/\//i, 'https://').replace(/\/+$/, '');
    }
    if (/^http:\/\//i.test(trimmed)) {
      return trimmed.replace(/\/+$/, '');
    }
    if (/^ws:\/\//i.test(trimmed)) {
      return trimmed.replace(/^ws:\/\//i, 'http://').replace(/\/+$/, '');
    }

    // No scheme provided: distinguish between local IP/localhost (HTTP) and public tunnels (HTTPS)
    let bareHost = trimmed.replace(/\/+.*$/, '');
    if (bareHost.includes(':')) {
      bareHost = bareHost.split(':')[0];
    }

    const isRawIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(bareHost) || bareHost === 'localhost' || bareHost === '127.0.0.1';
    const isPublicTunnel = !isRawIp || bareHost.includes('ngrok') || bareHost.includes('.app');

    const scheme = isPublicTunnel ? 'https' : 'http';
    return `${scheme}://${trimmed.replace(/\/+$/, '')}`;
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
    if (isPublicTunnel) {
      this.transport = 'ngrok';
      if (!this.hasAttemptedLanPromotion) {
        this.setTransportState('idle');
      }
      console.log(`[Connection] Starting with ngrok: ${this.url}`);
    } else {
      this.transport = 'lan';
      this.setTransportState('promoted');
      this.hasAttemptedLanPromotion = true;
      console.log(`[Connection] Starting with LAN: ${this.url}`);
    }

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

        // Fallback timer if login_response is delayed or doesn't provide serverInfo
        if (isPublicTunnel && !this.hasAttemptedLanPromotion) {
          setTimeout(() => {
            if (isPublicTunnel && !this.hasAttemptedLanPromotion) {
              this.attemptLanPromotion();
            }
          }, 2000);
        }
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

      this.socket.on('login_response', (resp: {
        success: boolean;
        users?: string[];
        serverInfo?: {
          localIp: string;
          localIps?: string[];
          port: number;
          localUrl?: string;
          isTunnel?: boolean;
        };
      }) => {
        if (resp && resp.users) {
          const userList: User[] = resp.users.map((name, idx) => ({ name, id: idx + 1 }));
          this.setUsers(userList);
        }

        // Fast path: server already reported its local network coordinates over the socket
        if (isPublicTunnel && !this.hasAttemptedLanPromotion) {
          if (resp?.serverInfo?.localIp && resp?.serverInfo?.port) {
            this.attemptLanPromotion({
              localIp: resp.serverInfo.localIp,
              localIps: resp.serverInfo.localIps,
              port: resp.serverInfo.port,
              localUrl: resp.serverInfo.localUrl || `http://${resp.serverInfo.localIp}:${resp.serverInfo.port}`
            });
          } else {
            this.attemptLanPromotion();
          }
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

  public disconnect(resetPromotionState: boolean = false): void {
    if (resetPromotionState) {
      this.hasAttemptedLanPromotion = false;
      this.setTransportState('idle');
    }
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

  private async attemptLanPromotion(directInfo?: {
    localIp: string;
    localIps?: string[];
    port: number;
    localUrl: string;
  }): Promise<void> {
    if (this.hasAttemptedLanPromotion) return;
    this.hasAttemptedLanPromotion = true;

    this.setTransportState('discovering');
    console.log('[Connection] Discovering local IP...');

    let info: { localIp: string; localIps?: string[]; port: number; localUrl: string } | null = directInfo || null;

    if (!info) {
      const ngrokHttpBase = this.getHttpBaseUrl();
      const discoveryUrl = `${ngrokHttpBase}/api/connection-info?ngrok-skip-browser-warning=true`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(discoveryUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Accept: 'application/json'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          throw new Error(`HTTP ${res.status} (${contentType || 'non-JSON'})`);
        }
        info = await res.json();
      } catch (err: any) {
        console.warn(`[Connection] Local discovery request failed: ${err?.message || err}`);
        console.log('[Connection] Staying on ngrok fallback');
        this.setTransportState('fallback');
        return;
      }
    }

    if (!info || !info.localIp || !info.port) {
      console.warn('[Connection] Invalid discovery response received:', info);
      console.log('[Connection] Staying on ngrok fallback');
      this.setTransportState('fallback');
      return;
    }

    const targetLocalIp = info.localIp;
    const targetPort = info.port;
    const targetLocalUrl = info.localUrl || `http://${targetLocalIp}:${targetPort}`;

    console.log(`[Connection] Discovered local address: ${targetLocalUrl}`);
    this.setTransportState('probing');
    console.log(`[Connection] Probing local address: ${targetLocalUrl}...`);

    const isReachable = await this.probeLanEndpoint(targetLocalUrl, 2500);

    if (!isReachable) {
      console.warn(`[Connection] Local server unreachable. Continuing via ngrok.`);
      console.log('[Connection] Staying on ngrok fallback');
      this.setTransportState('fallback');
      return;
    }

    console.log('[Connection] Local address reachable! Switching...');
    console.log(`[Connection] Switching transport: ngrok -> LAN (${targetLocalUrl})`);

    // Disconnect and clean up the ngrok socket cleanly
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      console.log('[Connection] Ngrok socket disconnected');
    }

    // Switch transport to LAN
    this.transport = 'lan';
    this.setTransportState('promoted');

    // Connect to LAN socket
    this.connect(targetLocalIp, true, targetPort);
    console.log('[Connection] Local socket connected');
  }

  private async probeLanEndpoint(localUrl: string, timeoutMs: number = 2500): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let resolved = false;
      let probeSocket: Socket | null = null;
      let timer: any = null;

      const finish = (result: boolean, reason?: string) => {
        if (resolved) return;
        resolved = true;
        if (timer) clearTimeout(timer);
        if (probeSocket) {
          try {
            probeSocket.removeAllListeners();
            probeSocket.disconnect();
            probeSocket.close();
          } catch {}
          probeSocket = null;
        }
        if (!result && reason) {
          console.warn(`[Connection] Local probe failed: ${reason}`);
        }
        resolve(result);
      };

      timer = setTimeout(() => {
        finish(false, `Timeout after ${timeoutMs}ms`);
      }, timeoutMs);

      // Attempt lightweight fetch probe in parallel (non-blocking)
      try {
        const controller = new AbortController();
        const fetchTimer = setTimeout(() => controller.abort(), timeoutMs);
        fetch(`${localUrl}/health`, { method: 'GET', mode: 'cors', signal: controller.signal })
          .then((res) => {
            clearTimeout(fetchTimer);
            if (res.ok) {
              finish(true);
            }
          })
          .catch((_fetchErr) => {
            clearTimeout(fetchTimer);
          });
      } catch {
        // Mixed content or network error on fetch attempt is expected on HTTPS, ignore
      }

      // Attempt Socket.IO WebSocket probe
      try {
        probeSocket = io(localUrl, {
          transports: ['websocket'],
          reconnection: false,
          timeout: timeoutMs,
          forceNew: true,
          autoConnect: true
        });

        probeSocket.on('connect', () => {
          finish(true);
        });

        probeSocket.on('connect_error', (err) => {
          finish(false, err?.message || 'Socket connect_error');
        });

        probeSocket.on('error', (err: any) => {
          finish(false, err?.message || 'Socket error');
        });
      } catch (err: any) {
        finish(false, err?.message || 'Exception initializing probe');
      }
    });
  }

  /**
   * Commands that mutate what the audience sees. Blocked while another operator
   * holds control so two controllers cannot fight over a live stage.
   *
   * Read-only traffic (thumbnail requests, catalog refresh, control requests)
   * is deliberately absent: an observer must still be able to browse.
   */
  private static readonly STAGE_MUTATING_EVENTS = new Set<string>([
    'hologram-asset-action',
    'hologram-model-action',
    'hologram-joystick-action',
    'hologram-video-action',
    'hologram-action',
    'hologram-camera-orthographic-action',
    'StereoSettingsActionKey',
    'hologram-display-mode-action',
    'hologram-model-transform'
  ]);

  /**
   * False when this client is an observer. Defaults to true, and stays true if
   * the bridge never reports lock state, so an older server cannot lock the
   * operator out of their own stage.
   */
  private hasStageControl: boolean = true;

  /** Notified when a stage command is dropped because control is held elsewhere. */
  private blockedHandler: ((eventName: string) => void) | null = null;

  public onCommandBlocked(handler: (eventName: string) => void): () => void {
    this.blockedHandler = handler;
    return () => {
      this.blockedHandler = null;
    };
  }

  public setStageControl(hasControl: boolean): void {
    this.hasStageControl = hasControl;
  }

  public get canDriveStage(): boolean {
    return this.hasStageControl;
  }

  public emitEvent(eventName: string, data: any): void {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    if (!this.hasStageControl && StageSocketService.STAGE_MUTATING_EVENTS.has(eventName)) {
      // Silent drops look like a broken app; tell the UI so it can say why.
      this.blockedHandler?.(eventName);
      return;
    }

    this.socket.emit(eventName, data);
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

  public sendModelTransform(transform: any): void {
    this.emitEvent('hologram-model-transform', transform);
  }

  public sendSyncTransform(yaw: number, pitch: number, scale?: number, posX?: number, posY?: number): void {
    const payload = {
      action: 'sync_transform',
      direction: 'move',
      yaw,
      pitch,
      scale: scale ?? 1,
      xPos: posX ?? 0,
      yPos: posY ?? 0
    };
    this.emitEvent('hologram-joystick-action', payload);
  }

  public stopAutoRotate(): void {
    this.emitEvent('hologram-joystick-action', {
      action: 'stop_auto_rotate',
      direction: 'move',
      xPos: 0,
      yPos: 0
    });
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

  /**
   * Switch the stage display path: 2D / side-by-side stereo / HOLO device.
   * Both `mode` and `modeName` are sent so either Unity parse branch resolves it.
   */
  public sendDisplayMode(mode: DisplayMode): void {
    const payload: DisplayModePayload = {
      mode,
      modeName: DisplayModeNames[mode]
    };
    this.emitEvent(StaticStrings.DisplayModeActionKey, payload);

    // Fallback over the raw `message` channel: bridges that relay only known
    // typed events still pass `message` through (same route as ReqAsset /
    // FullScreen). Unity's handler is idempotent, so the duplicate is harmless.
    this.emitEvent('message', `DisplayMode#${DisplayModeNames[mode]}`);
  }

  /**
   * Switch the stage environment: the black void the stage shipped with, or space.
   * Both `preset` and `presetName` are sent so either Unity parse branch resolves it.
   *
   * No raw `message` fallback here, unlike sendDisplayMode: that fallback exists for
   * bridges that relay only a fixed set of typed events, and Unity has no
   * `Environment#` raw branch - sending one would be a channel nothing reads.
   */
  public sendEnvironmentPreset(preset: EnvironmentPreset): void {
    const payload: EnvironmentPresetPayload = {
      preset,
      presetName: EnvironmentPresetNames[preset]
    };
    this.emitEvent(StaticStrings.EnvironmentActionKey, payload);
  }

  /** Ask the bridge for exclusive control of the stage. */
  public requestControl(): void {
    this.emitEvent(StaticStrings.ControlRequest, {});
  }

  /** Give control back so another operator can take over. */
  public releaseControl(): void {
    this.emitEvent(StaticStrings.ControlRelease, {});
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

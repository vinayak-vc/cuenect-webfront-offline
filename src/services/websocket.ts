// WebSocket service matching Signaling.cs and server.js JSON wire protocol
import { ConnectionState, WebMessage, User } from '../types/protocol';

export type MessageHandler = (command: string, rawMessage: string, parts: string[]) => void;
export type StateChangeHandler = (state: ConnectionState, detail?: string) => void;
export type UsersChangeHandler = (users: User[]) => void;

export class StageWebSocket {
  private socket: WebSocket | null = null;
  private url: string = '';
  private state: ConnectionState = 'disconnected';
  private users: User[] = [];
  private clientName: string = '';
  private isLoggedIn: boolean = false;
  private messageHandlers: Set<MessageHandler> = new Set();
  private stateHandlers: Set<StateChangeHandler> = new Set();
  private usersHandlers: Set<UsersChangeHandler> = new Set();
  private reconnectTimer: number | null = null;
  private autoReconnect: boolean = false;

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

  public getIsLoggedIn(): boolean {
    return this.isLoggedIn;
  }

  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  public onStateChange(handler: StateChangeHandler): () => void {
    this.stateHandlers.add(handler);
    handler(this.state);
    return () => {
      this.stateHandlers.delete(handler);
    };
  }

  public onUsersChange(handler: UsersChangeHandler): () => void {
    this.usersHandlers.add(handler);
    handler(this.users);
    return () => {
      this.usersHandlers.delete(handler);
    };
  }

  private setState(state: ConnectionState, detail?: string): void {
    this.state = state;
    this.stateHandlers.forEach((handler) => handler(state, detail));
  }

  private setUsers(users: User[]): void {
    this.users = users;
    this.usersHandlers.forEach((handler) => handler(users));
  }

  public connect(address: string, usePort: boolean = true, port: number = 9000): void {
    this.disconnect();
    this.autoReconnect = true;
    this.isLoggedIn = false;

    // Generate a unique client name matching Unity Signaling.cs convention
    this.clientName = `WebBrowser_${Math.random().toString(36).substring(2, 8)}`;

    let cleanAddress = address.trim();
    if (cleanAddress.startsWith('ws://')) {
      cleanAddress = cleanAddress.substring(5);
    } else if (cleanAddress.startsWith('wss://')) {
      cleanAddress = cleanAddress.substring(6);
    }

    if (cleanAddress.endsWith('/')) {
      cleanAddress = cleanAddress.substring(0, cleanAddress.length - 1);
    }

    if (usePort) {
      if (!cleanAddress.includes(':')) {
        this.url = `ws://${cleanAddress}:${port}/`;
      } else {
        this.url = `ws://${cleanAddress}/`;
      }
    } else {
      this.url = `wss://${cleanAddress}`;
    }

    this.setState('connecting');

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        this.setState('connected');
        if (this.reconnectTimer) {
          window.clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Perform server.js login immediately on connection
        this.sendLogin();
      };

      this.socket.onmessage = (event: MessageEvent) => {
        if (typeof event.data === 'string') {
          this.handleIncomingRaw(event.data);
        }
      };

      this.socket.onerror = () => {
        this.setState('error', 'WebSocket connection error');
      };

      this.socket.onclose = (event: CloseEvent) => {
        this.socket = null;
        this.isLoggedIn = false;
        this.setUsers([]);
        this.setState('disconnected', event.reason || 'Connection closed');
        if (this.autoReconnect) {
          this.scheduleReconnect(address, usePort, port);
        }
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown connection error';
      this.setState('error', errorMsg);
      if (this.autoReconnect) {
        this.scheduleReconnect(address, usePort, port);
      }
    }
  }

  private handleIncomingRaw(rawData: string): void {
    let parsedJson: WebMessage | null = null;
    try {
      parsedJson = JSON.parse(rawData);
    } catch {
      parsedJson = null;
    }

    if (parsedJson && parsedJson.type) {
      this.handleWebMessage(parsedJson);
    } else {
      // Plain text fallback
      const parts = rawData.split('#');
      const command = parts[0] || '';
      this.messageHandlers.forEach((handler) => handler(command, rawData, parts));
    }
  }

  private handleWebMessage(msg: WebMessage): void {
    switch (msg.type) {
      case 'connect':
        // Server greeted us, send login if not already sent
        this.sendLogin();
        if (msg.users) {
          this.setUsers(msg.users);
        }
        break;

      case 'login':
        if (msg.success) {
          this.isLoggedIn = true;
          if (msg.users) {
            this.setUsers(msg.users);
          }
          // Trigger initial stage handshake once logged in
          this.messageHandlers.forEach((handler) =>
            handler('__STAGE_LOGGED_IN__', '', ['__STAGE_LOGGED_IN__'])
          );
        }
        break;

      case 'newUser':
      case 'users':
      case 'leave':
        if (msg.users) {
          this.setUsers(msg.users);
        }
        break;

      case 'message':
        if (msg.message) {
          const innerMessage = msg.message;
          const parts = innerMessage.split('#');
          const command = parts[0] || '';
          this.messageHandlers.forEach((handler) => handler(command, innerMessage, parts));
        }
        break;

      case 'error':
        console.warn('Signaling server error:', msg.message);
        break;

      default:
        break;
    }
  }

  private sendLogin(): void {
    const loginMsg: WebMessage = {
      type: 'login',
      name: this.clientName
    };
    this.sendRaw(JSON.stringify(loginMsg));
  }

  private scheduleReconnect(address: string, usePort: boolean, port: number): void {
    if (this.reconnectTimer) {
      return;
    }
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (this.autoReconnect && this.state !== 'connected' && this.state !== 'connecting') {
        this.connect(address, usePort, port);
      }
    }, 4000);
  }

  public sendRaw(msg: string): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(msg);
      return true;
    }
    return false;
  }

  // Sends stage commands wrapped in server.js WebMessage JSON
  public send(stageMessage: string): boolean {
    const webMsg: WebMessage = {
      type: 'message',
      messengertype: 'client',
      message: stageMessage
    };
    return this.sendRaw(JSON.stringify(webMsg));
  }

  public sendJson(command: string, payload: unknown): boolean {
    const jsonStr = JSON.stringify(payload);
    return this.send(`${command}#${jsonStr}`);
  }

  public disconnect(): void {
    this.autoReconnect = false;
    this.isLoggedIn = false;
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close();
      }
      this.socket = null;
    }
    this.setUsers([]);
    this.setState('disconnected');
  }
}

export const stageWebSocket = new StageWebSocket();

// WebSocket service matching Signaling.cs wire protocol
import { StaticStrings, ConnectionState } from '../types/protocol';

export type MessageHandler = (command: string, rawMessage: string, parts: string[]) => void;
export type StateChangeHandler = (state: ConnectionState, detail?: string) => void;

export class StageWebSocket {
  private socket: WebSocket | null = null;
  private url: string = '';
  private state: ConnectionState = 'disconnected';
  private messageHandlers: Set<MessageHandler> = new Set();
  private stateHandlers: Set<StateChangeHandler> = new Set();
  private reconnectTimer: number | null = null;
  private autoReconnect: boolean = false;

  public getState(): ConnectionState {
    return this.state;
  }

  public getUrl(): string {
    return this.url;
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

  private setState(state: ConnectionState, detail?: string): void {
    this.state = state;
    this.stateHandlers.forEach((handler) => handler(state, detail));
  }

  public connect(address: string, usePort: boolean = true, port: number = 9000): void {
    this.disconnect();
    this.autoReconnect = true;

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
        // Handshake on connect
        this.send(`${StaticStrings.AppVersion}#1.0.0`);
      };

      this.socket.onmessage = (event: MessageEvent) => {
        if (typeof event.data === 'string') {
          const rawMessage = event.data;
          const parts = rawMessage.split('#');
          const command = parts[0] || '';
          this.messageHandlers.forEach((handler) => handler(command, rawMessage, parts));
        }
      };

      this.socket.onerror = () => {
        this.setState('error', 'WebSocket connection error');
      };

      this.socket.onclose = (event: CloseEvent) => {
        this.socket = null;
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

  public send(msg: string): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(msg);
      return true;
    }
    return false;
  }

  public sendJson(command: string, payload: unknown): boolean {
    const jsonStr = JSON.stringify(payload);
    return this.send(`${command}#${jsonStr}`);
  }

  public disconnect(): void {
    this.autoReconnect = false;
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
    this.setState('disconnected');
  }
}

export const stageWebSocket = new StageWebSocket();

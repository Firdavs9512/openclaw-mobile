import { EventEmitter } from 'events';
import { Platform } from 'react-native';

import type {
  ConnectionState,
  ConnectChallenge,
  ConnectParams,
  DeviceIdentity,
  EventFrame,
  GatewayConfig,
  GatewayFrame,
  HelloOkPayload,
  ResponseFrame,
} from '@/types/gateway';
import { ensureDeviceIdentity, signChallenge } from '@/utils/crypto';
import { secureSet } from '@/utils/secure-storage';

import { GatewayError } from './errors';
import { buildGatewayUrl, generateUUID } from './utils';

interface PendingRequest {
  id: string;
  method: string;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class GatewayClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private config: GatewayConfig | null = null;
  private deviceIdentity: DeviceIdentity | null = null;
  private _state: ConnectionState = 'disconnected';

  get state(): ConnectionState {
    return this._state;
  }

  getConfig(): GatewayConfig | null {
    return this.config;
  }

  async connect(config: GatewayConfig): Promise<void> {
    if (this.ws) {
      this.disconnect();
    }

    this.config = config;
    this.setState('connecting');

    this.deviceIdentity = await ensureDeviceIdentity();

    const url = buildGatewayUrl(config);
    await this.openWebSocket(url);
    this.setState('handshaking');

    const challenge = await this.waitForEvent<ConnectChallenge>(
      'connect.challenge',
      5000,
    );

    const signature = await signChallenge(challenge.nonce);

    const connectParams: ConnectParams = {
      minProtocol: 'v3',
      maxProtocol: 'v3',
      client: {
        id: 'openclaw-rn',
        version: '0.1.0',
        platform: Platform.OS,
        mode: 'operator',
        instanceId: this.deviceIdentity.id,
      },
      role: 'operator',
      scopes: [
        'operator.read',
        'operator.write',
        'operator.admin',
        'operator.approvals',
      ],
      auth: {
        token: config.token,
        password: config.password,
      },
      device: {
        id: this.deviceIdentity.id,
        publicKey: this.deviceIdentity.publicKey,
        signature,
        signedAt: Date.now(),
        nonce: challenge.nonce,
      },
      locale: 'en',
    };

    const helloOk = await this.call<HelloOkPayload>(
      'connect',
      connectParams as unknown as Record<string, unknown>,
      10000,
    );

    if (helloOk.auth?.deviceToken) {
      await secureSet('device_token', helloOk.auth.deviceToken);
    }

    this.setState('connected');
  }

  async call<T = unknown>(
    method: string,
    params?: unknown,
    timeout: number = 15000,
  ): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new GatewayError('NOT_CONNECTED', 'WebSocket is not connected');
    }

    const id = generateUUID();

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(
          new GatewayError(
            'TIMEOUT',
            `Request ${method} timed out after ${timeout}ms`,
          ),
        );
      }, timeout);

      this.pendingRequests.set(id, {
        id,
        method,
        resolve: (payload: unknown) => {
          clearTimeout(timer);
          resolve(payload as T);
        },
        reject: (error: Error) => {
          clearTimeout(timer);
          reject(error);
        },
        timer,
      });

      this.ws!.send(
        JSON.stringify({
          type: 'req',
          id,
          method,
          params,
        }),
      );
    });
  }

  disconnect(): void {
    const ws = this.ws;
    this.ws = null;

    this.setState('disconnected');

    if (ws) {
      ws.close();
    }

    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new GatewayError('DISCONNECTED', 'Client disconnected'));
    }
    this.pendingRequests.clear();
  }

  // === PRIVATE ===

  private openWebSocket(url: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url);

      const onOpen = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(
          new GatewayError(
            'CONNECTION_FAILED',
            `WebSocket connection failed to ${url}`,
          ),
        );
      };

      const cleanup = () => {
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('error', onError);
      };

      ws.addEventListener('open', onOpen);
      ws.addEventListener('error', onError);

      ws.addEventListener('message', (event: MessageEvent) => {
        this.handleFrame(String(event.data));
      });

      ws.addEventListener('close', () => {
        this.handleClose();
      });

      this.ws = ws;
    });
  }

  private waitForEvent<T>(eventName: string, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.removeListener(eventName, handler);
        reject(
          new GatewayError(
            'HANDSHAKE_TIMEOUT',
            `Timeout waiting for ${eventName}`,
          ),
        );
      }, timeoutMs);

      const handler = (payload: T) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(payload);
      };

      this.once(eventName, handler);
    });
  }

  private handleFrame(data: string): void {
    let frame: GatewayFrame;
    try {
      frame = JSON.parse(data) as GatewayFrame;
    } catch {
      return;
    }

    switch (frame.type) {
      case 'res':
        this.handleResponse(frame);
        break;
      case 'event':
        this.handleEvent(frame);
        break;
      case 'req':
        this.emit('server:request', frame);
        break;
    }
  }

  private handleResponse(frame: ResponseFrame): void {
    const pending = this.pendingRequests.get(frame.id);
    if (!pending) return;

    this.pendingRequests.delete(frame.id);

    if (frame.ok) {
      pending.resolve(frame.payload);
    } else {
      pending.reject(
        new GatewayError(
          frame.error?.code ?? 'UNKNOWN',
          frame.error?.message ?? 'Unknown error',
        ),
      );
    }
  }

  private handleEvent(frame: EventFrame): void {
    this.emit(frame.event, frame.payload);
    this.emit('event', frame);
  }

  private handleClose(): void {
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(
        new GatewayError('DISCONNECTED', 'Connection closed'),
      );
    }
    this.pendingRequests.clear();

    if (this._state !== 'disconnected') {
      this.setState('disconnected');
    }
  }

  private setState(state: ConnectionState): void {
    if (this._state === state) return;
    const prev = this._state;
    this._state = state;
    this.emit('stateChange', state, prev);
  }
}

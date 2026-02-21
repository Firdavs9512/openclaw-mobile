import { GatewayClient } from '../client';
import { GatewayError } from '../errors';

// === MOCKS ===

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// Mock crypto utilities directly — we're testing the client, not crypto
jest.mock('@/utils/crypto', () => ({
  ensureDeviceIdentity: jest.fn(async () => ({
    id: 'mock-device-id-abc123',
    publicKey: 'bW9jay1wdWJsaWMta2V5', // base64 of "mock-public-key"
  })),
  signChallenge: jest.fn(async () => 'bW9jay1zaWduYXR1cmU='), // base64 of "mock-signature"
}));

// Mock secure storage
jest.mock('@/utils/secure-storage', () => ({
  secureSet: jest.fn(async () => {}),
  secureGet: jest.fn(async () => null),
  secureDelete: jest.fn(async () => {}),
  secureHas: jest.fn(async () => false),
}));

// === MockWebSocket ===

type WsListener = (event: Record<string, unknown>) => void;

class MockWebSocket {
  static readonly OPEN = 1;
  static readonly CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  sent: string[] = [];
  private listeners: Record<string, WsListener[]> = {};

  addEventListener(event: string, handler: WsListener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  removeEventListener(event: string, handler: WsListener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.fire('close', { code: 1000, reason: '' });
  }

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.fire('open', {});
  }

  simulateMessage(data: string) {
    this.fire('message', { data });
  }

  simulateError() {
    this.fire('error', { message: 'Connection failed' });
  }

  private fire(event: string, payload: Record<string, unknown>) {
    (this.listeners[event] || []).forEach((h) => h(payload));
  }
}

// === SETUP ===

let mockWs: MockWebSocket;
let uuidCounter = 0;

beforeAll(() => {
  const WsMock = jest.fn(() => {
    mockWs = new MockWebSocket();
    return mockWs;
  });
  Object.defineProperty(WsMock, 'OPEN', { value: 1 });
  Object.defineProperty(WsMock, 'CLOSED', { value: 3 });
  (global as any).WebSocket = WsMock;

  if (!global.crypto) {
    (global as any).crypto = {};
  }
  (global.crypto as any).randomUUID = () => `test-uuid-${++uuidCounter}`;
});

beforeEach(() => {
  uuidCounter = 0;
});

/** Flush pending microtasks */
function flush(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Helper: perform full handshake and return connected client.
 *
 * With crypto mocked, ensureDeviceIdentity and signChallenge resolve
 * in a single microtask each, making timing predictable.
 */
async function connectClient(client: GatewayClient): Promise<void> {
  const connectPromise = client.connect({
    host: '192.168.1.100',
    port: 18789,
    token: 'test-token',
    useTLS: false,
  });

  // Let ensureDeviceIdentity() resolve, then openWebSocket() is called
  await flush();

  // WebSocket constructor was called. Simulate open.
  mockWs.simulateOpen();

  // Now client waits for connect.challenge. Send it.
  await flush();
  mockWs.simulateMessage(
    JSON.stringify({
      type: 'event',
      event: 'connect.challenge',
      payload: { nonce: 'test-nonce-abc', ts: Date.now() },
    }),
  );

  // Let signChallenge resolve and call('connect', ...) send the request
  await flush();

  // Find and respond to the connect request
  const connectReq = findSentRequest('connect');
  if (!connectReq) {
    await flush();
  }

  const req = findSentRequest('connect');
  if (!req) throw new Error('connect request was never sent');

  const reqFrame = JSON.parse(req);
  mockWs.simulateMessage(
    JSON.stringify({
      type: 'res',
      id: reqFrame.id,
      ok: true,
      payload: { protocol: 'v3', policy: { tickIntervalMs: 5000 } },
    }),
  );

  await connectPromise;
}

function findSentRequest(method: string): string | undefined {
  return mockWs.sent.find((s) => {
    try {
      const f = JSON.parse(s);
      return f.method === method;
    } catch {
      return false;
    }
  });
}

// === TESTS ===

describe('GatewayClient', () => {
  it('tracks state transitions: disconnected → connecting → handshaking → connected', async () => {
    const client = new GatewayClient();
    const states: string[] = [];

    client.on('stateChange', (state: string) => states.push(state));

    await connectClient(client);

    expect(states).toEqual(['connecting', 'handshaking', 'connected']);
    expect(client.state).toBe('connected');

    client.disconnect();
  });

  it('sends correct connect params during handshake', async () => {
    const client = new GatewayClient();

    await connectClient(client);

    const raw = findSentRequest('connect');
    expect(raw).toBeDefined();

    const frame = JSON.parse(raw!);
    expect(frame.type).toBe('req');
    expect(frame.params.minProtocol).toBe('v3');
    expect(frame.params.maxProtocol).toBe('v3');
    expect(frame.params.client.id).toBe('openclaw-rn');
    expect(frame.params.client.platform).toBe('ios');
    expect(frame.params.role).toBe('operator');
    expect(frame.params.auth.token).toBe('test-token');
    expect(frame.params.device.publicKey).toBe('bW9jay1wdWJsaWMta2V5');
    expect(frame.params.device.signature).toBe('bW9jay1zaWduYXR1cmU=');
    expect(frame.params.device.nonce).toBe('test-nonce-abc');
    expect(frame.params.device.id).toBe('mock-device-id-abc123');
    expect(frame.params.scopes).toEqual([
      'operator.read',
      'operator.write',
      'operator.admin',
      'operator.approvals',
    ]);

    client.disconnect();
  });

  it('call() resolves with response payload', async () => {
    const client = new GatewayClient();
    await connectClient(client);

    const callPromise = client.call<{ status: string }>('health');
    await flush();

    const raw = findSentRequest('health');
    expect(raw).toBeDefined();
    const reqFrame = JSON.parse(raw!);

    mockWs.simulateMessage(
      JSON.stringify({
        type: 'res',
        id: reqFrame.id,
        ok: true,
        payload: { status: 'ok' },
      }),
    );

    const result = await callPromise;
    expect(result).toEqual({ status: 'ok' });

    client.disconnect();
  });

  it('call() rejects with TIMEOUT when no response arrives', async () => {
    const client = new GatewayClient();
    await connectClient(client);

    // Short timeout for fast test
    const callPromise = client.call('slow-method', {}, 200);

    await expect(callPromise).rejects.toThrow('timed out');

    try {
      await callPromise;
    } catch (e) {
      expect(e).toBeInstanceOf(GatewayError);
      expect((e as GatewayError).code).toBe('TIMEOUT');
    }

    client.disconnect();
  }, 10000);

  it('call() rejects with GatewayError on error response', async () => {
    const client = new GatewayClient();
    await connectClient(client);

    const callPromise = client.call('protected-method');
    await flush();

    const raw = findSentRequest('protected-method');
    expect(raw).toBeDefined();
    const reqFrame = JSON.parse(raw!);

    mockWs.simulateMessage(
      JSON.stringify({
        type: 'res',
        id: reqFrame.id,
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Bad token' },
      }),
    );

    try {
      await callPromise;
      throw new Error('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(GatewayError);
      const err = e as GatewayError;
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.message).toBe('Bad token');
      expect(err.isAuthError).toBe(true);
    }

    client.disconnect();
  });

  it('emits events received from the gateway', async () => {
    const client = new GatewayClient();
    await connectClient(client);

    const tickPayloads: unknown[] = [];
    const allEvents: unknown[] = [];

    client.on('tick', (payload: unknown) => tickPayloads.push(payload));
    client.on('event', (frame: unknown) => allEvents.push(frame));

    mockWs.simulateMessage(
      JSON.stringify({
        type: 'event',
        event: 'tick',
        payload: { uptime: 12345 },
      }),
    );

    expect(tickPayloads).toEqual([{ uptime: 12345 }]);
    expect(allEvents).toHaveLength(1);
    expect((allEvents[0] as Record<string, unknown>).event).toBe('tick');

    client.disconnect();
  });

  it('disconnect() cleans up state and rejects pending requests', async () => {
    const client = new GatewayClient();
    await connectClient(client);

    const callPromise = client.call('slow').catch((e: Error) => e);
    await flush();

    client.disconnect();

    const error = await callPromise;
    expect(error).toBeInstanceOf(GatewayError);
    expect((error as GatewayError).code).toBe('DISCONNECTED');
    expect(client.state).toBe('disconnected');
  });

  it('connect() rejects with HANDSHAKE_TIMEOUT if challenge never arrives', async () => {
    const client = new GatewayClient();

    const connectPromise = client.connect({
      host: '192.168.1.100',
      port: 18789,
      useTLS: false,
    });

    // Let ensureDeviceIdentity() resolve
    await flush();

    // Open the WebSocket so connect proceeds to handshake phase
    mockWs.simulateOpen();
    await flush();

    // Don't send challenge — wait for the 5s timeout
    await expect(connectPromise).rejects.toThrow(
      'Timeout waiting for connect.challenge',
    );

    try {
      await connectPromise;
    } catch (e) {
      expect((e as GatewayError).code).toBe('HANDSHAKE_TIMEOUT');
    }

    client.disconnect();
  }, 10000);
});

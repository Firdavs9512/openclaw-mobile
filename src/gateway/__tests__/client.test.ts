import { GatewayClient } from '../client';
import { GatewayError } from '../errors';

// === MOCKS ===

let appStateListener: ((state: string) => void) | null = null;

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: {
    addEventListener: jest.fn(
      (_event: string, cb: (state: string) => void) => {
        appStateListener = cb;
        return { remove: jest.fn() };
      },
    ),
  },
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

// === AUTO-RECONNECT TESTS ===

describe('Auto-reconnect', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] });
    uuidCounter = 0;
    appStateListener = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Helper: perform full handshake with fake timers.
   * Must manually advance timers for setTimeout-based waits.
   */
  async function connectWithFakeTimers(
    client: GatewayClient,
  ): Promise<void> {
    const connectPromise = client.connect({
      host: '192.168.1.100',
      port: 18789,
      token: 'test-token',
      useTLS: false,
    });

    // Let ensureDeviceIdentity() resolve
    await flush();

    // Simulate WS open
    mockWs.simulateOpen();
    await flush();

    // Send challenge
    mockWs.simulateMessage(
      JSON.stringify({
        type: 'event',
        event: 'connect.challenge',
        payload: { nonce: 'test-nonce-abc', ts: Date.now() },
      }),
    );

    await flush();

    // Find connect request (may need extra flush)
    let req = findSentRequest('connect');
    if (!req) {
      await flush();
      req = findSentRequest('connect');
    }
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

  /**
   * Helper: simulate a full reconnect cycle by responding to the
   * new WS instance's handshake.
   */
  async function completeReconnectHandshake(): Promise<void> {
    // New WS instance was created by connect() call inside scheduleReconnect
    await flush();
    mockWs.simulateOpen();
    await flush();

    mockWs.simulateMessage(
      JSON.stringify({
        type: 'event',
        event: 'connect.challenge',
        payload: { nonce: 'reconnect-nonce', ts: Date.now() },
      }),
    );
    await flush();

    let req = findSentRequest('connect');
    if (!req) {
      await flush();
      req = findSentRequest('connect');
    }
    if (!req) throw new Error('reconnect connect request was never sent');

    const reqFrame = JSON.parse(req);
    mockWs.simulateMessage(
      JSON.stringify({
        type: 'res',
        id: reqFrame.id,
        ok: true,
        payload: { protocol: 'v3', policy: { tickIntervalMs: 5000 } },
      }),
    );
    await flush();
  }

  // Test 1: Reconnect starts when connection drops
  it('starts reconnecting when WS closes unexpectedly', async () => {
    const client = new GatewayClient();
    await connectWithFakeTimers(client);
    expect(client.state).toBe('connected');

    const scheduled: unknown[] = [];
    client.on('reconnect:scheduled', (e: unknown) => scheduled.push(e));

    // Simulate unexpected close
    mockWs.close();
    await flush();

    expect(client.state).toBe('reconnecting');
    expect(scheduled).toHaveLength(1);

    client.disconnect();
  });

  // Test 2: Delay grows exponentially
  it('increases delay exponentially across attempts', async () => {
    const client = new GatewayClient({ jitter: 0 });
    await connectWithFakeTimers(client);

    const delays: number[] = [];
    client.on('reconnect:scheduled', (e: { delay: number }) => {
      delays.push(e.delay);
    });

    // First drop
    mockWs.close();
    await flush();

    // Advance timer to trigger first retry, which will fail (WS error)
    jest.advanceTimersByTime(500);
    await flush();
    // connect() was called, openWebSocket creates new WS. Make it fail.
    mockWs.simulateError();
    await flush();

    // Second retry should be scheduled with higher delay
    expect(delays.length).toBeGreaterThanOrEqual(2);
    expect(delays[1]).toBeGreaterThan(delays[0]);
    // 500 (attempt 0) → 850 (attempt 1)
    expect(delays[0]).toBe(500);
    expect(delays[1]).toBeCloseTo(850, 0);

    client.disconnect();
  });

  // Test 3: Delay never exceeds maxDelay
  it('caps delay at maxDelay', async () => {
    const client = new GatewayClient({ jitter: 0 });
    await connectWithFakeTimers(client);

    const delays: number[] = [];
    client.on('reconnect:scheduled', (e: { delay: number }) => {
      delays.push(e.delay);
    });

    // Simulate close
    mockWs.close();
    await flush();

    // Run through many retry cycles by failing each attempt
    for (let i = 0; i < 10; i++) {
      jest.advanceTimersByTime(10000);
      await flush();
      // Each attempt creates a new WS — make it fail
      mockWs.simulateError();
      await flush();
    }

    // All delays should be <= maxDelay (8000)
    for (const delay of delays) {
      expect(delay).toBeLessThanOrEqual(8000);
    }

    client.disconnect();
  });

  // Test 4: Auth error stops reconnect
  it('stops reconnecting on auth error', async () => {
    const client = new GatewayClient({ jitter: 0 });
    await connectWithFakeTimers(client);

    const authErrors: unknown[] = [];
    client.on('reconnect:auth_error', (e: unknown) => authErrors.push(e));

    // Drop connection
    mockWs.close();
    await flush();

    expect(client.state).toBe('reconnecting');

    // Advance to trigger first reconnect attempt
    jest.advanceTimersByTime(500);
    await flush();

    // New WS opens, simulate open + challenge
    mockWs.simulateOpen();
    await flush();

    mockWs.simulateMessage(
      JSON.stringify({
        type: 'event',
        event: 'connect.challenge',
        payload: { nonce: 'auth-nonce', ts: Date.now() },
      }),
    );
    await flush();

    // Find connect request
    let req = findSentRequest('connect');
    if (!req) {
      await flush();
      req = findSentRequest('connect');
    }

    if (req) {
      const reqFrame = JSON.parse(req);
      // Respond with auth error
      mockWs.simulateMessage(
        JSON.stringify({
          type: 'res',
          id: reqFrame.id,
          ok: false,
          error: { code: 'UNAUTHORIZED', message: 'Token revoked' },
        }),
      );
    }

    await flush();

    expect(authErrors).toHaveLength(1);
    expect(client.state).toBe('disconnected');

    // Advance timers — should NOT schedule another reconnect
    jest.advanceTimersByTime(30000);
    await flush();
    expect(client.state).toBe('disconnected');

    client.disconnect();
  });

  // Test 5: Successful reconnect resets attempt counter
  it('resets attempt counter after successful reconnect', async () => {
    const client = new GatewayClient({ jitter: 0 });
    await connectWithFakeTimers(client);

    const scheduled: { attempt: number; delay: number }[] = [];
    client.on('reconnect:scheduled', (e: { attempt: number; delay: number }) => {
      scheduled.push(e);
    });

    let successCount = 0;
    client.on('reconnect:success', () => successCount++);

    // Drop connection
    mockWs.close();
    await flush();

    // Advance to trigger reconnect
    jest.advanceTimersByTime(500);
    await flush();

    // Complete the reconnect handshake
    await completeReconnectHandshake();

    expect(successCount).toBe(1);
    expect(client.state).toBe('connected');

    // Drop again — attempt should start from 0
    mockWs.close();
    await flush();

    // The new scheduled event should have attempt: 0
    const lastScheduled = scheduled[scheduled.length - 1];
    expect(lastScheduled.attempt).toBe(0);

    client.disconnect();
  });

  // Test 6: stopReconnect() clears all timers
  it('stopReconnect() clears timers and sets state to disconnected', async () => {
    const client = new GatewayClient();
    await connectWithFakeTimers(client);

    // Drop connection
    mockWs.close();
    await flush();
    expect(client.state).toBe('reconnecting');

    // Stop reconnect
    client.stopReconnect();

    expect(client.state).toBe('disconnected');

    // Advance timers — no reconnect should fire
    jest.advanceTimersByTime(30000);
    await flush();
    expect(client.state).toBe('disconnected');
  });

  // Test 7: AppState 'active' triggers immediate retry with reset counter
  it('resets attempt and reschedules on AppState active', async () => {
    const client = new GatewayClient({ jitter: 0 });
    await connectWithFakeTimers(client);

    const scheduled: { attempt: number; delay: number }[] = [];
    client.on('reconnect:scheduled', (e: { attempt: number; delay: number }) => {
      scheduled.push(e);
    });

    // Drop connection
    mockWs.close();
    await flush();
    expect(client.state).toBe('reconnecting');

    // First scheduled: attempt 0, delay 500
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].attempt).toBe(0);

    // Advance to trigger first retry (fail it)
    jest.advanceTimersByTime(500);
    await flush();
    mockWs.simulateError();
    await flush();

    // Now at attempt 1, delay ~850 is scheduled
    expect(scheduled.length).toBeGreaterThanOrEqual(2);

    // Simulate app returning to foreground
    expect(appStateListener).not.toBeNull();
    appStateListener!('active');

    // Should have scheduled a new reconnect with attempt=0
    const lastScheduled = scheduled[scheduled.length - 1];
    expect(lastScheduled.attempt).toBe(0);
    expect(lastScheduled.delay).toBe(500); // reset to initial delay

    client.disconnect();
  });

  // Test 8: Health monitor disconnects after 2.5x tick interval
  it('health monitor closes connection when tick stops arriving', async () => {
    const client = new GatewayClient();
    await connectWithFakeTimers(client);
    expect(client.state).toBe('connected');

    const staleEvents: unknown[] = [];
    client.on('health:stale', () => staleEvents.push(true));

    // tickIntervalMs is 5000 from connectWithFakeTimers
    // Health check runs every 5000ms, triggers at 2.5 * 5000 = 12500ms without tick

    // Advance 5000ms — first check: elapsed ~5000 < 12500, OK
    jest.advanceTimersByTime(5000);
    await flush();
    expect(staleEvents).toHaveLength(0);

    // Advance another 5000ms — second check: elapsed ~10000 < 12500, OK
    jest.advanceTimersByTime(5000);
    await flush();
    expect(staleEvents).toHaveLength(0);

    // Advance another 5000ms — third check: elapsed ~15000 > 12500, STALE
    jest.advanceTimersByTime(5000);
    await flush();

    expect(staleEvents).toHaveLength(1);
    // WS was closed by health monitor, triggering reconnect
    expect(client.state).toBe('reconnecting');

    client.disconnect();
  });
});

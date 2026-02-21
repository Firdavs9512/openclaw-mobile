/* eslint-disable @typescript-eslint/no-explicit-any */

// === MOCKS (must be before imports) ===

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: {
    addEventListener: jest.fn(
      (_event: string, _cb: (state: string) => void) => {
        return { remove: jest.fn() };
      },
    ),
  },
}));

jest.mock('@/utils/crypto', () => ({
  ensureDeviceIdentity: jest.fn(async () => ({
    id: 'mock-device-id-abc123',
    publicKey: 'bW9jay1wdWJsaWMta2V5',
  })),
  signChallenge: jest.fn(async () => 'bW9jay1zaWduYXR1cmU='),
}));

jest.mock('@/utils/secure-storage', () => ({
  secureSet: jest.fn(async () => {}),
  secureGet: jest.fn(async () => null),
  secureDelete: jest.fn(async () => {}),
  secureHas: jest.fn(async () => false),
}));

// === IMPORTS ===

import { WebSocket } from 'ws';

import { GatewayClient } from '../../src/gateway/client';
import { MockGatewayServer } from '../mock-gateway/server';

// === GLOBAL SETUP ===

const TEST_PORT = 18789;

// GatewayClient ichida `new WebSocket(url)` ishlashi uchun
(global as any).WebSocket = WebSocket;

// generateUUID uchun crypto.randomUUID
if (!(global as any).crypto?.randomUUID) {
  (global as any).crypto = {
    ...(global as any).crypto,
    randomUUID: () =>
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }),
  };
}

// === HELPERS ===

async function waitFor(
  predicate: () => boolean,
  timeoutMs = 5000,
  intervalMs = 50,
): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`waitFor timed out after ${timeoutMs}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

// === TESTS ===

describe('Basic MVP Flow', () => {
  let server: MockGatewayServer;
  const clients: GatewayClient[] = [];

  function createClient(): GatewayClient {
    const client = new GatewayClient();
    clients.push(client);
    return client;
  }

  beforeAll(async () => {
    server = new MockGatewayServer(TEST_PORT);
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  afterAll(async () => {
    await server.close();
  });

  afterEach(() => {
    for (const client of clients) {
      client.disconnect();
    }
    clients.length = 0;
  });

  test(
    'Gateway ga ulanish',
    async () => {
      const client = createClient();
      await client.connect({
        host: '127.0.0.1',
        port: TEST_PORT,
        token: 'test-token',
        useTLS: false,
      });
      expect(client.state).toBe('connected');
    },
    15000,
  );

  test(
    'Health check',
    async () => {
      const client = createClient();
      await client.connect({
        host: '127.0.0.1',
        port: TEST_PORT,
        token: 'test-token',
        useTLS: false,
      });

      const result = await client.call<{ ok: boolean; version: string }>(
        'health',
      );
      expect(result.ok).toBe(true);
      expect(result.version).toBe('0.0.0-mock');
    },
    15000,
  );

  test(
    'Xabar yuborish va streaming qabul qilish',
    async () => {
      const client = createClient();
      await client.connect({
        host: '127.0.0.1',
        port: TEST_PORT,
        token: 'test-token',
        useTLS: false,
      });

      const chunks: string[] = [];
      let messageStarted = false;
      let finished = false;

      client.on('agent', (event: any) => {
        if (event.type === 'message_start') {
          messageStarted = true;
        }
        if (event.type === 'content_block_delta') {
          chunks.push(event.delta.text);
        }
        if (event.type === 'message_stop') {
          finished = true;
        }
      });

      const result = await client.call<{ runId: string; sessionKey: string }>(
        'chat.send',
        { sessionKey: 'main', message: 'Salom' },
      );

      expect(result.runId).toBeDefined();
      expect(result.sessionKey).toBe('main');

      // Streaming tugashini kutish
      await waitFor(() => finished, 10000);

      const fullText = chunks.join('');
      expect(fullText).toContain('Salom');
      expect(messageStarted).toBe(true);
      expect(finished).toBe(true);
    },
    15000,
  );

  test(
    'Sessions list',
    async () => {
      const client = createClient();
      await client.connect({
        host: '127.0.0.1',
        port: TEST_PORT,
        token: 'test-token',
        useTLS: false,
      });

      const result = await client.call<{ sessions: any[] }>('sessions.list');
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].sessionKey).toBe('main');
    },
    15000,
  );

  test(
    'Auth error',
    async () => {
      const client = createClient();

      await expect(
        client.connect({
          host: '127.0.0.1',
          port: TEST_PORT,
          token: 'wrong-token',
          useTLS: false,
        }),
      ).rejects.toThrow('Invalid token');
    },
    15000,
  );
});

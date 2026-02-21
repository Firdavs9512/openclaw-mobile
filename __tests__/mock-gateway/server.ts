import { WebSocketServer, type WebSocket as WsWebSocket } from 'ws';

export class MockGatewayServer {
  private wss: WebSocketServer;
  private connections = new Set<WsWebSocket>();
  private tickIntervals = new Map<WsWebSocket, ReturnType<typeof setInterval>>();

  constructor(port = 18789) {
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws) => {
      this.connections.add(ws);

      // 1. Challenge yuborish (biroz kechiktirish — client waitForEvent o'rnatishi uchun)
      setTimeout(() => {
        if (ws.readyState === ws.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'event',
              event: 'connect.challenge',
              payload: { nonce: 'test-nonce-' + Date.now(), ts: Date.now() },
            }),
          );
        }
      }, 50);

      ws.on('message', (data) => {
        const frame = JSON.parse(data.toString());
        this.handleFrame(ws, frame);
      });

      ws.on('close', () => {
        const interval = this.tickIntervals.get(ws);
        if (interval) {
          clearInterval(interval);
          this.tickIntervals.delete(ws);
        }
        this.connections.delete(ws);
      });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleFrame(ws: WsWebSocket, frame: any): void {
    if (frame.type !== 'req') return;

    switch (frame.method) {
      case 'connect':
        this.handleConnect(ws, frame);
        break;
      case 'health':
        this.respond(ws, frame.id, { ok: true, version: '0.0.0-mock' });
        break;
      case 'chat.send':
        this.handleChatSend(ws, frame);
        break;
      case 'chat.history':
        this.respond(ws, frame.id, { messages: [] });
        break;
      case 'sessions.list':
        this.respond(ws, frame.id, {
          sessions: [
            {
              sessionKey: 'main',
              agentId: 'main',
              lastMessage: 'Test',
              updatedAt: new Date().toISOString(),
            },
          ],
        });
        break;
      case 'sessions.delete':
        this.respond(ws, frame.id, { ok: true });
        break;
      case 'chat.abort':
        this.respond(ws, frame.id, { ok: true });
        break;
      default:
        this.respond(ws, frame.id, null, false, {
          code: 'UNKNOWN_METHOD',
          message: `Unknown: ${frame.method}`,
        });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleConnect(ws: WsWebSocket, frame: any): void {
    const token = frame.params?.auth?.token;
    if (token !== 'test-token' && token !== undefined) {
      this.respond(ws, frame.id, null, false, {
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
      });
      return;
    }

    this.respond(ws, frame.id, {
      protocol: 'v3',
      policy: { tickIntervalMs: 15000 },
    });

    // Tick events boshlash
    const tickInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(
          JSON.stringify({ type: 'event', event: 'tick', payload: {} }),
        );
      } else {
        clearInterval(tickInterval);
      }
    }, 15000);

    this.tickIntervals.set(ws, tickInterval);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleChatSend(ws: WsWebSocket, frame: any): void {
    const message = frame.params?.message || '';
    const runId = 'run-' + Date.now();
    const sessionKey = frame.params?.sessionKey || 'main';

    // 1. Darhol javob
    this.respond(ws, frame.id, { runId, sessionKey });

    // 2. Streaming simulation
    setTimeout(() => {
      if (ws.readyState !== ws.OPEN) return;

      // message_start
      ws.send(
        JSON.stringify({
          type: 'event',
          event: 'agent',
          payload: {
            type: 'message_start',
            message: { role: 'assistant' },
            runId,
          },
        }),
      );

      const responseText = `Siz yozdingiz: "${message}". Bu mock gateway dan javob.`;
      const words = responseText.split(' ');
      let i = 0;

      const streamInterval = setInterval(() => {
        if (i >= words.length || ws.readyState !== ws.OPEN) {
          // message_stop
          if (ws.readyState === ws.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'event',
                event: 'agent',
                payload: { type: 'message_stop' },
              }),
            );
          }
          clearInterval(streamInterval);
          return;
        }

        // content_block_delta
        ws.send(
          JSON.stringify({
            type: 'event',
            event: 'agent',
            payload: {
              type: 'content_block_delta',
              index: 0,
              delta: {
                type: 'text_delta',
                text: (i > 0 ? ' ' : '') + words[i],
              },
            },
          }),
        );
        i++;
      }, 100);
    }, 200);
  }

  private respond(
    ws: WsWebSocket,
    id: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    ok = true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error?: any,
  ): void {
    ws.send(
      JSON.stringify({
        type: 'res',
        id,
        ok,
        ...(ok ? { payload } : { error }),
      }),
    );
  }

  async close(): Promise<void> {
    for (const interval of this.tickIntervals.values()) {
      clearInterval(interval);
    }
    this.tickIntervals.clear();

    for (const ws of this.connections) {
      ws.close();
    }
    this.connections.clear();

    return new Promise((resolve) => {
      this.wss.close(() => resolve());
    });
  }
}

// Standalone rejimda ishga tushirish: bun run __tests__/mock-gateway/server.ts
if (require.main === module) {
  const server = new MockGatewayServer();
  console.log('Mock Gateway Server listening on port 18789');

  process.on('SIGINT', () => {
    server.close().then(() => process.exit(0));
  });
}

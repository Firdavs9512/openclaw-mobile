import type { GatewayConfig } from '@/types/gateway';

export type OpenClawDeepLink =
  | { type: 'connect'; config: GatewayConfig }
  | { type: 'pair'; config: GatewayConfig; pairToken: string }
  | { type: 'relay'; relayUrl: string; roomId: string; secret: string };

const DEFAULT_PORT = 18789;

export function parseOpenClawUrl(url: string): OpenClawDeepLink | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'openclaw:') return null;

  const params = parsed.searchParams;

  switch (parsed.hostname) {
    case 'connect':
    case 'pair': {
      const host = params.get('host');
      if (!host) return null;

      const port = parseInt(params.get('port') || String(DEFAULT_PORT), 10);
      const token = params.get('token') || undefined;
      const useTLS = params.get('tls') === '1';
      const config: GatewayConfig = { host, port, token, useTLS };

      if (parsed.hostname === 'pair' && token) {
        return { type: 'pair', config, pairToken: token };
      }
      return { type: 'connect', config };
    }

    case 'relay': {
      const relayUrl = params.get('url');
      const roomId = params.get('room');
      const secret = params.get('secret');
      if (!relayUrl || !roomId || !secret) return null;
      return { type: 'relay', relayUrl, roomId, secret };
    }

    default:
      return null;
  }
}

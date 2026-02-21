import type { GatewayConfig } from '@/types/gateway';

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function buildGatewayUrl(config: GatewayConfig): string {
  const protocol = config.useTLS ? 'wss' : 'ws';
  return `${protocol}://${config.host}:${config.port}`;
}

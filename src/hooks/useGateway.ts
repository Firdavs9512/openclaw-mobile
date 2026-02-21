import { useGatewayStore } from '@/stores/gateway-store';

export function useGatewayConnection() {
  const state = useGatewayStore((s) => s.connectionState);
  const error = useGatewayStore((s) => s.error);
  const url = useGatewayStore((s) => s.gatewayUrl);
  return { state, error, url };
}

export function useGatewayActions() {
  const connect = useGatewayStore((s) => s.connect);
  const disconnect = useGatewayStore((s) => s.disconnect);
  const reconnectFromSaved = useGatewayStore((s) => s.reconnectFromSaved);
  return { connect, disconnect, reconnectFromSaved };
}

export function useIsConnected(): boolean {
  return useGatewayStore((s) => s.connectionState === 'connected');
}

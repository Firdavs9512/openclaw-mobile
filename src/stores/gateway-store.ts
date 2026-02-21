import { create } from 'zustand';

import { GatewayClient } from '@/gateway/client';
import { GatewayError } from '@/gateway/errors';
import { buildGatewayUrl } from '@/gateway/utils';
import type { ConnectionState, GatewayConfig } from '@/types/gateway';
import {
  AppKeys,
  appGet,
  appGetBoolean,
  appGetNumber,
  appSet,
} from '@/utils/app-storage';
import { secureGet, secureSet } from '@/utils/secure-storage';

interface GatewayStore {
  // === STATE ===
  connectionState: ConnectionState;
  gatewayUrl: string | null;
  error: GatewayError | null;
  reconnectAttempt: number;
  reconnectDelay: number;
  lastHeartbeat: number | null;

  // === ACTIONS ===
  connect: (config: GatewayConfig) => Promise<void>;
  disconnect: () => void;
  reconnectFromSaved: () => Promise<boolean>;
  clearError: () => void;
}

const client = new GatewayClient();

export const useGatewayStore = create<GatewayStore>((set, get) => {
  client.on('stateChange', (state: ConnectionState) => {
    set({ connectionState: state });
  });

  client.on('reconnect:scheduled', ({ attempt, delay }: { attempt: number; delay: number }) => {
    set({ reconnectAttempt: attempt, reconnectDelay: delay });
  });

  client.on('reconnect:auth_error', (error: GatewayError) => {
    set({ error, connectionState: 'disconnected' });
  });

  client.on('tick', () => {
    set({ lastHeartbeat: Date.now() });
  });

  client.on('health:stale', () => {
    set({ lastHeartbeat: null });
  });

  return {
    connectionState: 'disconnected',
    gatewayUrl: null,
    error: null,
    reconnectAttempt: 0,
    reconnectDelay: 0,
    lastHeartbeat: null,

    connect: async (config) => {
      set({ error: null });
      try {
        appSet(AppKeys.GATEWAY_HOST, config.host);
        appSet(AppKeys.GATEWAY_PORT, config.port);
        appSet(AppKeys.GATEWAY_USE_TLS, config.useTLS);
        if (config.token) {
          await secureSet('gateway_token', config.token);
        }

        await client.connect(config);
        const url = buildGatewayUrl(config);
        set({ gatewayUrl: url });

        const { setupAgentEventListener } = await import(
          '@/stores/chat-store'
        );
        setupAgentEventListener();
      } catch (error) {
        if (error instanceof GatewayError) {
          set({ error });
        }
        throw error;
      }
    },

    disconnect: () => {
      client.disconnect();
      set({
        connectionState: 'disconnected',
        reconnectAttempt: 0,
        reconnectDelay: 0,
      });
    },

    reconnectFromSaved: async () => {
      const host = appGet(AppKeys.GATEWAY_HOST);
      const port = appGetNumber(AppKeys.GATEWAY_PORT);
      const token = await secureGet('gateway_token');
      const useTLS = appGetBoolean(AppKeys.GATEWAY_USE_TLS) ?? false;

      if (!host || !port) return false;

      try {
        await get().connect({ host, port, token: token ?? undefined, useTLS });
        return true;
      } catch {
        return false;
      }
    },

    clearError: () => set({ error: null }),
  };
});

export function getGatewayClient(): GatewayClient {
  return client;
}

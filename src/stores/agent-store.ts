import { create } from 'zustand';

import { getGatewayClient } from '@/stores/gateway-store';
import type { AgentIdentity } from '@/types/gateway';

const DEFAULT_NAME = 'Agent';
const DEFAULT_AVATAR = '🤖';

interface AgentStore {
  // === STATE ===
  name: string;
  avatar: string;
  isLoaded: boolean;

  // === ACTIONS ===
  fetchIdentity: () => Promise<void>;
  reset: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  name: DEFAULT_NAME,
  avatar: DEFAULT_AVATAR,
  isLoaded: false,

  fetchIdentity: async () => {
    try {
      const client = getGatewayClient();
      const result = await client.call<AgentIdentity>(
        'agent.identity.get',
        {},
      );
      set({
        name: result.name || DEFAULT_NAME,
        avatar: result.avatar || DEFAULT_AVATAR,
        isLoaded: true,
      });
    } catch (error) {
      console.warn('[AgentStore] Failed to fetch agent identity:', error);
      set({ isLoaded: true });
    }
  },

  reset: () => {
    set({
      name: DEFAULT_NAME,
      avatar: DEFAULT_AVATAR,
      isLoaded: false,
    });
  },
}));

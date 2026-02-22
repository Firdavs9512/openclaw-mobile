import { create } from 'zustand';

import { getGatewayClient } from '@/stores/gateway-store';
import type {
  SkillMessage,
  SkillStatusEntry,
  SkillStatusReport,
  SkillsInstallResponse,
} from '@/types/skills';

interface SkillsStore {
  // === STATE ===
  skills: SkillStatusEntry[];
  isLoading: boolean;
  error: string | null;
  busyKey: string | null;
  messages: Record<string, SkillMessage>;
  apiKeyEdits: Record<string, string>;

  // === ACTIONS ===
  loadSkills: (clearMessages?: boolean) => Promise<void>;
  toggleSkill: (skillKey: string, enable: boolean) => Promise<void>;
  saveApiKey: (skillKey: string) => Promise<void>;
  installSkill: (
    skillKey: string,
    name: string,
    installId: string,
  ) => Promise<void>;
  setApiKeyEdit: (skillKey: string, value: string) => void;
  clearError: () => void;
  reset: () => void;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export const useSkillsStore = create<SkillsStore>((set, get) => ({
  skills: [],
  isLoading: false,
  error: null,
  busyKey: null,
  messages: {},
  apiKeyEdits: {},

  loadSkills: async (clearMessages) => {
    if (get().isLoading) return;

    set({
      isLoading: true,
      error: null,
      ...(clearMessages ? { messages: {} } : {}),
    });

    try {
      const client = getGatewayClient();
      const result = await client.call<SkillStatusReport>(
        'skills.status',
        {},
      );
      set({ skills: result.skills ?? [], isLoading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), isLoading: false });
    }
  },

  toggleSkill: async (skillKey, enable) => {
    if (get().busyKey) return;

    set({ busyKey: skillKey, error: null });
    try {
      const client = getGatewayClient();
      await client.call('skills.update', { skillKey, enabled: enable });
      await get().loadSkills();
      set((state) => ({
        busyKey: null,
        messages: {
          ...state.messages,
          [skillKey]: {
            kind: 'success' as const,
            message: enable ? 'Skill yoqildi' : "Skill o'chirildi",
          },
        },
      }));
    } catch (err) {
      const message = getErrorMessage(err);
      set((state) => ({
        busyKey: null,
        error: message,
        messages: {
          ...state.messages,
          [skillKey]: { kind: 'error' as const, message },
        },
      }));
    }
  },

  saveApiKey: async (skillKey) => {
    if (get().busyKey) return;

    const apiKey = get().apiKeyEdits[skillKey] ?? '';
    set({ busyKey: skillKey, error: null });

    try {
      const client = getGatewayClient();
      await client.call('skills.update', { skillKey, apiKey });
      await get().loadSkills();
      set((state) => ({
        busyKey: null,
        messages: {
          ...state.messages,
          [skillKey]: {
            kind: 'success' as const,
            message: 'API kalit saqlandi',
          },
        },
      }));
    } catch (err) {
      const message = getErrorMessage(err);
      set((state) => ({
        busyKey: null,
        error: message,
        messages: {
          ...state.messages,
          [skillKey]: { kind: 'error' as const, message },
        },
      }));
    }
  },

  installSkill: async (skillKey, name, installId) => {
    if (get().busyKey) return;

    set({ busyKey: skillKey, error: null });
    try {
      const client = getGatewayClient();
      const result = await client.call<SkillsInstallResponse>(
        'skills.install',
        { name, installId, timeoutMs: 120000 },
      );
      await get().loadSkills();
      set((state) => ({
        busyKey: null,
        messages: {
          ...state.messages,
          [skillKey]: {
            kind: 'success' as const,
            message: result.message ?? "O'rnatildi",
          },
        },
      }));
    } catch (err) {
      const message = getErrorMessage(err);
      set((state) => ({
        busyKey: null,
        error: message,
        messages: {
          ...state.messages,
          [skillKey]: { kind: 'error' as const, message },
        },
      }));
    }
  },

  setApiKeyEdit: (skillKey, value) => {
    set((state) => ({
      apiKeyEdits: { ...state.apiKeyEdits, [skillKey]: value },
    }));
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      skills: [],
      isLoading: false,
      error: null,
      busyKey: null,
      messages: {},
      apiKeyEdits: {},
    }),
}));

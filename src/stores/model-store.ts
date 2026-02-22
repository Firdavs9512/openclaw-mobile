import { create } from 'zustand';

import type { ModelInfo } from '@/types/gateway';
import { getGatewayClient } from '@/stores/gateway-store';
import { AppKeys, appGet, appSet } from '@/utils/app-storage';

interface SessionPatchResult {
  ok: boolean;
  resolved?: {
    modelProvider: string;
    model: string;
  };
}

interface ModelStore {
  // === STATE ===
  models: ModelInfo[];
  selectedModelId: string | null;
  isLoading: boolean;
  error: string | null;

  // === ACTIONS ===
  loadModels: () => Promise<void>;
  selectModel: (modelId: string) => Promise<void>;
  reset: () => void;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  models: [],
  selectedModelId: null,
  isLoading: false,
  error: null,

  loadModels: async () => {
    set({ isLoading: true, error: null });
    try {
      const client = getGatewayClient();
      const result = await client.call<{ models: ModelInfo[] }>(
        'models.list',
      );
      const models = result.models || [];

      // MMKV'dan saqlangan model ID ni olish
      const savedId = appGet(AppKeys.SELECTED_MODEL);
      const savedExists = savedId && models.some((m) => m.id === savedId);

      // Hozirgi sessiyadan haqiqiy modelni so'rash
      let resolvedModelId: string | null = null;

      const { useChatStore } = await import('@/stores/chat-store');
      const sessionKey = useChatStore.getState().activeSessionKey;

      if (sessionKey) {
        try {
          // Bo'sh patch yuborib hozirgi resolved modelni olish
          const patchResult = await client.call<SessionPatchResult>(
            'sessions.patch',
            { key: sessionKey },
          );
          if (patchResult.resolved?.model) {
            const rm = patchResult.resolved.model;
            // models ro'yxatida shu model bormi tekshirish
            const match = models.find((m) => m.id === rm || m.id.includes(rm) || rm.includes(m.id));
            if (match) {
              resolvedModelId = match.id;
            }
          }
        } catch {
          // Session patch ishlamasa — davom etamiz
        }
      }

      // Prioritet: resolved > saved > birinchi model
      const selectedModelId = resolvedModelId
        ?? (savedExists ? savedId! : null)
        ?? models[0]?.id
        ?? null;

      set({ models, selectedModelId, isLoading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Modellarni yuklashda xatolik';
      set({ error: message, isLoading: false });
    }
  },

  selectModel: async (modelId) => {
    const { models } = get();
    if (!models.some((m) => m.id === modelId)) return;

    const prevId = get().selectedModelId;
    // Optimistic update
    set({ selectedModelId: modelId, error: null });

    try {
      const client = getGatewayClient();
      const { useChatStore } = await import('@/stores/chat-store');
      const sessionKey = useChatStore.getState().activeSessionKey;

      if (sessionKey) {
        // Session darajasida model o'zgartirish
        await client.call('sessions.patch', {
          key: sessionKey,
          model: modelId,
        });
      }

      appSet(AppKeys.SELECTED_MODEL, modelId);
    } catch (err) {
      // Revert on error
      set({ selectedModelId: prevId });
      const message =
        err instanceof Error ? err.message : "Modelni o'zgartirishda xatolik";
      set({ error: message });
    }
  },

  reset: () => {
    set({
      models: [],
      selectedModelId: null,
      isLoading: false,
      error: null,
    });
  },
}));

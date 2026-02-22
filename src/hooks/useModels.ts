import { useModelStore } from '@/stores/model-store';
import type { ModelInfo } from '@/types/gateway';

export function useModels() {
  const models = useModelStore((s) => s.models);
  const selectedModelId = useModelStore((s) => s.selectedModelId);
  const isLoading = useModelStore((s) => s.isLoading);
  const error = useModelStore((s) => s.error);
  return { models, selectedModelId, isLoading, error };
}

export function useModelActions() {
  const loadModels = useModelStore((s) => s.loadModels);
  const selectModel = useModelStore((s) => s.selectModel);
  return { loadModels, selectModel };
}

export function useSelectedModel(): ModelInfo | null {
  const models = useModelStore((s) => s.models);
  const selectedModelId = useModelStore((s) => s.selectedModelId);
  return models.find((m) => m.id === selectedModelId) ?? null;
}

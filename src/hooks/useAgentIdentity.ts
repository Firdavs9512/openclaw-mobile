import { useAgentStore } from '@/stores/agent-store';

export function useAgentName(): string {
  return useAgentStore((s) => s.name);
}

export function useAgentAvatar(): string {
  return useAgentStore((s) => s.avatar);
}

export function useAgentIdentity(): { name: string; avatar: string; isLoaded: boolean } {
  const name = useAgentStore((s) => s.name);
  const avatar = useAgentStore((s) => s.avatar);
  const isLoaded = useAgentStore((s) => s.isLoaded);
  return { name, avatar, isLoaded };
}

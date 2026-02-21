import type { Message, SessionInfo, StreamingMessage } from '@/types/chat';
import { useChatStore } from '@/stores/chat-store';

export function useChat() {
  const sendMessage = useChatStore((s) => s.sendMessage);
  const abortRun = useChatStore((s) => s.abortRun);
  const isAgentRunning = useChatStore((s) => s.isAgentRunning);
  return { sendMessage, abortRun, isAgentRunning };
}

export function useMessages(sessionKey: string): Message[] {
  return useChatStore((s) => s.messages[sessionKey] || []);
}

export function useStreamingMessage(): StreamingMessage | null {
  return useChatStore((s) => s.streamingMessage);
}

export function useSessions(): SessionInfo[] {
  return useChatStore((s) => s.sessions);
}

export function useActiveSessionKey(): string | null {
  return useChatStore((s) => s.activeSessionKey);
}

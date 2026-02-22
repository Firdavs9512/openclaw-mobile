import { create } from 'zustand';

import type {
  Attachment,
  Message,
  SessionInfo,
  StreamingMessage,
  ThinkingLevel,
} from '@/types/chat';
import { generateUUID } from '@/gateway/utils';
import { getGatewayClient } from '@/stores/gateway-store';
import { AppKeys, appGet, appSet } from '@/utils/app-storage';

// === Gateway Event Types (haqiqiy gateway protokol formati) ===

interface GatewayAgentEvent {
  runId: string;
  stream: 'lifecycle' | 'assistant' | 'thinking' | 'tool';
  data: Record<string, unknown>;
  sessionKey: string;
  seq: number;
  ts: number;
}

interface ChatStore {
  // === STATE ===
  sessions: SessionInfo[];
  activeSessionKey: string | null;
  messages: Record<string, Message[]>;
  streamingMessage: StreamingMessage | null;
  streamingSessionKey: string | null;
  isAgentRunning: boolean;
  currentRunId: string | null;

  // === SESSION ACTIONS ===
  loadSessions: () => Promise<void>;
  setActiveSession: (sessionKey: string) => void;
  createSession: (agentId?: string) => string;
  deleteSession: (sessionKey: string) => Promise<void>;

  // === MESSAGE ACTIONS ===
  sendMessage: (text: string, attachments?: Attachment[]) => Promise<void>;
  loadHistory: (sessionKey: string) => Promise<void>;
  abortRun: () => Promise<void>;

  // === STREAMING (ichki) ===
  _handleAgentEvent: (event: GatewayAgentEvent) => void;
  _handleChatEvent: (event: GatewayChatEvent) => void;
  _finalizeStream: () => void;
}

interface GatewayChatEvent {
  runId: string;
  sessionKey: string;
  seq: number;
  state: 'delta' | 'final';
  message: {
    role: 'assistant';
    content: { type: string; text?: string }[];
    timestamp?: number;
  };
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // === INITIAL STATE ===
  sessions: [],
  activeSessionKey: null,
  messages: {},
  streamingMessage: null,
  streamingSessionKey: null,
  isAgentRunning: false,
  currentRunId: null,

  // === SESSION ACTIONS ===

  loadSessions: async () => {
    const client = getGatewayClient();
    const result = await client.call<{ sessions: SessionInfo[] }>(
      'sessions.list',
      { limit: 50 },
    );
    const sessions = result.sessions || [];
    set({ sessions });

    const lastKey = appGet(AppKeys.LAST_SESSION_KEY);
    if (lastKey && sessions.some((s) => s.sessionKey === lastKey)) {
      set({ activeSessionKey: lastKey });
    }
  },

  setActiveSession: (sessionKey) => {
    set({ activeSessionKey: sessionKey });
    appSet(AppKeys.LAST_SESSION_KEY, sessionKey);
  },

  createSession: (agentId = 'main') => {
    const sessionKey = `mobile-${generateUUID().slice(0, 8)}`;
    set((state) => ({
      activeSessionKey: sessionKey,
      sessions: [
        { sessionKey, agentId, updatedAt: new Date().toISOString() },
        ...state.sessions,
      ],
    }));
    appSet(AppKeys.LAST_SESSION_KEY, sessionKey);
    return sessionKey;
  },

  deleteSession: async (sessionKey) => {
    const client = getGatewayClient();
    await client.call('sessions.delete', { sessionKey });

    set((state) => {
      const { [sessionKey]: _, ...remainingMessages } = state.messages;
      return {
        sessions: state.sessions.filter((s) => s.sessionKey !== sessionKey),
        messages: remainingMessages,
        activeSessionKey:
          state.activeSessionKey === sessionKey
            ? null
            : state.activeSessionKey,
      };
    });
  },

  // === MESSAGE ACTIONS ===

  sendMessage: async (text, attachments) => {
    const { activeSessionKey } = get();
    const sessionKey = activeSessionKey || 'main';
    const client = getGatewayClient();

    const userMsg: Message = {
      id: generateUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      status: 'sending',
      attachments,
      sessionKey,
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [sessionKey]: [...(state.messages[sessionKey] || []), userMsg],
      },
    }));

    try {
      const result = await client.call<{ runId: string }>(
        'chat.send',
        {
          sessionKey,
          message: text,
          thinking:
            (appGet(AppKeys.THINKING_LEVEL) as ThinkingLevel) || 'off',
          idempotencyKey: userMsg.id,
          attachments: attachments?.map((a) => ({
            type: a.type,
            mimeType: a.mimeType,
            fileName: a.fileName,
            content: a.content,
          })),
        },
        35000,
      );

      set((state) => ({
        isAgentRunning: true,
        currentRunId: result.runId,
        streamingSessionKey: sessionKey,
        messages: {
          ...state.messages,
          [sessionKey]: (state.messages[sessionKey] || []).map((m) =>
            m.id === userMsg.id ? { ...m, status: 'sent' as const } : m,
          ),
        },
      }));

      // Safety timeout: agar 60s ichida javob tugamasa, state ni reset qilish
      const runId = result.runId;
      setTimeout(() => {
        const state = get();
        if (state.isAgentRunning && state.currentRunId === runId) {
          console.warn('[ChatStore] Agent run timed out, resetting state');
          set({
            isAgentRunning: false,
            streamingMessage: null,
            currentRunId: null,
            streamingSessionKey: null,
          });
        }
      }, 60000);
    } catch {
      set((state) => ({
        messages: {
          ...state.messages,
          [sessionKey]: (state.messages[sessionKey] || []).map((m) =>
            m.id === userMsg.id ? { ...m, status: 'failed' as const } : m,
          ),
        },
      }));
    }
  },

  loadHistory: async (sessionKey) => {
    const client = getGatewayClient();
    const result = await client.call<{ messages: Message[] }>(
      'chat.history',
      { sessionKey, limit: 50 },
    );
    const visible = (result.messages || []).filter(
      (m) => m.role === 'user' || m.role === 'assistant',
    );
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionKey]: visible,
      },
    }));
  },

  abortRun: async () => {
    const { activeSessionKey, currentRunId } = get();
    if (!activeSessionKey) return;

    const client = getGatewayClient();
    try {
      await client.call('chat.abort', {
        sessionKey: activeSessionKey,
        runId: currentRunId,
      });
    } finally {
      set({ isAgentRunning: false, streamingMessage: null, currentRunId: null, streamingSessionKey: null });
    }
  },

  // === STREAMING — agent event handler ===
  // Ikkala formatni qo'llab-quvvatlaydi:
  // 1. Haqiqiy gateway: { stream: "lifecycle"|"assistant", data: { delta: "..." } }
  // 2. Mock/Anthropic: { type: "message_start"|"content_block_delta"|"message_stop" }

  _handleAgentEvent: (event) => {
    // Formatni aniqlash: haqiqiy gateway "stream" fieldiga ega
    if (event.stream) {
      // === Haqiqiy gateway formati ===
      const { stream, data, runId } = event;

      if (stream === 'lifecycle') {
        const phase = data.phase as string;

        if (phase === 'start') {
          set((state) => ({
            streamingMessage: {
              id: generateUUID(),
              role: 'assistant',
              content: '',
              isStreaming: true,
            },
            isAgentRunning: true,
            currentRunId: runId,
            streamingSessionKey: state.streamingSessionKey || state.activeSessionKey,
          }));
        } else if (phase === 'end') {
          get()._finalizeStream();
        }
      } else if (stream === 'assistant') {
        const delta = data.delta as string | undefined;
        if (delta) {
          set((state) => {
            const current = state.streamingMessage || {
              id: generateUUID(),
              role: 'assistant' as const,
              content: '',
              isStreaming: true,
            };
            return {
              streamingMessage: {
                ...current,
                content: current.content + delta,
              },
              isAgentRunning: true,
            };
          });
        }
      } else if (stream === 'thinking') {
        const delta = data.delta as string | undefined;
        if (delta) {
          set((state) => ({
            streamingMessage: state.streamingMessage
              ? {
                  ...state.streamingMessage,
                  isThinking: true,
                  thinkingContent:
                    (state.streamingMessage.thinkingContent || '') + delta,
                }
              : null,
          }));
        }
      } else if (stream === 'tool') {
        const toolName = data.name as string | undefined;
        if (toolName) {
          set((state) => ({
            streamingMessage: state.streamingMessage
              ? { ...state.streamingMessage, toolName }
              : null,
          }));
        }
      }
    } else {
      // === Mock/Anthropic formati (type-based) ===
      const legacyEvent = event as unknown as { type: string; runId?: string; delta?: { type: string; text?: string }; error?: { code: string; message: string } };

      switch (legacyEvent.type) {
        case 'message_start': {
          set((state) => ({
            streamingMessage: {
              id: generateUUID(),
              role: 'assistant',
              content: '',
              isStreaming: true,
            },
            isAgentRunning: true,
            streamingSessionKey: state.streamingSessionKey || state.activeSessionKey,
            ...(legacyEvent.runId ? { currentRunId: legacyEvent.runId } : {}),
          }));
          break;
        }
        case 'content_block_delta': {
          if (legacyEvent.delta?.type === 'text_delta' && legacyEvent.delta.text) {
            const text = legacyEvent.delta.text;
            set((state) => ({
              streamingMessage: state.streamingMessage
                ? { ...state.streamingMessage, content: state.streamingMessage.content + text }
                : null,
            }));
          }
          break;
        }
        case 'message_stop': {
          get()._finalizeStream();
          break;
        }
        case 'error': {
          console.warn('[ChatStore] Agent error:', legacyEvent.error);
          set({
            isAgentRunning: false,
            streamingMessage: null,
            currentRunId: null,
            streamingSessionKey: null,
          });
          break;
        }
      }
    }
  },

  // === STREAMING — chat event handler (to'liq xabar holati) ===

  _handleChatEvent: (event) => {
    if (event.state === 'final') {
      // Yakuniy xabar — to'g'ridan to'g'ri messages ga qo'shish
      const textContent = event.message.content
        .filter((c) => c.type === 'text' && c.text)
        .map((c) => c.text)
        .join('');

      const { streamingSessionKey, activeSessionKey } = get();
      const sessionKey = streamingSessionKey || activeSessionKey || 'main';

      const finalMsg: Message = {
        id: generateUUID(),
        role: 'assistant',
        content: textContent,
        timestamp: event.message.timestamp || Date.now(),
        status: 'complete',
        sessionKey,
      };

      set((state) => {
        // Agar streaming message mavjud bo'lsa va uning ID sidan foydalanish
        const msgId = state.streamingMessage?.id || finalMsg.id;
        const existing = state.messages[sessionKey] || [];
        // Duplikat ID bo'lsa, qo'shmaslik
        if (existing.some((m) => m.id === msgId)) {
          return {
            streamingMessage: null,
            streamingSessionKey: null,
            isAgentRunning: false,
            currentRunId: null,
          };
        }
        return {
          streamingMessage: null,
          streamingSessionKey: null,
          isAgentRunning: false,
          currentRunId: null,
          messages: {
            ...state.messages,
            [sessionKey]: [
              ...existing,
              { ...finalMsg, id: msgId },
            ],
          },
        };
      });
    }
    // delta eventlarni agent event orqali handle qilamiz (real-time streaming uchun)
  },

  _finalizeStream: () => {
    const { streamingMessage, streamingSessionKey, activeSessionKey } = get();
    if (!streamingMessage) return;

    const sessionKey = streamingSessionKey || activeSessionKey || 'main';

    const finalMsg: Message = {
      id: streamingMessage.id,
      role: 'assistant',
      content: streamingMessage.content,
      timestamp: Date.now(),
      status: 'complete',
      thinkingContent: streamingMessage.thinkingContent,
      sessionKey,
    };

    set((state) => {
      const existing = state.messages[sessionKey] || [];
      // Duplikat ID bo'lsa, qo'shmaslik
      if (existing.some((m) => m.id === finalMsg.id)) {
        return {
          streamingMessage: null,
          streamingSessionKey: null,
          isAgentRunning: false,
          currentRunId: null,
        };
      }
      return {
        streamingMessage: null,
        streamingSessionKey: null,
        isAgentRunning: false,
        currentRunId: null,
        messages: {
          ...state.messages,
          [sessionKey]: [
            ...existing,
            finalMsg,
          ],
        },
      };
    });
  },
}));

// === Agent + Chat Event Listener Setup ===

let _agentListenerActive = false;

export function setupAgentEventListener(): void {
  if (_agentListenerActive) return;
  _agentListenerActive = true;

  const client = getGatewayClient();

  // Agent eventlar — real-time streaming (lifecycle, assistant, thinking, tool)
  client.on('agent', (payload: unknown) => {
    const event = payload as GatewayAgentEvent;
    useChatStore.getState()._handleAgentEvent(event);
  });

  // Chat eventlar — yakuniy xabar holati (final fallback)
  client.on('chat', (payload: unknown) => {
    const event = payload as GatewayChatEvent;
    // Faqat final state ni handle qilamiz — agent lifecycle:end bilan race condition
    // bo'lsa, _handleChatEvent ichida tekshiramiz
    if (event.state === 'final') {
      const state = useChatStore.getState();
      // Agar agent lifecycle:end allaqachon finalize qilgan bo'lsa, skip
      if (state.isAgentRunning || state.streamingMessage) {
        useChatStore.getState()._handleChatEvent(event);
      }
    }
  });
}

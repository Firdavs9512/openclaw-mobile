import { create } from 'zustand';

import type {
  Attachment,
  Message,
  SessionInfo,
  StreamingMessage,
  ThinkingLevel,
} from '@/types/chat';
import type {
  AgentContentBlockDelta,
  AgentContentBlockStart,
  AgentError,
  AgentEvent,
  AgentMessageStart,
  AgentThinkingDelta,
  AgentToolUseStart,
} from '@/types/events';
import { generateUUID } from '@/gateway/utils';
import { getGatewayClient } from '@/stores/gateway-store';
import { AppKeys, appGet, appSet } from '@/utils/app-storage';

interface ChatStore {
  // === STATE ===
  sessions: SessionInfo[];
  activeSessionKey: string | null;
  messages: Record<string, Message[]>;
  streamingMessage: StreamingMessage | null;
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
  _handleAgentEvent: (event: AgentEvent) => void;
  _appendStreamDelta: (text: string) => void;
  _appendThinkingDelta: (text: string) => void;
  _finalizeStream: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // === INITIAL STATE ===
  sessions: [],
  activeSessionKey: null,
  messages: {},
  streamingMessage: null,
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
        messages: {
          ...state.messages,
          [sessionKey]: (state.messages[sessionKey] || []).map((m) =>
            m.id === userMsg.id ? { ...m, status: 'sent' as const } : m,
          ),
        },
      }));
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
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionKey]: result.messages || [],
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
      set({ isAgentRunning: false, streamingMessage: null, currentRunId: null });
    }
  },

  // === STREAMING (ichki) ===

  _handleAgentEvent: (event) => {
    switch (event.type) {
      case 'message_start': {
        const msgStart = event as AgentMessageStart;
        set({
          streamingMessage: {
            id: generateUUID(),
            role: 'assistant',
            content: '',
            isStreaming: true,
          },
          isAgentRunning: true,
          ...(msgStart.runId ? { currentRunId: msgStart.runId } : {}),
        });
        break;
      }

      case 'content_block_start': {
        const blockStart = event as AgentContentBlockStart;
        if (blockStart.content_block.type === 'thinking') {
          set((state) => ({
            streamingMessage: state.streamingMessage
              ? { ...state.streamingMessage, isThinking: true }
              : null,
          }));
        } else if (blockStart.content_block.type === 'tool_use') {
          set((state) => ({
            streamingMessage: state.streamingMessage
              ? {
                  ...state.streamingMessage,
                  toolName: blockStart.content_block.name,
                }
              : null,
          }));
        }
        break;
      }

      case 'content_block_delta': {
        const delta = (event as AgentContentBlockDelta).delta;
        if (delta.type === 'text_delta' && delta.text) {
          get()._appendStreamDelta(delta.text);
        } else if (delta.type === 'thinking_delta' && delta.text) {
          get()._appendThinkingDelta(delta.text);
        }
        break;
      }

      case 'content_block_stop': {
        set((state) => ({
          streamingMessage: state.streamingMessage
            ? {
                ...state.streamingMessage,
                isThinking: false,
                toolName: undefined,
              }
            : null,
        }));
        break;
      }

      case 'thinking_start': {
        set((state) => ({
          streamingMessage: state.streamingMessage
            ? { ...state.streamingMessage, isThinking: true }
            : null,
        }));
        break;
      }

      case 'thinking_delta': {
        const thinkDelta = event as AgentThinkingDelta;
        if (thinkDelta.delta.text) {
          get()._appendThinkingDelta(thinkDelta.delta.text);
        }
        break;
      }

      case 'thinking_stop': {
        set((state) => ({
          streamingMessage: state.streamingMessage
            ? { ...state.streamingMessage, isThinking: false }
            : null,
        }));
        break;
      }

      case 'tool_use_start': {
        const toolStart = event as AgentToolUseStart;
        set((state) => ({
          streamingMessage: state.streamingMessage
            ? { ...state.streamingMessage, toolName: toolStart.tool.name }
            : null,
        }));
        break;
      }

      case 'tool_use_stop': {
        set((state) => ({
          streamingMessage: state.streamingMessage
            ? { ...state.streamingMessage, toolName: undefined }
            : null,
        }));
        break;
      }

      case 'message_delta': {
        // stop_reason keladi — hozircha handle qilish shart emas
        break;
      }

      case 'message_stop': {
        get()._finalizeStream();
        break;
      }

      case 'error': {
        const errorEvent = event as AgentError;
        console.warn('[ChatStore] Agent error:', errorEvent.error);
        set({
          isAgentRunning: false,
          streamingMessage: null,
          currentRunId: null,
        });
        break;
      }
    }
  },

  _appendStreamDelta: (text) => {
    set((state) => ({
      streamingMessage: state.streamingMessage
        ? {
            ...state.streamingMessage,
            content: state.streamingMessage.content + text,
          }
        : null,
    }));
  },

  _appendThinkingDelta: (text) => {
    set((state) => ({
      streamingMessage: state.streamingMessage
        ? {
            ...state.streamingMessage,
            thinkingContent:
              (state.streamingMessage.thinkingContent || '') + text,
          }
        : null,
    }));
  },

  _finalizeStream: () => {
    const { streamingMessage, activeSessionKey } = get();
    if (!streamingMessage || !activeSessionKey) return;

    const finalMsg: Message = {
      id: streamingMessage.id,
      role: 'assistant',
      content: streamingMessage.content,
      timestamp: Date.now(),
      status: 'complete',
      thinkingContent: streamingMessage.thinkingContent,
      sessionKey: activeSessionKey,
    };

    set((state) => ({
      streamingMessage: null,
      isAgentRunning: false,
      currentRunId: null,
      messages: {
        ...state.messages,
        [activeSessionKey]: [
          ...(state.messages[activeSessionKey] || []),
          finalMsg,
        ],
      },
    }));
  },
}));

// === Agent Event Listener Setup ===

let _agentListenerActive = false;

export function setupAgentEventListener(): void {
  if (_agentListenerActive) return;
  _agentListenerActive = true;

  const client = getGatewayClient();
  client.on('agent', (payload: AgentEvent) => {
    useChatStore.getState()._handleAgentEvent(payload);
  });
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  status: MessageStatus;
  attachments?: Attachment[];
  thinkingContent?: string;
  toolUses?: ToolUseBlock[];
  sessionKey: string;
}

export type MessageStatus = 'sending' | 'sent' | 'streaming' | 'complete' | 'failed';

export interface Attachment {
  type: 'image' | 'document' | 'file' | 'audio';
  mimeType: string;
  fileName: string;
  content: string; // Base64 encoded
}

export interface ChatSendParams {
  sessionKey: string;
  message: string;
  thinking?: ThinkingLevel;
  timeoutMs?: number;
  idempotencyKey?: string;
  attachments?: Attachment[];
  agentId?: string;
}

export type ThinkingLevel = 'off' | 'low' | 'medium' | 'high';

export interface SessionInfo {
  sessionKey: string;
  agentId: string;
  lastMessage?: string;
  updatedAt: string;
  messageCount?: number;
}

export interface StreamingMessage {
  id: string;
  role: 'assistant';
  content: string;
  isStreaming: boolean;
  thinkingContent?: string;
  isThinking?: boolean;
  toolName?: string;
}

export interface ToolUseBlock {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: string;
  status: 'running' | 'complete' | 'error';
}

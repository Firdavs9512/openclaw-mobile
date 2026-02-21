export type AgentEvent =
  | AgentMessageStart
  | AgentContentBlockStart
  | AgentContentBlockDelta
  | AgentContentBlockStop
  | AgentMessageDelta
  | AgentMessageStop
  | AgentThinkingStart
  | AgentThinkingDelta
  | AgentThinkingStop
  | AgentToolUseStart
  | AgentToolUseStop
  | AgentError;

export interface AgentMessageStart {
  type: 'message_start';
  message: { role: 'assistant' };
  runId?: string;
}

export interface AgentContentBlockStart {
  type: 'content_block_start';
  index: number;
  content_block: {
    type: 'text' | 'tool_use' | 'thinking';
    id?: string;
    name?: string;
    text?: string;
  };
}

export interface AgentContentBlockDelta {
  type: 'content_block_delta';
  index: number;
  delta: {
    type: 'text_delta' | 'input_json_delta' | 'thinking_delta';
    text?: string;
    partial_json?: string;
  };
}

export interface AgentContentBlockStop {
  type: 'content_block_stop';
  index: number;
}

export interface AgentMessageDelta {
  type: 'message_delta';
  delta: {
    stop_reason: string;
  };
}

export interface AgentMessageStop {
  type: 'message_stop';
}

export interface AgentThinkingStart {
  type: 'thinking_start';
}

export interface AgentThinkingDelta {
  type: 'thinking_delta';
  delta: { text: string };
}

export interface AgentThinkingStop {
  type: 'thinking_stop';
}

export interface AgentToolUseStart {
  type: 'tool_use_start';
  tool: { id: string; name: string; input: Record<string, unknown> };
}

export interface AgentToolUseStop {
  type: 'tool_use_stop';
  result: { content: string; isError?: boolean };
}

export interface AgentError {
  type: 'error';
  error: { code: string; message: string };
}

// === GATEWAY EVENTS ===

export type GatewayEventType =
  | 'tick'
  | 'health'
  | 'agent'
  | 'chat'
  | 'presence'
  | 'connect.challenge'
  | 'node.pair.requested'
  | 'exec.approval.requested'
  | 'shutdown';

export interface ExecApprovalRequest {
  approvalId: string;
  sessionKey: string;
  runId: string;
  command: string;
}

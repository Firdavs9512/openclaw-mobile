// === FRAME TYPES ===

export type GatewayFrame = RequestFrame | ResponseFrame | EventFrame;

export interface RequestFrame {
  type: 'req';
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface ResponseFrame {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: GatewayError;
}

export interface EventFrame {
  type: 'event';
  event: string;
  payload: unknown;
  seq?: number;
  stateVersion?: number;
}

export interface GatewayError {
  code: string;
  message: string;
}

// === CONNECTION ===

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'handshaking'
  | 'connected'
  | 'reconnecting';

export interface GatewayConfig {
  host: string;
  port: number;
  token?: string;
  password?: string;
  useTLS: boolean;
  tlsFingerprint?: string;
}

export interface ConnectChallenge {
  nonce: string;
  ts: number;
}

export interface ConnectParams {
  minProtocol: string;
  maxProtocol: string;
  client: ClientInfo;
  role: 'operator' | 'node';
  scopes?: string[];
  caps?: string[];
  commands?: string[];
  permissions?: Record<string, boolean>;
  auth: AuthPayload;
  device?: DevicePayload;
  locale?: string;
}

export interface ClientInfo {
  id: string;
  version: string;
  platform: string;
  mode: 'operator' | 'node';
  instanceId: string;
  deviceFamily?: string;
  displayName?: string;
}

export interface AuthPayload {
  token?: string;
  password?: string;
}

export interface DevicePayload {
  id: string;
  publicKey: string;
  signature: string;
  signedAt: number;
  nonce: string;
}

export interface HelloOkPayload {
  protocol: string;
  policy: {
    tickIntervalMs: number;
  };
  auth?: {
    deviceToken?: string;
  };
}

// === DEVICE IDENTITY ===

export interface DeviceIdentity {
  id: string; // SHA-256 fingerprint of publicKey
  publicKey: string; // Base64 encoded Ed25519 public key
}

// === AGENT IDENTITY ===

export interface AgentIdentity {
  name: string;
  avatar: string; // emoji, masalan "🤖"
}

// === MODEL INFO ===

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  reasoning?: boolean;
}

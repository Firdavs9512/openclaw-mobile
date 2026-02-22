// === Skills Status Config Check ===

export interface SkillsStatusConfigCheck {
  path: string;
  satisfied: boolean;
}

// === Skill Install Option ===

export interface SkillInstallOption {
  id: string;
  kind: 'brew' | 'node' | 'go' | 'uv';
  label: string;
  bins: string[];
}

// === Skill Status Entry ===

export interface SkillStatusEntry {
  name: string;
  description: string;
  source: string;
  filePath: string;
  baseDir: string;
  skillKey: string;
  bundled?: boolean;
  primaryEnv?: string;
  emoji?: string;
  homepage?: string;
  always: boolean;
  disabled: boolean;
  blockedByAllowlist: boolean;
  eligible: boolean;
  requirements: {
    bins: string[];
    env: string[];
    config: string[];
    os: string[];
  };
  missing: {
    bins: string[];
    env: string[];
    config: string[];
    os: string[];
  };
  configChecks: SkillsStatusConfigCheck[];
  install: SkillInstallOption[];
}

// === Skill Status Report ===

export interface SkillStatusReport {
  workspaceDir: string;
  managedSkillsDir: string;
  skills: SkillStatusEntry[];
}

// === RPC Params ===

export interface SkillsStatusParams {
  agentId?: string;
}

export interface SkillsUpdateParams {
  skillKey: string;
  enabled?: boolean;
  apiKey?: string;
  env?: Record<string, string>;
}

export interface SkillsInstallParams {
  name: string;
  installId: string;
  timeoutMs?: number;
}

// === RPC Responses ===

export interface SkillsUpdateResponse {
  ok: boolean;
  skillKey: string;
  config: Record<string, unknown>;
}

export interface SkillsInstallResponse {
  ok: boolean;
  message?: string;
}

export interface SkillsBinsResponse {
  bins: string[];
}

// === UI State ===

export interface SkillMessage {
  kind: 'success' | 'error';
  message: string;
}

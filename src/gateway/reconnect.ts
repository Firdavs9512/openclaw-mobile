export interface ReconnectConfig {
  initialDelay: number;
  maxDelay: number;
  multiplier: number;
  jitter: number;
  maxAttempts: number;
}

export const DEFAULT_RECONNECT_CONFIG: ReconnectConfig = {
  initialDelay: 500,
  maxDelay: 8000,
  multiplier: 1.7,
  jitter: 0.3,
  maxAttempts: Infinity,
};

/**
 * Keyingi reconnect kutish vaqtini hisoblash (0-indexed attempt).
 *
 * base        = min(initialDelay * multiplier^attempt, maxDelay)
 * jitterRange = base * jitter
 * delay       = base + random(-jitterRange, +jitterRange)
 */
export function calculateDelay(
  attempt: number,
  config: ReconnectConfig,
): number {
  const base = Math.min(
    config.initialDelay * Math.pow(config.multiplier, attempt),
    config.maxDelay,
  );
  const jitterRange = base * config.jitter;
  const jitter = (Math.random() * 2 - 1) * jitterRange;
  return Math.max(0, Math.min(config.maxDelay, base + jitter));
}

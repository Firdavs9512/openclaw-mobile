export class GatewayError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'GatewayError';
    this.code = code;
  }

  get isAuthError(): boolean {
    return this.code === 'UNAUTHORIZED' || this.code === 'NOT_PAIRED';
  }

  get isRateLimit(): boolean {
    return this.code === 'RATE_LIMITED';
  }

  get isTimeout(): boolean {
    return this.code === 'TIMEOUT';
  }
}

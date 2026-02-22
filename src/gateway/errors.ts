export class GatewayError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'GatewayError';
    this.code = code;
  }

  get isPairingRequired(): boolean {
    return (
      this.code === 'NOT_PAIRED' ||
      this.message.toLowerCase().includes('pairing required')
    );
  }

  get isAuthError(): boolean {
    return this.code === 'UNAUTHORIZED' || this.isPairingRequired;
  }

  get isRateLimit(): boolean {
    return this.code === 'RATE_LIMITED';
  }

  get isTimeout(): boolean {
    return this.code === 'TIMEOUT';
  }
}

import {
  calculateDelay,
  DEFAULT_RECONNECT_CONFIG,
  type ReconnectConfig,
} from '../reconnect';

describe('calculateDelay', () => {
  const noJitter: ReconnectConfig = { ...DEFAULT_RECONNECT_CONFIG, jitter: 0 };

  it('returns approximately initialDelay at attempt 0', () => {
    const delay = calculateDelay(0, DEFAULT_RECONNECT_CONFIG);
    // With ±30% jitter: 500 * 0.7 = 350, 500 * 1.3 = 650
    expect(delay).toBeGreaterThanOrEqual(350);
    expect(delay).toBeLessThanOrEqual(650);
  });

  it('returns exact initialDelay at attempt 0 with no jitter', () => {
    expect(calculateDelay(0, noJitter)).toBe(500);
  });

  it('grows exponentially between attempts', () => {
    const d0 = calculateDelay(0, noJitter);
    const d1 = calculateDelay(1, noJitter);
    const d2 = calculateDelay(2, noJitter);

    expect(d0).toBe(500);
    expect(d1).toBeCloseTo(850, 0); // 500 * 1.7
    expect(d2).toBeCloseTo(1445, 0); // 500 * 1.7^2
  });

  it('never exceeds maxDelay', () => {
    for (let i = 0; i < 20; i++) {
      expect(calculateDelay(i, noJitter)).toBeLessThanOrEqual(
        DEFAULT_RECONNECT_CONFIG.maxDelay,
      );
    }
  });

  it('never exceeds maxDelay even with jitter', () => {
    for (let i = 0; i < 100; i++) {
      expect(calculateDelay(10, DEFAULT_RECONNECT_CONFIG)).toBeLessThanOrEqual(
        DEFAULT_RECONNECT_CONFIG.maxDelay,
      );
    }
  });

  it('never returns negative values', () => {
    for (let i = 0; i < 100; i++) {
      expect(calculateDelay(0, DEFAULT_RECONNECT_CONFIG)).toBeGreaterThanOrEqual(0);
    }
  });
});

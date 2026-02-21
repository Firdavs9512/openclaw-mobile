import { parseOpenClawUrl } from '../deep-link';

describe('parseOpenClawUrl', () => {
  it('parses valid connect URL', () => {
    const result = parseOpenClawUrl(
      'openclaw://connect?host=192.168.1.10&port=18789&token=abc123&tls=0',
    );
    expect(result).toEqual({
      type: 'connect',
      config: { host: '192.168.1.10', port: 18789, token: 'abc123', useTLS: false },
    });
  });

  it('parses valid pair URL with pairToken', () => {
    const result = parseOpenClawUrl(
      'openclaw://pair?host=192.168.1.10&port=18789&token=temp_token&tls=1',
    );
    expect(result).toEqual({
      type: 'pair',
      config: { host: '192.168.1.10', port: 18789, token: 'temp_token', useTLS: true },
      pairToken: 'temp_token',
    });
  });

  it('parses valid relay URL', () => {
    const result = parseOpenClawUrl(
      'openclaw://relay?url=wss://relay.host&room=room-id&secret=secret123',
    );
    expect(result).toEqual({
      type: 'relay',
      relayUrl: 'wss://relay.host',
      roomId: 'room-id',
      secret: 'secret123',
    });
  });

  it('returns null for invalid URL', () => {
    expect(parseOpenClawUrl('not-a-url')).toBeNull();
  });

  it('returns null for non-openclaw scheme', () => {
    expect(parseOpenClawUrl('https://example.com')).toBeNull();
  });

  it('returns null for missing required params', () => {
    expect(parseOpenClawUrl('openclaw://connect')).toBeNull();
    expect(parseOpenClawUrl('openclaw://relay?url=wss://x')).toBeNull();
  });

  it('uses default port 18789 when not specified', () => {
    const result = parseOpenClawUrl('openclaw://connect?host=10.0.0.1&tls=0');
    expect(result).not.toBeNull();
    expect(result!.type === 'connect' && result!.config.port).toBe(18789);
  });

  it('handles tls=1 as useTLS true', () => {
    const result = parseOpenClawUrl('openclaw://connect?host=10.0.0.1&tls=1');
    expect(result).not.toBeNull();
    expect(result!.type === 'connect' && result!.config.useTLS).toBe(true);
  });
});

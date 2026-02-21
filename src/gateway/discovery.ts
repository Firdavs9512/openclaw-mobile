import Zeroconf from 'react-native-zeroconf';

export interface DiscoveredGateway {
  name: string;
  host: string;
  port: number;
  useTLS: boolean;
  tlsFingerprint?: string;
  tailnetDns?: string;
}

const SERVICE_TYPE = '_openclaw-gw._tcp.';
const DEFAULT_SCAN_DURATION = 5000;

export function startDiscovery(
  onFound: (gateway: DiscoveredGateway) => void,
  onRemoved?: (name: string) => void,
  duration: number = DEFAULT_SCAN_DURATION,
): { stop: () => void } {
  const zeroconf = new Zeroconf();

  zeroconf.on('resolved', (service) => {
    const txt = service.txt ?? {};

    if (txt.role !== 'gateway') return;

    const gateway: DiscoveredGateway = {
      name: service.name,
      host: service.host,
      port: parseInt(txt.gatewayPort, 10) || service.port,
      useTLS: txt.gatewayTls === '1',
      tlsFingerprint: txt.gatewayTlsSha256 || undefined,
      tailnetDns: txt.tailnetDns || undefined,
    };

    onFound(gateway);
  });

  if (onRemoved) {
    zeroconf.on('remove', (name: string) => {
      onRemoved(name);
    });
  }

  zeroconf.scan(SERVICE_TYPE, 'local.');

  const timer = setTimeout(() => {
    zeroconf.stop();
  }, duration);

  return {
    stop: () => {
      clearTimeout(timer);
      zeroconf.stop();
      zeroconf.removeAllListeners();
    },
  };
}

export async function scanGateways(
  duration: number = DEFAULT_SCAN_DURATION,
): Promise<DiscoveredGateway[]> {
  return new Promise((resolve) => {
    const found: DiscoveredGateway[] = [];

    const { stop } = startDiscovery(
      (gw) => {
        if (!found.some((g) => g.host === gw.host && g.port === gw.port)) {
          found.push(gw);
        }
      },
      undefined,
      duration,
    );

    setTimeout(() => {
      stop();
      resolve(found);
    }, duration + 100);
  });
}

import { useCallback, useEffect, useRef, useState } from 'react';

import { type DiscoveredGateway, startDiscovery } from '@/gateway/discovery';

export function useDiscovery() {
  const [gateways, setGateways] = useState<DiscoveredGateway[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const scan = useCallback((duration = 5000) => {
    stopRef.current?.();

    setIsScanning(true);
    setGateways([]);

    const { stop } = startDiscovery(
      (gw) => {
        setGateways((prev) => {
          if (prev.some((g) => g.host === gw.host && g.port === gw.port)) {
            return prev;
          }
          return [...prev, gw];
        });
      },
      (name) => {
        setGateways((prev) => prev.filter((g) => g.name !== name));
      },
      duration,
    );

    stopRef.current = stop;

    setTimeout(() => {
      setIsScanning(false);
    }, duration + 100);
  }, []);

  useEffect(() => {
    return () => {
      stopRef.current?.();
    };
  }, []);

  return { gateways, isScanning, scan };
}

export type { DiscoveredGateway } from '@/gateway/discovery';

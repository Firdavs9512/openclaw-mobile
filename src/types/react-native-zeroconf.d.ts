declare module 'react-native-zeroconf' {
  interface ZeroconfService {
    name: string;
    host: string;
    port: number;
    txt?: Record<string, string>;
    addresses?: string[];
    fullName?: string;
  }

  export default class Zeroconf {
    scan(type: string, protocol?: string, domain?: string): void;
    stop(): void;
    on(event: 'resolved', listener: (service: ZeroconfService) => void): void;
    on(event: 'remove', listener: (name: string) => void): void;
    on(event: 'error', listener: (error: Error) => void): void;
    on(event: 'start' | 'stop' | 'found' | 'update', listener: () => void): void;
    removeAllListeners(): void;
  }
}

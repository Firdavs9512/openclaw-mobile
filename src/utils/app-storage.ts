import { createMMKV } from 'react-native-mmkv';

export const appStorage = createMMKV({ id: 'openclaw-app' });

export const AppKeys = {
  GATEWAY_HOST: 'gateway_host',
  GATEWAY_PORT: 'gateway_port',
  GATEWAY_USE_TLS: 'gateway_use_tls',
  LAST_SESSION_KEY: 'last_session_key',
  THINKING_LEVEL: 'thinking_level',
  THEME: 'theme',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  DISCOVERED_GATEWAYS: 'discovered_gateways',
  PERM_BROWSER_CONTROL: 'perm_browser_control',
  PERM_FILE_ACCESS: 'perm_file_access',
  PERM_HEARTBEAT: 'perm_heartbeat',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
} as const;

export function appSet(key: string, value: string | number | boolean): void {
  appStorage.set(key, value);
}

export function appGet(key: string): string | undefined {
  return appStorage.getString(key);
}

export function appGetNumber(key: string): number | undefined {
  return appStorage.getNumber(key);
}

export function appGetBoolean(key: string): boolean | undefined {
  return appStorage.getBoolean(key);
}

export function appDelete(key: string): void {
  appStorage.remove(key);
}

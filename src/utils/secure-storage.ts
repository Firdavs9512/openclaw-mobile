import * as Keychain from 'react-native-keychain';

const SERVICE_PREFIX = 'openclaw';

export async function secureSet(key: string, value: string): Promise<void> {
  await Keychain.setGenericPassword(key, value, {
    service: `${SERVICE_PREFIX}.${key}`,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function secureGet(key: string): Promise<string | null> {
  const result = await Keychain.getGenericPassword({
    service: `${SERVICE_PREFIX}.${key}`,
  });
  if (result === false) return null;
  return result.password;
}

export async function secureDelete(key: string): Promise<void> {
  await Keychain.resetGenericPassword({
    service: `${SERVICE_PREFIX}.${key}`,
  });
}

export async function secureHas(key: string): Promise<boolean> {
  return (await secureGet(key)) !== null;
}

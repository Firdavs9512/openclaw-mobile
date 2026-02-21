import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { Buffer } from 'buffer';

import {
  ensureDeviceIdentity,
  generateDeviceIdentity,
  loadDeviceIdentity,
  signChallenge,
} from '../crypto';

const keychainStore: Record<string, { username: string; password: string }> = {};

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(
    async (username: string, password: string, opts: { service: string }) => {
      keychainStore[opts.service] = { username, password };
      return true;
    },
  ),
  getGenericPassword: jest.fn(async (opts: { service: string }) => {
    return keychainStore[opts.service] || false;
  }),
  resetGenericPassword: jest.fn(async (opts: { service: string }) => {
    delete keychainStore[opts.service];
    return true;
  }),
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly',
  },
}));

function clearKeychainStore() {
  for (const key of Object.keys(keychainStore)) {
    delete keychainStore[key];
  }
}

beforeEach(clearKeychainStore);

describe('crypto', () => {
  it('generateDeviceIdentity creates keypair with 64-char hex fingerprint', async () => {
    const identity = await generateDeviceIdentity();

    expect(identity.id).toHaveLength(64);
    expect(identity.id).toMatch(/^[0-9a-f]{64}$/);
    expect(identity.publicKey).toBeTruthy();

    const pubBytes = Buffer.from(identity.publicKey, 'base64');
    expect(pubBytes).toHaveLength(32);
  });

  it('signChallenge produces a valid signature', async () => {
    const identity = await generateDeviceIdentity();
    const nonce = 'test-challenge-nonce-123';

    const signatureB64 = await signChallenge(nonce);
    expect(signatureB64).toBeTruthy();

    const signature = new Uint8Array(Buffer.from(signatureB64, 'base64'));
    const message = new TextEncoder().encode(nonce);
    const publicKey = new Uint8Array(Buffer.from(identity.publicKey, 'base64'));

    const valid = await ed.verifyAsync(signature, message, publicKey);
    expect(valid).toBe(true);
  });

  it('ensureDeviceIdentity creates on first call, returns same on second', async () => {
    const first = await ensureDeviceIdentity();
    const second = await ensureDeviceIdentity();

    expect(first.id).toBe(second.id);
    expect(first.publicKey).toBe(second.publicKey);
  });

  it('loadDeviceIdentity returns saved identity correctly', async () => {
    const generated = await generateDeviceIdentity();
    const loaded = await loadDeviceIdentity();

    expect(loaded).not.toBeNull();
    expect(loaded!.id).toBe(generated.id);
    expect(loaded!.publicKey).toBe(generated.publicKey);

    const pubBytes = new Uint8Array(Buffer.from(generated.publicKey, 'base64'));
    const expectedFingerprint = bytesToHex(sha256(pubBytes));
    expect(loaded!.id).toBe(expectedFingerprint);
  });
});

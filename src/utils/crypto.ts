import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { Buffer } from 'buffer';

import type { DeviceIdentity } from '@/types/gateway';

import { secureGet, secureSet } from './secure-storage';

export async function generateDeviceIdentity(): Promise<DeviceIdentity> {
  const privateKey = ed.utils.randomSecretKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);

  const fingerprint = bytesToHex(sha256(publicKey));
  const publicKeyB64 = Buffer.from(publicKey).toString('base64');
  const privateKeyB64 = Buffer.from(privateKey).toString('base64');

  await secureSet('device_private_key', privateKeyB64);
  await secureSet('device_public_key', publicKeyB64);

  return { id: fingerprint, publicKey: publicKeyB64 };
}

export async function loadDeviceIdentity(): Promise<DeviceIdentity | null> {
  const publicKeyB64 = await secureGet('device_public_key');
  if (!publicKeyB64) return null;

  const publicKeyBytes = new Uint8Array(Buffer.from(publicKeyB64, 'base64'));
  const fingerprint = bytesToHex(sha256(publicKeyBytes));

  return { id: fingerprint, publicKey: publicKeyB64 };
}

export async function signChallenge(nonce: string): Promise<string> {
  const privateKeyB64 = await secureGet('device_private_key');
  if (!privateKeyB64) {
    throw new Error('Device identity not found. Call ensureDeviceIdentity() first.');
  }

  const privateKey = new Uint8Array(Buffer.from(privateKeyB64, 'base64'));
  const message = new TextEncoder().encode(nonce);
  const signature = await ed.signAsync(message, privateKey);

  return Buffer.from(signature).toString('base64');
}

export async function ensureDeviceIdentity(): Promise<DeviceIdentity> {
  const existing = await loadDeviceIdentity();
  if (existing) return existing;
  return generateDeviceIdentity();
}

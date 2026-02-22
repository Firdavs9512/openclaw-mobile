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

export interface DeviceAuthPayloadParams {
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  signedAtMs: number;
  token?: string | null;
  nonce?: string | null;
}

function buildDeviceAuthPayload(params: DeviceAuthPayloadParams): string {
  const version = params.nonce ? 'v2' : 'v1';
  const scopes = params.scopes.join(',');
  const token = params.token ?? '';
  const base = [
    version,
    params.deviceId,
    params.clientId,
    params.clientMode,
    params.role,
    scopes,
    String(params.signedAtMs),
    token,
  ];
  if (version === 'v2') {
    base.push(params.nonce ?? '');
  }
  return base.join('|');
}

export async function signDeviceAuth(params: DeviceAuthPayloadParams): Promise<string> {
  const privateKeyB64 = await secureGet('device_private_key');
  if (!privateKeyB64) {
    throw new Error('Device identity not found. Call ensureDeviceIdentity() first.');
  }

  const payload = buildDeviceAuthPayload(params);
  const privateKey = new Uint8Array(Buffer.from(privateKeyB64, 'base64'));
  const message = new TextEncoder().encode(payload);
  const signature = await ed.signAsync(message, privateKey);

  return Buffer.from(signature).toString('base64');
}

export async function ensureDeviceIdentity(): Promise<DeviceIdentity> {
  const existing = await loadDeviceIdentity();
  if (existing) return existing;
  return generateDeviceIdentity();
}

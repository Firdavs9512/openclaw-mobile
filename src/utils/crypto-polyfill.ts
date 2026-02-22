// Bu import birinchi bo'lishi KERAK — native getRandomValues ni o'rnatadi
import 'react-native-get-random-values';

import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha2.js';
import { sha512 } from '@noble/hashes/sha2.js';

// crypto.randomUUID polyfill
if (typeof globalThis.crypto.randomUUID === 'undefined') {
  globalThis.crypto.randomUUID = (): `${string}-${string}-${string}-${string}-${string}` => {
    const hex = (n: number) => {
      const bytes = new Uint8Array(n);
      globalThis.crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    };
    return `${hex(4)}-${hex(2)}-${hex(2)}-${hex(2)}-${hex(6)}`;
  };
}

// crypto.subtle.digest polyfill
if (typeof globalThis.crypto.subtle === 'undefined') {
  // @ts-expect-error -- minimal polyfill
  globalThis.crypto.subtle = {
    async digest(algorithm: string, data: ArrayBuffer): Promise<ArrayBuffer> {
      const input = new Uint8Array(data);
      const algo = typeof algorithm === 'string' ? algorithm : (algorithm as { name: string }).name;
      switch (algo.toUpperCase().replace('-', '')) {
        case 'SHA256':
          return sha256(input).buffer;
        case 'SHA512':
          return sha512(input).buffer;
        default:
          throw new Error(`Unsupported digest algorithm: ${algo}`);
      }
    },
  };
}

// @noble/ed25519 ga sha512 sync va async berish
const sha512Concat = (...msgs: Uint8Array[]) => {
  const merged = new Uint8Array(msgs.reduce((sum, m) => sum + m.length, 0));
  let offset = 0;
  for (const m of msgs) {
    merged.set(m, offset);
    offset += m.length;
  }
  return sha512(merged);
};

ed.etc.sha512Sync = sha512Concat;
ed.etc.sha512Async = async (...msgs: Uint8Array[]) => sha512Concat(...msgs);

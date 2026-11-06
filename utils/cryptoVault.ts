export interface EncryptedVaultEnvelope {
  type: 'subdebt_encrypted_vault';
  version: 1;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  createdAt: string;
}

const PBKDF2_ITERATIONS = 100000;
const SALT_BYTE_LENGTH = 16;
const IV_BYTE_LENGTH = 12;

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  const len = bytes.length;
  while (i < len) {
    const b1 = bytes[i++];
    const b2 = i < len ? bytes[i++] : 0;
    const b3 = i < len ? bytes[i++] : 0;
    const trip = (b1 << 16) | (b2 << 8) | b3;
    result += chars[(trip >> 18) & 63];
    result += chars[(trip >> 12) & 63];
    result += i - 1 > len ? '=' : chars[(trip >> 6) & 63];
    result += i > len ? '=' : chars[trip & 63];
  }
  return result;
};

const base64ToBytes = (base64: string): Uint8Array => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const bufferLength = Math.floor((len * 3) / 4);
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const e1 = chars.indexOf(clean[i]);
    const e2 = chars.indexOf(clean[i + 1]);
    const e3 = chars.indexOf(clean[i + 2]);
    const e4 = chars.indexOf(clean[i + 3]);
    const t = (e1 << 18) | (e2 << 12) | ((e3 & 63) << 6) | (e4 & 63);
    if (p < bufferLength) bytes[p++] = (t >> 16) & 255;
    if (e3 !== -1 && p < bufferLength) bytes[p++] = (t >> 8) & 255;
    if (e4 !== -1 && p < bufferLength) bytes[p++] = t & 255;
  }
  return bytes;
};

export const isEncryptedVaultPayload = (data: any): boolean => {
  return (
    typeof data === 'object' &&
    data !== null &&
    data.type === 'subdebt_encrypted_vault' &&
    typeof data.ciphertext === 'string' &&
    typeof data.salt === 'string' &&
    typeof data.iv === 'string'
  );
};

export const encryptVaultData = async (
  plaintextJson: string,
  password: string
): Promise<string> => {
  if (!password || password.trim().length === 0) {
    throw new Error('Encryption password cannot be empty');
  }
  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    throw new Error('Web Crypto API is unavailable in this environment');
  }

  const enc = new TextEncoder();
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));

  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    enc.encode(plaintextJson)
  );

  const envelope: EncryptedVaultEnvelope = {
    type: 'subdebt_encrypted_vault',
    version: 1,
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToHex(salt),
    iv: bytesToHex(iv),
    ciphertext: bytesToBase64(new Uint8Array(encryptedBuffer)),
    createdAt: new Date().toISOString(),
  };

  return JSON.stringify(envelope, null, 2);
};

export const decryptVaultData = async (
  encryptedEnvelopeJson: string,
  password: string
): Promise<string> => {
  if (!password || password.trim().length === 0) {
    throw new Error('Decryption password cannot be empty');
  }
  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    throw new Error('Web Crypto API is unavailable in this environment');
  }

  let envelope: EncryptedVaultEnvelope;
  try {
    envelope = typeof encryptedEnvelopeJson === 'string'
      ? JSON.parse(encryptedEnvelopeJson)
      : encryptedEnvelopeJson;
  } catch (err) {
    throw new Error('Corrupted encrypted backup file format');
  }

  if (!isEncryptedVaultPayload(envelope)) {
    throw new Error('Invalid encrypted vault envelope schema');
  }

  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const salt = hexToBytes(envelope.salt);
  const iv = hexToBytes(envelope.iv);
  const ciphertextBytes = base64ToBytes(envelope.ciphertext);

  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: envelope.iterations || PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  try {
    const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      ciphertextBytes as unknown as BufferSource
    );
    return dec.decode(decryptedBuffer);
  } catch (cryptoErr) {
    throw new Error('Incorrect Master Password. Decryption failed.');
  }
};

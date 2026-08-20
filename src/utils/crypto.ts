import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

const PBKDF2_ITERATIONS = 100_000;

export async function randomHex(bytes: number): Promise<string> {
  const raw = await Crypto.getRandomBytesAsync(bytes);
  return Array.from(raw)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function deriveKey(pin: string, saltHex: string): string {
  return CryptoJS.PBKDF2(pin, CryptoJS.enc.Hex.parse(saltHex), {
    keySize: 256 / 32,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  }).toString(CryptoJS.enc.Hex);
}

export function deriveKeyAsync(pin: string, saltHex: string): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(deriveKey(pin, saltHex));
      } catch (e) {
        reject(e);
      }
    }, 0);
  });
}

export async function encryptText(plainText: string, keyHex: string): Promise<string> {
  const iv = CryptoJS.lib.WordArray.create(Array.from(await Crypto.getRandomBytesAsync(16)));
  const encrypted = CryptoJS.AES.encrypt(plainText, CryptoJS.enc.Hex.parse(keyHex), { iv });
  return `${CryptoJS.enc.Hex.stringify(iv)}:${encrypted.toString()}`;
}

export async function decryptText(payload: string, keyHex: string): Promise<string> {
  const separator = payload.indexOf(':');
  if (separator < 0) {
    throw new Error('Invalid payload');
  }
  const ivHex = payload.slice(0, separator);
  const cipher = payload.slice(separator + 1);
  const bytes = CryptoJS.AES.decrypt(cipher, CryptoJS.enc.Hex.parse(keyHex), {
    iv: CryptoJS.enc.Hex.parse(ivHex),
  });
  const result = bytes.toString(CryptoJS.enc.Utf8);
  if (!result) {
    throw new Error('Decryption failed');
  }
  return result;
}

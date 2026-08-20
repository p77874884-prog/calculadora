import * as Crypto from 'expo-crypto';
import {
  deleteItemAsync,
  getItemAsync,
  setItemAsync,
} from '../utils/secureStorage';

const PHONE_KEY = 'calculadora.profile.phone';
const PHONE_HASH_KEY = 'calculadora.profile.phoneHash';
const REGISTERED_KEY = 'calculadora.profile.registered';

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11) {
    return `+55${digits}`;
  }
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+${digits}`;
  }
  return `+55${digits}`;
}

function prettyPhone(formatted: string): string {
  const digits = formatted.replace(/\D/g, '');
  if (digits.length === 13) {
    const d = digits.slice(2);
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  return formatted;
}

export async function isPhoneRegistered(): Promise<boolean> {
  return (await getItemAsync(REGISTERED_KEY)) === 'true';
}

export async function getPhone(): Promise<string | null> {
  return getItemAsync(PHONE_KEY);
}

export async function getPhoneFormatted(): Promise<string | null> {
  const raw = await getPhone();
  return raw ? prettyPhone(raw) : null;
}

export async function registerPhone(raw: string): Promise<string> {
  const formatted = formatPhone(raw);
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    formatted,
  );
  await setItemAsync(PHONE_KEY, formatted);
  await setItemAsync(PHONE_HASH_KEY, hash);
  await setItemAsync(REGISTERED_KEY, 'true');
  return formatted;
}

export async function verifyPhone(raw: string): Promise<boolean> {
  const formatted = formatPhone(raw);
  const stored = await getItemAsync(PHONE_KEY);
  return formatted === stored;
}

export async function clearPhone(): Promise<void> {
  await deleteItemAsync(PHONE_KEY);
  await deleteItemAsync(PHONE_HASH_KEY);
  await deleteItemAsync(REGISTERED_KEY);
}

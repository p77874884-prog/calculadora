import * as Crypto from 'expo-crypto';
import * as LocalAuth from 'expo-local-authentication';
import { randomHex } from '../utils/crypto';
import {
  deleteItemAsync,
  getItemAsync,
  setItemAsync,
} from '../utils/secureStorage';

const PIN_HASH_KEY = 'calculadora.auth.pinHash';
const PIN_SALT_KEY = 'calculadora.auth.pinSalt';
const FAILURES_KEY = 'calculadora.auth.failures';
const LOCKED_UNTIL_KEY = 'calculadora.auth.lockedUntil';
const BIOMETRIC_KEY = 'calculadora.auth.biometricEnabled';
const HARDWARE_KEY = 'calculadora.auth.hasHardware';

export const MAX_FAILED_ATTEMPTS = 10;
export const LOCKOUT_MS = 5 * 60 * 1000;

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

export async function isPinSet(): Promise<boolean> {
  return (await getItemAsync(PIN_HASH_KEY)) !== null;
}

export async function setPin(pin: string): Promise<void> {
  const salt = await randomHex(16);
  const hash = await hashPin(pin, salt);
  await setItemAsync(PIN_SALT_KEY, salt);
  await setItemAsync(PIN_HASH_KEY, hash);
  await setItemAsync(FAILURES_KEY, '0');
  await deleteItemAsync(LOCKED_UNTIL_KEY);
}

export async function getRemainingLockoutMs(): Promise<number> {
  const raw = await getItemAsync(LOCKED_UNTIL_KEY);
  if (!raw) {
    return 0;
  }
  const remaining = Number.parseInt(raw, 10) - Date.now();
  if (remaining > 0) {
    return remaining;
  }
  await deleteItemAsync(LOCKED_UNTIL_KEY);
  await setItemAsync(FAILURES_KEY, '0');
  return 0;
}

export type PinVerification =
  | { status: 'success' }
  | { status: 'invalid'; attemptsLeft: number }
  | { status: 'locked'; remainingMs: number };

export async function verifyPin(pin: string): Promise<PinVerification> {
  const remaining = await getRemainingLockoutMs();
  if (remaining > 0) {
    return { status: 'locked', remainingMs: remaining };
  }

  const hash = await getItemAsync(PIN_HASH_KEY);
  const salt = await getItemAsync(PIN_SALT_KEY);
  if (!hash || !salt) {
    return { status: 'invalid', attemptsLeft: MAX_FAILED_ATTEMPTS };
  }

  const candidate = await hashPin(pin, salt);
  if (candidate === hash) {
    await setItemAsync(FAILURES_KEY, '0');
    return { status: 'success' };
  }

  const failures =
    Number.parseInt((await getItemAsync(FAILURES_KEY)) ?? '0', 10) + 1;
  if (failures >= MAX_FAILED_ATTEMPTS) {
    await setItemAsync(LOCKED_UNTIL_KEY, String(Date.now() + LOCKOUT_MS));
    await setItemAsync(FAILURES_KEY, '0');
    return { status: 'locked', remainingMs: LOCKOUT_MS };
  }
  await setItemAsync(FAILURES_KEY, String(failures));
  return { status: 'invalid', attemptsLeft: MAX_FAILED_ATTEMPTS - failures };
}

export async function hasHardwareBiometrics(): Promise<boolean> {
  const cached = await getItemAsync(HARDWARE_KEY);
  if (cached !== null) return cached === 'true';
  const has = await LocalAuth.hasHardwareAsync();
  await setItemAsync(HARDWARE_KEY, String(has));
  return has;
}

export async function isBiometricEnabled(): Promise<boolean> {
  return (await getItemAsync(BIOMETRIC_KEY)) === 'true';
}

export async function enableBiometric(): Promise<boolean> {
  const has = await hasHardwareBiometrics();
  if (!has) return false;
  const enrolled = await LocalAuth.isEnrolledAsync();
  if (!enrolled) return false;
  await setItemAsync(BIOMETRIC_KEY, 'true');
  return true;
}

export async function disableBiometric(): Promise<void> {
  await deleteItemAsync(BIOMETRIC_KEY);
}

export async function authenticateWithBiometric(): Promise<boolean> {
  const enabled = await isBiometricEnabled();
  if (!enabled) return false;
  try {
    const result = await LocalAuth.authenticateAsync({
      promptMessage: 'Autenticar no Calculadora',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

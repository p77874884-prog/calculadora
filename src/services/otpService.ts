import AsyncStorage from '@react-native-async-storage/async-storage';
import { decryptText, deriveKeyAsync, encryptText, randomHex } from '../utils/crypto';

const OTP_SALT_KEY = 'calculadora.otp.salt';
const OTP_DB_KEY = 'calculadora.otp.db';

let sessionKey: string | null = null;

interface OTPRecord {
  phone: string;
  code: string;
  createdAt: number;
  attempts: number;
  verified: boolean;
}

const CODE_LENGTH = 6;
const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const BACKEND_URL = 'http://192.168.1.3:3001';

function isBackendConfigured(): boolean {
  return BACKEND_URL.length > 0;
}

function generateCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

async function loadDB(): Promise<OTPRecord | null> {
  if (!sessionKey) return null;
  const raw = await AsyncStorage.getItem(OTP_DB_KEY);
  if (!raw) return null;
  try {
    const decrypted = await decryptText(raw, sessionKey);
    return JSON.parse(decrypted) as OTPRecord;
  } catch {
    return null;
  }
}

async function persistDB(record: OTPRecord): Promise<void> {
  if (!sessionKey) throw new Error('OTP database is locked');
  const ciphertext = await encryptText(JSON.stringify(record), sessionKey);
  await AsyncStorage.setItem(OTP_DB_KEY, ciphertext);
}

export async function initOTP(pin: string): Promise<void> {
  let salt = await AsyncStorage.getItem(OTP_SALT_KEY);
  if (!salt) {
    salt = await randomHex(16);
    await AsyncStorage.setItem(OTP_SALT_KEY, salt);
  }
  sessionKey = await deriveKeyAsync(pin, salt);
}

export async function closeOTP(): Promise<void> {
  sessionKey = null;
}

export interface SendResult {
  code?: string;
  expiresIn: number;
}

export async function sendOTP(phone: string): Promise<SendResult> {
  if (isBackendConfigured()) {
    const res = await fetch(`${BACKEND_URL}/api/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!data.ok) {
      if (data.status === 'not_authorized') {
        throw new Error('NOT_AUTHORIZED');
      }
      throw new Error(data.error || 'Falha ao enviar SMS');
    }
    return { expiresIn: CODE_TTL_MS };
  }

  const code = generateCode();
  const record: OTPRecord = {
    phone,
    code,
    createdAt: Date.now(),
    attempts: 0,
    verified: false,
  };
  await persistDB(record);
  return { code, expiresIn: CODE_TTL_MS };
}

export async function verifyOTP(phone: string, code: string): Promise<{
  status: 'success' | 'invalid' | 'expired' | 'max_attempts' | 'not_found';
  remainingMs?: number;
}> {
  if (isBackendConfigured()) {
    const res = await fetch(`${BACKEND_URL}/api/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    if (data.ok && data.status === 'approved') {
      return { status: 'success' };
    }
    return { status: 'invalid', remainingMs: CODE_TTL_MS };
  }

  const record = await loadDB();
  if (!record || record.phone !== phone) {
    return { status: 'not_found' };
  }

  if (record.verified) {
    return { status: 'success' };
  }

  const elapsed = Date.now() - record.createdAt;
  if (elapsed > CODE_TTL_MS) {
    return { status: 'expired', remainingMs: 0 };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return { status: 'max_attempts' };
  }

  if (record.code !== code) {
    record.attempts += 1;
    await persistDB(record);
    return {
      status: 'invalid',
      remainingMs: CODE_TTL_MS - elapsed,
    };
  }

  record.verified = true;
  await persistDB(record);
  return { status: 'success' };
}

export async function isOTPVerified(phone: string): Promise<boolean> {
  const record = await loadDB();
  return record?.phone === phone && record?.verified === true;
}

export async function resendOTP(phone: string): Promise<SendResult> {
  return sendOTP(phone);
}

export function formatPhoneDisplay(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  return raw;
}

export function isUsingRealSMS(): boolean {
  return isBackendConfigured();
}

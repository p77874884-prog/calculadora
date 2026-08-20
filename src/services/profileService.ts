import AsyncStorage from '@react-native-async-storage/async-storage';
import { decryptText, deriveKeyAsync, encryptText, randomHex } from '../utils/crypto';
import {
  deleteItemAsync,
  getItemAsync,
  setItemAsync,
} from '../utils/secureStorage';

const PROFILE_SALT_KEY = 'calculadora.profile.salt';
const PROFILE_DB_KEY = 'calculadora.profile.data';

export interface UserProfile {
  name: string;
  phone: string;
  avatarUri: string | null;
  status: string;
  createdAt: number;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Eu',
  phone: '',
  avatarUri: null,
  status: 'Disponivel',
  createdAt: 0,
};

let sessionKey: string | null = null;

export async function openProfile(pin: string): Promise<void> {
  let salt = await AsyncStorage.getItem(PROFILE_SALT_KEY);
  if (!salt) {
    salt = await randomHex(16);
    await AsyncStorage.setItem(PROFILE_SALT_KEY, salt);
  }
  sessionKey = await deriveKeyAsync(pin, salt);
}

export async function closeProfile(): Promise<void> {
  sessionKey = null;
}

async function loadProfileData(): Promise<UserProfile> {
  if (!sessionKey) return DEFAULT_PROFILE;
  const raw = await AsyncStorage.getItem(PROFILE_DB_KEY);
  if (!raw) return DEFAULT_PROFILE;
  try {
    const decrypted = await decryptText(raw, sessionKey);
    return JSON.parse(decrypted) as UserProfile;
  } catch {
    return DEFAULT_PROFILE;
  }
}

async function persistProfileData(profile: UserProfile): Promise<void> {
  if (!sessionKey) throw new Error('Profile database is locked');
  const ciphertext = await encryptText(JSON.stringify(profile), sessionKey);
  await AsyncStorage.setItem(PROFILE_DB_KEY, ciphertext);
}

export async function getProfile(): Promise<UserProfile> {
  return loadProfileData();
}

export async function updateProfile(
  updates: Partial<UserProfile>,
): Promise<UserProfile> {
  const current = await loadProfileData();
  const merged = {
    ...current,
    ...updates,
    createdAt: current.createdAt || Date.now(),
  };
  await persistProfileData(merged);
  return merged;
}

export async function setAvatar(base64Uri: string): Promise<UserProfile> {
  return updateProfile({ avatarUri: base64Uri });
}

export async function removeAvatar(): Promise<UserProfile> {
  return updateProfile({ avatarUri: null });
}

export async function setProfileName(name: string): Promise<UserProfile> {
  return updateProfile({ name });
}

export async function setProfileStatus(status: string): Promise<UserProfile> {
  return updateProfile({ status });
}

export async function hasProfile(): Promise<boolean> {
  return (await getItemAsync(REGISTERED_KEY)) === 'true';
}

const REGISTERED_KEY = 'calculadora.profile.registered';

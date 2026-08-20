import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { decryptText, deriveKeyAsync, encryptText, randomHex } from '../utils/crypto';
import { loadAll, loadMeta, persistAll, persistMeta } from './messageService';
import { getProfile, updateProfile } from './profileService';

const BACKUP_VERSION = 1;

interface BackupData {
  version: number;
  createdAt: number;
  conversations: Record<string, unknown[]>;
  meta: Record<string, unknown>;
  profile: unknown;
}

export async function exportBackup(pin: string): Promise<boolean> {
  try {
    const conversations = await loadAll();
    const meta = await loadMeta();
    const profile = await getProfile();

    const data: BackupData = {
      version: BACKUP_VERSION,
      createdAt: Date.now(),
      conversations,
      meta,
      profile,
    };

    const salt = await randomHex(16);
    const key = await deriveKeyAsync(pin, salt);
    const encrypted = await encryptText(JSON.stringify(data), key);
    const payload = JSON.stringify({ salt, data: encrypted });

    const date = new Date().toISOString().slice(0, 10);
    const fileName = `calculadora_backup_${date}.calcbackup`;
    const file = new File(Paths.document, fileName);
    file.write(payload);

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar backup',
      });
    }

    Alert.alert('Backup exportado', `Arquivo salvo: ${fileName}`);
    return true;
  } catch {
    Alert.alert('Erro', 'Falha ao exportar backup.');
    return false;
  }
}

export async function importBackup(pin: string, filePath: string): Promise<boolean> {
  try {
    const file = new File(filePath);
    const content = await file.text();
    const { salt, data } = JSON.parse(content);

    if (!salt || !data) {
      Alert.alert('Arquivo invalido', 'O arquivo selecionado nao e um backup valido.');
      return false;
    }

    const key = await deriveKeyAsync(pin, salt);
    const decrypted = await decryptText(data, key);
    const backup: BackupData = JSON.parse(decrypted);

    if (backup.version !== BACKUP_VERSION) {
      Alert.alert('Versao incompativel', 'Este backup e de uma versao diferente.');
      return false;
    }

    await persistAll(backup.conversations as Record<string, never[]>);
    await persistMeta(backup.meta as Record<string, never>);
    if (backup.profile) {
      await updateProfile(backup.profile as Record<string, never>);
    }

    Alert.alert('Backup restaurado', 'Todas as conversas foram restauradas com sucesso.');
    return true;
  } catch {
    Alert.alert('Erro', 'PIN incorreto ou arquivo corrompido.');
    return false;
  }
}

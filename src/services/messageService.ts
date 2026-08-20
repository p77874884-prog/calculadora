import AsyncStorage from '@react-native-async-storage/async-storage';
import { decryptText, deriveKeyAsync, encryptText, randomHex } from '../utils/crypto';

const STORE_KEY = 'calculadora.messages.db';
const SALT_KEY = 'calculadora.messages.salt';
const CHAT_META_KEY = 'calculadora.messages.meta';

export type MessageKind =
  | 'text'
  | 'photo'
  | 'audio'
  | 'video'
  | 'file'
  | 'sticker'
  | 'location'
  | 'contact'
  | 'system';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface MessageReaction {
  emoji: string;
  fromMe: boolean;
  contactId: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  fromMe: boolean;
  kind: MessageKind;
  fileName?: string;
  fileSize?: string;
  duration?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  replyTo?: string;
  replyPreview?: string;
  reactions?: MessageReaction[];
  status: MessageStatus;
  isForwarded?: boolean;
  isStarred?: boolean;
  createdAt: number;
}

export interface ChatMeta {
  pinned: boolean;
  muted: boolean;
  archived: boolean;
  unreadCount: number;
  typing: boolean;
  lastMessageAt: number;
}

type ConversationMap = Record<string, ChatMessage[]>;
type MetaMap = Record<string, ChatMeta>;

let sessionKey: string | null = null;

const MESSAGE_TTL_MS = 24 * 60 * 60 * 1000;

export async function openDatabase(pin: string): Promise<void> {
  let salt = await AsyncStorage.getItem(SALT_KEY);
  if (!salt) {
    salt = await randomHex(16);
    await AsyncStorage.setItem(SALT_KEY, salt);
  }
  sessionKey = await deriveKeyAsync(pin, salt);
}

export async function closeDatabase(): Promise<void> {
  sessionKey = null;
}

export function isDatabaseOpen(): boolean {
  return sessionKey !== null;
}

export async function loadAll(): Promise<ConversationMap> {
  if (!sessionKey) return {};
  const raw = await AsyncStorage.getItem(STORE_KEY);
  if (!raw) return {};
  try {
    const decrypted = await decryptText(raw, sessionKey);
    return JSON.parse(decrypted) as ConversationMap;
  } catch {
    return {};
  }
}

export async function persistAll(conversations: ConversationMap): Promise<void> {
  if (!sessionKey) throw new Error('Database is locked');
  const ciphertext = await encryptText(JSON.stringify(conversations), sessionKey);
  await AsyncStorage.setItem(STORE_KEY, ciphertext);
}

export async function loadMeta(): Promise<MetaMap> {
  if (!sessionKey) return {};
  const raw = await AsyncStorage.getItem(CHAT_META_KEY);
  if (!raw) return {};
  try {
    const decrypted = await decryptText(raw, sessionKey);
    return JSON.parse(decrypted) as MetaMap;
  } catch {
    return {};
  }
}

export async function persistMeta(meta: MetaMap): Promise<void> {
  if (!sessionKey) throw new Error('Database is locked');
  const ciphertext = await encryptText(JSON.stringify(meta), sessionKey);
  await AsyncStorage.setItem(CHAT_META_KEY, ciphertext);
}

export async function getChatMeta(contactId: string): Promise<ChatMeta> {
  const all = await loadMeta();
  return all[contactId] ?? {
    pinned: false,
    muted: false,
    archived: false,
    unreadCount: 0,
    typing: false,
    lastMessageAt: 0,
  };
}

export async function updateChatMeta(
  contactId: string,
  updates: Partial<ChatMeta>,
): Promise<void> {
  const all = await loadMeta();
  all[contactId] = { ...(all[contactId] ?? {}), ...updates } as ChatMeta;
  await persistMeta(all);
}

export async function getMessages(contactId: string): Promise<ChatMessage[]> {
  const all = await loadAll();
  return all[contactId] ?? [];
}

export async function getAllConversations(): Promise<Record<string, ChatMessage[]>> {
  return loadAll();
}

export async function addMessage(
  contactId: string,
  message: Omit<ChatMessage, 'id' | 'createdAt' | 'status'>,
): Promise<ChatMessage[]> {
  const all = await loadAll();
  const list = all[contactId] ?? [];
  const newMsg: ChatMessage = {
    ...message,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'sent',
    createdAt: Date.now(),
  };
  list.push(newMsg);
  all[contactId] = list;
  await persistAll(all);

  const metaAll = await loadMeta();
  metaAll[contactId] = {
    ...(metaAll[contactId] ?? {}),
    lastMessageAt: newMsg.createdAt,
  } as ChatMeta;
  await persistMeta(metaAll);

  if (!message.fromMe) {
    setTimeout(() => {
      simulateDelivery(contactId, newMsg.id).catch(() => {});
    }, 1000);
  }

  return list;
}

export async function addSystemMessage(
  contactId: string,
  text: string,
): Promise<ChatMessage[]> {
  return addMessage(contactId, {
    text,
    fromMe: false,
    kind: 'system',
  });
}

async function simulateDelivery(contactId: string, messageId: string): Promise<void> {
  const all = await loadAll();
  const list = all[contactId];
  if (!list) return;
  const msg = list.find((m) => m.id === messageId);
  if (!msg || msg.fromMe) return;
  msg.status = 'delivered';
  await persistAll(all);

  setTimeout(() => {
    void (async () => {
      const a2 = await loadAll();
      const l2 = a2[contactId];
      if (!l2) return;
      const m2 = l2.find((m) => m.id === messageId);
      if (m2) m2.status = 'read';
      await persistAll(a2);
    })();
  }, 2000);
}

export async function updateMessageStatus(
  contactId: string,
  messageId: string,
  status: MessageStatus,
): Promise<void> {
  const all = await loadAll();
  const list = all[contactId];
  if (!list) return;
  const msg = list.find((m) => m.id === messageId);
  if (!msg) return;
  msg.status = status;
  await persistAll(all);
}

export async function toggleReaction(
  contactId: string,
  messageId: string,
  emoji: string,
): Promise<void> {
  const all = await loadAll();
  const list = all[contactId];
  if (!list) return;
  const msg = list.find((m) => m.id === messageId);
  if (!msg) return;
  if (!msg.reactions) msg.reactions = [];
  const existing = msg.reactions.find((r) => r.emoji === emoji && r.fromMe);
  if (existing) {
    msg.reactions = msg.reactions.filter((r) => !(r.emoji === emoji && r.fromMe));
  } else {
    msg.reactions.push({ emoji, fromMe: true, contactId: 'me' });
  }
  await persistAll(all);
}

export async function toggleStar(contactId: string, messageId: string): Promise<void> {
  const all = await loadAll();
  const list = all[contactId];
  if (!list) return;
  const msg = list.find((m) => m.id === messageId);
  if (msg) msg.isStarred = !msg.isStarred;
  await persistAll(all);
}

export async function deleteMessage(
  contactId: string,
  messageId: string,
): Promise<void> {
  const all = await loadAll();
  const list = all[contactId];
  if (!list) return;
  all[contactId] = list.filter((m) => m.id !== messageId);
  await persistAll(all);
}

export async function clearChat(contactId: string): Promise<void> {
  const all = await loadAll();
  all[contactId] = [];
  await persistAll(all);
}

export async function cleanupExpiredMessages(): Promise<number> {
  const all = await loadAll();
  const now = Date.now();
  let totalRemoved = 0;

  for (const contactId of Object.keys(all)) {
    const before = all[contactId].length;
    all[contactId] = all[contactId].filter(
      (msg) => now - msg.createdAt < MESSAGE_TTL_MS || msg.kind === 'system',
    );
    totalRemoved += before - all[contactId].length;

    if (all[contactId].length === 0) {
      delete all[contactId];
    }
  }

  if (totalRemoved > 0) {
    await persistAll(all);

    const metaAll = await loadMeta();
    for (const contactId of Object.keys(metaAll)) {
      if (!all[contactId]) {
        delete metaAll[contactId];
      }
    }
    await persistMeta(metaAll);
  }

  return totalRemoved;
}

export function getMessageCountdown(createdAt: number): string {
  const elapsed = Date.now() - createdAt;
  const remaining = MESSAGE_TTL_MS - elapsed;
  if (remaining <= 0) return 'Expirando...';
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function generateAutoReply(contactId: string, messageText: string): string {
  const replies: Record<string, string[]> = {
    ana: ['Legal!', 'Vou olhar', 'Beleza', 'Obrigada!', 'Perfeito', 'Depois a gente combina'],
    bruno: ['Certo', 'Vou verificar', 'Beleza', 'Depois te falo', 'Fechado'],
    carla: ['Sim!', 'Com certeza', 'Top!', 'Show', 'Vamos sim'],
    diego: ['Mandou bem!', 'Valeu!', 'Top', 'Beleza', 'Show de bola'],
    elen: ['Amei!', 'Obrigada', 'Lindo!', 'Maravilhoso', 'Que legal'],
    felipe: ['Fechado!', 'Bora!', 'Show', 'Perfeito', 'Combinado'],
    atelie: ['Obrigado pela preferencia!', 'Qualquer duvida, fale conosco', 'Seu pedido esta a caminho'],
    moda: ['Confira nossas novidades!', 'Tem desconto pra voce!', 'Colecao nova disponivel'],
  };
  const pool = replies[contactId] ?? ['Ok', 'Certo', 'Beleza', 'Valeu', '👍'];
  return pool[Math.floor(Math.random() * pool.length)];
}

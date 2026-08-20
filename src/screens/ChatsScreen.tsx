import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import type { TabsNavigationProp } from '../navigation/types';
import { CONTACTS } from '../services/data';
import {
  getAllConversations,
  getChatMeta,
  updateChatMeta,
  type ChatMessage,
} from '../services/messageService';

function formatRelative(timestamp?: number): string {
  if (!timestamp) return '';
  const now = new Date();
  const date = new Date(timestamp);
  if (now.toDateString() === date.toDateString()) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) return 'Ontem';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function messagePreview(message: ChatMessage): string {
  const prefix = message.fromMe ? '' : '';
  switch (message.kind) {
    case 'photo': return `${prefix}📷 Foto`;
    case 'video': return `${prefix}🎬 Video`;
    case 'audio': return `${prefix}🎵 Audio`;
    case 'file': return `${prefix}📎 ${message.fileName ?? 'Anexo'}`;
    case 'system': return message.text;
    case 'location': return `${prefix}📍 Localizacao`;
    case 'sticker': return `${prefix}🏷️ Sticker`;
    default: return `${prefix}${message.text}`;
  }
}

interface ChatItem {
  contactId: string;
  name: string;
  status: string;
  lastMessage?: ChatMessage;
  meta: { pinned: boolean; muted: boolean; archived: boolean; unreadCount: number };
}

export function ChatsScreen() {
  const navigation = useNavigation<TabsNavigationProp<'Chats'>>();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const load = useCallback(async () => {
    const allMessages = await getAllConversations();
    const items: ChatItem[] = [];
    for (const contact of CONTACTS) {
      const msgs = allMessages[contact.id] ?? [];
      const meta = await getChatMeta(contact.id);
      const last = msgs[msgs.length - 1];
      items.push({
        contactId: contact.id,
        name: contact.name,
        status: contact.status,
        lastMessage: last,
        meta: {
          pinned: meta.pinned,
          muted: meta.muted,
          archived: meta.archived,
          unreadCount: meta.unreadCount,
        },
      });
    }
    items.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ?? 0;
      const bTime = b.lastMessage?.createdAt ?? 0;
      if (a.meta.pinned && !b.meta.pinned) return -1;
      if (!a.meta.pinned && b.meta.pinned) return 1;
      return bTime - aTime;
    });
    setChats(items);
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => void load());
    void load();
    return unsub;
  }, [navigation, load]);

  const filtered = chats.filter((c) => {
    const visible = showArchived ? c.meta.archived : !c.meta.archived;
    if (!visible) return false;
    if (query.trim()) {
      return c.name.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  });

  const handleLongPress = (item: ChatItem) => {
    const options = [
      item.meta.pinned ? 'Desafixar' : 'Fixar no topo',
      item.meta.muted ? 'Ativar notificacoes' : 'Silenciar',
      item.meta.archived ? 'Desarquivar' : 'Arquivar',
      'Apagar conversa',
      'Cancelar',
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 4 },
        (i) => {
          if (i === 0) void updateChatMeta(item.contactId, { pinned: !item.meta.pinned }).then(load);
          if (i === 1) void updateChatMeta(item.contactId, { muted: !item.meta.muted }).then(load);
          if (i === 2) void updateChatMeta(item.contactId, { archived: !item.meta.archived }).then(load);
        },
      );
    } else {
      Alert.alert(item.name, '', [
        { text: options[0], onPress: () => void updateChatMeta(item.contactId, { pinned: !item.meta.pinned }).then(load) },
        { text: options[1], onPress: () => void updateChatMeta(item.contactId, { muted: !item.meta.muted }).then(load) },
        { text: options[2], onPress: () => void updateChatMeta(item.contactId, { archived: !item.meta.archived }).then(load) },
        { text: options[3], style: 'destructive' },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  };

  const archivedCount = chats.filter((c) => c.meta.archived).length;

  return (
    <View className="flex-1 bg-[#0B1628]">
      <View className="px-3 pb-1 pt-1">
        <View className="flex-row items-center rounded-xl bg-[#202C33] px-3 py-2">
          <Ionicons name="search" size={16} color="#8696A0" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar ou startar nova conversa"
            placeholderTextColor="#8696A0"
            className="ml-3 flex-1 text-[14px] text-[#D1D7DB]"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#8696A0" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {archivedCount > 0 && !showArchived && (
        <TouchableOpacity
          onPress={() => setShowArchived(true)}
          className="flex-row items-center gap-3 border-b border-[#222D34] px-4 py-3"
        >
          <Ionicons name="archive-outline" size={20} color="#06CF9C" />
          <Text className="text-[15px] text-[#06CF9C]">
            Arquivadas ({archivedCount})
          </Text>
        </TouchableOpacity>
      )}

      {showArchived && (
        <TouchableOpacity
          onPress={() => setShowArchived(false)}
          className="flex-row items-center gap-3 border-b border-[#222D34] px-4 py-3"
        >
          <Ionicons name="arrow-back" size={20} color="#06CF9C" />
          <Text className="text-[15px] text-[#06CF9C]">Voltar</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.contactId}
        renderItem={({ item }) => {
          const last = item.lastMessage;
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('ChatDetail', { contactId: item.contactId })}
              onLongPress={() => handleLongPress(item)}
              className="flex-row items-center gap-3 border-b border-[#222D34] px-4 py-3 active:bg-[#111B21]"
            >
              <Avatar name={item.name} size={50} />
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-[16px] ${item.meta.unreadCount > 0 ? 'font-bold' : 'font-normal'} text-[#E9EDEF]`}
                  >
                    {item.name}
                  </Text>
                  {last && (
                    <Text
                      className={`text-[12px] ${
                        item.meta.unreadCount > 0 ? 'text-[#06CF9C]' : 'text-[#8696A0]'
                      }`}
                    >
                      {formatRelative(last.createdAt)}
                    </Text>
                  )}
                </View>
                <View className="mt-0.5 flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-center gap-1">
                    {last?.fromMe && (
                      <Ionicons
                        name={
                          last.status === 'read'
                            ? 'checkmark-done'
                            : last.status === 'delivered'
                              ? 'checkmark-done'
                              : 'checkmark'
                        }
                        size={16}
                        color={last.status === 'read' ? '#53BDEB' : '#8696A0'}
                      />
                    )}
                    <Text
                      className={`flex-1 text-[13px] ${
                        item.meta.unreadCount > 0 ? 'text-[#D1D7DB]' : 'text-[#8696A0]'
                      }`}
                      numberOfLines={1}
                    >
                      {last ? messagePreview(last) : item.status}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5 ml-2">
                    {item.meta.muted && (
                      <Ionicons name="notifications-off-outline" size={14} color="#8696A0" />
                    )}
                    {item.meta.pinned && (
                      <Ionicons name="pin" size={14} color="#8696A0" />
                    )}
                    {item.meta.unreadCount > 0 && (
                      <View className="h-5 min-w-5 items-center justify-center rounded-full bg-[#06CF9C] px-1.5">
                        <Text className="text-[11px] font-bold text-[#111B21]">
                          {item.meta.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="mt-20 items-center">
            <Ionicons name="chatbubbles-outline" size={60} color="#222D34" />
            <Text className="mt-4 text-[15px] text-[#8696A0]">
              {showArchived ? 'Nenhuma conversa arquivada' : 'Nenhuma conversa ainda'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-[#06CF9C] shadow-lg">
        <Ionicons name="chatbubble-ellipses" size={24} color="#111B21" />
      </TouchableOpacity>
    </View>
  );
}

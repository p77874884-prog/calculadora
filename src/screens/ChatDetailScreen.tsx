import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { MessageBubble } from '../components/MessageBubble';
import type { RootStackParamList } from '../navigation/types';
import { findContact } from '../services/data';
import {
  addMessage,
  deleteMessage,
  generateAutoReply,
  getMessages,
  toggleReaction,
  toggleStar,
  type ChatMessage,
} from '../services/messageService';
import { startCall } from '../services/callService';
import { QUICK_EMOJIS } from '../utils/emojis';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatDetail'> & {
  onLock: () => void;
  onStartCall: (contactId: string, kind: 'voice' | 'video') => void;
};

export function ChatDetailScreen({ route, navigation, onLock, onStartCall }: Props) {
  const { contactId } = route.params;
  const contact = findContact(contactId);
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showEmojiBar, setShowEmojiBar] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const msgs = await getMessages(contactId);
    setMessages(msgs);
  }, [contactId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => void load(), 3000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View className="flex-row items-center gap-2">
          <Avatar name={contact?.name ?? '?'} size={36} />
          <View>
            <Text className="text-[15px] font-bold text-[#E9EDEF]">
              {contact?.name ?? 'Conversa'}
            </Text>
            <Text className="text-[12px] text-[#8696A0]">
              {contact?.status === 'online' ? 'online' : contact?.status ?? ''}
            </Text>
          </View>
        </View>
      ),
      headerRight: () => (
        <View className="flex-row items-center gap-4 mr-2">
          <TouchableOpacity
            onPress={() => {
              startCall(contactId, 'video');
              onStartCall(contactId, 'video');
            }}
            hitSlop={8}
          >
            <Ionicons name="videocam" size={22} color="#AEBAC1" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              startCall(contactId, 'voice');
              onStartCall(contactId, 'voice');
            }}
            hitSlop={8}
          >
            <Ionicons name="call" size={22} color="#AEBAC1" />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={8}>
            <Ionicons name="ellipsis-vertical" size={20} color="#AEBAC1" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, contact?.name, contact?.status, onStartCall, contactId]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setReplyTo(null);
    Keyboard.dismiss();
    const list = await addMessage(contactId, {
      text,
      kind: 'text',
      fromMe: true,
      replyTo: replyTo?.id,
      replyPreview: replyTo?.text,
    });
    setMessages(list);

    setIsTyping(true);
    setTimeout(() => {
      void (async () => {
        const reply = generateAutoReply(contactId, text);
        await addMessage(contactId, { text: reply, kind: 'text', fromMe: false });
        const updated = await getMessages(contactId);
        setMessages(updated);
        setIsTyping(false);
      })();
    }, 1500 + Math.random() * 2000);
  }, [input, contactId, replyTo]);

  const sendPhoto = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const list = await addMessage(contactId, {
        text: result.assets[0].uri,
        kind: 'photo',
        fromMe: true,
      });
      setMessages(list);
    }
  }, [contactId]);

  const sendCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      const list = await addMessage(contactId, {
        text: result.assets[0].uri,
        kind: 'photo',
        fromMe: true,
      });
      setMessages(list);
    }
  }, [contactId]);

  const sendDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const list = await addMessage(contactId, {
          text: file.uri,
          kind: 'file',
          fileName: file.name,
          fileSize: file.size ? `${(file.size / 1024).toFixed(0)} KB` : undefined,
          fromMe: true,
        });
        setMessages(list);
      }
    } catch {}
  }, [contactId]);

  const handleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      await toggleReaction(contactId, messageId, emoji);
      await load();
    },
    [contactId, load],
  );

  const handleLongPress = useCallback((msg: ChatMessage) => {
    setSelectedMsg(msg.id);
    const options = ['Responder', msg.isStarred ? 'Desfavoritar' : 'Favoritar', 'Encaminhar', 'Deletar', 'Cancelar'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 4 },
        (i) => {
          if (i === 0) setReplyTo(msg);
          if (i === 1) void toggleStar(contactId, msg.id).then(() => load());
          if (i === 3) {
            Alert.alert('Deletar mensagem', 'Apagar esta mensagem?', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Apagar',
                style: 'destructive',
                onPress: () => void deleteMessage(contactId, msg.id).then(() => load()),
              },
            ]);
          }
          setSelectedMsg(null);
        },
      );
    } else {
      Alert.alert('Mensagem', '', [
        { text: 'Responder', onPress: () => setReplyTo(msg) },
        { text: msg.isStarred ? 'Desfavoritar' : 'Favoritar', onPress: () => void toggleStar(contactId, msg.id).then(() => load()) },
        { text: 'Encaminhar', onPress: () => {} },
        { text: 'Apagar', style: 'destructive', onPress: () => void deleteMessage(contactId, msg.id).then(() => load()) },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  }, [contactId, load]);

  const handleAttach = useCallback(() => {
    const options = ['Foto', 'Camera', 'Documento', 'Cancelar'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 3 },
        (i) => {
          if (i === 0) void sendPhoto();
          if (i === 1) void sendCamera();
          if (i === 2) void sendDocument();
        },
      );
    } else {
      Alert.alert('Anexo', '', [
        { text: 'Foto', onPress: () => void sendPhoto() },
        { text: 'Camera', onPress: () => void sendCamera() },
        { text: 'Documento', onPress: () => void sendDocument() },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  }, [sendPhoto, sendCamera, sendDocument]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      style={{ backgroundColor: '#0B1628' }}
    >
      <View className="absolute inset-0 bg-[#0B1628]" />

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        className="flex-1 px-2 pt-2"
        contentContainerStyle={{ paddingBottom: 8 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            onReact={handleReaction}
            onLongPress={handleLongPress}
          />
        )}
        ListEmptyComponent={
          <View className="mt-16 items-center rounded-2xl bg-[#182229]/80 p-4 mx-8">
            <Ionicons name="lock-closed" size={24} color="#06CF9C" />
            <Text className="mt-2 text-center text-[13px] text-[#8696A0]">
              Mensagens criptografadas de ponta a ponta. Ninguem fora desta conversa pode ler.
            </Text>
          </View>
        }
        ListFooterComponent={
          isTyping ? (
            <View className="flex-row items-center gap-2 px-3 py-2 ml-1">
              <Avatar name={contact?.name ?? '?'} size={24} />
              <View className="rounded-2xl bg-[#202C33] px-3 py-2">
                <Text className="text-[13px] text-[#8696A0]">digitando...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {replyTo && (
        <View className="mx-3 mb-1 flex-row items-center rounded-xl bg-[#182229] px-3 py-2 border-l-4 border-[#06CF9C]">
          <View className="flex-1">
            <Text className="text-[12px] font-bold text-[#06CF9C]">
              {replyTo.fromMe ? 'Voce' : contact?.name}
            </Text>
            <Text className="text-[12px] text-[#8696A0]" numberOfLines={1}>
              {replyTo.text}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyTo(null)} className="p-1">
            <Ionicons name="close" size={18} color="#AEBAC1" />
          </TouchableOpacity>
        </View>
      )}

      <View
        className="flex-row items-end gap-1.5 bg-[#202C33] px-2 pb-2 pt-1.5"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <TouchableOpacity className="p-2" onPress={handleAttach}>
          <Ionicons name="add-circle-outline" size={26} color="#8696A0" />
        </TouchableOpacity>

        <TouchableOpacity
          className="p-2"
          onPress={() => setShowEmojiBar(!showEmojiBar)}
        >
          <Ionicons
            name={showEmojiBar ? 'keypad-outline' : 'happy-outline'}
            size={24}
            color="#8696A0"
          />
        </TouchableOpacity>

        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Mensagem"
          placeholderTextColor="#8696A0"
          multiline
          className="max-h-32 flex-1 rounded-2xl bg-[#2A3942] px-4 py-2.5 text-[15px] text-[#D1D7DB]"
        />

        <TouchableOpacity
          onPress={() => {
            if (input.trim()) {
              void send();
            } else {
              void sendVoice();
            }
          }}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#06CF9C]"
        >
          <Ionicons
            name={input.trim() ? 'send' : 'mic'}
            size={20}
            color="#111B21"
          />
        </TouchableOpacity>
      </View>

      {showEmojiBar && (
        <View className="flex-row bg-[#202C33] px-3 pb-2 border-t border-[#2A3942]">
          <FlatList
            data={QUICK_EMOJIS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(e) => e}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setInput((prev) => prev + item)}
                className="px-2 py-1"
              >
                <Text className="text-[24px]">{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function sendVoice() {
  Alert.alert('Gravacao de voz', 'Funcao em desenvolvimento 🎤');
}

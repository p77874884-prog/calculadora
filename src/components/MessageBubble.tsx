import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { ChatMessage } from '../services/messageService';
import { getMessageCountdown } from '../services/messageService';
import { REACTION_EMOJIS } from '../utils/emojis';

const MESSAGE_TTL_MS = 24 * 60 * 60 * 1000;

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function StatusIcon({ status }: { status: ChatMessage['status'] }) {
  switch (status) {
    case 'sending':
      return <Ionicons name="time-outline" size={14} color="#8CA3C9" />;
    case 'sent':
      return <Ionicons name="checkmark" size={14} color="#8CA3C9" />;
    case 'delivered':
      return <Ionicons name="checkmark-done" size={14} color="#8CA3C9" />;
    case 'read':
      return <Ionicons name="checkmark-done" size={14} color="#53BDEB" />;
  }
}

interface MessageBubbleProps {
  message: ChatMessage;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (message: ChatMessage) => void;
  onLongPress?: (message: ChatMessage) => void;
}

export function MessageBubble({ message, onReact, onReply, onLongPress }: MessageBubbleProps) {
  const isMine = message.fromMe;
  const isSystem = message.kind === 'system';
  const [showReactions, setShowReactions] = useState(false);

  const elapsed = Date.now() - message.createdAt;
  const remaining = Math.max(0, MESSAGE_TTL_MS - elapsed);
  const progress = remaining / MESSAGE_TTL_MS;
  const barColor = progress > 0.5 ? '#06CF9C' : progress > 0.25 ? '#F59E0B' : '#EF4444';

  if (isSystem) {
    return (
      <View className="my-1 items-center">
        <View className="rounded-full bg-navy-800/80 px-4 py-1.5">
          <Text className="text-[12px] text-white/50">{message.text}</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={() => {
        setShowReactions(!showReactions);
        onLongPress?.(message);
      }}
      onPress={() => setShowReactions(false)}
      className={`mb-0.5 ${isMine ? 'items-end' : 'items-start'}`}
    >
      <View className={`flex-row items-end gap-1 ${isMine ? 'flex-row-reverse' : ''}`}>
        <View
          className={`max-w-[78%] px-2 py-1.5 ${
            isMine
              ? 'rounded-[8px] rounded-br-sm bg-[#005C4B]'
              : 'rounded-[8px] rounded-bl-sm bg-[#202C33]'
          }`}
          style={{
            elevation: 1,
          }}
        >
          {message.isForwarded && (
            <View className="flex-row items-center gap-1 mb-0.5">
              <Ionicons name="arrow-redo-outline" size={11} color="#8CA3C9" />
              <Text className="text-[10px] italic text-[#8696A0]">Encaminhada</Text>
            </View>
          )}

          {message.replyPreview && (
            <View className="mb-1 rounded-md border-l-4 border-[#6B7B8A] bg-[#182229] px-2 py-1">
              <Text className="text-[11px] font-medium text-[#06CF9C]">
                {message.fromMe ? 'Voce' : message.text.slice(0, 20)}
              </Text>
              <Text className="text-[11px] text-[#8696A0]" numberOfLines={1}>
                {message.replyPreview}
              </Text>
            </View>
          )}

          {message.kind === 'text' && (
            <Text className="text-[14.5px] leading-[19px] text-[#E9EDEF]">
              {message.text}
            </Text>
          )}

          {message.kind === 'photo' && (
            <View>
              <View className="h-48 w-56 items-center justify-center rounded-md bg-[#182229]">
                <Ionicons name="image" size={36} color="#06CF9C" />
              </View>
              {message.text ? (
                <Text className="mt-1 text-[14px] text-[#E9EDEF]">{message.text}</Text>
              ) : null}
            </View>
          )}

          {message.kind === 'video' && (
            <View>
              <View className="h-48 w-56 items-center justify-center rounded-md bg-[#182229]">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-black/50">
                  <Ionicons name="play" size={24} color="#fff" />
                </View>
              </View>
              {message.text ? (
                <Text className="mt-1 text-[14px] text-[#E9EDEF]">{message.text}</Text>
              ) : null}
            </View>
          )}

          {message.kind === 'audio' && (
            <View className="w-56">
              <View className="flex-row items-center gap-2">
                <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-[#06CF9C]">
                  <Ionicons name="play" size={18} color="#111B21" />
                </TouchableOpacity>
                <View className="flex-1">
                  <View className="h-1 rounded-full bg-[#374045]" />
                  <View className="absolute left-0 top-0 h-1 w-[40%] rounded-full bg-[#8696A0]" />
                </View>
              </View>
              <View className="mt-0.5 flex-row items-center justify-between">
                <Text className="text-[11px] text-[#8696A0]">{message.duration ?? '0:00'}</Text>
                <Ionicons name="mic" size={10} color="#8696A0" />
              </View>
            </View>
          )}

          {message.kind === 'file' && (
            <View className="w-56 rounded-md bg-[#182229] p-2">
              <View className="flex-row items-center gap-2">
                <View className="h-10 w-10 items-center justify-center rounded-md bg-[#06CF9C]">
                  <Ionicons name="document-text" size={22} color="#111B21" />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-medium text-[#E9EDEF]" numberOfLines={1}>
                    {message.fileName ?? 'Documento'}
                  </Text>
                  <Text className="text-[11px] text-[#8696A0]">{message.fileSize ?? 'PDF'}</Text>
                </View>
              </View>
            </View>
          )}

          {message.kind === 'location' && (
            <View className="w-56">
              <View className="h-36 items-center justify-center rounded-md bg-[#182229]">
                <Ionicons name="location" size={36} color="#06CF9C" />
                <Text className="mt-1 text-[12px] text-[#8696A0]">Localizacao compartilhada</Text>
              </View>
            </View>
          )}

          {message.kind === 'sticker' && (
            <Text className="text-6xl">{message.text}</Text>
          )}

          <View className={`flex-row items-center gap-1 self-end ${isMine ? 'mt-0' : 'mt-0'}`}>
            <Text className="text-[11px] text-[#8696A0]">{formatTime(message.createdAt)}</Text>
            {message.kind !== 'system' && (
              <View className="flex-row items-center gap-0.5">
                <Ionicons name="time-outline" size={10} color="#8696A0" />
                <Text className="text-[9px] text-[#8696A0]">
                  {getMessageCountdown(message.createdAt)}
                </Text>
              </View>
            )}
            {isMine && <StatusIcon status={message.status} />}
          </View>

          {message.kind !== 'system' && (
            <View className="mt-1 h-[3px] w-full rounded-full bg-[#374045]">
              <View
                style={{
                  width: `${Math.max(2, progress * 100)}%`,
                  backgroundColor: barColor,
                }}
                className="h-full rounded-full"
              />
            </View>
          )}
        </View>
      </View>

      {message.reactions && message.reactions.length > 0 && (
        <View className={`flex-row gap-0.5 ${isMine ? 'mr-2' : 'ml-2'}`}>
          {message.reactions.map((r, i) => (
            <View
              key={i}
              className="flex-row items-center rounded-full bg-[#182229] px-1.5 py-0.5 -mb-1"
              style={{ elevation: 2 }}
            >
              <Text className="text-[13px]">{r.emoji}</Text>
            </View>
          ))}
        </View>
      )}

      {showReactions && (
        <View
          className={`flex-row rounded-full bg-[#233138] px-2 py-1.5 mt-1 ${
            isMine ? 'mr-1' : 'ml-1'
          }`}
          style={{ elevation: 4 }}
        >
          {REACTION_EMOJIS.slice(0, 7).map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => {
                onReact?.(message.id, emoji);
                setShowReactions(false);
              }}
              className="px-1"
            >
              <Text className="text-[20px]">{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

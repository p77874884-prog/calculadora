import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { findContact, STATUSES } from '../services/data';

export function StatusScreen() {
  return (
    <ScrollView style={{ backgroundColor: '#0B1628' }}>
      <TouchableOpacity className="flex-row items-center gap-4 px-4 py-4">
        <View className="relative">
          <Avatar name="Meu status" size={52} />
          <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full bg-[#06CF9C]">
            <Ionicons name="add" size={16} color="#111B21" />
          </View>
        </View>
        <View>
          <Text className="text-[16px] font-semibold text-[#E9EDEF]">Meu status</Text>
          <Text className="text-[13px] text-[#8696A0]">Toque para adicionar</Text>
        </View>
      </TouchableOpacity>

      <Text className="px-4 pb-2 pt-4 text-[12px] font-bold uppercase text-[#06CF9C]">
        Atualizacoes recentes
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
        {STATUSES.map((status) => {
          const contact = findContact(status.contactId);
          return (
            <TouchableOpacity key={status.id} className="mr-4 items-center">
              <View
                className={`rounded-full border-2 p-0.5 ${
                  status.seen ? 'border-[#374045]' : 'border-[#06CF9C]'
                }`}
              >
                <Avatar name={contact?.name ?? '?'} size={52} />
              </View>
              <Text
                className="mt-1 max-w-16 text-center text-[12px] text-[#8696A0]"
                numberOfLines={1}
              >
                {contact?.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text className="px-4 pb-2 pt-5 text-[12px] font-bold uppercase text-[#06CF9C]">
        Vistas recentes
      </Text>
      {STATUSES.map((status) => {
        const contact = findContact(status.contactId);
        return (
          <View key={status.id} className="flex-row items-center gap-3 border-b border-[#222D34] px-4 py-3">
            <Avatar name={contact?.name ?? '?'} size={44} />
            <View className="flex-1">
              <Text className="text-[14px] text-[#E9EDEF]">{contact?.name}</Text>
              <Text className="text-[12px] text-[#8696A0]">{status.caption}</Text>
            </View>
            <Ionicons name="eye" size={16} color="#8696A0" />
          </View>
        );
      })}
    </ScrollView>
  );
}

import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { CALLS, findContact } from '../services/data';
import { startCall, type CallKind } from '../services/callService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type IconName = keyof typeof Ionicons.glyphMap;

export function CallsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleCall = (contactId: string, kind: CallKind) => {
    startCall(contactId, kind);
    navigation.navigate('Call', { contactId, kind });
  };

  return (
    <FlatList
      data={CALLS}
      keyExtractor={(call) => call.id}
      style={{ backgroundColor: '#0B1628' }}
      renderItem={({ item }) => {
        const contact = findContact(item.contactId);
        const directionIcon: IconName =
          item.direction === 'outgoing' ? 'arrow-up-outline' : 'arrow-down-outline';
        const directionColor = item.direction === 'missed' ? '#EA4335' : '#06CF9C';
        const directionLabel =
          item.direction === 'missed'
            ? 'Perdida'
            : item.direction === 'outgoing'
              ? 'Efetuada'
              : 'Recebida';
        return (
          <View className="flex-row items-center gap-3 border-b border-[#222D34] px-4 py-3">
            <Avatar name={contact?.name ?? '?'} size={48} />
            <View className="flex-1">
              <Text className="text-[15px] font-medium text-[#E9EDEF]">{contact?.name}</Text>
              <View className="mt-0.5 flex-row items-center gap-1">
                <Ionicons name={directionIcon} size={14} color={directionColor} />
                <Text className="text-[12px] text-[#8696A0]">
                  {directionLabel} · {item.at}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => handleCall(item.contactId, 'voice')}
                className="h-9 w-9 items-center justify-center rounded-full bg-[#202C33]"
              >
                <Ionicons name="call" size={16} color="#06CF9C" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleCall(item.contactId, 'video')}
                className="h-9 w-9 items-center justify-center rounded-full bg-[#202C33]"
              >
                <Ionicons name="videocam" size={16} color="#06CF9C" />
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    />
  );
}

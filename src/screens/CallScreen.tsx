import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { findContact } from '../services/data';
import {
  endCall,
  getCurrentCall,
  getCallDuration,
  subscribeToCalls,
  type ActiveCall,
  type CallKind,
} from '../services/callService';

interface CallScreenProps {
  contactId: string;
  kind: CallKind;
  onEnd: () => void;
}

export function CallScreen({ contactId, kind, onEnd }: CallScreenProps) {
  const insets = useSafeAreaInsets();
  const contact = findContact(contactId);
  const [call, setCall] = useState<ActiveCall | null>(getCurrentCall());
  const [, setTick] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const unsub = subscribeToCalls((c) => {
      setCall(c);
      if (c?.state === 'ended') setTimeout(onEnd, 1500);
    });
    return unsub;
  }, [onEnd]);

  useEffect(() => {
    if (call?.state === 'active') {
      tickRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [call?.state]);

  const handleEnd = useCallback(() => { endCall(); }, []);

  const stateLabel = (() => {
    if (!call) return '';
    switch (call.state) {
      case 'ringing': return 'Chamando...';
      case 'active': return getCallDuration(call.startedAt);
      case 'ended': return 'Chamada encerrada';
      default: return '';
    }
  })();

  return (
    <View className="flex-1 items-center" style={{ backgroundColor: '#0B1628' }}>
      <View className="flex-1 items-center justify-center" style={{ paddingTop: insets.top }}>
        <View className="mb-6">
          <Avatar name={contact?.name ?? '?'} size={120} />
        </View>
        <Text className="mb-1 text-[22px] font-bold text-[#E9EDEF]">
          {contact?.name ?? 'Desconhecido'}
        </Text>
        <Text className="mb-2 text-[14px] text-[#8696A0]">
          {kind === 'video' ? 'Videochamada' : 'Chamada de voz'}
        </Text>
        <Text className={`text-[17px] ${
          call?.state === 'active' ? 'text-[#06CF9C]' : call?.state === 'ended' ? 'text-[#EA4335]' : 'text-[#8696A0]'
        }`}>
          {stateLabel}
        </Text>
        {call?.state === 'ringing' && (
          <View className="mt-4 h-24 w-24 items-center justify-center rounded-full bg-[#202C33]/50">
            <Ionicons name={kind === 'video' ? 'videocam' : 'call'} size={40} color="#06CF9C" />
          </View>
        )}
      </View>

      <View className="mb-12 flex-row items-center gap-6" style={{ paddingBottom: insets.bottom }}>
        <TouchableOpacity className="h-14 w-14 items-center justify-center rounded-full bg-[#202C33]">
          <Ionicons name="mic-off" size={24} color="#E9EDEF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleEnd}
          className="h-16 w-16 items-center justify-center rounded-full bg-[#EA4335]"
        >
          <Ionicons name="call" size={30} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
        <TouchableOpacity className="h-14 w-14 items-center justify-center rounded-full bg-[#202C33]">
          <Ionicons name="volume-high" size={24} color="#E9EDEF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

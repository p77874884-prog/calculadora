import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  formatPhoneDisplay,
  isUsingRealSMS,
  resendOTP,
  sendOTP,
  verifyOTP,
} from '../services/otpService';
import { registerPhone } from '../services/phoneAuthService';
import { updateProfile } from '../services/profileService';

interface VerifyScreenProps {
  phone: string;
  name: string;
  onVerified: () => void;
  onBack: () => void;
}

export function VerifyScreen({ phone, name, onVerified, onBack }: VerifyScreenProps) {
  const insets = useSafeAreaInsets();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [sending, setSending] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);
  const CODE_LENGTH = 6;

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  useEffect(() => {
    void (async () => {
      try {
        const result = await sendOTP(phone);
        if (isUsingRealSMS()) {
          Alert.alert(
            'Codigo enviado',
            `Um codigo de ${CODE_LENGTH} digitos foi enviado via SMS para ${formatPhoneDisplay(phone)}.`,
          );
        } else {
          Alert.alert(
            'Codigo enviado (Demo)',
            `Um codigo de ${CODE_LENGTH} digitos foi enviado para ${formatPhoneDisplay(phone)}.\n\nDemo: ${result.code}`,
          );
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'NOT_AUTHORIZED') {
          Alert.alert('Acesso nao autorizado', 'Seu numero nao esta autorizado a usar o app. Entre em contato com o administrador.');
          onBack();
        } else {
          Alert.alert('Erro', 'Falha ao enviar SMS. Tente novamente.');
          onBack();
        }
      }
    })();
  }, [phone]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) text = text.slice(-1);
    if (!/^\d*$/.test(text)) return;

    const newDigits = [...digits];
    newDigits[index] = text;
    setDigits(newDigits);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== '') && newDigits.join('').length === 6) {
      void handleVerify(newDigits.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
    }
  };

  const handleVerify = useCallback(
    async (code?: string) => {
      const otp = code ?? digits.join('');
      if (otp.length !== 6) {
        Alert.alert('Codigo incompleto', 'Digite os 6 digitos do codigo.');
        return;
      }
      setLoading(true);
      try {
        const result = await verifyOTP(phone, otp);
        switch (result.status) {
          case 'success':
            await registerPhone(phone);
            await updateProfile({ name, phone, createdAt: Date.now() });
            onVerified();
            break;
          case 'invalid':
            Alert.alert('Codigo invalido', 'O codigo digitado esta incorreto. Tente novamente.');
            setDigits(['', '', '', '', '', '']);
            inputs.current[0]?.focus();
            break;
          case 'expired':
            Alert.alert('Codigo expirado', 'Solicite um novo codigo.');
            setResendTimer(0);
            break;
          case 'max_attempts':
            Alert.alert('Muitas tentativas', 'Aguarde e solicite um novo codigo.');
            setResendTimer(60);
            break;
          default:
            Alert.alert('Erro', 'Nao foi possivel verificar. Tente novamente.');
        }
      } catch {
        Alert.alert('Erro', 'Falha na verificacao.');
      } finally {
        setLoading(false);
      }
    },
    [digits, phone, name, onVerified],
  );

  const handleResend = async () => {
    if (resendTimer > 0 || sending) return;
    setSending(true);
    try {
      const result = await resendOTP(phone);
      setResendTimer(60);
      if (isUsingRealSMS()) {
        Alert.alert(
          'Codigo reenviado',
          `Novo codigo enviado via SMS para ${formatPhoneDisplay(phone)}.`,
        );
      } else {
        Alert.alert(
          'Codigo reenviado (Demo)',
          `Novo codigo enviado para ${formatPhoneDisplay(phone)}.\n\nDemo: ${result.code}`,
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'NOT_AUTHORIZED') {
        Alert.alert('Acesso nao autorizado', 'Seu numero nao esta autorizado.');
        onBack();
      } else {
        Alert.alert('Erro', 'Nao foi possivel reenviar.');
      }
    } finally {
      setSending(false);
    }
  };

  const filledCount = digits.filter((d) => d !== '').length;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-navy-950"
    >
      <View
        className="flex-1 items-center px-8"
        style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom }}
      >
        <TouchableOpacity onPress={onBack} className="absolute left-4 top-4 z-10 p-2">
          <Ionicons name="arrow-back" size={24} color="#D4AF37" />
        </TouchableOpacity>

        <View className="mb-6 h-16 w-16 items-center justify-center rounded-full bg-navy-800">
          <Ionicons name="chatbubble-ellipses" size={32} color="#D4AF37" />
        </View>

        <Text className="mb-2 text-center text-2xl font-bold text-white">
          Verificar numero
        </Text>
        <Text className="mb-1 text-center text-sm text-white/50">
          Digite o codigo de verificacao enviado para
        </Text>
        <Text className="mb-8 text-center text-sm font-semibold text-gold-text">
          {formatPhoneDisplay(phone)}
        </Text>

        <View className="mb-8 flex-row justify-center gap-3">
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              value={digit}
              onChangeText={(t) => handleChange(t, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={i === 0}
              selectTextOnFocus
              className={`h-14 w-12 items-center justify-center rounded-xl text-center text-2xl font-bold ${
                digit ? 'border-2 border-gold bg-navy-800 text-white' : 'border border-navy-600 bg-navy-800 text-white'
              }`}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={() => void handleVerify()}
          disabled={loading || filledCount < 6}
          className={`w-full items-center rounded-2xl py-4 ${
            filledCount >= 6 && !loading ? 'bg-gold' : 'bg-navy-700'
          }`}
        >
          <Text
            className={`text-base font-bold ${
              filledCount >= 6 && !loading ? 'text-navy-950' : 'text-white/40'
            }`}
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </Text>
        </TouchableOpacity>

        <View className="mt-6 flex-row items-center gap-1">
          <Text className="text-sm text-white/40">Nao recebeu o codigo? </Text>
          <TouchableOpacity
            onPress={() => void handleResend()}
            disabled={resendTimer > 0 || sending}
          >
            <Text
              className={`text-sm font-semibold ${
                resendTimer > 0 ? 'text-white/30' : 'text-gold-text'
              }`}
            >
              {resendTimer > 0 ? `Reenviar em ${resendTimer}s` : 'Reenviar'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="mt-8 text-center text-xs text-white/30">
          O codigo expira em 5 minutos
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

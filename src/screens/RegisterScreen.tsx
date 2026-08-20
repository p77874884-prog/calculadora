import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
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
import { VerifyScreen } from './VerifyScreen';

interface RegisterScreenProps {
  onRegistered: () => void;
}

export function RegisterScreen({ onRegistered }: RegisterScreenProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'phone' | 'name' | 'verify'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');

  const phoneDigits = phone.replace(/\D/g, '');

  const formatDisplay = (raw: string): string => {
    const d = raw.replace(/\D/g, '');
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  };

  const handlePhoneSubmit = () => {
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      Alert.alert('Numero invalido', 'Digite um numero de celular valido com DDD.');
      return;
    }
    setStep('name');
  };

  const handleNameSubmit = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      Alert.alert('Nome invalido', 'Digite seu nome completo.');
      return;
    }
    setStep('verify');
  };

  if (step === 'verify') {
    const formatted = phoneDigits.length === 11 ? `+55${phoneDigits}` : `+55${phoneDigits}`;
    return (
      <VerifyScreen
        phone={formatted}
        name={name.trim()}
        onVerified={onRegistered}
        onBack={() => setStep('name')}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-navy-950"
    >
      <View
        className="flex-1 items-center justify-center px-8"
        style={{ paddingBottom: insets.bottom }}
      >
        <View className="mb-8 h-20 w-20 items-center justify-center rounded-full bg-navy-800">
          <Ionicons name="calculator" size={40} color="#D4AF37" />
        </View>

        {step === 'phone' ? (
          <>
            <Text className="mb-2 text-center text-2xl font-bold text-white">
              Bem-vindo ao Calculadora
            </Text>
            <Text className="mb-8 text-center text-sm text-white/50">
              Para continuar, cadastre seu numero de celular.
            </Text>

            <View className="mb-6 w-full flex-row items-center rounded-2xl bg-navy-800 px-4">
              <Text className="py-3 text-lg text-white/60">+55</Text>
              <View className="mx-2 h-6 w-px bg-white/20" />
              <TextInput
                value={formatDisplay(phone)}
                onChangeText={(text) => setPhone(text)}
                placeholder="(00) 00000-0000"
                placeholderTextColor="#8CA3C9"
                keyboardType="phone-pad"
                maxLength={16}
                className="flex-1 py-3 text-lg text-white"
              />
            </View>

            <TouchableOpacity
              onPress={handlePhoneSubmit}
              disabled={phoneDigits.length < 10}
              className={`w-full items-center rounded-2xl py-4 ${
                phoneDigits.length >= 10 ? 'bg-gold' : 'bg-navy-700'
              }`}
            >
              <Text
                className={`text-base font-bold ${
                  phoneDigits.length >= 10 ? 'text-navy-950' : 'text-white/40'
                }`}
              >
                Continuar
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="mb-2 text-center text-2xl font-bold text-white">
              Qual seu nome?
            </Text>
            <Text className="mb-8 text-center text-sm text-white/50">
              Seu nome aparecera para seus contatos.
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nome completo"
              placeholderTextColor="#8CA3C9"
              autoCapitalize="words"
              className="mb-6 w-full rounded-2xl bg-navy-800 px-4 py-3.5 text-lg text-white"
            />

            <TouchableOpacity
              onPress={handleNameSubmit}
              disabled={name.trim().length < 2}
              className={`w-full items-center rounded-2xl py-4 ${
                name.trim().length >= 2 ? 'bg-gold' : 'bg-navy-700'
              }`}
            >
              <Text
                className={`text-base font-bold ${
                  name.trim().length >= 2 ? 'text-navy-950' : 'text-white/40'
                }`}
              >
                Verificar numero
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep('phone')} className="mt-4 p-2">
              <Text className="text-sm text-gold-text">Voltar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

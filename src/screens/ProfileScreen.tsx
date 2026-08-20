import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import {
  authenticateWithBiometric,
  disableBiometric,
  enableBiometric,
  hasHardwareBiometrics,
  isBiometricEnabled,
} from '../services/authService';
import { exportBackup, importBackup } from '../services/backupService';
import { getPhoneFormatted } from '../services/phoneAuthService';
import {
  getProfile,
  removeAvatar,
  setAvatar,
  setProfileName,
  setProfileStatus,
  type UserProfile,
} from '../services/profileService';

export function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'export' | 'import'>('export');
  const [pinInput, setPinInput] = useState('');

  const load = useCallback(async () => {
    const [p, ph, bioAvail, bioEn] = await Promise.all([
      getProfile(),
      getPhoneFormatted(),
      hasHardwareBiometrics(),
      isBiometricEnabled(),
    ]);
    setProfile(p);
    setPhone(ph);
    setNameInput(p.name);
    setStatusInput(p.status);
    setBioAvailable(bioAvail);
    setBioEnabled(bioEn);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissao negada', 'Permita o acesso as fotos nas configuracoes.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      const updated = await setAvatar(result.assets[0].uri);
      setProfile(updated);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissao negada', 'Permita o acesso a camera nas configuracoes.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      const updated = await setAvatar(result.assets[0].uri);
      setProfile(updated);
    }
  };

  const handleAvatarPress = () => {
    Alert.alert('Foto de perfil', 'Escolha uma opcao', [
      { text: 'Tirar foto', onPress: () => void takePhoto() },
      { text: 'Escolher da galeria', onPress: () => void pickImage() },
      ...(profile?.avatarUri
        ? [
            {
              text: 'Remover foto',
              style: 'destructive' as const,
              onPress: async () => {
                const updated = await removeAvatar();
                setProfile(updated);
              },
            },
          ]
        : []),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  };

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (trimmed.length < 2) {
      Alert.alert('Nome invalido', 'O nome deve ter pelo menos 2 caracteres.');
      return;
    }
    const updated = await setProfileName(trimmed);
    setProfile(updated);
    setEditingName(false);
  };

  const saveStatus = async () => {
    const updated = await setProfileStatus(statusInput.trim() || 'Disponivel');
    setProfile(updated);
    setEditingStatus(false);
  };

  const toggleBiometric = async () => {
    if (bioEnabled) {
      await disableBiometric();
      setBioEnabled(false);
    } else {
      const auth = await authenticateWithBiometric();
      if (auth) {
        const ok = await enableBiometric();
        setBioEnabled(ok);
        if (!ok) {
          Alert.alert('Indisponivel', 'Nao foi possivel ativar a biometria.');
        }
      }
    }
  };

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-navy-950">
        <Text className="text-white/40">Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-navy-950">
      <View className="items-center pb-6 pt-4" style={{ paddingTop: insets.top + 8 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="absolute left-4 top-4 z-10 p-2">
          <Ionicons name="arrow-back" size={24} color="#D4AF37" />
        </TouchableOpacity>

        <Text className="mb-6 text-lg font-bold text-white">Meu Perfil</Text>

        <TouchableOpacity onPress={handleAvatarPress} className="relative mb-4">
          <Avatar name={profile.name} size={100} uri={profile.avatarUri} />
          <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-gold">
            <Ionicons name="camera" size={16} color="#0B132B" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleAvatarPress}>
          <Text className="text-sm text-gold-text">Alterar foto</Text>
        </TouchableOpacity>
      </View>

      <View className="px-6">
        <Text className="mb-2 text-xs font-bold uppercase text-white/40">Informacoes</Text>

        <View className="mb-3 rounded-2xl bg-navy-800 px-4 py-3">
          <Text className="mb-1 text-xs text-white/40">Nome</Text>
          {editingName ? (
            <View className="flex-row items-center gap-2">
              <TextInput value={nameInput} onChangeText={setNameInput} autoFocus className="flex-1 text-base text-white" />
              <TouchableOpacity onPress={() => void saveName()} className="p-1">
                <Ionicons name="checkmark-circle" size={28} color="#D4AF37" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setEditingName(false); setNameInput(profile.name); }}
                className="p-1"
              >
                <Ionicons name="close-circle" size={28} color="#8CA3C9" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingName(true)}>
              <Text className="text-base text-white">{profile.name}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="mb-3 rounded-2xl bg-navy-800 px-4 py-3">
          <Text className="mb-1 text-xs text-white/40">Telefone</Text>
          <Text className="text-base text-white">{phone ?? 'Nao informado'}</Text>
        </View>

        <View className="mb-3 rounded-2xl bg-navy-800 px-4 py-3">
          <Text className="mb-1 text-xs text-white/40">Status</Text>
          {editingStatus ? (
            <View className="flex-row items-center gap-2">
              <TextInput
                value={statusInput}
                onChangeText={setStatusInput}
                autoFocus
                placeholder="Defina seu status"
                placeholderTextColor="#8CA3C9"
                className="flex-1 text-base text-white"
              />
              <TouchableOpacity onPress={() => void saveStatus()} className="p-1">
                <Ionicons name="checkmark-circle" size={28} color="#D4AF37" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setEditingStatus(false); setStatusInput(profile.status); }}
                className="p-1"
              >
                <Ionicons name="close-circle" size={28} color="#8CA3C9" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingStatus(true)}>
              <Text className="text-base text-white">{profile.status}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text className="mb-2 mt-4 text-xs font-bold uppercase text-white/40">Seguranca</Text>

        {bioAvailable && (
          <TouchableOpacity
            onPress={() => void toggleBiometric()}
            className="mb-3 flex-row items-center justify-between rounded-2xl bg-navy-800 px-4 py-3"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="finger-print" size={22} color="#D4AF37" />
              <View>
                <Text className="text-base text-white">Biometria</Text>
                <Text className="text-xs text-white/40">
                  {bioEnabled ? 'Ativada' : 'Desativada'}
                </Text>
              </View>
            </View>
            <View
              className={`h-7 w-12 items-center justify-center rounded-full ${
                bioEnabled ? 'bg-gold' : 'bg-navy-600'
              }`}
            >
              <View
                className={`h-5 w-5 rounded-full bg-white ${bioEnabled ? 'ml-5' : 'ml-1'}`}
              />
            </View>
          </TouchableOpacity>
        )}

        <Text className="mb-2 mt-4 text-xs font-bold uppercase text-white/40">Backup</Text>

        <TouchableOpacity
          onPress={() => { setPinModalMode('export'); setPinInput(''); setPinModalVisible(true); }}
          className="mb-3 flex-row items-center gap-3 rounded-2xl bg-navy-800 px-4 py-3"
        >
          <Ionicons name="cloud-upload-outline" size={22} color="#D4AF37" />
          <View className="flex-1">
            <Text className="text-base text-white">Exportar backup</Text>
            <Text className="text-xs text-white/40">Salvar conversas criptografadas</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8CA3C9" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { setPinModalMode('import'); setPinInput(''); setPinModalVisible(true); }}
          className="mb-3 flex-row items-center gap-3 rounded-2xl bg-navy-800 px-4 py-3"
        >
          <Ionicons name="cloud-download-outline" size={22} color="#D4AF37" />
          <View className="flex-1">
            <Text className="text-base text-white">Importar backup</Text>
            <Text className="text-xs text-white/40">Restaurar conversas salvas</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8CA3C9" />
        </TouchableOpacity>

        <View className="mt-8 mb-24 items-center">
          <Text className="text-xs text-white/30">Calculadora v1.0.0 — Criptografia AES-256</Text>
        </View>
      </View>

      <Modal visible={pinModalVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-8">
          <View className="w-full rounded-2xl bg-navy-800 p-6">
            <Text className="mb-2 text-center text-lg font-bold text-white">
              {pinModalMode === 'export' ? 'Exportar backup' : 'Importar backup'}
            </Text>
            <Text className="mb-4 text-center text-sm text-white/50">
              Digite seu PIN de 6 digitos
            </Text>
            <TextInput
              value={pinInput}
              onChangeText={setPinInput}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              autoFocus
              placeholder="000000"
              placeholderTextColor="#8CA3C9"
              className="mb-4 rounded-xl bg-navy-900 px-4 py-3 text-center text-2xl tracking-[8px] text-white"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setPinModalVisible(false)}
                className="flex-1 items-center rounded-xl bg-navy-600 py-3"
              >
                <Text className="text-sm font-bold text-white">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (pinInput.length !== 6) return;
                  setPinModalVisible(false);
                  if (pinModalMode === 'export') {
                    await exportBackup(pinInput);
                  } else {
                    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
                    if (!result.canceled && result.assets[0]) {
                      await importBackup(pinInput, result.assets[0].uri);
                    }
                  }
                  setPinInput('');
                }}
                className="flex-1 items-center rounded-xl bg-gold py-3"
              >
                <Text className="text-sm font-bold text-navy-950">
                  {pinModalMode === 'export' ? 'Exportar' : 'Importar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

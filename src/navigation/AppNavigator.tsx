import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet } from 'react-native';
import { ActivityIndicator, Alert, View } from 'react-native';
import { CallScreen } from '../screens/CallScreen';
import { CalculatorScreen } from '../screens/CalculatorScreen';
import { ChatDetailScreen } from '../screens/ChatDetailScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { authenticateWithBiometric, isBiometricEnabled } from '../services/authService';
import { isPhoneRegistered } from '../services/phoneAuthService';
import { closeDatabase, openDatabase, cleanupExpiredMessages } from '../services/messageService';
import { closeOTP, initOTP } from '../services/otpService';
import { closeProfile, openProfile } from '../services/profileService';
import { seedMessagesIfEmpty } from '../services/seed';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const [unlocked, setUnlocked] = useState(false);
  const [needsRegister, setNeedsRegister] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [activeCall, setActiveCall] = useState<{
    contactId: string;
    kind: 'voice' | 'video';
  } | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);
  const unlockedRef = useRef(unlocked);
  const unlockingRef = useRef(false);

  useEffect(() => {
    unlockedRef.current = unlocked;
  }, [unlocked]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && unlockedRef.current) {
        setNeedsReauth(true);
      }
    });
    return () => subscription.remove();
  }, []);

  const handleReauthSuccess = useCallback(() => {
    setNeedsReauth(false);
  }, []);

  const handleReauthFail = useCallback(async () => {
    setNeedsReauth(false);
    await closeDatabase();
    await closeProfile();
    await closeOTP();
    setUnlocked(false);
    setNeedsRegister(false);
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    void cleanupExpiredMessages();
    const interval = setInterval(() => {
      void cleanupExpiredMessages();
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [unlocked]);

  const handleUnlock = useCallback(async (pin: string) => {
    if (unlockingRef.current) return;
    unlockingRef.current = true;
    setUnlocking(true);
    try {
      await Promise.all([
        openDatabase(pin),
        openProfile(pin),
        initOTP(pin),
      ]);
      const registered = await isPhoneRegistered();
      if (!registered) {
        setNeedsRegister(true);
      } else {
        await seedMessagesIfEmpty();
        setUnlocked(true);
      }
    } catch {
      Alert.alert('Erro', 'Falha ao desbloquear. Tente novamente.');
    } finally {
      unlockingRef.current = false;
      setUnlocking(false);
    }
  }, []);

  const handleRegistered = useCallback(async () => {
    if (unlockingRef.current) return;
    unlockingRef.current = true;
    setUnlocking(true);
    try {
      await seedMessagesIfEmpty();
      setNeedsRegister(false);
      setUnlocked(true);
    } catch {
      Alert.alert('Erro', 'Falha ao finalizar cadastro. Tente novamente.');
    } finally {
      unlockingRef.current = false;
      setUnlocking(false);
    }
  }, []);

  const handleLock = useCallback(async () => {
    await closeDatabase();
    await closeProfile();
    await closeOTP();
    setUnlocked(false);
    setNeedsRegister(false);
  }, []);

  const handleStartCall = useCallback((contactId: string, kind: 'voice' | 'video') => {
    setActiveCall({ contactId, kind });
  }, []);

  const handleEndCall = useCallback(() => {
    setActiveCall(null);
  }, []);

  if (activeCall) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Call">
          {() => (
            <CallScreen
              contactId={activeCall.contactId}
              kind={activeCall.kind}
              onEnd={handleEndCall}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          gestureEnabled: false,
        }}
      >
        {unlocked ? (
          <>
            <Stack.Screen name="Main">
              {() => <MainTabs onLock={handleLock} />}
            </Stack.Screen>
            <Stack.Screen
              name="ChatDetail"
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#111B21' },
                headerTintColor: '#E9EDEF',
                headerTitleStyle: { fontWeight: '700' },
                headerBackButtonDisplayMode: 'minimal',
              }}
            >
              {(props) => (
                <ChatDetailScreen
                  {...props}
                  onLock={handleLock}
                  onStartCall={handleStartCall}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="ProductDetail"
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            >
              {(props) => <ProductDetailScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen
              name="Profile"
              options={{
                headerShown: false,
                animation: 'slide_from_left',
              }}
            >
              {() => <ProfileScreen />}
            </Stack.Screen>
          </>
        ) : needsRegister ? (
          <Stack.Screen name="Register">
            {() => <RegisterScreen onRegistered={handleRegistered} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Calculator">
            {() => <CalculatorScreen onUnlock={handleUnlock} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>

      {unlocking && (
        <View
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: '#0B1628',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color="#06CF9C" />
          </View>
        </View>
      )}

      {needsReauth && !unlocking && (
        <ReauthOverlay
          onSuccess={handleReauthSuccess}
          onFail={handleReauthFail}
        />
      )}
    </View>
  );
}

function ReauthOverlay({ onSuccess, onFail }: { onSuccess: () => void; onFail: () => void }) {
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;
    void (async () => {
      const bio = await isBiometricEnabled();
      if (!bio) {
        onFail();
        return;
      }
      const ok = await authenticateWithBiometric();
      if (ok) {
        onSuccess();
      } else {
        onFail();
      }
    })();
  }, [onSuccess, onFail]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <View
        style={{
          flex: 1,
          backgroundColor: '#0B1628',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#06CF9C" />
      </View>
    </View>
  );
}

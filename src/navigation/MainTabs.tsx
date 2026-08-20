import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity } from 'react-native';
import { CallsScreen } from '../screens/CallsScreen';
import { ChatsScreen } from '../screens/ChatsScreen';
import { MarketplaceScreen } from '../screens/MarketplaceScreen';
import { StatusScreen } from '../screens/StatusScreen';
import type { RootStackParamList, MainTabParamList } from './types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TITLES: Record<keyof MainTabParamList, string> = {
  Chats: 'Ghost#062',
  Calls: 'Ligacoes',
  Status: 'Atualizacoes',
  Marketplace: 'Mercado',
};

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Chats: 'chatbubble-ellipses',
  Calls: 'call',
  Status: 'aperture',
  Marketplace: 'storefront',
};

export function MainTabs({ onLock }: { onLock: () => void }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitle: TITLES[route.name],
        headerStyle: { backgroundColor: '#111B21' },
        headerTintColor: '#E9EDEF',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        tabBarStyle: {
          backgroundColor: '#111B21',
          borderTopColor: '#222D34',
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: '#06CF9C',
        tabBarInactiveTintColor: '#8696A0',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} color={color} size={size} />
        ),
        headerRight: () => (
          <TouchableOpacity onPress={onLock} className="mr-4" hitSlop={8}>
            <Ionicons name="lock-closed" size={20} color="#AEBAC1" />
          </TouchableOpacity>
        ),
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            className="ml-4"
            hitSlop={8}
          >
            <Ionicons name="person-circle" size={26} color="#AEBAC1" />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Calls" component={CallsScreen} />
      <Tab.Screen name="Status" component={StatusScreen} />
      <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
    </Tab.Navigator>
  );
}

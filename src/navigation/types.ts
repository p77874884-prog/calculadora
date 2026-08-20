import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Calculator: undefined;
  Register: undefined;
  Main: undefined;
  Profile: undefined;
  ChatDetail: { contactId: string };
  Call: { contactId: string; kind: 'voice' | 'video' };
  ProductDetail: { productId: string };
};

export type MainTabParamList = {
  Chats: undefined;
  Calls: undefined;
  Status: undefined;
  Marketplace: undefined;
};

export type TabsNavigationProp<T extends keyof MainTabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, T>,
  NativeStackNavigationProp<RootStackParamList>
>;

import './global.css';

import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0B1628',
    card: '#111B21',
    primary: '#06CF9C',
    text: '#E9EDEF',
    border: '#222D34',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={appTheme}>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

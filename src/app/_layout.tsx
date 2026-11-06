import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';
import { Appearance, Platform } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { NavigationFrame } from '@/components/app-navigation';
import { GameProvider } from '@/features/game';
import { PreferencesProvider, usePreferences } from '@/features/preferences';
import { useAppTheme } from '@/hooks/use-app-theme';
export default function Layout() {
  return <PreferencesProvider><ThemedApp /></PreferencesProvider>;
}

function ThemedApp() {
  const reducedMotion = useReducedMotion();
  const { themeMode } = usePreferences();
  const colors = useAppTheme();
  const navigationTheme = useMemo(() => {
    const base = themeMode === 'dark' ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, background: colors.background, card: colors.surface,
      text: colors.text, border: colors.border, primary: colors.primary } };
  }, [themeMode, colors]);
  useEffect(() => {
    if (Platform.OS !== 'web') Appearance.setColorScheme(themeMode);
    void SystemUI.setBackgroundColorAsync(colors.background).catch(error => console.warn('Nie udało się ustawić tła aplikacji.', error));
  }, [themeMode, colors.background]);
  return <ThemeProvider value={navigationTheme}>
    <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
    <GameProvider>
    <NavigationFrame>
      <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.background }, animation: reducedMotion ? 'none' : 'slide_from_right' }}>
        <Stack.Screen name="home" options={{ headerShown: false, animation: reducedMotion ? 'none' : 'fade' }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: 'Mój profil', headerShown: false, animation: reducedMotion ? 'none' : 'fade' }} />
        <Stack.Screen name="grzybdex/index" options={{ title: 'Grzybedex', headerShown: false, animation: reducedMotion ? 'none' : 'fade' }} />
        <Stack.Screen name="grzybdex/[id]" options={{ title: 'Karta grzyba' }} />
        <Stack.Screen name="settings" options={{ title: 'Ustawienia' }} />
        <Stack.Screen name="account" options={{ title: 'Konto' }} />
        <Stack.Screen name="create" options={{ title: 'Nowy pokój' }} />
        <Stack.Screen name="join" options={{ title: 'Dołącz kodem' }} />
        <Stack.Screen name="room/[id]" options={{ title: 'Pokój wyprawy' }} />
      </Stack>
    </NavigationFrame>
    </GameProvider>
  </ThemeProvider>;
}


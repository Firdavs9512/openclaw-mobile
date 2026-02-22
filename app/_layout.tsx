import '@/utils/crypto-polyfill';

import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { useURL } from 'expo-linking';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useGatewayActions } from '@/hooks/useGateway';
import { ThemeProvider, useTheme } from '@/theme';
import { AppKeys, appGetBoolean } from '@/utils/app-storage';
import { parseOpenClawUrl } from '@/utils/deep-link';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { colors, isDark } = useTheme();
  const url = useURL();
  const { reconnectFromSaved } = useGatewayActions();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Onboarding tekshiruvi va SplashScreen boshqaruvi
  useEffect(() => {
    const onboardingComplete = appGetBoolean(AppKeys.ONBOARDING_COMPLETE);

    if (onboardingComplete) {
      reconnectFromSaved();
    } else {
      router.replace('/onboarding');
    }

    setIsNavigationReady(true);
    SplashScreen.hideAsync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Deep link handling
  useEffect(() => {
    if (!url || !isNavigationReady) return;

    const parsed = parseOpenClawUrl(url);
    if (parsed && (parsed.type === 'connect' || parsed.type === 'pair')) {
      router.push({
        pathname: '/onboarding/manual-setup',
        params: {
          host: parsed.config.host,
          port: String(parsed.config.port),
          token: parsed.config.token ?? '',
          useTLS: parsed.config.useTLS ? '1' : '0',
          autoConnect: '1',
        },
      });
    }
  }, [url, isNavigationReady]);

  const navigationTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.error,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.error,
        },
      };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="chat/[sessionKey]" options={{ headerShown: true, title: 'Chat' }} />
      </Stack>
    </NavigationThemeProvider>
  );
}

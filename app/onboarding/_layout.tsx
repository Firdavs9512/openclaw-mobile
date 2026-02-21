import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export default function OnboardingLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        headerBackTitle: 'Orqaga',
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="connection-method"
        options={{ title: 'Ulanish usuli' }}
      />
      <Stack.Screen
        name="lan-discovery"
        options={{ title: 'Tarmoqda qidirish' }}
      />
      <Stack.Screen
        name="manual-setup"
        options={{ title: 'Manual sozlash' }}
      />
      <Stack.Screen
        name="scan-qr"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
    </Stack>
  );
}

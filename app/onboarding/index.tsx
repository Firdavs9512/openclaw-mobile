import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View } from '@/components/common/Themed';
import { useTheme } from '@/theme';

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.hero}>
        <View
          style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}
          lightColor={colors.primaryLight}
          darkColor={colors.primaryLight}
        >
          <FontAwesome name="terminal" size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>OpenClaw Mobile</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Shaxsiy AI yordamchingiz
        </Text>
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/onboarding/connection-method')}
        >
          <Text style={styles.primaryButtonText}>Boshlash</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, { borderColor: colors.primary }]}
          onPress={() => router.push('/onboarding/scan-qr')}
        >
          <FontAwesome
            name="qrcode"
            size={18}
            color={colors.primary}
            style={styles.qrIcon}
          />
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
            QR kod skan qilish
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  qrIcon: {
    marginRight: 8,
  },
});

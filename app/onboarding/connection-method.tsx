import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/common/Themed';
import { useTheme } from '@/theme';

interface ConnectionOption {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  subtitle: string;
  route: '/onboarding/lan-discovery' | '/onboarding/manual-setup' | '/onboarding/scan-qr';
}

const OPTIONS: ConnectionOption[] = [
  {
    icon: 'wifi',
    title: 'Bir xil tarmoqda',
    subtitle: 'Gateway ni avtomatik topish',
    route: '/onboarding/lan-discovery',
  },
  {
    icon: 'wrench',
    title: 'Manual sozlash',
    subtitle: 'Host, port va token kiritish',
    route: '/onboarding/manual-setup',
  },
  {
    icon: 'qrcode',
    title: 'QR Kod Skan',
    subtitle: 'Gateway dan QR kodni skanerlash',
    route: '/onboarding/scan-qr',
  },
];

export default function ConnectionMethodScreen() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Qanday ulanmoqchisiz?</Text>

      {OPTIONS.map((opt) => (
        <Pressable
          key={opt.route}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={() => router.push(opt.route)}
        >
          <View
            style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}
            lightColor={colors.primaryLight}
            darkColor={colors.primaryLight}
          >
            <FontAwesome name={opt.icon} size={22} color={colors.primary} />
          </View>
          <View style={styles.cardText} lightColor="transparent" darkColor="transparent">
            <Text style={styles.cardTitle}>{opt.title}</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              {opt.subtitle}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.textTertiary} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
  },
});

import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Section } from '@/components/settings/Section';
import { Row } from '@/components/settings/Row';
import { ProfileCard } from '@/components/settings/ProfileCard';
import { PillToggle } from '@/components/settings/PillToggle';
import { ToggleRow } from '@/components/settings/ToggleRow';
import { useGatewayConnection, useGatewayActions, useIsConnected } from '@/hooks/useGateway';
import { useTheme, type ThemeMode } from '@/theme';
import { AppKeys, appGetBoolean, appSet } from '@/utils/app-storage';

// === Gateway Section ===

function GatewaySection() {
  const { state, url } = useGatewayConnection();
  const { disconnect } = useGatewayActions();
  const isConnected = useIsConnected();
  const { colors } = useTheme();

  const statusColor =
    state === 'connected'
      ? colors.statusConnected
      : state === 'disconnected'
        ? colors.statusDisconnected
        : colors.statusConnecting;

  const statusText =
    state === 'connected'
      ? 'Ulangan'
      : state === 'disconnected'
        ? 'Uzilgan'
        : 'Ulanmoqda...';

  const statusIcon = (
    <View
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: statusColor,
      }}
    />
  );

  return (
    <Section title="GATEWAY">
      <Row
        icon={statusIcon}
        title={url || 'Ulanmagan'}
        subtitle={statusText}
      />
      <Row
        title="Gateway o'zgartirish"
        onPress={() => router.push('/onboarding/connection-method')}
        chevron
      />
      {isConnected && (
        <Row
          title="Uzish"
          titleStyle={{ color: colors.error }}
          onPress={disconnect}
          isLast
        />
      )}
    </Section>
  );
}

// === Theme Section ===

const THEME_VALUES: ThemeMode[] = ['dark', 'light', 'system'];
const THEME_LABELS = ["Dark", "Light", "System"];

function ThemeSection() {
  const { mode, setMode, isDark } = useTheme();
  const { colors } = useTheme();

  const currentLabel = isDark ? "Qo'ng'ir rejim" : "Yorug' rejim";

  const handleChange = useCallback(
    (index: number) => {
      setMode(THEME_VALUES[index]);
    },
    [setMode],
  );

  return (
    <Section title="TEMA">
      <View style={styles.themeRow}>
        <View style={styles.themeInfo}>
          <Text style={[styles.themeTitle, { color: colors.text }]}>
            Ko&apos;rinish
          </Text>
          <Text style={[styles.themeSubtitle, { color: colors.textSecondary }]}>
            {currentLabel}
          </Text>
        </View>
        <PillToggle
          options={THEME_LABELS}
          selectedIndex={THEME_VALUES.indexOf(mode)}
          onChange={handleChange}
        />
      </View>
    </Section>
  );
}

// === AI Model Section ===

function AIModelSection() {
  return (
    <Section title="AI MODEL">
      <Row
        title="Model"
        subtitle="Claude Sonnet 4.5"
        chevron
        isLast
      />
    </Section>
  );
}

// === Permissions Section ===

function PermissionsSection() {
  const [browserControl, setBrowserControl] = useState(
    () => appGetBoolean(AppKeys.PERM_BROWSER_CONTROL) ?? true,
  );
  const [fileAccess, setFileAccess] = useState(
    () => appGetBoolean(AppKeys.PERM_FILE_ACCESS) ?? false,
  );
  const [heartbeat, setHeartbeat] = useState(
    () => appGetBoolean(AppKeys.PERM_HEARTBEAT) ?? true,
  );

  const handleBrowserControl = useCallback((val: boolean) => {
    setBrowserControl(val);
    appSet(AppKeys.PERM_BROWSER_CONTROL, val);
  }, []);

  const handleFileAccess = useCallback((val: boolean) => {
    setFileAccess(val);
    appSet(AppKeys.PERM_FILE_ACCESS, val);
  }, []);

  const handleHeartbeat = useCallback((val: boolean) => {
    setHeartbeat(val);
    appSet(AppKeys.PERM_HEARTBEAT, val);
  }, []);

  return (
    <Section title="RUXSATLAR">
      <ToggleRow
        title="Browser Control"
        subtitle="Veb sahifalarni boshqarish"
        value={browserControl}
        onValueChange={handleBrowserControl}
      />
      <ToggleRow
        title="File Access"
        subtitle="Fayllarni o'qish/yozish"
        value={fileAccess}
        onValueChange={handleFileAccess}
      />
      <ToggleRow
        title="Heartbeat"
        subtitle="Proaktiv tekshiruvlar"
        value={heartbeat}
        onValueChange={handleHeartbeat}
        isLast
      />
    </Section>
  );
}

// === App Section ===

function AppSection() {
  const [notifications, setNotifications] = useState(
    () => appGetBoolean(AppKeys.NOTIFICATIONS_ENABLED) ?? true,
  );

  const handleNotifications = useCallback((val: boolean) => {
    setNotifications(val);
    appSet(AppKeys.NOTIFICATIONS_ENABLED, val);
  }, []);

  return (
    <Section title="ILOVA">
      <ToggleRow
        title="Bildirishnomalar"
        value={notifications}
        onValueChange={handleNotifications}
        isLast
      />
    </Section>
  );
}

// === Main Screen ===

export default function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Sozlamalar
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          OpenClaw konfiguratsiyasi
        </Text>
      </View>

      <ProfileCard />
      <ThemeSection />
      <AIModelSection />
      <PermissionsSection />
      <AppSection />
      <GatewaySection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  themeInfo: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 16,
  },
  themeSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});

import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Section } from '@/components/settings/Section';
import { Row } from '@/components/settings/Row';
import { SegmentedControl } from '@/components/settings/SegmentedControl';
import { useGatewayConnection, useGatewayActions, useIsConnected } from '@/hooks/useGateway';
import { useTheme, type ThemeMode } from '@/theme';
import { AppKeys, appGet, appSet } from '@/utils/app-storage';
import { loadDeviceIdentity } from '@/utils/crypto';
import type { ThinkingLevel } from '@/types/chat';

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

// === Chat Section ===

const THINKING_VALUES: ThinkingLevel[] = ['off', 'low', 'medium', 'high'];
const THINKING_LABELS = ['Off', 'Low', 'Med', 'High'];

function ChatSection() {
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>(
    () => (appGet(AppKeys.THINKING_LEVEL) as ThinkingLevel) || 'off',
  );

  const handleChange = useCallback((index: number) => {
    const level = THINKING_VALUES[index];
    setThinkingLevel(level);
    appSet(AppKeys.THINKING_LEVEL, level);
  }, []);

  return (
    <Section title="CHAT">
      <Row title="Fikrlash rejimi" subtitle={thinkingLevel} isLast />
      <SegmentedControl
        values={THINKING_LABELS}
        selectedIndex={THINKING_VALUES.indexOf(thinkingLevel)}
        onChange={handleChange}
      />
    </Section>
  );
}

// === Appearance Section ===

const THEME_VALUES: ThemeMode[] = ['system', 'light', 'dark'];
const THEME_LABELS = ['Tizim', 'Yorqin', "Qo'ng'ir"];

function AppearanceSection() {
  const { mode, setMode } = useTheme();

  const handleChange = useCallback(
    (index: number) => {
      setMode(THEME_VALUES[index]);
    },
    [setMode],
  );

  return (
    <Section title="KO'RINISH">
      <Row title="Mavzu" isLast />
      <SegmentedControl
        values={THEME_LABELS}
        selectedIndex={THEME_VALUES.indexOf(mode)}
        onChange={handleChange}
      />
    </Section>
  );
}

// === About Section ===

function AboutSection() {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    loadDeviceIdentity().then((identity) => {
      if (identity) {
        setDeviceId(identity.id.slice(0, 16) + '...');
      }
    });
  }, []);

  return (
    <Section title="HAQIDA">
      <Row title="Ilova versiyasi" subtitle="0.1.0" />
      <Row title="Gateway versiyasi" subtitle="—" />
      <Row title="Device ID" subtitle={deviceId || '—'} isLast />
    </Section>
  );
}

// === Main Screen ===

export default function SettingsScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <GatewaySection />
      <ChatSection />
      <AppearanceSection />
      <AboutSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 40,
  },
});

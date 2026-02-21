import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/common/Themed';
import { useTheme } from '@/theme';
import { useGatewayConnection } from '@/hooks/useGateway';
import type { ConnectionState } from '@/types/gateway';

const STATUS_MAP: Record<ConnectionState, { label: string; colorKey: 'statusConnected' | 'statusConnecting' | 'statusDisconnected' }> = {
  connected: { label: 'Ulangan', colorKey: 'statusConnected' },
  connecting: { label: 'Ulanmoqda', colorKey: 'statusConnecting' },
  handshaking: { label: 'Ulanmoqda', colorKey: 'statusConnecting' },
  reconnecting: { label: 'Ulanmoqda', colorKey: 'statusConnecting' },
  disconnected: { label: 'Uzilgan', colorKey: 'statusDisconnected' },
};

export function StatusPill() {
  const { colors } = useTheme();
  const { state } = useGatewayConnection();
  const { label, colorKey } = STATUS_MAP[state];
  const dotColor = colors[colorKey];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});

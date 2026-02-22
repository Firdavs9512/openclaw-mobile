import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssistantAvatar } from '@/components/chat/AssistantAvatar';
import { useGatewayConnection, useIsConnected } from '@/hooks/useGateway';
import { useAgentName } from '@/hooks/useAgentIdentity';
import { useTheme } from '@/theme';

interface ChatHeaderProps {
  onMenuPress: () => void;
}

export function ChatHeader({ onMenuPress }: ChatHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { state } = useGatewayConnection();
  const isConnected = useIsConnected();
  const agentName = useAgentName();

  const statusColor = isConnected
    ? colors.statusConnected
    : state === 'disconnected'
      ? colors.statusDisconnected
      : colors.statusConnecting;

  const statusText = isConnected
    ? 'Online — tayyor yordam berish'
    : state === 'disconnected'
      ? 'Offline'
      : 'Ulanmoqda...';

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <AssistantAvatar size={40} />

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{agentName}</Text>
        <View style={styles.statusRow}>
          <View
            style={[styles.statusDot, { backgroundColor: statusColor }]}
          />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            {statusText}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onMenuPress}
        style={({ pressed }) => [
          styles.menuButton,
          { opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <FontAwesome
          name="ellipsis-v"
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

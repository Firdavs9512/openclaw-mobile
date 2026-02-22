import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AssistantAvatar } from '@/components/chat/AssistantAvatar';
import { useAgentName } from '@/hooks/useAgentIdentity';
import { useTheme } from '@/theme';

export function ProfileCard() {
  const { colors } = useTheme();
  const agentName = useAgentName();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.primaryLight },
      ]}
    >
      <AssistantAvatar size={56} />

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{agentName}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sizning shaxsiy AI yordamchi
        </Text>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>v0.1.0 • Pro</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  versionBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(231,76,60,0.2)',
  },
  versionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E74C3C',
  },
});

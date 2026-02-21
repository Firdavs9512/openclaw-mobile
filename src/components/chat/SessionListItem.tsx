import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text } from '@/components/common/Themed';
import { useTheme } from '@/theme';
import { formatSessionTime } from '@/utils/format-time';
import type { SessionInfo } from '@/types/chat';

interface SessionListItemProps {
  session: SessionInfo;
  onPress: () => void;
  onDelete: () => void;
}

export const SessionListItem = React.memo(function SessionListItem({
  session,
  onPress,
  onDelete,
}: SessionListItemProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onDelete}
      delayLongPress={500}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? colors.surface : colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
        <FontAwesome name="commenting" size={20} color={colors.primary} />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text
            style={[styles.name, { color: colors.text }]}
            numberOfLines={1}
          >
            {session.agentId || 'Suhbat'}
          </Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>
            {formatSessionTime(session.updatedAt)}
          </Text>
        </View>

        <Text
          style={[
            styles.preview,
            {
              color: session.lastMessage
                ? colors.textSecondary
                : colors.textTertiary,
            },
          ]}
          numberOfLines={2}
        >
          {session.lastMessage || 'Yangi suhbat'}
        </Text>
      </View>

      <FontAwesome
        name="chevron-right"
        size={12}
        color={colors.textTertiary}
        style={styles.chevron}
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  body: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 13,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
  },
  chevron: {
    marginLeft: 8,
  },
});

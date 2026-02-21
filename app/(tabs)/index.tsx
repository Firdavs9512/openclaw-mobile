import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { Text } from '@/components/common/Themed';
import { ConnectionBanner } from '@/components/common/ConnectionBanner';
import { SessionListItem } from '@/components/chat/SessionListItem';
import { useSessions } from '@/hooks/useChat';
import { useIsConnected } from '@/hooks/useGateway';
import { useChatStore } from '@/stores/chat-store';
import { useTheme } from '@/theme';
import type { SessionInfo } from '@/types/chat';

// ─── Empty State ────────────────────────────────────────────

function EmptySessionsState() {
  const { colors } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <FontAwesome name="comment-o" size={48} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Suhbatlar yo&apos;q
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Yangi suhbat boshlash uchun pastdagi + tugmasini bosing.
      </Text>
    </View>
  );
}

// ─── FAB ────────────────────────────────────────────────────

function FAB({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled: boolean;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12 });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.fab,
        { bottom: insets.bottom + 20, backgroundColor: colors.primary },
        disabled && styles.fabDisabled,
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.fabPressable,
          pressed && styles.fabPressed,
        ]}
      >
        <FontAwesome name="plus" size={24} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

// ─── Sessions Screen ────────────────────────────────────────

export default function SessionsScreen() {
  const sessions = useSessions();
  const isConnected = useIsConnected();
  const { colors } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isConnected) {
      useChatStore.getState().loadSessions();
    }
  }, [isConnected]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await useChatStore.getState().loadSessions();
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleNewSession = useCallback(() => {
    const sessionKey = useChatStore.getState().createSession();
    router.push(`/chat/${sessionKey}`);
  }, []);

  const handleDelete = useCallback((sessionKey: string) => {
    Alert.alert(
      "Suhbatni o'chirish",
      "Bu suhbat butunlay o'chiriladi. Davom etilsinmi?",
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: "O'chirish",
          style: 'destructive',
          onPress: async () => {
            await useChatStore.getState().deleteSession(sessionKey);
          },
        },
      ],
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: SessionInfo }) => (
      <SessionListItem
        session={item}
        onPress={() => router.push(`/chat/${item.sessionKey}`)}
        onDelete={() => handleDelete(item.sessionKey)}
      />
    ),
    [handleDelete],
  );

  const keyExtractor = useCallback(
    (item: SessionInfo) => item.sessionKey,
    [],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ConnectionBanner />

      <FlatList
        data={sessions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={isRefreshing}
        onRefresh={isConnected ? handleRefresh : undefined}
        ListEmptyComponent={<EmptySessionsState />}
        contentContainerStyle={
          sessions.length === 0 ? styles.emptyList : undefined
        }
      />

      <FAB onPress={handleNewSession} disabled={!isConnected} />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  fabDisabled: {
    opacity: 0.5,
  },
  fabPressable: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPressed: {
    opacity: 0.8,
  },
});

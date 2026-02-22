import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { Text, View } from '@/components/common/Themed';
import { ConnectionBanner } from '@/components/common/ConnectionBanner';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { StreamingText } from '@/components/chat/StreamingText';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChat, useMessages, useStreamingMessage } from '@/hooks/useChat';
import { useIsConnected } from '@/hooks/useGateway';
import { useChatStore } from '@/stores/chat-store';
import { useTheme } from '@/theme';
import { AppKeys, appGet } from '@/utils/app-storage';
import type { Message } from '@/types/chat';

function EmptyState() {
  const { colors } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>OpenClaw ga xush kelibsiz!</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Birinchi xabaringizni yozing
      </Text>
    </View>
  );
}

export default function ChatTabScreen() {
  const { colors } = useTheme();
  const isConnected = useIsConnected();
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isAtBottom, setIsAtBottom] = useState(true);

  // Sessiyani tiklash yoki yaratish
  useEffect(() => {
    const lastKey = appGet(AppKeys.LAST_SESSION_KEY);
    if (lastKey) {
      setSessionKey(lastKey);
      useChatStore.getState().setActiveSession(lastKey);
    } else {
      const newKey = useChatStore.getState().createSession();
      setSessionKey(newKey);
    }
  }, []);

  // History yuklash
  useEffect(() => {
    if (sessionKey && isConnected) {
      useChatStore.getState().loadHistory(sessionKey);
    }
  }, [sessionKey, isConnected]);

  const messages = useMessages(sessionKey ?? '');
  const streamingMessage = useStreamingMessage();
  const { sendMessage, abortRun, isAgentRunning } = useChat();

  const allMessages = useMemo(() => {
    const msgs = [...messages];

    if (streamingMessage && streamingMessage.isStreaming) {
      msgs.push({
        id: streamingMessage.id,
        role: 'assistant',
        content: streamingMessage.content,
        timestamp: Date.now(),
        status: 'streaming',
        sessionKey: sessionKey ?? '',
      });
    }

    return msgs.reverse();
  }, [messages, streamingMessage, sessionKey]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!sessionKey) return;
      await sendMessage(text);
    },
    [sessionKey, sendMessage],
  );

  const handleRetry = useCallback(
    (message: Message) => {
      sendMessage(message.content);
    },
    [sendMessage],
  );

  const handleNewChat = useCallback(() => {
    const newKey = useChatStore.getState().createSession();
    setSessionKey(newKey);
  }, []);

  const handleMenuPress = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Bekor qilish', 'Yangi suhbat', 'Suhbatni tozalash'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleNewChat();
          } else if (buttonIndex === 2) {
            handleNewChat();
          }
        },
      );
    } else {
      Alert.alert(
        'Menu',
        undefined,
        [
          { text: 'Bekor qilish', style: 'cancel' },
          { text: 'Yangi suhbat', onPress: handleNewChat },
          {
            text: 'Suhbatni tozalash',
            style: 'destructive',
            onPress: handleNewChat,
          },
        ],
      );
    }
  }, [handleNewChat]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;
      setIsAtBottom(contentOffset.y < 50);
    },
    [],
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      if (item.status === 'streaming' && streamingMessage) {
        return <StreamingText message={streamingMessage} />;
      }
      return <MessageBubble message={item} onRetry={handleRetry} />;
    },
    [streamingMessage, handleRetry],
  );

  const showEmpty = allMessages.length === 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ChatHeader onMenuPress={handleMenuPress} />
      <ConnectionBanner />

      {showEmpty ? (
        <EmptyState />
      ) : (
        <FlatList
          ref={flatListRef}
          data={allMessages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          inverted
          onScroll={onScroll}
          scrollEventThrottle={16}
          removeClippedSubviews
          maxToRenderPerBatch={15}
          windowSize={10}
          initialNumToRender={20}
          contentContainerStyle={styles.listContent}
        />
      )}

      <ChatInput
        onSend={handleSend}
        onAbort={abortRun}
        isAgentRunning={isAgentRunning}
        disabled={!isConnected}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
});

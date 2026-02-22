import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { Text, View } from '@/components/common/Themed';
import { ConnectionBanner } from '@/components/common/ConnectionBanner';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { StreamingText } from '@/components/chat/StreamingText';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChat, useMessages, useStreamingMessage } from '@/hooks/useChat';
import { useIsConnected } from '@/hooks/useGateway';
import { useChatStore } from '@/stores/chat-store';
import { useTheme } from '@/theme';
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

export default function ChatScreen() {
  const { sessionKey } = useLocalSearchParams<{ sessionKey: string }>();
  const messages = useMessages(sessionKey);
  const streamingMessage = useStreamingMessage();
  const { sendMessage, abortRun, isAgentRunning } = useChat();
  const isConnected = useIsConnected();
  const { colors } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isAtBottom, setIsAtBottom] = useState(true);

  // Active session o'rnatish
  useEffect(() => {
    if (sessionKey) {
      useChatStore.getState().setActiveSession(sessionKey);
    }
  }, [sessionKey]);

  // History yuklash (yangi sessiya uchun emas)
  useEffect(() => {
    if (sessionKey && sessionKey !== 'new' && isConnected) {
      useChatStore.getState().loadHistory(sessionKey);
    }
  }, [sessionKey, isConnected]);

  // Messages + streamingMessage birlashtirish
  const allMessages = useMemo(() => {
    const msgs = [...messages];

    if (streamingMessage && streamingMessage.isStreaming) {
      msgs.push({
        id: streamingMessage.id,
        role: 'assistant',
        content: streamingMessage.content,
        timestamp: Date.now(),
        status: 'streaming',
        sessionKey,
      });
    }

    return msgs.reverse();
  }, [messages, streamingMessage, sessionKey]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!sessionKey || sessionKey === 'new') {
        const newKey = useChatStore.getState().createSession();
        router.replace(`/chat/${newKey}`);
        await sendMessage(text);
      } else {
        await sendMessage(text);
      }
    },
    [sessionKey, sendMessage],
  );

  const handleRetry = useCallback(
    (message: Message) => {
      sendMessage(message.content);
    },
    [sendMessage],
  );

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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
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

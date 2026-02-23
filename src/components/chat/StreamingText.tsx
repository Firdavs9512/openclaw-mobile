import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { AssistantAvatar } from '@/components/chat/AssistantAvatar';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import { useTheme } from '@/theme';
import type { StreamingMessage } from '@/types/chat';

interface StreamingTextProps {
  message: StreamingMessage;
}

// Gateway ichki direktivalarini tozalash
const GATEWAY_DIRECTIVE_RE = /\[\[[a-z_]+\]\]\s*/gi;

export const StreamingText = React.memo(function StreamingText({
  message,
}: StreamingTextProps) {
  const { colors } = useTheme();
  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    if (message.isStreaming) {
      cursorOpacity.value = withRepeat(
        withTiming(0, { duration: 530, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cursorOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [message.isStreaming, cursorOpacity]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const cleanContent = message.content.replace(GATEWAY_DIRECTIVE_RE, '');
  const hasContent = cleanContent.length > 0;

  return (
    <View
      style={[
        styles.wrapper,
        { alignItems: 'flex-start' },
      ]}
    >
      <View
        style={[styles.bubble, { backgroundColor: colors.assistantBubble }]}
      >
        {(message.isThinking || message.toolName) && (
          <View style={styles.indicator}>
            <ActivityIndicator size="small" color={colors.textTertiary} />
            <Text style={[styles.indicatorText, { color: colors.textTertiary }]}>
              {message.toolName
                ? `${message.toolName} ishlatilmoqda...`
                : "O'ylayapti..."}
            </Text>
          </View>
        )}
        {hasContent && (
          <MarkdownRenderer>{cleanContent}</MarkdownRenderer>
        )}
        {message.isStreaming && (
          <Animated.View style={[styles.cursorContainer, cursorStyle]}>
            <Text style={[styles.cursor, { color: colors.primary }]}>
              ▍
            </Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.assistantFooter}>
        <AssistantAvatar size={20} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
    marginHorizontal: 12,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  indicatorText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  cursorContainer: {
    height: 22,
    justifyContent: 'center',
  },
  cursor: {
    fontSize: 18,
    fontWeight: '300',
    lineHeight: 22,
  },
  assistantFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginLeft: 4,
  },
});

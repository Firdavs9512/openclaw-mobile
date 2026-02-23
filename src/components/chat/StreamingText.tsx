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
import { MarkdownContent } from '@/components/chat/MarkdownContent';
import { useTheme } from '@/theme';
import type { StreamingMessage } from '@/types/chat';

interface StreamingTextProps {
  message: StreamingMessage;
}

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
        <View style={styles.contentRow}>
          <MarkdownContent
            content={message.content.replace(/\[\[[a-z_]+\]\]\s*/gi, '')}
          />
          {message.isStreaming && (
            <Animated.View style={[cursorStyle, styles.cursorWrapper]}>
              <Text style={[styles.cursor, { color: colors.primary }]}>
                |
              </Text>
            </Animated.View>
          )}
        </View>
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
  contentRow: {
    flexDirection: 'column',
  },
  cursorWrapper: {
    alignSelf: 'flex-end',
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

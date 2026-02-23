import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AssistantAvatar } from '@/components/chat/AssistantAvatar';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import { useTheme } from '@/theme';
import type { Message, MessageStatus } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  onRetry?: (message: Message) => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

const STATUS_ICONS: Record<MessageStatus, string> = {
  sending: '\u23F3',
  sent: '\u2713',
  streaming: '\u2713',
  complete: '\u2713\u2713',
  failed: '\u274C',
};

// Gateway ichki direktivalarini tozalash (masalan, [[reply_to_current]])
const GATEWAY_DIRECTIVE_RE = /\[\[[a-z_]+\]\]\s*/gi;

function extractText(content: unknown): string {
  let raw: string;
  if (typeof content === 'string') {
    raw = content;
  } else if (Array.isArray(content)) {
    raw = content
      .map((block) => {
        if (typeof block === 'string') return block;
        if (block && typeof block === 'object' && 'text' in block) return String(block.text);
        return '';
      })
      .join('');
  } else if (content && typeof content === 'object' && 'text' in content) {
    raw = String((content as { text: string }).text);
  } else {
    raw = String(content ?? '');
  }
  return raw.replace(GATEWAY_DIRECTIVE_RE, '').trimStart();
}

export const MessageBubble = React.memo(function MessageBubble({
  message,
  onRetry,
}: MessageBubbleProps) {
  const { colors } = useTheme();
  const isUser = message.role === 'user';

  const bubbleBg = isUser ? colors.userBubble : colors.assistantBubble;
  const textColor = isUser ? colors.userBubbleText : colors.assistantBubbleText;
  const displayText = extractText(message.content);

  return (
    <View
      style={[
        styles.wrapper,
        { alignItems: isUser ? 'flex-end' : 'flex-start' },
      ]}
    >
      <View style={[styles.bubble, { backgroundColor: bubbleBg }]}>
        {isUser ? (
          <Text style={[styles.content, { color: textColor }]}>
            {displayText}
          </Text>
        ) : (
          <MarkdownRenderer content={displayText} />
        )}
        {isUser && (
          <View style={styles.meta}>
            <Text style={[styles.timestamp, { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
              {formatTime(message.timestamp)}
            </Text>
            <Text
              style={[
                styles.statusIcon,
                {
                  color:
                    message.status === 'failed'
                      ? colors.error
                      : 'rgba(255,255,255,0.7)',
                },
              ]}
            >
              {STATUS_ICONS[message.status]}
            </Text>
          </View>
        )}
      </View>

      {!isUser && (
        <View style={styles.assistantFooter}>
          <AssistantAvatar size={20} />
          <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      )}

      {message.status === 'failed' && (
        <Pressable
          onPress={() => onRetry?.(message)}
          style={styles.retryButton}
        >
          <Text style={[styles.retryText, { color: colors.error }]}>
            Qayta yuborish
          </Text>
        </Pressable>
      )}
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
  content: {
    fontSize: 16,
    lineHeight: 22,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  statusIcon: {
    fontSize: 11,
  },
  assistantFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginLeft: 4,
  },
  retryButton: {
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

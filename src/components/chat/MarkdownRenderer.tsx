import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import Markdown from '@ronradtke/react-native-markdown-display';
import MarkdownIt from 'markdown-it';

import { useTheme } from '@/theme';
import { sanitizePartialMarkdown } from '@/utils/sanitize-markdown';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

const mdParser = MarkdownIt({ typographer: false, linkify: true });

export const MarkdownRenderer = React.memo(function MarkdownRenderer({
  content,
  isStreaming,
}: MarkdownRendererProps) {
  const { colors } = useTheme();

  // Streaming throttle: 50ms
  const [throttledContent, setThrottledContent] = useState(content);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isStreaming) {
      setThrottledContent(content);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setThrottledContent(content);
    }, 50);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, isStreaming]);

  const processedContent = useMemo(() => {
    const text = throttledContent || '';
    if (!text) return ' ';
    if (isStreaming) {
      return sanitizePartialMarkdown(text);
    }
    return text;
  }, [throttledContent, isStreaming]);

  const handleLinkPress = useCallback((url: string) => {
    Linking.openURL(url);
    return false;
  }, []);

  const markdownStyles = useMemo(
    () => ({
      body: {
        color: colors.assistantBubbleText,
        fontSize: 16,
        lineHeight: 22,
      },
      heading1: {
        fontSize: 22,
        fontWeight: '700' as const,
        color: colors.assistantBubbleText,
        marginTop: 8,
        marginBottom: 4,
      },
      heading2: {
        fontSize: 20,
        fontWeight: '600' as const,
        color: colors.assistantBubbleText,
        marginTop: 6,
        marginBottom: 4,
      },
      heading3: {
        fontSize: 18,
        fontWeight: '600' as const,
        color: colors.assistantBubbleText,
        marginTop: 4,
        marginBottom: 2,
      },
      heading4: {
        fontSize: 17,
        fontWeight: '600' as const,
        color: colors.assistantBubbleText,
      },
      heading5: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: colors.assistantBubbleText,
      },
      heading6: {
        fontSize: 16,
        fontWeight: '500' as const,
        color: colors.textSecondary,
      },
      strong: {
        fontWeight: '700' as const,
      },
      em: {
        fontStyle: 'italic' as const,
      },
      s: {
        textDecorationLine: 'line-through' as const,
      },
      code_inline: {
        backgroundColor: colors.codeBackground,
        color: colors.codeText,
        fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
        fontSize: 14,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
      },
      code_block: {
        backgroundColor: colors.codeBackground,
        color: colors.codeText,
        fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
        fontSize: 13,
        lineHeight: 18,
        padding: 12,
        borderRadius: 8,
        marginVertical: 6,
      },
      fence: {
        backgroundColor: colors.codeBackground,
        color: colors.codeText,
        fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
        fontSize: 13,
        lineHeight: 18,
        padding: 12,
        borderRadius: 8,
        marginVertical: 6,
      },
      blockquote: {
        backgroundColor: colors.codeBackground,
        borderLeftColor: colors.primary,
        borderLeftWidth: 3,
        paddingLeft: 12,
        paddingVertical: 4,
        marginVertical: 4,
        borderRadius: 4,
      },
      link: {
        color: colors.primary,
        textDecorationLine: 'underline' as const,
      },
      list_item: {
        marginVertical: 2,
      },
      bullet_list: {
        marginVertical: 4,
      },
      ordered_list: {
        marginVertical: 4,
      },
      bullet_list_icon: {
        color: colors.assistantBubbleText,
        fontSize: 16,
        lineHeight: 22,
      },
      ordered_list_icon: {
        color: colors.assistantBubbleText,
        fontSize: 16,
        lineHeight: 22,
      },
      hr: {
        backgroundColor: colors.border,
        height: 1,
        marginVertical: 10,
      },
      table: {
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 4,
        marginVertical: 6,
      },
      tr: {
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
      },
      th: {
        padding: 6,
        fontWeight: '600' as const,
      },
      td: {
        padding: 6,
      },
      paragraph: {
        marginTop: 0,
        marginBottom: 4,
      },
      text: {
        color: colors.assistantBubbleText,
      },
      textgroup: {
        color: colors.assistantBubbleText,
      },
    }),
    [colors],
  );

  return (
    <View>
      <Markdown
        style={markdownStyles}
        mergeStyle
        markdownit={mdParser}
        onLinkPress={handleLinkPress}
      >
        {processedContent}
      </Markdown>
    </View>
  );
});

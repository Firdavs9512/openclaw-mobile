import React, { useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import MarkdownIt from 'markdown-it';

import { useTheme } from '@/theme';

interface MarkdownRendererProps {
  children: string;
}

const mdInstance = new MarkdownIt({
  typographer: true,
  linkify: true,
});

export const MarkdownRenderer = React.memo(function MarkdownRenderer({
  children,
}: MarkdownRendererProps) {
  const { colors } = useTheme();

  const markdownStyles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: colors.assistantBubbleText,
          fontSize: 16,
          lineHeight: 22,
        },
        paragraph: {
          marginTop: 0,
          marginBottom: 8,
        },
        // Headings
        heading1: {
          fontSize: 24,
          fontWeight: '700' as const,
          color: colors.assistantBubbleText,
          marginTop: 4,
          marginBottom: 8,
        },
        heading2: {
          fontSize: 20,
          fontWeight: '700' as const,
          color: colors.assistantBubbleText,
          marginTop: 4,
          marginBottom: 6,
        },
        heading3: {
          fontSize: 18,
          fontWeight: '600' as const,
          color: colors.assistantBubbleText,
          marginTop: 4,
          marginBottom: 4,
        },
        // Inline code
        code_inline: {
          backgroundColor: colors.codeBackground,
          color: colors.codeText,
          fontSize: 14,
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
          paddingHorizontal: 5,
          paddingVertical: 2,
          borderRadius: 4,
        },
        // Code blocks
        fence: {
          backgroundColor: colors.codeBackground,
          color: colors.codeText,
          fontSize: 14,
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
          padding: 12,
          borderRadius: 8,
          marginVertical: 8,
        },
        code_block: {
          backgroundColor: colors.codeBackground,
          color: colors.codeText,
          fontSize: 14,
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
          padding: 12,
          borderRadius: 8,
          marginVertical: 8,
        },
        // Bold & italic
        strong: {
          fontWeight: '700' as const,
        },
        em: {
          fontStyle: 'italic' as const,
        },
        // Links
        link: {
          color: colors.primary,
          textDecorationLine: 'underline' as const,
        },
        // Lists
        bullet_list: {
          marginVertical: 4,
        },
        ordered_list: {
          marginVertical: 4,
        },
        list_item: {
          marginVertical: 2,
        },
        // Blockquote
        blockquote: {
          backgroundColor: colors.codeBackground,
          borderLeftWidth: 3,
          borderLeftColor: colors.primary,
          paddingLeft: 12,
          paddingVertical: 4,
          marginVertical: 6,
        },
        // Horizontal rule
        hr: {
          backgroundColor: colors.border,
          height: 1,
          marginVertical: 12,
        },
        // Table
        table: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 4,
          marginVertical: 8,
        },
        thead: {
          backgroundColor: colors.codeBackground,
        },
        th: {
          padding: 8,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderColor: colors.border,
          fontWeight: '600' as const,
        },
        td: {
          padding: 8,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderColor: colors.border,
        },
        // Strikethrough
        s: {
          textDecorationLine: 'line-through' as const,
        },
      }),
    [colors],
  );

  return (
    <Markdown style={markdownStyles} mergeStyle={false} markdownit={mdInstance}>
      {children}
    </Markdown>
  );
});

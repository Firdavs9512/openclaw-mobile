import React, { useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { useTheme } from '@/theme';
import type { ThemeColors } from '@/theme';

interface MarkdownContentProps {
  content: string;
}

function buildMarkdownStyles(colors: ThemeColors) {
  return StyleSheet.create({
    body: {
      color: colors.assistantBubbleText,
      fontSize: 16,
      lineHeight: 22,
    },
    heading1: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.assistantBubbleText,
      marginTop: 8,
      marginBottom: 4,
    },
    heading2: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.assistantBubbleText,
      marginTop: 8,
      marginBottom: 4,
    },
    heading3: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.assistantBubbleText,
      marginTop: 6,
      marginBottom: 2,
    },
    heading4: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.assistantBubbleText,
      marginTop: 4,
      marginBottom: 2,
    },
    strong: {
      fontWeight: '700',
    },
    em: {
      fontStyle: 'italic',
    },
    link: {
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    blockquote: {
      backgroundColor: colors.surface,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      paddingLeft: 10,
      paddingVertical: 4,
      marginVertical: 4,
    },
    code_inline: {
      backgroundColor: colors.codeBackground,
      color: colors.codeText,
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 4,
    },
    code_block: {
      backgroundColor: colors.codeBackground,
      color: colors.codeText,
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      padding: 10,
      borderRadius: 8,
      marginVertical: 4,
    },
    fence: {
      backgroundColor: colors.codeBackground,
      color: colors.codeText,
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      padding: 10,
      borderRadius: 8,
      marginVertical: 4,
    },
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 4,
      marginVertical: 4,
    },
    thead: {
      backgroundColor: colors.surface,
    },
    th: {
      padding: 6,
      borderWidth: 0.5,
      borderColor: colors.border,
      fontWeight: '600',
    },
    td: {
      padding: 6,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    tr: {
      borderBottomWidth: 0.5,
      borderColor: colors.border,
    },
    bullet_list: {
      marginVertical: 2,
    },
    ordered_list: {
      marginVertical: 2,
    },
    list_item: {
      marginVertical: 1,
    },
    hr: {
      backgroundColor: colors.border,
      height: 1,
      marginVertical: 8,
    },
    image: {
      borderRadius: 8,
      marginVertical: 4,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 4,
    },
  });
}

export const MarkdownContent = React.memo(function MarkdownContent({
  content,
}: MarkdownContentProps) {
  const { colors } = useTheme();

  const markdownStyles = useMemo(() => buildMarkdownStyles(colors), [colors]);

  if (!content) {
    return null;
  }

  return (
    <Markdown style={markdownStyles} mergeStyle>
      {content}
    </Markdown>
  );
});

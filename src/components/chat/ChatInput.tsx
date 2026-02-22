import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

interface ChatInputProps {
  onSend: (text: string) => void;
  onAbort?: () => void;
  isAgentRunning: boolean;
  disabled: boolean;
}

export function ChatInput({
  onSend,
  onAbort,
  isAgentRunning,
  disabled,
}: ChatInputProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const canSend = text.trim().length > 0 && !disabled && !isAgentRunning;

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled || isAgentRunning) return;
    onSend(trimmed);
    setText('');
  }, [text, disabled, isAgentRunning, onSend]);

  const handleAbort = useCallback(() => {
    onAbort?.();
  }, [onAbort]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingBottom: Math.max(insets.bottom, 8),
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.inputBar,
            borderColor: colors.inputBorder,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[styles.textInput, { color: colors.text }]}
          multiline
          placeholder={disabled ? "Ulanish yo'q" : 'Xabar yozing...'}
          placeholderTextColor={colors.textTertiary}
          value={text}
          onChangeText={setText}
          editable={!disabled && !isAgentRunning}
          blurOnSubmit={false}
        />

        {isAgentRunning ? (
          <Pressable style={styles.actionButton} onPress={handleAbort}>
            <FontAwesome
              name="stop-circle"
              size={24}
              color={colors.error}
            />
          </Pressable>
        ) : (
          <Pressable
            style={[
              styles.sendButton,
              {
                backgroundColor: canSend ? colors.primary : 'transparent',
              },
            ]}
            onPress={handleSend}
            disabled={!canSend}
          >
            <FontAwesome
              name="paper-plane"
              size={16}
              color={canSend ? '#FFFFFF' : colors.textTertiary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 88,
    paddingVertical: 6,
  },
  actionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

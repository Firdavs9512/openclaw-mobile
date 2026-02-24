import React, { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { AttachmentPickerButton } from '@/components/chat/AttachmentPickerButton';
import { AttachmentPreviewStrip } from '@/components/chat/AttachmentPreviewStrip';
import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  filesToAttachments,
  pickImages,
  pickDocuments,
  type PickedFile,
} from '@/utils/attachment-helpers';
import type { Attachment } from '@/types/chat';

interface ChatInputProps {
  onSend: (text: string, attachments?: Attachment[]) => void;
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
  const [pendingFiles, setPendingFiles] = useState<PickedFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const canSend =
    (text.trim().length > 0 || pendingFiles.length > 0) &&
    !disabled &&
    !isAgentRunning &&
    !isConverting;

  const addFiles = useCallback(
    (files: PickedFile[]) => {
      setPendingFiles((prev) => {
        const total = prev.length + files.length;
        if (total > MAX_ATTACHMENTS_PER_MESSAGE) {
          Alert.alert(
            'Limit',
            `Maksimum ${MAX_ATTACHMENTS_PER_MESSAGE} ta fayl biriktirish mumkin.`,
          );
          return prev.concat(files.slice(0, MAX_ATTACHMENTS_PER_MESSAGE - prev.length));
        }
        return prev.concat(files);
      });
    },
    [],
  );

  const handlePickImages = useCallback(async () => {
    const files = await pickImages();
    if (files.length > 0) addFiles(files);
  }, [addFiles]);

  const handlePickDocuments = useCallback(async () => {
    const files = await pickDocuments();
    if (files.length > 0) addFiles(files);
  }, [addFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if ((!trimmed && pendingFiles.length === 0) || disabled || isAgentRunning || isConverting) return;

    if (pendingFiles.length > 0) {
      setIsConverting(true);
      try {
        const attachments = await filesToAttachments(pendingFiles);
        onSend(trimmed, attachments);
        setText('');
        setPendingFiles([]);
      } catch (e) {
        Alert.alert('Xatolik', e instanceof Error ? e.message : 'Fayl yuklashda xatolik.');
      } finally {
        setIsConverting(false);
      }
    } else {
      onSend(trimmed);
      setText('');
    }
  }, [text, pendingFiles, disabled, isAgentRunning, isConverting, onSend]);

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
      <AttachmentPreviewStrip items={pendingFiles} onRemove={handleRemoveFile} />

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.inputBar,
            borderColor: colors.inputBorder,
          },
        ]}
      >
        <AttachmentPickerButton
          onPickImages={handlePickImages}
          onPickDocuments={handlePickDocuments}
          disabled={disabled || isAgentRunning}
        />

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
            {isConverting ? (
              <FontAwesome name="spinner" size={16} color={colors.textTertiary} />
            ) : (
              <FontAwesome
                name="paper-plane"
                size={16}
                color={canSend ? '#FFFFFF' : colors.textTertiary}
              />
            )}
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
    paddingLeft: 4,
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

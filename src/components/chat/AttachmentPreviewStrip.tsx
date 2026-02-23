import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useTheme } from '@/theme';
import type { PickedFile } from '@/utils/attachment-helpers';
import { formatFileSize, getFileIcon } from '@/utils/attachment-helpers';

interface AttachmentPreviewStripProps {
  items: PickedFile[];
  onRemove: (index: number) => void;
}

export const AttachmentPreviewStrip = React.memo(function AttachmentPreviewStrip({
  items,
  onRemove,
}: AttachmentPreviewStripProps) {
  const { colors } = useTheme();

  if (items.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {items.map((item, index) => (
        <View
          key={`${item.uri}-${index}`}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {item.type === 'image' ? (
            <Image source={{ uri: item.uri }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.fileIconBox, { backgroundColor: colors.primaryLight }]}>
              <FontAwesome
                name={getFileIcon(item.mimeType) as 'file-o'}
                size={20}
                color={colors.primary}
              />
            </View>
          )}

          <Text
            style={[styles.fileName, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.fileName}
          </Text>

          {item.fileSize != null && (
            <Text style={[styles.fileSize, { color: colors.textTertiary }]}>
              {formatFileSize(item.fileSize)}
            </Text>
          )}

          <Pressable
            style={[styles.removeButton, { backgroundColor: colors.error }]}
            onPress={() => onRemove(index)}
            accessibilityRole="button"
            accessibilityLabel={`${item.fileName} ni olib tashlash`}
          >
            <FontAwesome name="times" size={10} color="#FFFFFF" />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    maxHeight: 110,
  },
  content: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    gap: 8,
  },
  card: {
    width: 80,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 4,
  },
  thumbnail: {
    width: 80,
    height: 64,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    resizeMode: 'cover',
  },
  fileIconBox: {
    width: 80,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 10,
    marginTop: 2,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  fileSize: {
    fontSize: 9,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

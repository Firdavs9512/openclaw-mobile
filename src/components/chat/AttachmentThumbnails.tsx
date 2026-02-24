import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useTheme } from '@/theme';
import { getFileIcon } from '@/utils/attachment-helpers';
import type { Attachment } from '@/types/chat';

interface AttachmentThumbnailsProps {
  attachments: Attachment[];
  isUser: boolean;
}

export const AttachmentThumbnails = React.memo(function AttachmentThumbnails({
  attachments,
  isUser,
}: AttachmentThumbnailsProps) {
  const { colors } = useTheme();

  const images = attachments.filter((a) => a.type === 'image');
  const files = attachments.filter((a) => a.type !== 'image');

  return (
    <View style={styles.container}>
      {images.length > 0 && (
        <View style={styles.imageGrid}>
          {images.map((img, i) => (
            <Image
              key={`img-${i}`}
              source={{ uri: `data:${img.mimeType};base64,${img.content}` }}
              style={[
                styles.imageThumbnail,
                images.length === 1 && styles.imageSingle,
              ]}
            />
          ))}
        </View>
      )}

      {files.map((file, i) => (
        <View
          key={`file-${i}`}
          style={[
            styles.fileCard,
            {
              backgroundColor: isUser
                ? 'rgba(255,255,255,0.15)'
                : colors.surface,
            },
          ]}
        >
          <FontAwesome
            name={getFileIcon(file.mimeType) as 'file-o'}
            size={16}
            color={isUser ? colors.userBubbleText : colors.primary}
          />
          <Text
            style={[
              styles.fileCardName,
              { color: isUser ? colors.userBubbleText : colors.text },
            ]}
            numberOfLines={1}
          >
            {file.fileName}
          </Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 6,
    gap: 4,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  imageThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  imageSingle: {
    width: 200,
    height: 150,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  fileCardName: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Alert } from 'react-native';

import type { Attachment } from '@/types/chat';

// === Konstantalar ===

export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_ATTACHMENTS_PER_MESSAGE = 10;
const IMAGE_MAX_DIMENSION = 2048;
const IMAGE_COMPRESSION_QUALITY = 0.8;

// === Oraliq tip ===

export interface PickedFile {
  uri: string;
  fileName: string;
  mimeType: string;
  type: 'image' | 'file';
  fileSize?: number;
}

// === Picker funksiyalar ===

export async function pickImages(): Promise<PickedFile[]> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Ruxsat kerak', 'Galereya ruxsati berilmagan.');
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: IMAGE_COMPRESSION_QUALITY,
  });

  if (result.canceled || !result.assets) return [];

  return result.assets.map((asset) => ({
    uri: asset.uri,
    fileName: asset.fileName || `image-${Date.now()}.jpg`,
    mimeType: asset.mimeType || 'image/jpeg',
    type: 'image' as const,
    fileSize: asset.fileSize,
  }));
}

export async function pickDocuments(): Promise<PickedFile[]> {
  const result = await DocumentPicker.getDocumentAsync({
    multiple: true,
    type: ['*/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets) return [];

  return result.assets.map((asset) => ({
    uri: asset.uri,
    fileName: asset.name,
    mimeType: asset.mimeType || 'application/octet-stream',
    type: 'file' as const,
    fileSize: asset.size,
  }));
}

// === Siqish va konvertatsiya ===

async function compressImageIfNeeded(uri: string): Promise<string> {
  const manipulated = await manipulateAsync(
    uri,
    [{ resize: { width: IMAGE_MAX_DIMENSION } }],
    { compress: IMAGE_COMPRESSION_QUALITY, format: SaveFormat.JPEG },
  );
  return manipulated.uri;
}

export async function fileToAttachment(
  picked: PickedFile,
  maxSizeBytes = MAX_ATTACHMENT_SIZE_BYTES,
): Promise<Attachment> {
  let uri = picked.uri;

  if (picked.type === 'image') {
    uri = await compressImageIfNeeded(uri);
  }

  const base64 = await readAsStringAsync(uri, {
    encoding: EncodingType.Base64,
  });

  const sizeBytes = (base64.length * 3) / 4;
  if (sizeBytes > maxSizeBytes) {
    throw new Error(
      `"${picked.fileName}" hajmi ${formatFileSize(sizeBytes)}. Maksimum ${formatFileSize(maxSizeBytes)}.`,
    );
  }

  return {
    type: picked.type === 'image' ? 'image' : resolveAttachmentType(picked.mimeType),
    mimeType: picked.type === 'image' ? 'image/jpeg' : picked.mimeType,
    fileName: picked.fileName,
    content: base64,
  };
}

export async function filesToAttachments(
  files: PickedFile[],
  maxSizeBytes = MAX_ATTACHMENT_SIZE_BYTES,
): Promise<Attachment[]> {
  return Promise.all(files.map((f) => fileToAttachment(f, maxSizeBytes)));
}

// === Tip aniqlash ===

const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/html',
  'text/csv',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/rtf',
]);

function resolveAttachmentType(mimeType: string): 'document' | 'audio' | 'file' {
  if (DOCUMENT_MIME_TYPES.has(mimeType) || mimeType.startsWith('text/')) {
    return 'document';
  }
  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }
  return 'file';
}

// === Yordamchi funksiyalar ===

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'file-image-o';
  if (mimeType === 'application/pdf') return 'file-pdf-o';
  if (mimeType.startsWith('text/')) return 'file-text-o';
  if (mimeType.startsWith('audio/')) return 'file-audio-o';
  if (mimeType.startsWith('video/')) return 'file-video-o';
  return 'file-o';
}

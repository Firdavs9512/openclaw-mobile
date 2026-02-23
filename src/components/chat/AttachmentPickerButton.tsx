import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useTheme } from '@/theme';

interface AttachmentPickerButtonProps {
  onPickImages: () => void;
  onPickDocuments: () => void;
  disabled: boolean;
}

export function AttachmentPickerButton({
  onPickImages,
  onPickDocuments,
  disabled,
}: AttachmentPickerButtonProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);

  const handlePickImages = () => {
    setMenuVisible(false);
    onPickImages();
  };

  // TODO: Gateway hozirda document attachmentlarni qo'llab-quvvatlamaydi
  // const handlePickDocuments = () => {
  //   setMenuVisible(false);
  //   onPickDocuments();
  // };

  return (
    <>
      <Pressable
        style={styles.button}
        onPress={() => setMenuVisible(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Fayl biriktirish"
      >
        <FontAwesome
          name="plus"
          size={20}
          color={disabled ? colors.textTertiary : colors.primary}
        />
      </Pressable>

      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setMenuVisible(false)}
        >
          <View />
        </Pressable>

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={styles.handleRow}>
            <View
              style={[styles.handle, { backgroundColor: colors.border }]}
            />
          </View>

          <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
            <Pressable
              onPress={handlePickImages}
              accessibilityRole="button"
              accessibilityLabel="Rasm tanlash"
              style={({ pressed }) => [
                styles.menuItem,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <FontAwesome name="image" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                Rasm tanlash
              </Text>
              <FontAwesome
                name="chevron-right"
                size={12}
                color={colors.textTertiary}
              />
            </Pressable>

            {/* TODO: Gateway hozirda document attachmentlarni qo'llab-quvvatlamaydi.
               Fayl tanlash opsiyasi gateway yangilangandan keyin yoqiladi.
            <View
              style={[styles.separator, { backgroundColor: colors.border }]}
            />

            <Pressable
              onPress={handlePickDocuments}
              accessibilityRole="button"
              accessibilityLabel="Fayl tanlash"
              style={({ pressed }) => [
                styles.menuItem,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <FontAwesome
                  name="paperclip"
                  size={16}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                Fayl tanlash
              </Text>
              <FontAwesome
                name="chevron-right"
                size={12}
                color={colors.textTertiary}
              />
            </Pressable>
            */}
          </View>

          <Pressable
            onPress={() => setMenuVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Bekor qilish"
            style={({ pressed }) => [
              styles.cancelButton,
              {
                backgroundColor: colors.card,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
              Bekor qilish
            </Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  menuCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
    borderRadius: 12,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

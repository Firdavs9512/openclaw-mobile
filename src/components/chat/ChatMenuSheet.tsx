import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useTheme } from '@/theme';

interface ChatMenuSheetProps {
  visible: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onClearChat: () => void;
}

export function ChatMenuSheet({
  visible,
  onClose,
  onNewChat,
  onClearChat,
}: ChatMenuSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
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
        {/* Handle */}
        <View style={styles.handleRow}>
          <View
            style={[styles.handle, { backgroundColor: colors.border }]}
          />
        </View>

        {/* Menu items */}
        <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
          {/* Yangi suhbat */}
          <Pressable
            onPress={onNewChat}
            accessibilityRole="button"
            accessibilityLabel="Yangi suhbat"
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
              <FontAwesome name="plus" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.menuItemText, { color: colors.text }]}>
              Yangi suhbat
            </Text>
            <FontAwesome
              name="chevron-right"
              size={12}
              color={colors.textTertiary}
            />
          </Pressable>

          {/* Separator */}
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />

          {/* Suhbatni tozalash */}
          <Pressable
            onPress={onClearChat}
            accessibilityRole="button"
            accessibilityLabel="Suhbatni tozalash"
            style={({ pressed }) => [
              styles.menuItem,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.errorLight },
              ]}
            >
              <FontAwesome name="trash" size={16} color={colors.error} />
            </View>
            <Text style={[styles.menuItemText, { color: colors.error }]}>
              Suhbatni tozalash
            </Text>
          </Pressable>
        </View>

        {/* Bekor qilish */}
        <Pressable
          onPress={onClose}
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
  );
}

const styles = StyleSheet.create({
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

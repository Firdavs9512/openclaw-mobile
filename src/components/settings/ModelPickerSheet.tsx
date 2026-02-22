import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useTheme } from '@/theme';
import { useModels, useModelActions } from '@/hooks/useModels';
import type { ModelInfo } from '@/types/gateway';

interface ModelPickerSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function ModelPickerSheet({ visible, onClose }: ModelPickerSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { models, selectedModelId, isLoading, error } = useModels();
  const { selectModel, loadModels } = useModelActions();
  const [search, setSearch] = useState('');

  // Modal ochilganda modellarni yuklash va search ni tozalash
  useEffect(() => {
    if (visible) {
      setSearch('');
      loadModels();
    }
  }, [visible, loadModels]);

  const filtered = useMemo(() => {
    if (!search.trim()) return models;
    const q = search.toLowerCase().trim();
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q),
    );
  }, [models, search]);

  const handleSelect = useCallback(
    async (modelId: string) => {
      await selectModel(modelId);
      onClose();
    },
    [selectModel, onClose],
  );

  const renderItem = useCallback(
    ({ item }: { item: ModelInfo }) => {
      const isSelected = item.id === selectedModelId;

      return (
        <Pressable
          onPress={() => handleSelect(item.id)}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <View
            style={[
              styles.modelCard,
              {
                backgroundColor: colors.card,
                borderColor: isSelected ? colors.primary : colors.border,
                borderWidth: isSelected ? 2 : 1,
              },
            ]}
          >
            <View style={styles.modelCardContent}>
              <View style={styles.modelInfo}>
                <Text style={[styles.modelName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.modelProvider,
                    { color: colors.textTertiary },
                  ]}
                >
                  {item.provider}
                  {item.contextWindow
                    ? ` · ${Math.round(item.contextWindow / 1000)}K`
                    : ''}
                  {item.reasoning ? ' · Reasoning' : ''}
                </Text>
              </View>
              {isSelected && (
                <FontAwesome
                  name="check-circle"
                  size={22}
                  color={colors.primary}
                  style={styles.checkIcon}
                />
              )}
            </View>
          </View>
        </Pressable>
      );
    },
    [selectedModelId, colors, handleSelect],
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.center}>
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
          {search.trim() ? 'Natija topilmadi' : 'Modellar mavjud emas'}
        </Text>
      </View>
    ),
    [search, colors],
  );

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
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View
            style={[styles.handle, { backgroundColor: colors.border }]}
          />
        </View>

        {/* Sarlavha */}
        <Text style={[styles.title, { color: colors.text }]}>
          Model tanlang
        </Text>

        {/* Content */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={[styles.loadingText, { color: colors.textSecondary }]}
            >
              Modellar yuklanmoqda...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <FontAwesome
              name="exclamation-triangle"
              size={32}
              color={colors.error}
            />
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
            <Pressable
              style={[styles.retryButton, { borderColor: colors.primary }]}
              onPress={loadModels}
            >
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                Qayta urinish
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Search */}
            <View
              style={[
                styles.searchRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <FontAwesome
                name="search"
                size={14}
                color={colors.textTertiary}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Qidirish..."
                placeholderTextColor={colors.textTertiary}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <FontAwesome
                    name="times-circle"
                    size={16}
                    color={colors.textTertiary}
                  />
                </Pressable>
              )}
            </View>

            {/* Model count */}
            <Text
              style={[styles.countText, { color: colors.textTertiary }]}
            >
              {filtered.length} / {models.length} model
            </Text>

            {/* List */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ListEmptyComponent={renderEmpty}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </>
        )}

        {/* Bekor qilish */}
        <Pressable
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={onClose}
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
    maxHeight: '75%',
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  countText: {
    fontSize: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  list: {
    gap: 8,
    paddingBottom: 8,
  },
  modelCard: {
    borderRadius: 12,
    padding: 14,
  },
  modelCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
  },
  modelProvider: {
    fontSize: 11,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkIcon: {
    marginLeft: 12,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

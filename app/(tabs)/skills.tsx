import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConnectionBanner } from '@/components/common/ConnectionBanner';
import { SkillCard } from '@/components/skills/SkillCard';
import { SkillDetailSheet } from '@/components/skills/SkillDetailSheet';
import { useIsConnected } from '@/hooks/useGateway';
import { useSkillActions, useSkills } from '@/hooks/useSkills';
import { useTheme } from '@/theme';
import type { SkillStatusEntry } from '@/types/skills';

export default function SkillsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isConnected = useIsConnected();
  const { skills, isLoading, error, busyKey } = useSkills();
  const { loadSkills, toggleSkill } = useSkillActions();
  const [selectedSkill, setSelectedSkill] = useState<SkillStatusEntry | null>(
    null,
  );

  useEffect(() => {
    if (isConnected) {
      loadSkills(true);
    }
  }, [isConnected, loadSkills]);

  const handleRefresh = useCallback(() => {
    loadSkills(true);
  }, [loadSkills]);

  const handleToggle = useCallback(
    (skillKey: string, enable: boolean) => {
      toggleSkill(skillKey, enable);
    },
    [toggleSkill],
  );

  const handlePress = useCallback((skill: SkillStatusEntry) => {
    setSelectedSkill(skill);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSelectedSkill(null);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: SkillStatusEntry }) => (
      <SkillCard
        skill={item}
        busy={busyKey === item.skillKey}
        onToggle={handleToggle}
        onPress={handlePress}
      />
    ),
    [busyKey, handleToggle, handlePress],
  );

  const keyExtractor = useCallback(
    (item: SkillStatusEntry) => item.skillKey,
    [],
  );

  // Loading state — birinchi yuklash
  const showLoading = isLoading && skills.length === 0;
  // Error state — skill yo'q va xato bor
  const showError = !isLoading && !!error && skills.length === 0;
  // Empty state — hamma narsa yuklandi lekin skill yo'q
  const showEmpty = !isLoading && !error && skills.length === 0 && isConnected;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Skills</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {skills.length > 0
            ? `${skills.length} ta skill topildi`
            : 'Faol plaginlar va integratsiyalar'}
        </Text>
      </View>

      <ConnectionBanner />

      {showLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.centerText, { color: colors.textSecondary }]}>
            Skilllar yuklanmoqda...
          </Text>
        </View>
      )}

      {showError && (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <Pressable
            onPress={handleRefresh}
            style={({ pressed }) => [
              styles.retryButton,
              {
                borderColor: colors.primary,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Text style={[styles.retryText, { color: colors.primary }]}>
              Qayta urinish
            </Text>
          </Pressable>
        </View>
      )}

      {showEmpty && (
        <View style={styles.center}>
          <Text style={[styles.centerText, { color: colors.textSecondary }]}>
            Hech qanday skill topilmadi
          </Text>
        </View>
      )}

      {!showLoading && !showError && !showEmpty && (
        <FlatList
          data={skills}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl
              refreshing={isLoading && skills.length > 0}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}

      <SkillDetailSheet
        skill={selectedSkill}
        busyKey={busyKey}
        onClose={handleCloseSheet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  grid: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  centerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

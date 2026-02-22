import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { useTheme } from '@/theme';
import type { SkillStatusEntry } from '@/types/skills';

interface SkillCardProps {
  skill: SkillStatusEntry;
  busy: boolean;
  onToggle: (skillKey: string, enable: boolean) => void;
  onPress: (skill: SkillStatusEntry) => void;
}

function getStatusInfo(skill: SkillStatusEntry) {
  if (skill.blockedByAllowlist) {
    return { label: 'BLOKLANGAN', type: 'blocked' as const };
  }
  if (
    skill.missing.bins.length > 0 ||
    skill.missing.env.length > 0 ||
    skill.missing.config.length > 0
  ) {
    return { label: 'TAYYOR EMAS', type: 'missing' as const };
  }
  if (skill.disabled) {
    return { label: "O'CHIQ", type: 'disabled' as const };
  }
  if (skill.eligible && !skill.disabled) {
    return { label: 'FAOL', type: 'active' as const };
  }
  return { label: "O'CHIQ", type: 'disabled' as const };
}

export function SkillCard({ skill, busy, onToggle, onPress }: SkillCardProps) {
  const { colors } = useTheme();
  const status = getStatusInfo(skill);
  const isActive = status.type === 'active';

  const dotColor =
    status.type === 'active'
      ? colors.success
      : status.type === 'blocked'
        ? colors.error
        : status.type === 'missing'
          ? colors.warning
          : colors.textTertiary;

  const badgeBg =
    status.type === 'active'
      ? colors.successLight
      : status.type === 'blocked'
        ? colors.errorLight
        : status.type === 'missing'
          ? colors.warningLight
          : colors.surface;

  return (
    <Pressable
      onPress={() => onPress(skill)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.skillCardBg,
          borderColor: colors.skillCardBorder,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}
      >
        <Text style={styles.emoji}>{skill.emoji ?? '🧩'}</Text>
      </View>

      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {skill.name}
      </Text>
      <Text
        style={[styles.description, { color: colors.textSecondary }]}
        numberOfLines={2}
      >
        {skill.description}
      </Text>

      <View style={styles.footer}>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <View style={[styles.badgeDot, { backgroundColor: dotColor }]} />
          <Text style={[styles.badgeText, { color: dotColor }]}>
            {status.label}
          </Text>
        </View>

        {busy ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          !skill.blockedByAllowlist && (
            <Switch
              value={isActive}
              onValueChange={(value) => onToggle(skill.skillKey, value)}
              trackColor={{
                false: colors.switchTrackInactive,
                true: colors.switchTrackActive,
              }}
              style={styles.toggle}
            />
          )
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 22,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  toggle: {
    transform: [{ scale: 0.8 }],
  },
});

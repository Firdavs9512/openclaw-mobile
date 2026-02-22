import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useTheme } from '@/theme';

interface SkillCardProps {
  name: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  description: string;
  active: boolean;
}

export function SkillCard({ name, icon, description, active }: SkillCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.skillCardBg,
          borderColor: colors.skillCardBorder,
        },
      ]}
    >
      <View
        style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}
      >
        <FontAwesome name={icon} size={20} color={colors.primary} />
      </View>

      <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
      <Text
        style={[styles.description, { color: colors.textSecondary }]}
        numberOfLines={2}
      >
        {description}
      </Text>

      <View
        style={[
          styles.badge,
          {
            backgroundColor: active
              ? colors.successLight
              : colors.surface,
          },
        ]}
      >
        <View
          style={[
            styles.badgeDot,
            {
              backgroundColor: active
                ? colors.success
                : colors.textTertiary,
            },
          ]}
        />
        <Text
          style={[
            styles.badgeText,
            {
              color: active ? colors.success : colors.textTertiary,
            },
          ]}
        >
          {active ? 'FAOL' : "O'CHIQ"}
        </Text>
      </View>
    </View>
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
  badge: {
    alignSelf: 'flex-start',
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
});

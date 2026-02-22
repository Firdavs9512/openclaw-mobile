import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { useTheme } from '@/theme';

interface ToggleRowProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}

export function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
  isLast,
}: ToggleRowProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.row,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle != null && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: colors.switchTrackInactive,
          true: colors.switchTrackActive,
        }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});

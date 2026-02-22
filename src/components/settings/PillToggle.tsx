import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

interface PillToggleProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export function PillToggle({ options, selectedIndex, onChange }: PillToggleProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {options.map((label, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Pressable
            key={label}
            onPress={() => onChange(index)}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected ? colors.primary : colors.surface,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: isSelected ? '#FFFFFF' : colors.text },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});

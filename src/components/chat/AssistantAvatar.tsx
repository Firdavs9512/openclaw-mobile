import React from 'react';
import { StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface AssistantAvatarProps {
  size?: number;
}

export function AssistantAvatar({ size = 20 }: AssistantAvatarProps) {
  const half = size / 2;
  const iconSize = Math.round(size * 0.55);

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: half },
      ]}
    >
      <FontAwesome name="reddit-alien" size={iconSize} color="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#E74C3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

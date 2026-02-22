import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAgentAvatar } from '@/hooks/useAgentIdentity';

interface AssistantAvatarProps {
  size?: number;
}

export function AssistantAvatar({ size = 20 }: AssistantAvatarProps) {
  const avatar = useAgentAvatar();
  const half = size / 2;
  const emojiSize = Math.round(size * 0.55);

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: half },
      ]}
    >
      <Text style={{ fontSize: emojiSize, lineHeight: size }}>
        {avatar}
      </Text>
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

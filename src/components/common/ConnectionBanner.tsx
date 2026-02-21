import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Text } from '@/components/common/Themed';
import { useTheme } from '@/theme';
import { useGatewayConnection, useGatewayActions } from '@/hooks/useGateway';
import { useGatewayStore } from '@/stores/gateway-store';

const BANNER_HEIGHT = 44;

export function ConnectionBanner() {
  const { colors } = useTheme();
  const { state } = useGatewayConnection();
  const { reconnectFromSaved } = useGatewayActions();
  const reconnectDelay = useGatewayStore((s) => s.reconnectDelay);

  const isVisible = state !== 'connected';
  const bannerHeight = useSharedValue(isVisible ? BANNER_HEIGHT : 0);

  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    bannerHeight.value = withTiming(isVisible ? BANNER_HEIGHT : 0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isVisible, bannerHeight]);

  useEffect(() => {
    if (state === 'reconnecting' && reconnectDelay > 0) {
      setSecondsLeft(Math.ceil(reconnectDelay / 1000));
      const interval = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state, reconnectDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: bannerHeight.value,
    opacity: bannerHeight.value === 0 ? 0 : 1,
  }));

  const isDisconnected = state === 'disconnected';
  const bgColor = isDisconnected ? colors.errorLight : colors.warningLight;
  const textColor = isDisconnected ? colors.error : colors.warning;

  let message: string;
  if (state === 'reconnecting') {
    message = `Qayta ulanish: ${secondsLeft}s...`;
  } else if (isDisconnected) {
    message = "Ulanish yo'q";
  } else {
    message = 'Gateway ga ulanilmoqda...';
  }

  return (
    <Animated.View
      style={[styles.banner, { backgroundColor: bgColor }, animatedStyle]}
    >
      <Text style={[styles.text, { color: textColor }]}>{message}</Text>
      {isDisconnected && (
        <Pressable
          onPress={reconnectFromSaved}
          style={[styles.retryButton, { borderColor: textColor }]}
        >
          <Text style={[styles.retryText, { color: textColor }]}>
            Qayta ulanish
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

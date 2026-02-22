import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';

import { Text, View } from '@/components/common/Themed';
import { GatewayError } from '@/gateway/errors';
import { useGatewayStore } from '@/stores/gateway-store';
import { useTheme } from '@/theme';
import type { GatewayConfig } from '@/types/gateway';

interface PairingDialogProps {
  visible: boolean;
  config: GatewayConfig;
  onSuccess: () => void;
  onCancel: () => void;
}

const POLL_INTERVAL = 3000;

export function PairingDialog({
  visible,
  config,
  onSuccess,
  onCancel,
}: PairingDialogProps) {
  const { colors } = useTheme();
  const connect = useGatewayStore((s) => s.connect);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [attempt, setAttempt] = useState(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      cleanup();
      setAttempt(0);
      return;
    }

    timerRef.current = setInterval(async () => {
      try {
        setAttempt((a) => a + 1);
        await connect(config);
        cleanup();
        onSuccess();
      } catch (err) {
        if (err instanceof GatewayError && err.isPairingRequired) {
          // Hali juftlanmagan — davom etamiz
        } else {
          // Boshqa xatolarni ham ignore qilamiz — faqat polling davom etadi
          // Server pairing jarayonida turli xatolar qaytarishi mumkin
          console.warn('[PairingDialog] retry error:', err instanceof GatewayError ? `${err.code}: ${err.message}` : err);
        }
      }
    }, POLL_INTERVAL);

    return cleanup;
  }, [visible, config, connect, onSuccess, onCancel, cleanup]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={styles.overlay}
        lightColor="rgba(0,0,0,0.4)"
        darkColor="rgba(0,0,0,0.6)"
      >
        <View
          style={[styles.dialog, { borderColor: colors.border }]}
          lightColor={colors.card}
          darkColor={colors.card}
        >
          <Text style={styles.title}>Juftlash kerak</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Gateway da quyidagi buyruqni ishga tushiring:
          </Text>
          <View
            style={[styles.codeBlock, { borderColor: colors.border }]}
            lightColor={colors.surface}
            darkColor={colors.surface}
          >
            <Text style={styles.codeText}>openclaw nodes approve</Text>
          </View>
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.spinner}
          />
          <Text style={[styles.waitText, { color: colors.textTertiary }]}>
            Kutilmoqda... (urinish #{attempt})
          </Text>
          <Pressable
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={onCancel}
          >
            <Text style={{ color: colors.error }}>Bekor qilish</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  dialog: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  codeBlock: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  codeText: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
  spinner: {
    marginVertical: 12,
  },
  waitText: {
    fontSize: 13,
    marginBottom: 20,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
});

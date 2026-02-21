import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGatewayStore } from '@/stores/gateway-store';
import { useTheme } from '@/theme';
import { parseOpenClawUrl } from '@/utils/deep-link';
import { completeOnboarding } from '@/utils/onboarding';

const OVERLAY_COLOR = 'rgba(0, 0, 0, 0.6)';
const FRAME_SIZE = 250;

export default function ScanQRScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const processingRef = useRef(false);
  const connect = useGatewayStore((s) => s.connect);

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (processingRef.current) return;
      processingRef.current = true;

      const parsed = parseOpenClawUrl(data);
      if (parsed) {
        Vibration.vibrate(100);

        if (parsed.type === 'connect' || parsed.type === 'pair') {
          setIsConnecting(true);
          try {
            await connect(parsed.config);
            completeOnboarding();
            return;
          } catch {
            // Xatoda manual-setup ga yo'naltirish (params bilan)
            router.replace({
              pathname: '/onboarding/manual-setup',
              params: {
                host: parsed.config.host,
                port: String(parsed.config.port),
                token: parsed.config.token ?? '',
                useTLS: parsed.config.useTLS ? '1' : '0',
              },
            });
            return;
          } finally {
            setIsConnecting(false);
            processingRef.current = false;
          }
        }

        // relay yoki boshqa turlar uchun hozircha manual-setup ga yo'naltirish
        processingRef.current = false;
      } else {
        setError("Noto'g'ri QR kod");
        setTimeout(() => {
          setError(null);
          processingRef.current = false;
        }, 2000);
      }
    },
    [connect],
  );

  if (!permission) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.centered,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Kamera ruxsati kerak</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          QR kod skanerlash uchun kamera ruxsati zarur
        </Text>
        <Pressable
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Ruxsat berish</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={[styles.frame, { borderColor: colors.primary }]} />
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Connecting overlay */}
      {isConnecting && (
        <View style={styles.connectingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.connectingText}>Ulanilmoqda...</Text>
        </View>
      )}

      {/* Error toast */}
      {error && (
        <View style={[styles.toast, { backgroundColor: colors.error }]}>
          <Text style={styles.toastText}>{error}</Text>
        </View>
      )}

      {/* Back button */}
      <Pressable
        style={[styles.backButton, { top: insets.top + 8 }]}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Orqaga</Text>
      </Pressable>

      {/* Manual entry */}
      <Pressable
        style={[styles.manualButton, { bottom: insets.bottom + 32 }]}
        onPress={() => router.push('/onboarding/manual-setup')}
      >
        <Text style={[styles.manualButtonText, { color: colors.primary }]}>
          Manual kiritish
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayMiddle: { flexDirection: 'row', height: FRAME_SIZE },
  overlaySide: { flex: 1, backgroundColor: OVERLAY_COLOR },
  frame: { width: FRAME_SIZE, height: FRAME_SIZE, borderWidth: 2, borderRadius: 12 },
  overlayBottom: { flex: 1, backgroundColor: OVERLAY_COLOR },
  connectingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  connectingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  backButton: { position: 'absolute', left: 16 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  manualButton: { position: 'absolute', alignSelf: 'center' },
  manualButtonText: { fontSize: 16, fontWeight: '600' },
});

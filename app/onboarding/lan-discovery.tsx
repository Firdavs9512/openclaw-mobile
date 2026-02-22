import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';

import { Text, View } from '@/components/common/Themed';
import { PairingDialog } from '@/components/onboarding/PairingDialog';
import { GatewayError } from '@/gateway/errors';
import {
  useDiscovery,
  type DiscoveredGateway,
} from '@/hooks/useDiscovery';
import { useGatewayStore } from '@/stores/gateway-store';
import { useTheme } from '@/theme';
import type { GatewayConfig } from '@/types/gateway';
import { completeOnboarding } from '@/utils/onboarding';

export default function LanDiscoveryScreen() {
  const { colors } = useTheme();
  const { gateways, isScanning, scan } = useDiscovery();
  const connect = useGatewayStore((s) => s.connect);

  const [selectedGateway, setSelectedGateway] =
    useState<DiscoveredGateway | null>(null);
  const [token, setToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairingConfig, setPairingConfig] = useState<GatewayConfig | null>(
    null,
  );

  useEffect(() => {
    scan();
  }, [scan]);

  const buildConfig = useCallback(
    (gw: DiscoveredGateway): GatewayConfig => ({
      host: gw.host,
      port: gw.port,
      token: token.trim() || undefined,
      useTLS: gw.useTLS,
      tlsFingerprint: gw.tlsFingerprint,
    }),
    [token],
  );

  const handleConnect = useCallback(async () => {
    if (!selectedGateway) return;

    setIsConnecting(true);
    setError(null);

    const config = buildConfig(selectedGateway);

    try {
      await connect(config);
      completeOnboarding();
    } catch (err) {
      if (err instanceof GatewayError && err.isPairingRequired) {
        setSelectedGateway(null);
        setPairingConfig(config);
      } else if (err instanceof GatewayError) {
        setError(err.message);
      } else {
        setError("Kutilmagan xato yuz berdi");
      }
    } finally {
      setIsConnecting(false);
    }
  }, [selectedGateway, buildConfig, connect]);

  const handlePairingSuccess = useCallback(() => {
    setPairingConfig(null);
    completeOnboarding();
  }, []);

  const handlePairingCancel = useCallback(() => {
    setPairingConfig(null);
  }, []);

  const renderGateway = useCallback(
    ({ item }: { item: DiscoveredGateway }) => (
      <Pressable
        style={[
          styles.gatewayCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => {
          setSelectedGateway(item);
          setToken('');
          setError(null);
        }}
      >
        <View
          style={[styles.dot, { backgroundColor: colors.statusConnected }]}
          lightColor={colors.statusConnected}
          darkColor={colors.statusConnected}
        />
        <View style={styles.gatewayInfo} lightColor="transparent" darkColor="transparent">
          <Text style={styles.gatewayName}>{item.name}</Text>
          <Text style={[styles.gatewayHost, { color: colors.textSecondary }]}>
            {item.host}:{item.port}
            {item.useTLS ? ' (TLS)' : ''}
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={colors.textTertiary} />
      </Pressable>
    ),
    [colors],
  );

  const renderEmpty = useCallback(() => {
    if (isScanning) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Tarmoqda gateway topilmadi
        </Text>
      </View>
    );
  }, [isScanning, colors.textSecondary]);

  return (
    <View style={styles.container}>
      {isScanning && (
        <View style={styles.scanningRow} lightColor="transparent" darkColor="transparent">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.scanningText, { color: colors.textSecondary }]}>
            Qidirilmoqda...
          </Text>
        </View>
      )}

      <FlatList
        data={gateways}
        keyExtractor={(item) => `${item.host}:${item.port}`}
        renderItem={renderGateway}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer} lightColor="transparent" darkColor="transparent">
        <Pressable
          style={[styles.rescanButton, { borderColor: colors.border }]}
          onPress={() => scan()}
          disabled={isScanning}
        >
          <FontAwesome name="refresh" size={14} color={colors.primary} />
          <Text style={[styles.rescanText, { color: colors.primary }]}>
            Qayta qidirish
          </Text>
        </Pressable>
        <Pressable onPress={() => router.push('/onboarding/manual-setup')}>
          <Text style={[styles.manualLink, { color: colors.primary }]}>
            Manual kiritish
          </Text>
        </Pressable>
      </View>

      {/* Token Modal */}
      <Modal
        visible={selectedGateway !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedGateway(null)}
      >
        <View
          style={styles.modalOverlay}
          lightColor="rgba(0,0,0,0.4)"
          darkColor="rgba(0,0,0,0.6)"
        >
          <View
            style={[styles.modalContent, { borderColor: colors.border }]}
            lightColor={colors.card}
            darkColor={colors.card}
          >
            <Text style={styles.modalTitle}>
              {selectedGateway?.name ?? 'Gateway'}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {selectedGateway?.host}:{selectedGateway?.port}
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Token (ixtiyoriy)
            </Text>
            <TextInput
              style={[
                styles.tokenInput,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              value={token}
              onChangeText={setToken}
              placeholder="Token kiriting"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            {error && (
              <View
                style={[styles.errorBanner, { backgroundColor: colors.errorLight }]}
                lightColor={colors.errorLight}
                darkColor={colors.errorLight}
              >
                <FontAwesome name="exclamation-circle" size={14} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
              </View>
            )}

            <View style={styles.modalButtons} lightColor="transparent" darkColor="transparent">
              <Pressable
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setSelectedGateway(null)}
              >
                <Text style={{ color: colors.text }}>Bekor qilish</Text>
              </Pressable>
              <Pressable
                style={[styles.connectBtn, { backgroundColor: colors.primary }]}
                onPress={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.connectBtnText}>Ulanish</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pairing Dialog */}
      {pairingConfig && (
        <PairingDialog
          visible
          config={pairingConfig}
          onSuccess={handlePairingSuccess}
          onCancel={handlePairingCancel}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scanningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  scanningText: {
    fontSize: 14,
  },
  list: {
    paddingTop: 4,
    flexGrow: 1,
  },
  gatewayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  gatewayInfo: {
    flex: 1,
  },
  gatewayName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  gatewayHost: {
    fontSize: 13,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 16,
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  rescanText: {
    fontSize: 14,
    fontWeight: '500',
  },
  manualLink: {
    fontSize: 15,
    fontWeight: '500',
  },
  // Token Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  tokenInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  connectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

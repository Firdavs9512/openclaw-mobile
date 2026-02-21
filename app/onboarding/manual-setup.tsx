import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
} from 'react-native';

import { Text, View } from '@/components/common/Themed';
import { PairingDialog } from '@/components/onboarding/PairingDialog';
import { GatewayError } from '@/gateway/errors';
import { useGatewayStore } from '@/stores/gateway-store';
import { useTheme } from '@/theme';
import type { GatewayConfig } from '@/types/gateway';
import { completeOnboarding } from '@/utils/onboarding';

interface FormState {
  host: string;
  port: string;
  token: string;
  useTLS: boolean;
}

interface FormErrors {
  host?: string;
  port?: string;
}

function getErrorMessage(err: GatewayError): string {
  switch (err.code) {
    case 'CONNECTION_FAILED':
      return "Gateway ga ulanib bo'lmadi. Host va port ni tekshiring.";
    case 'UNAUTHORIZED':
      return "Token noto'g'ri. Qaytadan kiriting.";
    case 'TIMEOUT':
      return 'Ulanish vaqti tugadi. Tarmoq holatini tekshiring.';
    case 'HANDSHAKE_TIMEOUT':
      return 'Handshake vaqti tugadi. Gateway ishlab turibdimi?';
    default:
      return err.message;
  }
}

export default function ManualSetupScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    host?: string;
    port?: string;
    token?: string;
    useTLS?: string;
    autoConnect?: string;
  }>();

  const connect = useGatewayStore((s) => s.connect);

  const [form, setForm] = useState<FormState>({
    host: params.host ?? '',
    port: params.port ?? '18789',
    token: params.token ?? '',
    useTLS: params.useTLS === '1',
  });
  const [showToken, setShowToken] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [pairingConfig, setPairingConfig] = useState<GatewayConfig | null>(
    null,
  );

  const autoConnectDone = useRef(false);

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (key in errors) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[key as keyof FormErrors];
          return next;
        });
      }
    },
    [errors],
  );

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!form.host.trim()) {
      newErrors.host = 'Host majburiy';
    }
    const port = parseInt(form.port, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      newErrors.port = "Port 1-65535 orasida bo'lishi kerak";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form.host, form.port]);

  const handleConnect = useCallback(async () => {
    if (!validate()) return;

    setIsConnecting(true);
    setConnectError(null);

    const config: GatewayConfig = {
      host: form.host.trim(),
      port: parseInt(form.port, 10),
      token: form.token.trim() || undefined,
      useTLS: form.useTLS,
    };

    try {
      await connect(config);
      completeOnboarding();
    } catch (err) {
      if (err instanceof GatewayError && err.code === 'NOT_PAIRED') {
        setPairingConfig(config);
      } else if (err instanceof GatewayError) {
        setConnectError(getErrorMessage(err));
      } else {
        setConnectError("Kutilmagan xato yuz berdi");
      }
    } finally {
      setIsConnecting(false);
    }
  }, [form, validate, connect]);

  // Deep link / QR dan kelgan autoConnect
  useEffect(() => {
    if (params.autoConnect === '1' && form.host && !autoConnectDone.current) {
      autoConnectDone.current = true;
      handleConnect();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePairingSuccess = useCallback(() => {
    setPairingConfig(null);
    completeOnboarding();
  }, []);

  const handlePairingCancel = useCallback(() => {
    setPairingConfig(null);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Host */}
          <View style={styles.field} lightColor="transparent" darkColor="transparent">
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Host
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: errors.host ? colors.error : colors.border,
                },
              ]}
              value={form.host}
              onChangeText={(v) => updateField('host', v)}
              placeholder="192.168.1.100 yoki hostname"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            {errors.host && (
              <Text style={[styles.fieldError, { color: colors.error }]}>
                {errors.host}
              </Text>
            )}
          </View>

          {/* Port */}
          <View style={styles.field} lightColor="transparent" darkColor="transparent">
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Port
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: errors.port ? colors.error : colors.border,
                },
              ]}
              value={form.port}
              onChangeText={(v) => updateField('port', v)}
              placeholder="18789"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
            />
            {errors.port && (
              <Text style={[styles.fieldError, { color: colors.error }]}>
                {errors.port}
              </Text>
            )}
          </View>

          {/* Token */}
          <View style={styles.field} lightColor="transparent" darkColor="transparent">
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Token
            </Text>
            <View style={styles.tokenRow} lightColor="transparent" darkColor="transparent">
              <TextInput
                style={[
                  styles.input,
                  styles.tokenInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                value={form.token}
                onChangeText={(v) => updateField('token', v)}
                placeholder="Token kiriting"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showToken}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowToken((v) => !v)}
              >
                <FontAwesome
                  name={showToken ? 'eye-slash' : 'eye'}
                  size={18}
                  color={colors.textTertiary}
                />
              </Pressable>
            </View>
          </View>

          {/* TLS */}
          <View
            style={[styles.switchRow, { borderColor: colors.border }]}
            lightColor="transparent"
            darkColor="transparent"
          >
            <Text style={styles.switchLabel}>TLS ishlatish</Text>
            <Switch
              value={form.useTLS}
              onValueChange={(v) => updateField('useTLS', v)}
              trackColor={{
                false: colors.border,
                true: colors.primary,
              }}
            />
          </View>

          {/* Error */}
          {connectError && (
            <View
              style={[styles.errorBanner, { backgroundColor: colors.errorLight }]}
              lightColor={colors.errorLight}
              darkColor={colors.errorLight}
            >
              <FontAwesome
                name="exclamation-circle"
                size={16}
                color={colors.error}
              />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {connectError}
              </Text>
            </View>
          )}

          {/* Connect button */}
          <Pressable
            style={[
              styles.connectButton,
              {
                backgroundColor: isConnecting
                  ? colors.textTertiary
                  : colors.primary,
              },
            ]}
            onPress={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.connectButtonText}>Ulanish</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Pairing Dialog */}
      {pairingConfig && (
        <PairingDialog
          visible
          config={pairingConfig}
          onSuccess={handlePairingSuccess}
          onCancel={handlePairingCancel}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  fieldError: {
    fontSize: 12,
    marginTop: 4,
  },
  tokenRow: {
    position: 'relative',
  },
  tokenInput: {
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  connectButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

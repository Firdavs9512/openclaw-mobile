import React from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSkillActions, useSkillApiKeyEdit, useSkillMessage } from '@/hooks/useSkills';
import { useTheme } from '@/theme';
import type { SkillStatusEntry } from '@/types/skills';

interface SkillDetailSheetProps {
  skill: SkillStatusEntry | null;
  busyKey: string | null;
  onClose: () => void;
}

export function SkillDetailSheet({
  skill,
  busyKey,
  onClose,
}: SkillDetailSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { toggleSkill, saveApiKey, installSkill, setApiKeyEdit } =
    useSkillActions();
  const message = useSkillMessage(skill?.skillKey ?? '');
  const apiKeyValue = useSkillApiKeyEdit(skill?.skillKey ?? '');

  if (!skill) return null;

  const isBusy = busyKey === skill.skillKey;
  const isActive = skill.eligible && !skill.disabled;
  const hasMissingBins = skill.missing.bins.length > 0;
  const hasMissingEnv = skill.missing.env.length > 0;
  const hasMissingConfig = skill.missing.config.length > 0;
  const hasMissing = hasMissingBins || hasMissingEnv || hasMissingConfig;

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View
                style={[
                  styles.emojiCircle,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Text style={styles.emoji}>{skill.emoji ?? '🧩'}</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {skill.name}
                </Text>
                <Text
                  style={[styles.source, { color: colors.textTertiary }]}
                  numberOfLines={1}
                >
                  {skill.source}
                </Text>
              </View>
            </View>

            <Text
              style={[styles.description, { color: colors.textSecondary }]}
            >
              {skill.description}
            </Text>

            {/* Enable/Disable */}
            {!skill.blockedByAllowlist && (
              <View
                style={[
                  styles.row,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.rowLabel, { color: colors.text }]}>
                  {isActive ? 'Faol' : "O'chirilgan"}
                </Text>
                {isBusy ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Switch
                    value={isActive}
                    onValueChange={(value) =>
                      toggleSkill(skill.skillKey, value)
                    }
                    trackColor={{
                      false: colors.switchTrackInactive,
                      true: colors.switchTrackActive,
                    }}
                  />
                )}
              </View>
            )}

            {/* Blocked by Allowlist */}
            {skill.blockedByAllowlist && (
              <View
                style={[
                  styles.warningBox,
                  { backgroundColor: colors.errorLight },
                ]}
              >
                <Text style={[styles.warningText, { color: colors.error }]}>
                  Bu skill ruxsat ro&apos;yxati tomonidan bloklangan
                </Text>
              </View>
            )}

            {/* API Key */}
            {skill.primaryEnv && (
              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, { color: colors.textTertiary }]}
                >
                  API KALIT
                </Text>
                <View
                  style={[
                    styles.apiKeyRow,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.apiKeyInput, { color: colors.text }]}
                    placeholder={skill.primaryEnv}
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry
                    value={apiKeyValue}
                    onChangeText={(text) =>
                      setApiKeyEdit(skill.skillKey, text)
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    onPress={() => saveApiKey(skill.skillKey)}
                    disabled={isBusy}
                    style={({ pressed }) => [
                      styles.saveButton,
                      {
                        backgroundColor: colors.primary,
                        opacity: pressed || isBusy ? 0.6 : 1,
                      },
                    ]}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>Saqlash</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {/* Missing Requirements */}
            {hasMissing && (
              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, { color: colors.textTertiary }]}
                >
                  TALABLAR
                </Text>
                {hasMissingBins && (
                  <View
                    style={[
                      styles.missingBox,
                      { backgroundColor: colors.warningLight },
                    ]}
                  >
                    <Text
                      style={[styles.missingLabel, { color: colors.warning }]}
                    >
                      Kerakli dasturlar:
                    </Text>
                    <Text
                      style={[styles.missingItems, { color: colors.warning }]}
                    >
                      {skill.missing.bins.join(', ')}
                    </Text>
                  </View>
                )}
                {hasMissingEnv && (
                  <View
                    style={[
                      styles.missingBox,
                      { backgroundColor: colors.warningLight },
                    ]}
                  >
                    <Text
                      style={[styles.missingLabel, { color: colors.warning }]}
                    >
                      Kerakli muhit o&apos;zgaruvchilari:
                    </Text>
                    <Text
                      style={[styles.missingItems, { color: colors.warning }]}
                    >
                      {skill.missing.env.join(', ')}
                    </Text>
                  </View>
                )}
                {hasMissingConfig && (
                  <View
                    style={[
                      styles.missingBox,
                      { backgroundColor: colors.warningLight },
                    ]}
                  >
                    <Text
                      style={[styles.missingLabel, { color: colors.warning }]}
                    >
                      Kerakli sozlamalar:
                    </Text>
                    <Text
                      style={[styles.missingItems, { color: colors.warning }]}
                    >
                      {skill.missing.config.join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Install Options */}
            {skill.install.length > 0 && hasMissingBins && (
              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, { color: colors.textTertiary }]}
                >
                  O&apos;RNATISH
                </Text>
                {skill.install.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() =>
                      installSkill(skill.skillKey, skill.name, option.id)
                    }
                    disabled={isBusy}
                    style={({ pressed }) => [
                      styles.installButton,
                      {
                        borderColor: colors.primary,
                        opacity: pressed || isBusy ? 0.6 : 1,
                      },
                    ]}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Text
                          style={[
                            styles.installLabel,
                            { color: colors.primary },
                          ]}
                        >
                          {option.label}
                        </Text>
                        <Text
                          style={[
                            styles.installKind,
                            { color: colors.textTertiary },
                          ]}
                        >
                          {option.kind}
                        </Text>
                      </>
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            {/* Homepage */}
            {skill.homepage && (
              <Pressable
                onPress={() => Linking.openURL(skill.homepage!)}
                style={({ pressed }) => [
                  styles.linkRow,
                  {
                    borderBottomColor: colors.border,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  Hujjatlarni ochish
                </Text>
              </Pressable>
            )}

            {/* Feedback Message */}
            {message && (
              <View
                style={[
                  styles.messageBox,
                  {
                    backgroundColor:
                      message.kind === 'success'
                        ? colors.successLight
                        : colors.errorLight,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      message.kind === 'success'
                        ? colors.success
                        : colors.error,
                    fontSize: 13,
                    fontWeight: '500',
                  }}
                >
                  {message.message}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Close Button */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              {
                backgroundColor: colors.surface,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Text
              style={[styles.closeButtonText, { color: colors.text }]}
            >
              Yopish
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  scroll: {
    flexGrow: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
  },
  headerText: {
    marginLeft: 14,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  source: {
    fontSize: 12,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  warningBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  apiKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  apiKeyInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  missingBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  missingLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  missingItems: {
    fontSize: 12,
    fontWeight: '400',
  },
  installButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  installLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  installKind: {
    fontSize: 12,
  },
  linkRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  closeButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

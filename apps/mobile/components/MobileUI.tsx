import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@shopledger/shared';

export function ScreenHeader({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        {badge ? (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  variant = 'olive',
}: {
  label: string;
  onPress: () => void;
  variant?: 'olive' | 'deep' | 'success' | 'danger' | 'outline';
}) {
  const bg =
    variant === 'olive'
      ? COLORS.primaryOlive
      : variant === 'deep'
      ? COLORS.deepForestOlive
      : variant === 'success'
      ? COLORS.success
      : variant === 'danger'
      ? COLORS.danger
      : COLORS.cardWhite;

  const textColor = variant === 'outline' ? COLORS.deepForestOlive : '#FFFFFF';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.button,
        {
          backgroundColor: bg,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: COLORS.borderNeutral,
        },
      ]}
    >
      <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function StatusPill({
  label,
  tone = 'success',
}: {
  label: string;
  tone?: 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const bg =
    tone === 'success'
      ? COLORS.successBg
      : tone === 'warning'
      ? COLORS.warningBg
      : tone === 'danger'
      ? COLORS.dangerBg
      : COLORS.softTint;

  const fg =
    tone === 'success'
      ? COLORS.success
      : tone === 'warning'
      ? COLORS.warning
      : tone === 'danger'
      ? COLORS.danger
      : COLORS.deepForestOlive;

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.deepForestOlive,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSubtitle: {
    color: COLORS.softSage,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
  },
  headerBadge: {
    backgroundColor: COLORS.primaryOlive,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  headerBadgeText: {
    color: COLORS.softTint,
    fontSize: 11,
    fontWeight: '600',
  },
  button: {
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
});


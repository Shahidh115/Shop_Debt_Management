import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@shopledger/shared';
import { useMobileStore } from '@/store/useShopLedgerStore';
import { PrimaryButton } from '@/components/MobileUI';

type AuthMode = 'login' | 'forgot' | 'invitation';

export default function MobileLoginScreen() {
  const router = useRouter();
  const { signInWithRole } = useMobileStore();

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [roleTab, setRoleTab] = useState<'shop_owner' | 'customer'>('shop_owner');
  const [email, setEmail] = useState('kamal.silva@example.lk');
  const [password, setPassword] = useState('Kamal@2026');
  const [inviteCode, setInviteCode] = useState('INV-KG-2026');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleLogin = () => {
    setError(null);
    const res = signInWithRole(email, roleTab);
    if (!res.ok) {
      setError(res.error ?? 'Invalid credentials');
      return;
    }
    if (res.role === 'shop_owner') {
      router.replace('/(owner)/home');
    } else {
      router.replace('/(customer)/home');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Brand Header (Frames O01 & C01) */}
        <View style={styles.brandBanner}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>SL</Text>
          </View>
          <Text style={styles.brandTitle}>ShopLedger</Text>
          <Text style={styles.brandTagline}>Credit, with clarity.</Text>
        </View>

        {/* Role Selector (Owner O01 vs Customer C01) */}
        <View style={styles.roleSwitch}>
          <TouchableOpacity
            onPress={() => {
              setRoleTab('shop_owner');
              setEmail('kamal.silva@example.lk');
              setError(null);
            }}
            style={[
              styles.roleOption,
              roleTab === 'shop_owner' && styles.roleOptionActive,
            ]}
          >
            <Text
              style={[
                styles.roleOptionText,
                roleTab === 'shop_owner' && styles.roleOptionTextActive,
              ]}
            >
              Shop Owner (O01)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setRoleTab('customer');
              setEmail('ahmed.perera@example.lk');
              setError(null);
            }}
            style={[
              styles.roleOption,
              roleTab === 'customer' && styles.roleOptionActive,
            ]}
          >
            <Text
              style={[
                styles.roleOptionText,
                roleTab === 'customer' && styles.roleOptionTextActive,
              ]}
            >
              Customer (C01)
            </Text>
          </TouchableOpacity>
        </View>

        {authMode === 'login' && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>
              {roleTab === 'shop_owner'
                ? 'Sign in to your Shop Owner account'
                : 'Sign in to your Customer account'}
            </Text>
            <Text style={styles.cardSubheading}>
              {roleTab === 'shop_owner'
                ? 'Manage customers, credit purchases, payments, and complaints.'
                : 'One login across all shops where you hold a credit account.'}
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Email address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />

            <View style={{ marginTop: 14 }}>
              <PrimaryButton label="Sign In" onPress={handleLogin} />
            </View>

            <View style={styles.linksRow}>
              <TouchableOpacity onPress={() => setAuthMode('forgot')}>
                <Text style={styles.linkText}>Forgot password? (O50 / C27)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAuthMode('invitation')}>
                <Text style={styles.linkText}>Accept invitation (O30 / C31)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {authMode === 'forgot' && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Reset your password (O50 / C27 / C28)</Text>
            <Text style={styles.cardSubheading}>
              Enter your registered email address to receive a password reset link.
            </Text>
            {infoMessage ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>{infoMessage}</Text>
              </View>
            ) : null}
            <Text style={styles.label}>Email address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              style={styles.input}
            />
            <View style={{ marginTop: 14, gap: 10 }}>
              <PrimaryButton
                label="Send Reset Link"
                onPress={() =>
                  setInfoMessage(`Password recovery link sent to ${email} (Frame C28).`)
                }
              />
              <PrimaryButton
                label="Back to Sign In"
                variant="outline"
                onPress={() => {
                  setInfoMessage(null);
                  setAuthMode('login');
                }}
              />
            </View>
          </View>
        )}

        {authMode === 'invitation' && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Activate Account Invitation (O30 / C31 / C32)</Text>
            <Text style={styles.cardSubheading}>
              Invited by a ShopLedger administrator or shop owner? Set your password to activate
              your account.
            </Text>
            <Text style={styles.label}>Invitation Reference</Text>
            <TextInput value={inviteCode} onChangeText={setInviteCode} style={styles.input} />
            <Text style={styles.label}>Set New Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
            <View style={{ marginTop: 14, gap: 10 }}>
              <PrimaryButton label="Activate & Continue" onPress={handleLogin} />
              <PrimaryButton
                label="Back to Sign In"
                variant="outline"
                onPress={() => setAuthMode('login')}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.warmIvory,
  },
  container: {
    padding: 20,
  },
  brandBanner: {
    backgroundColor: COLORS.deepForestOlive,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryOlive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  brandTagline: {
    color: COLORS.softSage,
    fontSize: 13,
    marginTop: 4,
  },
  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleOptionActive: {
    backgroundColor: COLORS.deepForestOlive,
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.mutedText,
  },
  roleOptionTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.charcoalText,
  },
  cardSubheading: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginTop: 4,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.charcoalText,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.charcoalText,
    backgroundColor: COLORS.warmIvory,
  },
  linksRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryOlive,
  },
  errorBox: {
    backgroundColor: COLORS.dangerBg,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
  },
  infoBox: {
    backgroundColor: COLORS.successBg,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  infoText: {
    color: COLORS.success,
    fontSize: 12,
  },
});


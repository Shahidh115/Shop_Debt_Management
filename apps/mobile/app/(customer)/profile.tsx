import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SEED_IDS } from '@shopledger/shared';
import { useMobileStore } from '@/store/useShopLedgerStore';
import { ScreenHeader, PrimaryButton } from '@/components/MobileUI';

export default function CustomerProfileScreen() {
  const router = useRouter();
  const { state, currentUserId, signOut } = useMobileStore();
  const resolvedCustomerId = currentUserId || SEED_IDS.CUSTOMER_AHMED;
  const profile = state.profiles.find((p) => p.id === resolvedCustomerId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader
          subtitle="Frames C13, C22, C23, C29, C38"
          title="Your Profile & Security"
          badge="Customer"
        />

        <View style={styles.card}>
          <Text style={styles.title}>{profile?.full_name ?? 'Ahmed Perera'}</Text>
          <Text style={styles.line}>Email: {profile?.email ?? 'ahmed.perera@example.lk'}</Text>
          <Text style={styles.line}>Phone: {profile?.phone ?? '+94 77 512 9081'}</Text>
          <Text style={styles.line}>Identity Model: One Login Across Multiple Shops</Text>
        </View>

        <PrimaryButton
          label="Sign Out"
          variant="danger"
          onPress={() => {
            signOut();
            router.replace('/(auth)/login');
          }}
        />
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
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderNeutral,
    marginBottom: 14,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.charcoalText,
  },
  line: {
    fontSize: 13,
    color: COLORS.charcoalText,
  },
});

